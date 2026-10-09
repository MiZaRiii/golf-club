// Генератор буфера Zero (формат см. docs/zero-buffer-format.md).
// Каждое свойство задаётся парой: [значение для 1200, значение для 320].
// undefined в паре = свойство для этого разрешения не задаётся (наследуется / по умолчанию).

const R = "-res-320";
let seq = 0;
export const tmpId = () => "tmp" + String(++seq).padStart(4, "0");
export const resetIds = () => { seq = 0; };

// Кернинг: в Фигме проценты от размера шрифта, в Zero только пиксели.
// px = процент / 100 * fontsize, считать ОТДЕЛЬНО для каждой ширины (у 1200 и 320 свой fontsize).
// Пример: шрифт 10px, -3% -> -0.3 (число в поле letterspacing).
// Использование: ls: lsPx([-3, -3], [10, 9])  ->  [-0.3, -0.27]
// Размер шрифта в Zero только целый: округляем, при .5 вниз (7.5 -> 7, 12.5 -> 12, 106.7 -> 107).
export const rhd = (x) => Math.ceil(x - 0.5);
const two = (x) => +x.toFixed(2); // после запятой максимум два знака (0.375 не подходит)
// Кернинг считается от УЖЕ округлённого размера шрифта, отдельно для каждой ширины.
export const lsPx = (pct, fs) => (Array.isArray(pct) ? pct : [pct, pct]).map((p, i) => (p === undefined ? undefined : two((p / 100) * rhd(Array.isArray(fs) ? fs[i] : fs))));

const INT_KEYS = new Set(["top", "left", "width", "height"]);
const num = (v, k) => (typeof v === "number" ? String(INT_KEYS.has(k) ? Math.round(v) : two(v)) : v);

// pairs: { key: [d, m] | scalar }
function applyPairs(out, pairs) {
  for (const [k, v] of Object.entries(pairs)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      if (v[0] !== undefined) out[k] = num(v[0], k);
      if (v[1] !== undefined) out[k + R] = num(v[1], k);
    } else {
      out[k] = num(v, k);
    }
  }
}

const FREE = { container: "grid", axisx: "left", axisy: "top", margin: "0 0 0 0", leftunits: "px", topunits: "px", widthunits: "px", heightunits: "px" };

// ----- text -----
// o: { name, text, d:{...}, m:{...} } — d/m: fontsize, ls(px), lh, weight, family, color, align, ...
export function text(o) {
  if (o.padding !== undefined) throw new Error("text: padding запрещён (в Zero его нельзя править в панели). Оберни текст в группу с padding.");
  const p = { elem_type: "text", id: tmpId(), layer: o.name, name: o.name };
  Object.assign(p, FREE);
  const fsPair = Array.isArray(o.fontsize) ? o.fontsize : [o.fontsize, o.fontsize];
  const fs = fsPair.map((v) => (v === undefined ? undefined : rhd(v)));
  const ls = o.lsPct !== undefined ? lsPx(o.lsPct, fs) : o.ls; // ls — готовые px (для особых случаев)
  applyPairs(p, {
    fontsize: fs, color: o.color ?? "#ffffff", fontfamily: o.family ?? "Mazzard", fontweight: o.weight ?? "900",
    lineheight: o.lh, letterspacing: ls, lettercase: o.upper ? "uppercase" : undefined, align: o.align ?? "left",
    textfit: o.textfit ?? "autoheight", valign: o.valign ?? "top",
    top: o.top, left: o.left, width: o.width, height: o.height, widthmode: o.widthmode, heightmode: o.heightmode,
    zindex: o.z, hidden: o.hidden ?? "n", tag: o.tag ?? "div", classname: o.classname,
  });
  p.padding = "0 0 0 0";
  p.shadow_text_opacity = "100";
  p.borderradius = "0px 0px 0px 0px";
  p.text = o.text;
  return { id: p.id, index: 0, type: "element", isSelected: false, props: p };
}

// ----- image -----
export function image(o) {
  const p = { elem_type: "image", id: tmpId(), layer: o.name, name: o.name, img: o.img, imagefit: o.fit ?? "cover", filewidth: String(o.fw), fileheight: String(o.fh), opacity: "1", rotate: "0", borderradius: "0px 0px 0px 0px" };
  Object.assign(p, FREE);
  applyPairs(p, { top: o.top, left: o.left, width: o.width, height: o.height, widthmode: "fixed", heightmode: "fixed", zindex: o.z, hidden: o.hidden ?? "n", alt: o.alt, classname: o.classname, imageposition: o.pos ?? "center center" });
  return { id: p.id, index: 0, type: "element", isSelected: false, props: p };
}

// ----- shape (рамка/прямоугольник) -----
export function shape(o) {
  const p = { elem_type: "shape", id: tmpId(), layer: o.name, name: o.name, rotate: "0", borderstyle: "solid", borderradius: "0px 0px 0px 0px" };
  Object.assign(p, FREE);
  applyPairs(p, { top: o.top, left: o.left, width: o.width, height: o.height, opacity: o.opacity ?? "1", bgcolor: o.bgcolor ?? "", bordercolor: o.bordercolor, borderwidth: o.borderwidth, zindex: o.z, hidden: o.hidden ?? "n", widthmode: "fixed", heightmode: "fixed", classname: o.classname });
  return { id: p.id, index: 0, type: "element", isSelected: false, props: p };
}

// Тонкие линии (1px макета 1920) в этом проекте оформляются классом border-05-bottom (0.5px обрабатывает CSS в T123 страницы)
const THIN_BOTTOM = "0px 0px 1px 0px";
const withThinClass = (cls, bw) => {
  const list = Array.isArray(bw) ? bw : [bw];
  if (!list.some((v) => v === THIN_BOTTOM)) return cls;
  const have = String(cls || "").split(/\s+/).filter(Boolean);
  return have.includes("border-05-bottom") ? have.join(" ") : [...have, "border-05-bottom"].join(" ");
};

// ----- group (автокомпоновка) -----
// o: { name, dir:[d,m] 'row'|'column', gap:[d,m], pad:[d,m], w:[mode,px], h, align, justify, ... }
export function group(o, children = []) {
  const p = { elem_type: "group", type: "physical", id: tmpId(), name: o.name, layer: o.name, groupid: "", container: "grid", [`container${R}`]: "grid", flex: o.flex ?? "auto", // flex: "" = группа без автокомпоновки (свободные дети)
    overflow: o.overflow ?? "visible visible", margin: "0 0 0 0", leftunits: "px", topunits: "px", widthunits: "px", heightunits: "px", borderradius: "0px 0px 0px 0px" };
  const dir = o.dir ?? ["row", "row"];
  applyPairs(p, {
    flexdirection: dir, flexgapx: o.gapx, flexgapy: o.gapy, flexalignitems: o.alignItems ?? "flex-start", flexjustifycontent: o.justify ?? "flex-start", flexaligncontent: "flex-start",
    widthmode: o.wm ?? "fixed", heightmode: o.hm ?? "hug", width: o.width, height: o.height, left: o.left, top: o.top, zindex: o.z, hidden: o.hidden ?? "n",
    padding: o.pad, bgcolor: o.bg, bordercolor: o.bc, borderwidth: o.bw, borderradius: o.radius, opacity: o.opacity, classname: withThinClass(o.cls, o.bw),
  });
  return { id: p.id, index: 0, type: "group", isSelected: false, props: p, children };
}

// Проставить index, groupid и выровнять top/left детей по родителю
// Порядок в буфере Zero (проверено):
//  - дети группы с автокомпоновкой: массив = ОБРАТНЫЙ визуальному потоку (разворачиваем);
//  - дети свободной группы (flex ""): массив = снизу вверх, последний сверху (НЕ разворачиваем), z-index внутри группы не работает;
//  - корень при включённой автокомпоновке артборда: массив = порядок потока (НЕ разворачиваем), opts.rootAutolayout;
//  - корень при свободном артборде: массив обратный (index 0 = верхний слой), z-index поля работает.
// Автор описывает в естественном порядке (поток: сверху вниз / слева направо; свободные: снизу вверх).
export function finalize(nodes, parent, opts = {}) {
  const freeGroup = parent && parent.props.flex === "";
  const keep = freeGroup || (!parent && opts.rootAutolayout);
  if (!keep) nodes.reverse();
  nodes.forEach((n, i) => {
    n.index = i;
    if (parent) {
      n.props.groupid = parent.id;
      if (n.props.elem_type === "text") {
        n.props.heightmode = n.props.heightmode ?? "hug";
        n.props.widthmode = n.props.widthmode ?? "fixed";
      }
      if (parent.props.top !== undefined && n.props.top === undefined) n.props.top = parent.props.top;
      if (parent.props.left !== undefined && n.props.left === undefined) n.props.left = parent.props.left;
      for (const k of ["top", "left"]) if (parent.props[k + R] !== undefined && n.props[k + R] === undefined) n.props[k + R] = parent.props[k + R];
    }
    if (n.children) finalize(n.children, n, opts);
  });
  return nodes;
}

export function depth(nodes, d = 1) {
  return Math.max(...nodes.map((n) => (n.children ? depth(n.children, d + 1) : d)));
}
export function count(nodes) {
  return nodes.reduce((s, n) => s + 1 + (n.children ? count(n.children) : 0), 0);
}
