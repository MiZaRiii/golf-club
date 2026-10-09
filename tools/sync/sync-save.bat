@echo off
chcp 65001 >nul
cd /d "%~dp0..\.."
title Golf Club: сохранить в облако

echo === Изменения ===
git status --short
git add -A
git diff --cached --quiet
if errorlevel 1 (
  echo.
  echo === Будет сохранено ===
  git diff --cached --stat
  git commit -q -m "sync %date% %time:~0,8% %COMPUTERNAME%"
) else (
  echo Новых изменений нет.
)

echo.
echo === Забираю чужие изменения ===
git pull --rebase --autostash origin main
if errorlevel 1 (
  echo.
  echo Конфликт при получении изменений. Ничего не отправлено. Пришли вывод Claude.
  goto :end
)

echo.
echo === Отправляю на GitHub ===
git push origin main
if errorlevel 1 (
  echo.
  echo Отправить не удалось. Проверь интернет и вход в GitHub.
) else (
  echo.
  echo Готово, всё в облаке.
)

:end
echo.
pause
