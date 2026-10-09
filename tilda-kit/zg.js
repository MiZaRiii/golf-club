// ZG — сборка Zero Block из спецификации прямо в редакторе Тильды (без локального сервера).
// Загрузка один раз за вкладку (в окне редактора страницы или Zero):
//   eval(await (await fetch("https://raw.githubusercontent.com/MiZaRiii/golf-club/main/tilda-kit/zg.js")).text());
// Дальше:
//   ZG.cfg({ family: "Mazzard", weight: "400", color: "#000000", thin: "border-05-bottom" });
//   const { text, image, shape, group } = ZG;
//   await ZG.build([ ...корневые узлы ], { artboard, freeGroups, patch, rootAutolayout });
// Каждое свойство: скаляр или пара [1200, 320]. Сохраняет и публикует человек.
window.ZG = (() => {
  const R = "-res-320";
  const C = { family: "Arial", weight: "400", color: "#000000", thin: "" };
  let seq = 0;
  const tmpId = () => "tmp" + String(++seq).padStart(4, "0");
  const rhd = (x) => Math.ceil(x - 0.5); // размер шрифта целый, .5 вниз
  const two = (x) => +x.toFixed(2);
  const lsPx = (pct, fs) => (Array.isArray(pct) ? pct : [pct, pct]).map((p, i) => (p === undefined ? undefined : two((p / 100) * rhd(Array.isArray(fs) ? fs[i] : fs))));
  const INT = new Set(["top", "left", "width", "height"]);
  const num = (v, k) => (typeof v === "number" ? String(INT.has(k) ? Math.round(v) : two(v)) : v);
  const apply = (out, pairs) => {
    for (const [k, v] of Object.entries(pairs)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) { if (v[0] !== undefined) out[k] = num(v[0], k); if (v[1] !== undefined) out[k + R] = num(v[1], k); }
      else out[k] = num(v, k);
    }
  };
  const FREE = { container: "grid", axisx: "left", axisy: "top", margin: "0 0 0 0", leftunits: "px", topunits: "px", widthunits: "px", heightunits: "px" };
  const node = (p, type = "element", children) => ({ id: p.id, index: 0, type, isSelected: false, props: p, ...(children ? { children } : {}) });

  function text(o) {
    if (o.padding !== undefined) throw new Error("text: padding запрещён, оберни в группу с pad");
    const p = { elem_type: "text", id: tmpId(), layer: o.name, name: o.name, ...FREE };
    const fs = (Array.isArray(o.fontsize) ? o.fontsize : [o.fontsize, o.fontsize]).map((v) => (v === undefined ? undefined : rhd(v)));
    apply(p, {
      fontsize: fs, color: o.color ?? C.color, fontfamily: o.family ?? C.family, fontweight: o.weight ?? C.weight,
      lineheight: o.lh, letterspacing: o.lsPct !== undefined ? lsPx(o.lsPct, fs) : o.ls, lettercase: o.upper ? "uppercase" : undefined,
      align: o.align ?? "left", textfit: o.textfit ?? "autoheight", valign: o.valign ?? "top",
      top: o.top, left: o.left, width: o.width, height: o.height, widthmode: o.widthmode, heightmode: o.heightmode,
      zindex: o.z, hidden: o.hidden ?? "n", tag: o.tag ?? "div", classname: o.classname,
    });
    Object.assign(p, { padding: "0 0 0 0", shadow_text_opacity: "100", borderradius: "0px 0px 0px 0px", text: o.text });
    return node(p);
  }
  function image(o) {
    const p = { elem_type: "image", id: tmpId(), layer: o.name, name: o.name, img: o.img, imagefit: o.fit ?? "cover", filewidth: String(o.fw), fileheight: String(o.fh), opacity: "1", rotate: "0", borderradius: "0px 0px 0px 0px", ...FREE };
    apply(p, { top: o.top, left: o.left, width: o.width, height: o.height, widthmode: o.wm ?? "fixed", heightmode: "fixed", zindex: o.z, hidden: o.hidden ?? "n", alt: o.alt, classname: o.classname, imageposition: o.pos ?? "center center", borderradius: o.radius });
    return node(p);
  }
  function shape(o) {
    const p = { elem_type: "shape", id: tmpId(), layer: o.name, name: o.name, rotate: "0", borderstyle: "solid", borderradius: "0px 0px 0px 0px", ...FREE };
    apply(p, { top: o.top, left: o.left, width: o.width, height: o.height, opacity: o.opacity ?? "1", bgcolor: o.bgcolor ?? "", bordercolor: o.bordercolor, borderwidth: o.borderwidth, borderradius: o.radius, zindex: o.z, hidden: o.hidden ?? "n", widthmode: o.wm ?? "fixed", heightmode: "fixed", classname: o.classname });
    return node(p);
  }
  const thinCls = (cls, bw) => {
    if (!C.thin || ![].concat(bw).some((v) => v === "0px 0px 1px 0px")) return cls;
    const h = String(cls || "").split(/\s+/).filter(Boolean);
    return (h.includes(C.thin) ? h : [...h, C.thin]).join(" ");
  };
  // flex: "auto" автокомпоновка, "" свободная группа
  function group(o, children = []) {
    const p = { elem_type: "group", type: "physical", id: tmpId(), name: o.name, layer: o.name, groupid: "", container: "grid", ["container" + R]: "grid", flex: o.flex ?? "auto",
      overflow: o.overflow ?? "visible visible", margin: "0 0 0 0", leftunits: "px", topunits: "px", widthunits: "px", heightunits: "px", borderradius: "0px 0px 0px 0px" };
    apply(p, {
      flexdirection: o.dir ?? ["row", "row"], flexgapx: o.gapx, flexgapy: o.gapy, flexalignitems: o.alignItems ?? "flex-start", flexjustifycontent: o.justify ?? "flex-start", flexaligncontent: "flex-start",
      widthmode: o.wm ?? "fixed", heightmode: o.hm ?? "hug", width: o.width, height: o.height, left: o.left, top: o.top, zindex: o.z, hidden: o.hidden ?? "n",
      padding: o.pad, bgcolor: o.bg, bordercolor: o.bc, borderwidth: o.bw, borderradius: o.radius, opacity: o.opacity, classname: thinCls(o.cls, o.bw),
    });
    return node(p, "group", children);
  }
  // порядок: автокомпоновка — разворот; свободная группа и корень при автокомпоновке артборда — как есть; корень свободного артборда — разворот
  function finalize(nodes, parent, opts = {}) {
    const keep = (parent && parent.props.flex === "") || (!parent && opts.rootAutolayout);
    if (!keep) nodes.reverse();
    nodes.forEach((n, i) => {
      n.index = i;
      if (parent) {
        n.props.groupid = parent.id;
        if (n.props.elem_type === "text") { n.props.heightmode ??= "hug"; n.props.widthmode ??= "fixed"; }
        for (const k of ["top", "left", "top" + R, "left" + R]) if (parent.props[k] !== undefined && n.props[k] === undefined) n.props[k] = parent.props[k];
      }
      if (n.children) finalize(n.children, n, opts);
    });
    return nodes;
  }
  const depth = (ns, d = 1) => Math.max(...ns.map((n) => (n.children ? depth(n.children, d + 1) : d)));
  const count = (ns) => ns.reduce((s, n) => s + 1 + (n.children ? count(n.children) : 0), 0);

  // ---- редактор ----
  const f = [...document.querySelectorAll("iframe")].find((x) => /zero/.test(x.src));
  const w = f ? f.contentWindow : window, d = w.document;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ev = (el) => ["input", "change", "blur"].forEach((t) => el.dispatchEvent(new w.Event(t, { bubbles: true })));
  const setInput = (name, val) => { const i = d.querySelector(`input[name="${name}"]`); if (!i) return false; Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set.call(i, String(val)); ev(i); return true; };
  const setSelect = (name, val) => { const s = d.querySelector(`select[name="${name}"]`); if (!s) return false; s.value = val; ev(s); return true; };
  const layer = (n) => [...d.querySelectorAll(".tn-elem")].find((e) => e.getAttribute("data-field-layer-value") === n);
  const grp = (n) => [...d.querySelectorAll(".tn-group")].find((e) => [...e.attributes].some((a) => a.name.includes("group-name") && a.value === n));
  const res = async (r) => { w.zero.core__switchResolution(r); await sleep(450); };
  const key = (k, code, kc, mods = {}) => { const o = { key: k, code, keyCode: kc, which: kc, bubbles: true, cancelable: true, ...mods }; d.dispatchEvent(new w.KeyboardEvent("keydown", o)); d.dispatchEvent(new w.KeyboardEvent("keyup", o)); };
  const elems = () => d.querySelectorAll(".tn-elem").length;

  async function ready() {
    for (let i = 0; i < 100; i++) {
      if (/locally saved|локальн/i.test(d.body.innerText.slice(0, 4000))) { const b = [...d.querySelectorAll("*")].find((e) => e.children.length === 0 && /^(cancel|отмена)$/i.test((e.textContent || "").trim()) && e.offsetParent); if (b) b.click(); }
      if (w.zero && d.querySelector(".tn-layout") && d.querySelector(".tn-artboard") && d.querySelectorAll(".tn-res-item").length) break;
      await sleep(300);
    }
    await sleep(500);
  }
  async function clear() {
    for (const r of [1200, 320, 1200]) { await res(r); key("a", "KeyA", 65, { ctrlKey: true }); await sleep(150); key("Delete", "Delete", 46); await sleep(250); }
    return elems();
  }
  async function deselect() {
    const x = w.innerWidth * 0.35, y = w.innerHeight * 0.85, t = d.elementFromPoint(x, y);
    if (t) ["mousedown", "mouseup", "click"].forEach((n) => t.dispatchEvent(new w.MouseEvent(n, { bubbles: true, cancelable: true, clientX: x, clientY: y, view: w })));
    await sleep(300);
  }
  // cfg: { flex: "auto"|"", 1200: { flexdirection, gap, paddinghorizontal, paddingvertical | paddingtop+paddingbottom, heightmode, height }, 320: {...} }
  async function setArtboard(cfg) {
    for (const r of [1200, 320]) {
      await res(r); await deselect();
      setSelect("flex", cfg.flex === "auto" ? "auto" : ""); await sleep(250);
      const c = cfg[r]; if (!c) continue;
      if (cfg.flex !== "auto") { if (c.height !== undefined) setInput("height", c.height); continue; }
      if (!d.getElementById(c.flexdirection)) {
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
      if (c.heightmode !== undefined) { if (c.heightmode === "hug") { setSelect("heightmode", ""); await sleep(200); } setSelect("heightmode", c.heightmode); }
      await sleep(250);
    }
  }
  function inject(data) {
    const j = JSON.parse(JSON.stringify({ res: 1200, data }));
    const map = {}; const walk = (n) => { map[n.id] = w.t396__getUniqueId(); (n.children || []).forEach(walk); }; j.data.forEach(walk);
    const fix = (n) => { n.id = map[n.id]; n.props.id = n.id; if (n.props.groupid) n.props.groupid = map[n.props.groupid]; (n.children || []).forEach(fix); }; j.data.forEach(fix);
    j.timestamp = Date.now(); w.localStorage.setItem("tn_store_buffer__copy-paste", JSON.stringify(j));
    return Object.keys(map).length;
  }
  const paste = () => key("v", "KeyV", 86, { ctrlKey: true });
  // свободные группы: [{ group, kids: { "Слой": { 1200: [l,t,w,h], 320: [...] } } }] — координаты от левого верха группы
  async function fixFreeGroups(list) {
    for (const g of list || []) for (const r of [1200, 320]) {
      await res(r);
      const el = grp(g.group); if (!el) continue; const sfx = r === 320 ? R : "";
      const gl = +el.getAttribute(`data-field-left${sfx}-value`), gt = +el.getAttribute(`data-field-top${sfx}-value`);
      for (const [n, geo] of Object.entries(g.kids)) {
        const e = layer(n); if (!e || !geo[r]) continue; const [l, t, wd, h] = geo[r];
        for (const [k, v] of [["left", gl + l], ["top", gt + t], ["width", wd], ["height", h]]) w.elem__setFieldValue(e, k, String(v), "render", "updateui", r);
      }
      await sleep(150);
    }
  }
  // [["Слой","поле","значение",1200|320], ...]; группы ищутся по имени, если нет такого слоя
  function patch(list) {
    const miss = [];
    for (const [n, fld, v, r] of list) { const e = layer(n) || grp(n); if (e) w.elem__setFieldValue(e, fld, String(v), "render", "updateui", r); else miss.push(n); }
    return miss.length ? { miss } : "ok";
  }
  async function uploadImages(match = /raw\.githubusercontent|jsdelivr/) {
    await res(1200); const out = [];
    for (const e of [...d.querySelectorAll(".tn-elem")].filter((x) => x.querySelector("img") && match.test(x.querySelector("img").src))) {
      w.elem__select(e, false); await sleep(600);
      const b = [...d.querySelectorAll(".sui-file-upload")].find((x) => x.offsetParent && /upload to tilda/i.test(x.textContent));
      const n = e.getAttribute("data-field-layer-value");
      if (b) { b.click(); await sleep(4500); out.push(n + ": " + (e.querySelector("img")?.src || "")); } else out.push(n + ": нет кнопки");
    }
    return out;
  }
  async function heights() { const h = {}; for (const r of [1200, 320]) { await res(r); h[r] = d.querySelector(".tn-artboard").style.height; } await res(1200); return h; }

  // ВСЁ ОДНИМ ВЫЗОВОМ: финализация → очистка → артборд → вставка → свободные группы → fill корней → patch → высота
  async function build(roots, meta = {}) {
    finalize(roots, null, { rootAutolayout: meta.rootAutolayout ?? meta.artboard?.flex === "auto" });
    const dp = depth(roots); if (dp > 6) throw new Error("глубина групп " + dp + " > 6");
    await ready();
    const log = { cleared: meta.keep ? "-" : await clear(), depth: dp };
    if (meta.artboard) await setArtboard(meta.artboard);
    log.nodes = inject(roots);
    await res(1200); await deselect(); paste(); await sleep(900); await deselect();
    await fixFreeGroups(meta.freeGroups);
    const fill = meta.fillRoots ?? roots.filter((n) => n.type === "group" && n.props.widthmode === "fill").map((n) => n.props.name);
    for (const n of fill) { const g = grp(n); if (g) for (const r of [1200, 320]) w.elem__setFieldValue(g, "widthmode", "fill", "render", "updateui", r); }
    if (meta.patch) log.patch = patch(meta.patch);
    await sleep(300);
    if (meta.artboard) await setArtboard(meta.artboard);
    log.elems = elems(); log.heights = await heights();
    return log;
  }
  // совместимость со старым зеркалом: out/<name>.json + .meta.json с локального сервера
  async function rebuild(name, base = "http://localhost:8080/tools/zero-gen/out/") {
    const j = await fetch(`${base}${name}.json`, { cache: "no-store" }).then((x) => x.json());
    const meta = await fetch(`${base}${name}.meta.json`, { cache: "no-store" }).then((x) => x.json());
    await ready(); const log = { cleared: await clear() };
    if (meta.artboard) await setArtboard(meta.artboard);
    const map = {}; const walk = (n) => { map[n.id] = w.t396__getUniqueId(); (n.children || []).forEach(walk); }; j.data.forEach(walk);
    const fx = (n) => { n.id = map[n.id]; n.props.id = n.id; if (n.props.groupid) n.props.groupid = map[n.props.groupid]; (n.children || []).forEach(fx); }; j.data.forEach(fx);
    j.timestamp = Date.now(); w.localStorage.setItem("tn_store_buffer__copy-paste", JSON.stringify(j));
    await res(1200); await deselect(); paste(); await sleep(900); await deselect();
    await fixFreeGroups(meta.freeGroups);
    for (const n of meta.fillRoots || []) { const g = grp(n); if (g) for (const r of [1200, 320]) w.elem__setFieldValue(g, "widthmode", "fill", "render", "updateui", r); }
    if (meta.patch) patch(meta.patch);
    if (meta.artboard) await setArtboard(meta.artboard);
    log.elems = elems(); log.heights = await heights(); return log;
  }
  // компактная выгрузка текущего блока: имя, тип, геометрия 1200/320 — для сверки без скриншотов
  function dump() {
    const g = (e, k) => e.getAttribute(`data-field-${k}-value`);
    return [...d.querySelectorAll(".tn-elem,.tn-group")].map((e) => [g(e, "layer") || g(e, "group-name") || "?", ["left", "top", "width", "height"].map((k) => g(e, k)).join(","), ["left", "top", "width", "height"].map((k) => g(e, k + R)).join(",")].join(" | ")).join("\n");
  }

  return {
    cfg: (o) => Object.assign(C, o), text, image, shape, group, lsPx, rhd, finalize, depth, count,
    w, d, sleep, res, layer, group_: grp, ready, clear, deselect, setArtboard, inject, paste, fixFreeGroups, patch, uploadImages, heights, build, rebuild, dump,
  };
})();
