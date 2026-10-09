// Правка СУЩЕСТВУЮЩИХ элементов блока скриптом, без пересборки (выполнять в консоли Zero или через javascript_tool).
// Проверено: elem__setFieldValue(элемент, поле, значение, 'render', 'updateui', разрешение)
//   - пишет и в DOM (data-field-*), и в хранилище редактора (видно при копировании элемента Ctrl+C);
//   - разрешение: 1200 (базовое) или 320 (-res-320); без параметра = текущее разрешение редактора;
//   - работают top/left/width/height/hidden/opacity/borderwidth/fontsize/letterspacing/text/img и т.п.;
//   - НЕ меняет имя слоя (layer/name): для него в редакторе другой механизм.
// После правки Escape/клик по холсту; сохраняет человек.
const byLayer = (n) => [...document.querySelectorAll(".tn-elem")].find((e) => e.getAttribute("data-field-layer-value") === n);
const set = (layer, field, value, res) => elem__setFieldValue(byLayer(layer), field, String(value), "render", "updateui", res);

// Пример: рамка с разной прозрачностью на 1200 и 320
// set("Frame", "opacity", 0.7, 1200); set("Frame", "opacity", 0.6, 320);
// Пример: сдвинуть шар на 320
// set("Ball", "left", 85, 320); set("Ball", "top", 124, 320);
// Удаление элемента: выделить слой в панели слоёв и нажать Delete (скрытые на текущем разрешении слои выбираются в панели).
