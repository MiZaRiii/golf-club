// Помощник редактора Zero v2. Загружается ОДИН раз за сессию вкладки и дальше вызывается одной командой:
//   eval(await (await fetch("http://localhost:8080/tools/zero-gen/zg-editor.js")).text());   // определяет window.ZG
//   await ZG.rebuild("ambassadors");   // читает out/ambassadors.json и out/ambassadors.meta.json, собирает блок целиком
// Zero может быть в iframe (iframe=y): ZG сам находит окно редактора. Сохраняет и публикует человек.
// Проверено: синтетические нажатия Ctrl+A / Delete / Ctrl+V обрабатываются редактором.
window.ZG = (() => {
  const f = [...document.querySelectorAll("iframe")].find((x) => /zero/.test(x.src));
  const w = f ? f.contentWindow : window, d = w.document;
  const BASE = "http://localhost:8080/tools/zero-gen/out/";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ev = (el) => ["input", "change", "blur"].forEach((t) => el.dispatchEvent(new w.Event(t, { bubbles: true })));
  const setInput = (name, val) => { const i = d.querySelector(`input[name="${name}"]`); if (!i) return false; Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set.call(i, String(val)); ev(i); return true; };
  const setSelect = (name, val) => { const s = d.querySelector(`select[name="${name}"]`); if (!s) return false; s.value = val; ev(s); return true; };
  const layer = (n) => [...d.querySelectorAll(".tn-elem")].find((e) => e.getAttribute("data-field-layer-value") === n);
  const group = (n) => [...d.querySelectorAll(".tn-group")].find((e) => [...e.attributes].some((a) => a.name.includes("group-name") && a.value === n));
  const res = async (r) => { w.zero.core__switchResolution(r); await sleep(450); };
  const key = (k, code, kc, mods = {}) => { const o = { key: k, code, keyCode: kc, which: kc, bubbles: true, cancelable: true, ...mods }; d.dispatchEvent(new w.KeyboardEvent("keydown", o)); d.dispatchEvent(new w.KeyboardEvent("keyup", o)); };
  const count = () => d.querySelectorAll(".tn-elem").length;

  const api = {
    w, d, sleep, layer, group, res,
    // Очистка внутри Zero: Ctrl+A → Delete на 1200 и на 320 (скрытые на ширине слои выбираются только на своей ширине)
    async clear() {
      for (const r of [1200, 320, 1200]) { await res(r); key("a", "KeyA", 65, { ctrlKey: true }); await sleep(150); key("Delete", "Delete", 46); await sleep(250); }
      return count();
    },
    // Артборд: flex, направление, gap, padding (общий или раздельно top/bottom), высота (heightmode), отдельно для 1200 и 320
    // снять выделение (клик по пустому полю .tn-floor): иначе в панели настройки элемента, а не артборда
    async deselect() { const x = w.innerWidth * 0.35, y = w.innerHeight * 0.85, t = d.elementFromPoint(x, y); if (t) ["mousedown", "mouseup", "click"].forEach((n) => t.dispatchEvent(new w.MouseEvent(n, { bubbles: true, cancelable: true, clientX: x, clientY: y, view: w }))); await sleep(300); },
    async setArtboard(cfg) {
      for (const r of [1200, 320]) {
        await res(r); await api.deselect();
        setSelect("flex", cfg.flex === "auto" ? "auto" : ""); await sleep(250);
        const c = cfg[r]; if (!c || cfg.flex !== "auto") continue;
        if (!d.getElementById(c.flexdirection)) { // секция «Auto layout» свёрнута: раскрываем
          const h = [...d.querySelectorAll("*")].find((e) => e.children.length === 0 && /^auto layout$/i.test((e.textContent || "").trim()) && e.offsetParent);
          if (h) { h.click(); await sleep(300); }
        }
        d.getElementById(c.flexdirection).parentElement.click();
        setInput(c.flexdirection === "column" ? "flexgapy" : "flexgapx", c.gap ?? 0);
        setInput("paddinghorizontal", c.paddinghorizontal ?? 0);
        if (c.paddingtop !== undefined || c.paddingbottom !== undefined) {
          const dif = d.querySelector('.sui-panel__differ[data-original-field="padding"]');
          if (dif && !d.querySelector('input[name="paddingtop"]')?.offsetParent) { dif.click(); await sleep(150); }
          setInput("paddingtop", c.paddingtop ?? 0); setInput("paddingbottom", c.paddingbottom ?? 0);
        } else setInput("paddingvertical", c.paddingvertical ?? 0);
        if (c.heightmode !== undefined) { if (c.heightmode === "hug") { setSelect("heightmode", ""); await sleep(200); } setSelect("heightmode", c.heightmode); } // переключение Fixed→Hug заставляет редактор пересчитать высоту
        await sleep(250);
      }
    },
    // Положить JSON в буфер вставки (ID из t396__getUniqueId)
    async inject(url) {
      const j = await fetch(url, { cache: "no-store" }).then((x) => x.json());
      const map = {}; const walk = (n) => { map[n.id] = w.t396__getUniqueId(); (n.children || []).forEach(walk); }; j.data.forEach(walk);
      const fix = (n) => { n.id = map[n.id]; n.props.id = n.id; if (n.props.groupid) n.props.groupid = map[n.props.groupid]; (n.children || []).forEach(fix); }; j.data.forEach(fix);
      j.timestamp = Date.now(); w.localStorage.setItem("tn_store_buffer__copy-paste", JSON.stringify(j));
      return Object.keys(map).length;
    },
    paste() { key("v", "KeyV", 86, { ctrlKey: true }); },
    // Свободные группы: дети в абсолютных координатах, размер группы = bbox ВСЕХ детей (и скрытых на ширине)
    async fixFreeGroups(list) {
      for (const g of list || []) for (const r of [1200, 320]) {
        await res(r);
        const el = group(g.group); if (!el) continue; const sfx = r === 320 ? "-res-320" : "";
        const gl = +el.getAttribute(`data-field-left${sfx}-value`), gt = +el.getAttribute(`data-field-top${sfx}-value`);
        for (const [n, geo] of Object.entries(g.kids)) {
          const [l, t, wd, h] = geo[r], e = layer(n); if (!e) continue;
          for (const [k, v] of [["left", gl + l], ["top", gt + t], ["width", wd], ["height", h]]) w.elem__setFieldValue(e, k, String(v), "render", "updateui", r);
        }
        await sleep(150);
      }
    },
    // Значения полей на нужной ширине у существующих элементов: patch([["Frame","opacity","0.6",320], ...])
    patch(list) { for (const [n, f2, v, r] of list) w.elem__setFieldValue(layer(n), f2, String(v), "render", "updateui", r); },
    // Загрузка внешних картинок в Тильду («Upload to Tilda»)
    async uploadImages(match = /raw\.githubusercontent/) {
      await res(1200); const out = [];
      for (const e of [...d.querySelectorAll(".tn-elem")].filter((x) => x.querySelector("img") && match.test(x.querySelector("img").src))) {
        w.elem__select(e, false); await sleep(600);
        const b = [...d.querySelectorAll(".sui-file-upload")].find((x) => x.offsetParent && /upload to tilda/i.test(x.textContent));
        if (b) { b.click(); await sleep(4500); out.push(e.getAttribute("data-field-layer-value") + ": ok"); } else out.push(e.getAttribute("data-field-layer-value") + ": нет кнопки");
      }
      return out;
    },
    // ВСЁ ОДНИМ ВЫЗОВОМ: очистка → артборд → вставка → геометрия свободных групп → итог
    // дождаться загрузки редактора (после навигации/перезагрузки)
    async ready() {
      for (let i = 0; i < 100; i++) {
        // окно «найдена локальная версия блока, восстановить?» — отказываемся (грузим серверную версию)
        if (/locally saved|локальн/i.test(d.body.innerText.slice(0, 4000))) { const b = [...d.querySelectorAll("*")].find((e) => e.children.length === 0 && /^(cancel|отмена)$/i.test((e.textContent || "").trim()) && e.offsetParent); if (b) b.click(); }
        if (w.zero && d.querySelector(".tn-layout") && d.querySelector(".tn-artboard") && d.querySelectorAll(".tn-res-item").length) break;
        await sleep(300);
      }
      await sleep(500);
    },
    async rebuild(name) {
      await api.ready();
      const meta = await fetch(`${BASE}${name}.meta.json`, { cache: "no-store" }).then((x) => x.json());
      const log = {}; log.cleared = await api.clear();
      await api.setArtboard(meta.artboard);
      log.nodes = await api.inject(`${BASE}${name}.json`);
      await res(1200); await api.deselect(); api.paste(); await sleep(900); await api.deselect();
      await api.fixFreeGroups(meta.freeGroups);
      // редактор превращает ширину fill у корневых групп в fixed: возвращаем, затем пересчитываем высоту артборда
      for (const n of meta.fillRoots || []) { const g = group(n); if (g) for (const r of [1200, 320]) w.elem__setFieldValue(g, "widthmode", "fill", "render", "updateui", r); }
      if (meta.patch) api.patch(meta.patch);
      await sleep(300);
      await api.setArtboard(meta.artboard); // повторно: после очистки/вставки высота (hug) должна пересчитаться
      await res(1200);
      log.elems = count(); log.heights = {};
      for (const r of [1200, 320]) { await res(r); log.heights[r] = d.querySelector(".tn-artboard").style.height; }
      await res(1200);
      return log;
    },
  };
  return api;
})();
