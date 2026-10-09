// Выполнять в консоли страницы редактора Тильды (или через Claude in Chrome / javascript_tool).
// Забирает JSON секции с локального сервера (start.bat), выдаёт настоящие ID через t396__getUniqueId()
// и кладёт буфер, который редактор вставит по Ctrl+V. Сохраняет всегда человек: кнопка «Сохранить» в блоке.
//
// Перед вставкой в РЕДАКТОРЕ БЛОКА: Auto layout холста -> None, высота холста 1200 и 320 (см. docs).
const SRC = "http://localhost:8080/tools/zero-gen/out/program.json";
const f = [...document.querySelectorAll("iframe")].find((x) => /zero/.test(x.src));
const w = f ? f.contentWindow : window; // Zero может быть открыт в iframe редактора страницы
const j = await fetch(SRC, { cache: "no-store" }).then((r) => r.json());
const map = {};
const walk = (n) => { map[n.id] = w.t396__getUniqueId(); (n.children || []).forEach(walk); };
j.data.forEach(walk);
const fix = (n) => { n.id = map[n.id]; n.props.id = n.id; if (n.props.groupid) n.props.groupid = map[n.props.groupid]; (n.children || []).forEach(fix); };
j.data.forEach(fix);
j.timestamp = Date.now();
w.localStorage.setItem("tn_store_buffer__copy-paste", JSON.stringify(j));
({ nodes: Object.keys(map).length });
