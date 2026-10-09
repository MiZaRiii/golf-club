# kubok-mirror — локальное зеркало страницы

Источник: https://xn--80adda7airdp4ap9g.xn--p1ai/kubok-sinergii

| Что | Где |
|---|---|
| Запуск (localhost:8080) | `start.bat` или `python serve.py [порт]` |
| Синхронизация с сервером | `sync.bat` или `python sync.py` (`--force` — перекачать все ассеты) |
| Наши скрипты — правь здесь | `custom/intro.css`, `custom/intro.js`, `custom/parallax.js` |
| Чистый HTML с сервера, как есть | `source/original.html` |
| Версии наших вставок с сервера (для сравнения) | `source/custom-from-server/` |
| CSS/JS/шрифты/картинки Тильды и GitHub | `assets/<хост>/...` (генерируется) |
| Ресурсы, которые Тильда грузит динамически | `extra-assets.txt` |

`sync.py` перезаписывает `index.html` и `assets/`, но **никогда не трогает `custom/`**: файл создаётся только если его нет.
Если вставка на сервере отличается от `custom/`, скрипт об этом напишет — сравни с `source/custom-from-server/`.
`assets/**/*.orig` — исходные файлы Тильды до замены ссылок на локальные (служебные).
Правка Тильды для формы описана в `PATCHES` в `sync.py`; если Тильда обновит файл и патч не применится, скрипт предупредит.
Внешним остаётся только аналитика Тильды (`stat.tildaapi.com`) и отправка формы (`forms.tildacdn.com`).
