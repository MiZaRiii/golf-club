// Блок «Карточки амбассадоров» (источник данных для слайдера): Zero, всё на автокомпоновке.
// Карточка = группа .uc-amb-card; скрипт custom/ambassadors.js читает из неё фон, спикера, ФИО, заголовок (h3), описание
// и показывает в сцене (блок «Амбассадоры»). Новый амбассадор = скопировать карточку (Ctrl+C / Ctrl+V) и заменить содержимое.
// Запуск: node tools/zero-gen/ambassador-cards.mjs -> tools/zero-gen/out/ambassador-cards.json (+ .meta.json)
import { writeFileSync, mkdirSync } from "node:fs";
import { text, image, group, finalize, depth, count } from "./lib.mjs";

const TD = "https://static.tildacdn.com/";
const IMG = {
  bg: TD + "tild3438-3963-4235-b133-383533326137/ambassador-dina-bg-1.webp",        // фон (908x480)
  person: TD + "tild6635-3061-4232-b938-663263623165/ambassador-dina-pers.webp",    // вырезанный спикер (784x480)
};
const BLACK = "#000000";
const FONT_HEAD = "playfair_display";

function card() {
  const imgs = group({ name: "Images", dir: "row", gapx: 12, wm: "fill", z: 10 }, [
    image({ name: "Photo bg", classname: "uc-amb-c-bg", img: IMG.bg, fw: 908, fh: 480, width: [284, 122], height: [150, 64], z: 11 }),
    image({ name: "Photo speaker", classname: "uc-amb-c-person", img: IMG.person, fw: 784, fh: 480, width: [245, 122], height: [150, 75], z: 12 }),
  ]);
  const name = text({ name: "Name", classname: "uc-amb-c-name", text: "Дина Ашрапова", family: FONT_HEAD, weight: "400", color: BLACK, fontsize: [32, 28], lh: 1, lsPct: -2, widthmode: "fill", z: 20 });
  const title = text({ name: "Title h3", tag: "h3", classname: "uc-amb-c-title", text: "Организатор Турнира на Кубок Синергии в Тайланде и основатель проекта «Вокруг гольфа»", family: FONT_HEAD, weight: "400", color: BLACK, fontsize: [20, 18], lh: 1.1, lsPct: -2, widthmode: "fill", z: 21 });
  const d = { family: "Mazzard", weight: "300", color: BLACK, fontsize: [14, 12], lh: 1.3, lsPct: 3, widthmode: "fill" };
  const desc1 = text({ name: "Description first", classname: "uc-amb-c-desc", text: "Self‑made woman и управленец с 10+ лет опыта в предпринимательстве и крупных корпорациях", ...d, z: 22 });
  const desc2 = text({ name: "Description second", classname: "uc-amb-c-desc", text: "Кандидат экономических наук, мастер делового администрирования", ...d, z: 23 });
  return group({
    name: "Ambassador card", cls: "uc-amb-card", dir: "column", gapy: 12, wm: "fill", pad: "16px 16px 16px 16px", bc: "rgba(0,0,0,0.25)", bw: "1px 1px 1px 1px", z: 5,
  }, [imgs, name, title, desc1, desc2]);
}

const roots = [card()];
finalize(roots, null, { rootAutolayout: true });
const meta = {
  fillRoots: roots.filter((n) => n.type === "group" && n.props.widthmode === "fill").map((n) => n.props.name), // корневые группы с шириной fill
  artboard: {
    flex: "auto",
    1200: { flexdirection: "column", gap: 24, paddinghorizontal: 26, paddingtop: 24, paddingbottom: 24, heightmode: "hug" },
    320: { flexdirection: "column", gap: 24, paddinghorizontal: 16, paddingtop: 24, paddingbottom: 24, heightmode: "hug" },
  },
  freeGroups: [],
};
mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
writeFileSync(new URL("./out/ambassador-cards.json", import.meta.url), JSON.stringify({ res: 1200, data: roots, timestamp: 0 }));
writeFileSync(new URL("./out/ambassador-cards.meta.json", import.meta.url), JSON.stringify(meta));
console.log(`roots ${roots.length}, nodes ${count(roots)}, max depth ${depth(roots)}`);
