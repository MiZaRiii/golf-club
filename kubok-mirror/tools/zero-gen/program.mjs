// Секция «Программа турнира»: Фигма (1200 и 320) -> буфер Zero.
// Запуск: node tools/zero-gen/program.mjs  ->  tools/zero-gen/out/program.json
import { writeFileSync, mkdirSync } from "node:fs";
import { text, image, shape, group, finalize, depth, count, resetIds, rhd } from "./lib.mjs";

const GH = "https://raw.githubusercontent.com/MiZaRiii/golf-club/main/";
// Картинки загружены в Тильду (Upload to Tilda); копии с теми же именами лежат в GitHub MiZaRiii/golf-club (raw).
const TD = "https://static.tildacdn.com/";
const IMG = { bgD: TD + "tild3264-6439-4439-a637-663532313666/program-bg-1200.webp", bgM: TD + "tild3462-6536-4334-b963-636564353335/program-bg-320.webp", ball: TD + "tild6163-3464-4537-b239-663866376436/program-ball-1200.webp" };
const L = 26; // левый отступ контента на 1200 (контейнер 1148 по центру)
const WHITE = "#ffffff";
const LINE = "rgba(255,255,255,0.33)";

const days = [
  { n: "3", wd: "Воскресенье", ev: ["Прибытие в Хуа Хин", "Размещение в отеле", "Welcome drinks"] },
  { n: "4", wd: "Понедельник", ev: ["Опциональный тренировочный раунд на Black Mountain Golf Club", "Welcome drinks", "Регистрация участников"] },
  { n: "5", wd: "Вторник", ev: ["Первый турнирный раунд", "•", "•"] },
  { n: "6", wd: "Среда", ev: ["Второй турнирный раунд", "•", "•"] },
  { n: "7", wd: "Четверг", ev: ["Финальный турнирный раунд", "Gala dinner", "Церемония награждения"] },
  { n: "8", wd: "Пятница", ev: ["Выезд из отеля", "Check-out", "Отъезд"] },
];

// Заголовок на десктопе набран с индивидуальным трекингом (проценты Фигмы -> px)
const headSegs = [["П", -8], ["р", -7], ["о", -9], ["г", -4], ["р", -7], ["а", -5], ["м", -4], ["м", -8], ["а ", -7], ["ту", -2], ["р", -9], ["н", -5], ["и", -4], ["р", -8], ["а", -7]];
const headFs = rhd(106.7); // Zero: размер шрифта только целый
const headHtml = headSegs.map(([c, pct]) => `<span style="letter-spacing: ${+((pct / 100) * headFs).toFixed(2)}px;">${c}</span>`).join("");

// Правила: у текста нет padding, отступы вокруг текста делает группа-обёртка (padding/gap у групп работают штатно).
// Глубина: table(1) > row(2) > content(3) > events(4) > cell(5) > text(6).
function dayRow(d, i) {
  const num = text({ name: "Day num", text: d.n, fontsize: [28.125, 28], lh: [0.6, 0.75], lsPct: -3, upper: true, widthmode: "fill", height: [17, 21], z: 20 });
  const numWrap = group({ name: "Num", dir: "column", gapy: 0, pad: ["3px 0 0 0", "0 0 0 0"], width: [20, 16], z: 20 }, [num]);
  const month = text({ name: "Month", text: "января", fontsize: [10, 9], lh: 1.2, lsPct: [-3, -2], upper: true, widthmode: "fill", height: [12, 11], z: 21 });
  const wday = text({ name: "Weekday", text: d.wd, fontsize: [7.5, 8], lh: [1.45, 1.3], lsPct: 0, weight: "300", upper: true, widthmode: "fill", height: [11, 10], z: 22 });
  const dateCol = group({ name: "Date", dir: ["column", "column"], gapy: [0, 1], width: [230, 72], z: 21 }, [month, wday]);
  const events = group({ name: "Events", dir: ["row", "column"], gapx: 0, gapy: [0, 13], wm: "fill", z: 21 },
    d.ev.map((t, k) => group({ name: "Cell " + (k + 1), dir: "row", wm: "fill", pad: ["0 12px 0 12px", "0 0 0 0"], hidden: t === "•" ? ["n", "y"] : "n", z: 22 + k }, [
      text({ name: "Event " + (k + 1), text: t, fontsize: [12.5, 11], lh: [1.2, 1.25], lsPct: [-3, -2], upper: true, widthmode: "fill", height: [15, 14], z: 23 + k }),
    ])));
  const content = group({ name: "Row content", dir: "row", gapx: 0, wm: "fill", pad: ["0 0 6px 0", "0 0 0 0"], bw: ["0px 0px 1px 0px", "0px 0px 0px 0px"], bc: LINE, z: 20 }, [dateCol, events]);
  return group({ name: "Day " + d.n, dir: "row", gapx: 6, wm: "fill", pad: ["0 0 0 0", "12px 0 12px 0"], cls: "border-05-mobile bottom", bw: ["0px 0px 0px 0px", "0px 0px 1px 0px"], bc: LINE, z: 10 + i }, [numWrap, content]);
}

const table = group({
  name: "Program table", cls: "uc-prog-table", dir: "column", gapy: [7.5, 0], width: [1108, 288], left: [L + 21, 16], top: [324, 262],
  pad: ["6px 0 0 0", "0 14px 0 14px"], bw: ["3px 0px 0px 0px", "1px 1px 1px 1px"], bc: [WHITE, "rgba(255,255,255,0.28)"], bg: ["", "rgba(10,26,5,0.3)"], z: 10,
}, days.map(dayRow));

const roots = [
  image({ name: "BG desktop", classname: "uc-prog-bg", img: IMG.bgD, fw: 1836, fh: 913, left: [L, L], top: [0, 0], width: [1148, 1148], height: [571, 571], z: 1, hidden: ["n", "y"] }),
  image({ name: "BG mobile", classname: "uc-prog-bg", img: IMG.bgM, fw: 320, fh: 792, left: [0, 0], top: [0, 0], width: [320, 320], height: [792, 792], z: 1, hidden: ["y", "n"] }),
  shape({ name: "Frame", classname: "uc-prog-frame", left: [L + 8, 6], top: [6, 6], width: [1134, 308], height: [555, 780], bordercolor: WHITE, borderwidth: "1px 1px 1px 1px", opacity: ["0.7", "0.6"], z: 4 }),
  text({ name: "Heading desktop", classname: "uc-prog-title", text: headHtml, tag: "h2", family: "playfair_display", weight: "400", fontsize: [headFs, headFs], lh: 0.8, lsPct: 0, align: "center", left: [L + 110, L + 110], top: [4, 4], width: [928, 928], height: [85, 85], hidden: ["n", "y"], z: 6 }),
  text({ name: "Heading mobile", classname: "uc-prog-title", text: "Программа турнира", tag: "h2", family: "playfair_display", weight: "400", fontsize: [48, 48], lh: 0.85, lsPct: -6, align: "center", left: [43, 43], top: [40, 40], width: [234, 234], height: [82, 82], hidden: ["y", "n"], z: 6 }),
  image({ name: "Ball", classname: "uc-prog-ball", img: IMG.ball, fw: 326, fh: 417, left: [L + 427, 85], top: [79, 124], width: [210, 137], height: [269, 174], z: 7 }),
  table,
];

resetIds;
finalize(roots, null);
const out = { res: 1200, data: roots, timestamp: 0 };
mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
writeFileSync(new URL("./out/program.json", import.meta.url), JSON.stringify(out));
console.log(`roots ${roots.length}, nodes ${count(roots)}, max depth ${depth(roots)}, size ${JSON.stringify(out).length} bytes`);
