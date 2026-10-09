@echo off
chcp 65001 >nul
cd /d "%~dp0..\.."
title Golf Club: получить изменения

echo === Забираю изменения с GitHub ===
git pull --rebase --autostash origin main
if errorlevel 1 (
  echo.
  echo Не получилось. Если это конфликт, пришли вывод Claude, ничего не трогая.
) else (
  echo.
  echo Готово, папка актуальна.
)
echo.
pause
