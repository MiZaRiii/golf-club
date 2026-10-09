#!/usr/bin/env python3
"""Синхронизация локального зеркала страницы Тильды.

Что делает:
  1. Стягивает чистый HTML страницы с сервера (как отдаёт сервер, без браузера)
     и сохраняет его как есть в source/original.html.
  2. Находит наши вставки (интро и параллакс) и заменяет их подключением
     файлов из custom/ в тех же местах. custom/ НЕ перезаписывается: файл
     создаётся только если его ещё нет. Свежая серверная версия вставок
     всегда кладётся в source/custom-from-server/ — для сравнения.
  3. Скачивает CSS, JS, шрифты и картинки Тильды и GitHub в assets/<host>/...
     (уже скачанные файлы с тем же URL пропускаются) и переписывает ссылки
     на локальные.
  4. Пишет index.html.

Запуск:  python sync.py           — обычная синхронизация
         python sync.py --force   — перекачать все ассеты заново
"""
import gzip
import hashlib
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

PAGE_URL = "https://xn--80adda7airdp4ap9g.xn--p1ai/kubok-sinergii"
ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
CUSTOM = ROOT / "custom"
SOURCE = ROOT / "source"
MANIFEST = ASSETS / "manifest.json"
EXTRA = ROOT / "extra-assets.txt"  # URL, которые грузятся динамически — по одному на строку

# Хосты, чьи файлы забираем локально
ASSET_HOSTS = ("static.tildacdn.com", "neo.tildacdn.com", "raw.githubusercontent.com")
ASSET_EXT = ("css", "js", "woff", "woff2", "ttf", "otf", "eot", "svg", "png", "jpg",
             "jpeg", "gif", "webp", "avif", "ico", "json", "mp4", "webm")

# Наши вставки: имя -> маркер в коде скрипта
CUSTOM_BLOCKS = {
    "intro": "if(!window.ucIntro)",
    "parallax": "if(!window.ucParallax)",
}

# Правки скриптов Тильды, чтобы динамически подгружаемые ресурсы шли локально.
# Применяются при каждой синхронизации к свежескачанному файлу (оригинал лежит рядом как *.orig).
PATCHES = {
    "tilda-zero-forms-1.0.min.js": [
        # база для докачки CSS/JS формы берётся из src скрипта, но только если он начинается с https://
        ('-1!==_.indexOf("https://")', '-1!==_.indexOf("/js/")'),
    ],
}

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"

HOSTS_RE = "|".join(re.escape(h) for h in ASSET_HOSTS)
EXT_RE = "|".join(ASSET_EXT)
# Абсолютные (в т.ч. protocol-relative) ссылки на файлы с нужных хостов
URL_RE = re.compile(
    r"(?:https?:)?//(?:%s)/[^\s\"'()<>\\]+?\.(?:%s)(?:\?[^\s\"'()<>\\]*)?(?=[\s\"'()<>\\,;]|$)" % (HOSTS_RE, EXT_RE),
    re.I,
)
# База GitHub-папки + имена файлов в кавычках (скрипты склеивают base + "file.webp")
GH_BASE_RE = re.compile(r"(?:https://raw\.githubusercontent\.com|/assets/raw\.githubusercontent\.com)/[\w.-]+/[\w.-]+/[\w.-]+/")
QUOTED_FILE_RE = re.compile(r"[\"']([\w.-]+\.(?:%s))[\"']" % EXT_RE, re.I)
CSS_URL_RE = re.compile(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)|@import\s+['\"]([^'\"]+)['\"]", re.I)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    # CDN Тильды местами отдаёт gzip независимо от Accept-Encoding
    if data[:2] == b"\x1f\x8b":
        data = gzip.decompress(data)
    return data


def norm(url):
    return "https:" + url if url.startswith("//") else url


def local_path(url):
    """https://host/a/b.css?t=1 -> /assets/host/a/b.css"""
    p = urllib.parse.urlsplit(norm(url))
    return "/assets/" + p.netloc + urllib.parse.unquote(p.path)


def gh_urls(text):
    """Склеенные в скриптах ссылки на GitHub: база + "имя.webp"."""
    out = set()
    for base in set(GH_BASE_RE.findall(text)):
        base = base.replace("/assets/raw.githubusercontent.com", "https://raw.githubusercontent.com")
        for name in QUOTED_FILE_RE.findall(text):
            out.add(base + name)
    return out


class Mirror:
    def __init__(self, force=False):
        self.force = force
        self.manifest = json.loads(MANIFEST.read_text("utf-8")) if MANIFEST.exists() else {}
        self.done = set()
        self.new = self.skipped = 0
        self.failed = []

    def get(self, url):
        """Скачать ассет (если нужно) и вернуть его локальный путь."""
        url = norm(url)
        lp = local_path(url)
        if url in self.done:
            return lp
        self.done.add(url)
        dest = ROOT / lp.lstrip("/")
        if not self.force and self.manifest.get(lp) == url and dest.exists():
            self.skipped += 1
            data = None
        else:
            try:
                data = fetch(url)
            except Exception as e:  # noqa: BLE001
                self.failed.append(f"{url}  ({e})")
                return lp
            dest.parent.mkdir(parents=True, exist_ok=True)
            self.manifest[lp] = url
            self.new += 1
            print("  +", url)
        ext = dest.suffix.lower()
        if ext in (".css", ".js"):
            if data is None:
                # всё равно проходим по вложенным ссылкам — вдруг их нет локально
                text = (dest.with_name(dest.name + ".orig")).read_text("utf-8", "replace") \
                    if dest.with_name(dest.name + ".orig").exists() else dest.read_text("utf-8", "replace")
            else:
                text = data.decode("utf-8", "replace")
                # оригинал рядом — чтобы при повторных синках видеть исходные ссылки
                dest.with_name(dest.name + ".orig").write_text(text, "utf-8", newline="")
            text = self.rewrite_css(text, url) if ext == ".css" else self.rewrite_text(text)
            for old, new in PATCHES.get(dest.name, []):
                if old in text:
                    text = text.replace(old, new)
                    print("  ~ патч", dest.name)
                else:
                    print("  ! патч не применился (Тильда обновила файл?):", dest.name)
            dest.write_text(text, "utf-8", newline="")
        elif data is not None:
            dest.write_bytes(data)
        return lp

    def rewrite_text(self, text):
        return URL_RE.sub(lambda m: self.get(m.group(0)), text).replace(
            "https://raw.githubusercontent.com/", "/assets/raw.githubusercontent.com/")

    def rewrite_css(self, text, base):
        def repl(m):
            ref = m.group(1) or m.group(2)
            ref_s = ref.strip()
            if ref_s.startswith(("data:", "#")):
                return m.group(0)
            absu = urllib.parse.urljoin(base, ref_s)
            host = urllib.parse.urlsplit(absu).netloc
            if host not in ASSET_HOSTS:
                return m.group(0)
            return m.group(0).replace(ref, self.get(absu))
        return CSS_URL_RE.sub(repl, text)

    def save_manifest(self):
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(json.dumps(self.manifest, ensure_ascii=False, indent=1, sort_keys=True), "utf-8")


def extract_custom(html):
    """Вынести наши вставки в custom/, подключив их в тех же местах."""
    report = []
    found = set()

    def block_repl(m):
        block = m.group(0)
        name = next((n for n, mark in CUSTOM_BLOCKS.items() if mark in block), None)
        if not name:
            return block
        found.add(name)
        styles = re.findall(r"<style[^>]*>(.*?)</style>", block, re.S)
        scripts = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", block, re.S)
        srv = SOURCE / "custom-from-server"
        srv.mkdir(parents=True, exist_ok=True)
        for ext, parts in (("css", styles), ("js", scripts)):
            if not parts:
                continue
            code = "\n".join(p.strip() for p in parts) + "\n"
            (srv / f"{name}.{ext}").write_text(code, "utf-8", newline="")
            target = CUSTOM / f"{name}.{ext}"
            if not target.exists():
                CUSTOM.mkdir(exist_ok=True)
                # GitHub-ссылки сразу на локальные копии
                target.write_text(code.replace("https://raw.githubusercontent.com/",
                                               "/assets/raw.githubusercontent.com/"), "utf-8", newline="")
                report.append(f"создан custom/{name}.{ext}")
            else:
                same = target.read_text("utf-8").replace("/assets/raw.githubusercontent.com/", "https://raw.githubusercontent.com/") == code
                report.append(f"custom/{name}.{ext} не тронут" + ("" if same else " (на сервере версия отличается — см. source/custom-from-server/)"))
        # подключаем файлы на месте первого <style>/<script>, остальные инлайны убираем
        state = {"css": False, "js": False}

        def tag_repl(t):
            kind = "css" if t.group(0).startswith("<style") else "js"
            if state[kind]:
                return ""
            state[kind] = True
            return (f'<link rel="stylesheet" href="/custom/{name}.css">' if kind == "css"
                    else f'<script src="/custom/{name}.js"></script>')
        return re.sub(r"<style[^>]*>.*?</style>|<script(?![^>]*\bsrc=)[^>]*>.*?</script>", tag_repl, block, flags=re.S)

    html = re.sub(r"<!-- nominify begin -->.*?<!-- nominify end -->", block_repl, html, flags=re.S)
    for name in CUSTOM_BLOCKS:
        if name not in found:
            report.append(f"ВНИМАНИЕ: вставка «{name}» на странице не найдена")
    return html, report


def main():
    force = "--force" in sys.argv
    print("Скачиваю страницу:", PAGE_URL)
    raw = fetch(PAGE_URL).decode("utf-8")
    SOURCE.mkdir(exist_ok=True)
    (SOURCE / "original.html").write_text(raw, "utf-8", newline="")

    html, report = extract_custom(raw)
    m = Mirror(force)
    html = m.rewrite_text(html)
    # ассеты, на которые ссылаются наши файлы в custom/ (сами файлы не меняем)
    for f in CUSTOM.glob("*.*"):
        t = f.read_text("utf-8", "replace")
        for u in gh_urls(t) | {norm(x) for x in URL_RE.findall(t)}:
            m.get(u)
        for lp in re.findall(r"/assets/((?:%s)/[^\s\"'()<>\\]+\.(?:%s))" % (HOSTS_RE, EXT_RE), t):
            m.get("https://" + lp)
    if EXTRA.exists():
        for line in EXTRA.read_text("utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                m.get(line)

    (ROOT / "index.html").write_text(html, "utf-8", newline="")
    m.save_manifest()
    print()
    for r in report:
        print(" ", r)
    print(f"  ассетов: новых {m.new}, без изменений {m.skipped}, ошибок {len(m.failed)}")
    for f in m.failed:
        print("  ! не скачан:", f)
    digest = hashlib.sha1(raw.encode()).hexdigest()[:10]
    print(f"Готово. index.html обновлён (исходник {len(raw)} байт, sha1 {digest}).")


if __name__ == "__main__":
    main()
