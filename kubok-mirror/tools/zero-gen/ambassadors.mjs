// Секция «Амбассадоры» (сцена слайдера): Фигма (1200 и 320) -> буфер Zero.
// Классы (префикс uc-amb-) нужны скрипту слайдера (custom/ambassadors.js): см. docs/ambassadors-slider.md
// Запуск: node tools/zero-gen/ambassadors.mjs -> tools/zero-gen/out/ambassadors.json
import { writeFileSync, mkdirSync } from "node:fs";
import { text, image, shape, group, finalize, depth, count } from "./lib.mjs";

// Картинки загружены в Тильду («Upload to Tilda»); копии лежат в GitHub MiZaRiii/golf-club (raw), имена: ambassador-dina-*.webp, amb-arrow-*.svg
const TD = "https://static.tildacdn.com/";
const IMG = {
  bg: TD + "tild3438-3963-4235-b133-383533326137/ambassador-dina-bg-1.webp",          // фон (908x480), один на обе ширины, cover
  person: TD + "tild6635-3061-4232-b938-663263623165/ambassador-dina-pers.webp",      // вырезанный спикер (784x480), один на обе ширины
  prev: TD + "tild6432-3762-4133-a666-383333623433/amb-arrow-prev.svg",
  next: TD + "tild3366-3466-4339-b731-363238656534/amb-arrow-next.svg",
};
const BLACK = "#000000";
const WHITE = "#ffffff";
const LINE = "rgba(0,0,0,0.33)";
const FONT_HEAD = "playfair_display";

// ---- стрелка слайдера (группа-кружок с картинкой-шевроном) ----
// kind: prev | next. Размеры: 45/44 (круг), шеврон 8x15 / 6x12. Класс uc-amb-prev / uc-amb-next, состояние is-disabled ставит скрипт.
function arrow(kind, tag) {
  const chevron = image({ name: "Chevron " + kind, img: IMG[kind], fw: 8, fh: 15, fit: "contain", widthmode: undefined, width: [8, 6], height: [15, 12], z: 40 });
  return group({
    name: "Arrow " + kind, cls: "uc-amb-" + kind, dir: "row", alignItems: "center", justify: "center", width: [45, 44], height: [45, 44], hm: "fixed",
    bc: BLACK, bw: ["1px 1px 1px 1px", "1px 1px 1px 1px"], radius: "22px 22px 22px 22px", opacity: kind === "prev" ? "0.3" : "1", z: 30,
  }, [chevron]);
}

// ---- блок управления: счётчик + стрелки. Версия для десктопа (в колонке Info) и для 320 (в корне) ----
function controls(label, hidden, pad, bw, counterFs, counterLh, gap) {
  const counter = text({ name: "Counter " + label, classname: "uc-amb-counter", text: "01 / 04", fontsize: counterFs, lh: counterLh, lsPct: -1, upper: true, color: BLACK, widthmode: "hug", z: 31 });
  const nav = group({ name: "Nav " + label, cls: "uc-amb-nav", dir: "row", gapx: gap, alignItems: "center", wm: "hug", z: 30 }, [arrow("prev"), arrow("next")]);
  return group({ name: "Controls " + label, cls: "uc-amb-controls", dir: "row", justify: "space-between", alignItems: "center", wm: "fill", pad, bw, bc: BLACK, hidden, z: 20 }, [counter, nav]);
}

const heading = text({
  name: "Heading", tag: "h2", text: "Амбассадоры турнира", family: FONT_HEAD, weight: "400", color: BLACK, fontsize: [106.7, 46], lh: 1, lsPct: -3, widthmode: "fill", z: 5,
});

// ---- Portrait: свободная группа (overflow hidden): фон, спикер, рамка, имя поверх (только 1200) ----
const portrait = group({
  name: "Portrait", cls: "uc-amb-portrait", flex: "", overflow: "hidden hidden", wm: ["fixed", "fill"], hm: "fixed", width: [568, 288], height: [300, 224], z: 10,
}, [
  // Один элемент на обе ширины (картинка та же, меняется геометрия; у спикера на 320 прижимаем вправо, чтобы не срезать).
  image({ name: "BG", classname: "uc-amb-bg", img: IMG.bg, fw: 908, fh: 480, left: [0, 0], top: [0, 0], width: [568, 288], height: [300, 224], z: 1 }),
  image({ name: "Person", classname: "uc-amb-person", img: IMG.person, fw: 784, fh: 480, left: [78, 0], top: [0, 0], width: [490, 288], height: [300, 224], pos: ["center center", "right center"], z: 2 }),
  shape({ name: "Frame", classname: "uc-amb-frame", left: [9, 8], top: [9, 8], width: [550, 272], height: [283, 208], bordercolor: WHITE, borderwidth: "1px 1px 1px 1px", opacity: "0.8", z: 3 }),
  text({ name: "Name overlay", classname: "uc-amb-name-ov", text: "Дина<br>Ашрапова", family: FONT_HEAD, weight: "400", color: WHITE, fontsize: [45, 45], lh: 0.9, lsPct: -3, widthmode: "hug", left: [28, 8], top: [191, 8], width: [205, 205], hidden: ["n", "y"], z: 4 }),
]);

// ---- Info: колонка справа (1200) / под фото (320) ----
const nameM = text({ name: "Name", classname: "uc-amb-name", text: "Дина Ашрапова", family: FONT_HEAD, weight: "400", color: BLACK, fontsize: [32, 32], lh: 0.9, lsPct: -3, widthmode: "hug", hidden: ["y", "n"], z: 21 });
const role = text({ name: "Title", classname: "uc-amb-title", text: "Организатор Турнира на Кубок Синергии в Тайланде и основатель проекта «Вокруг гольфа»", family: FONT_HEAD, weight: "400", color: BLACK, fontsize: [25, 19], lh: [1.05, 1.1], lsPct: -2, widthmode: "fill", z: 22 });
const roleWrap = group({ name: "Title wrap", dir: "row", wm: "fill", pad: ["0 0 7px 0", "0 0 0 0"], bw: ["0px 0px 2px 0px", "0px 0px 0px 0px"], bc: BLACK, z: 22 }, [role]);
const descStyle = { family: "Mazzard", weight: "300", color: BLACK, fontsize: [13.75, 11], lh: [1.25, 1.35], lsPct: [3, 6], widthmode: "fill" };
const desc1 = text({ name: "Description first", classname: "uc-amb-desc", text: "Self‑made woman и управленец с 10+ лет опыта в предпринимательстве и крупных корпорациях", ...descStyle, z: 23 });
const desc2 = text({ name: "Description second", classname: "uc-amb-desc", text: "Кандидат экономических наук, мастер делового администрирования", ...descStyle, z: 24 });
const desc1Wrap = group({ name: "Description first wrap", cls: "uc-amb-descs border-05-bottom", dir: "row", wm: "fill", pad: ["0 0 6px 0", "0 0 6px 0"], bw: ["0px 0px 1px 0px", "0px 0px 1px 0px"], bc: LINE, z: 23 }, [desc1]);
const desc2Wrap = group({ name: "Description second wrap", cls: "uc-amb-descs border-05-bottom", dir: "row", wm: "fill", pad: ["0 0 6px 0", "0 0 0 0"], bw: ["0px 0px 1px 0px", "0px 0px 0px 0px"], bc: LINE, z: 24 }, [desc2]);
const descs = group({ name: "Descriptions", cls: "uc-amb-descs-group", dir: "column", gapy: [6, 6], wm: "fill", pad: ["0 0 0 0", "10px 0 0 0"], bw: ["0px 0px 0px 0px", "1px 0px 0px 0px"], bc: BLACK, z: 22 }, [desc1Wrap, desc2Wrap]);
const bio = group({ name: "Bio", cls: "uc-amb-bio", dir: "column", gapy: [11, 12], wm: "fill", z: 22 }, [roleWrap, descs]);

const info = group({
  name: "Info", cls: "uc-amb-info", dir: "column", gapy: [0, 12], justify: ["space-between", "flex-start"], wm: "fill", hm: ["fill", "hug"], z: 20,
}, [controls("desktop", ["n", "y"], ["0 0 10px 0", "0 0 0 0"], ["0px 0px 3px 0px", "0px 0px 0px 0px"], [18.75, 14], 1.1, [10, 8]), nameM, bio]);
// NB: controls() для 1200 внутри Info; версия для 320 ниже, в корне после Slide.

const slide = group({
  name: "Slide", cls: "uc-amb-slide", dir: ["row", "column"], gapx: [12, 0], gapy: [0, 16], wm: "fill", z: 10,
}, [portrait, info]);

const controlsM = controls("mobile", ["y", "n"], ["0 0 0 0", "0 0 0 0"], ["0px 0px 0px 0px", "0px 0px 0px 0px"], [18.75, 14], 1.1, [10, 8]);

const roots = [heading, slide, controlsM];
finalize(roots, null, { rootAutolayout: true }); // артборд на автокомпоновке
const out = { res: 1200, data: roots, timestamp: 0 };
mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
writeFileSync(new URL("./out/ambassadors.json", import.meta.url), JSON.stringify(out));
// Метаданные для редактора: настройки артборда и геометрия детей свободных групп (относительно группы).
// Редактор хранит координаты детей свободной группы абсолютными и считает размер группы по ВСЕМ детям (включая скрытые на этой ширине),
// поэтому после вставки геометрию детей нужно выставить скриптом (zg-editor.js: fixFreeGroups).
const meta = {
  fillRoots: roots.filter((n) => n.type === "group" && n.props.widthmode === "fill").map((n) => n.props.name), // корневые группы с шириной fill
  artboard: {
    flex: "auto",
    // отступы между блоками: сверху 0, снизу = расстояние до следующего блока в макете (десктоп 97); на 320 как во фрейме макета 48/48
    1200: { flexdirection: "column", gap: 45, paddinghorizontal: 26, paddingtop: 0, paddingbottom: 97, heightmode: "hug" },
    320: { flexdirection: "column", gap: 24, paddinghorizontal: 16, paddingtop: 48, paddingbottom: 48, heightmode: "hug" },
  },
  freeGroups: [{
    group: "Portrait",
    kids: {
      "BG": { 1200: [0, 0, 568, 300], 320: [0, 0, 288, 224] },
      "Person": { 1200: [78, 0, 490, 300], 320: [0, 0, 288, 224] },
      "Frame": { 1200: [9, 9, 550, 283], 320: [8, 8, 272, 208] },
      "Name overlay": { 1200: [28, 191, 205, 82], 320: [8, 8, 205, 82] },
    },
  }],
};
writeFileSync(new URL("./out/ambassadors.meta.json", import.meta.url), JSON.stringify(meta));
console.log(`roots ${roots.length}, nodes ${count(roots)}, max depth ${depth(roots)}, size ${JSON.stringify(out).length} bytes`);
