@echo off
chcp 65001 >nul
setlocal
title Golf Club: развернуть на новом ПК

where git >nul 2>&1 || (echo Git не найден. Установи Git for Windows: https://git-scm.com/download/win & goto :end)

set "TARGET=E:\Work\Golf Club"
set /p TARGET=Куда скачать [%TARGET%]: 

if exist "%TARGET%\.git" (echo В "%TARGET%" уже есть репозиторий. Используй там tools\sync\sync-pull.bat. & goto :end)
if exist "%TARGET%\*" (
  dir /b "%TARGET%" | findstr . >nul && (echo Папка "%TARGET%" не пустая. Укажи пустую или новую. & goto :end)
)

for /f "delims=" %%i in ('git config --global user.name') do set GN=%%i
if not defined GN (
  set /p GN=Имя для коммитов: 
  call git config --global user.name "%%GN%%"
)
for /f "delims=" %%i in ('git config --global user.email') do set GE=%%i
if not defined GE (
  set /p GE=Email для коммитов: 
  call git config --global user.email "%%GE%%"
)

git clone -b main https://github.com/MiZaRiii/golf-club "%TARGET%" || (echo Клонирование не удалось. Проверь интернет и вход в GitHub. & goto :end)

echo.
echo Готово: "%TARGET%"
echo Зеркало сайта (assets и index.html) в облако не кладётся. Чтобы его собрать, запусти kubok-mirror\sync.bat.
echo Дальше: tools\sync\sync-pull.bat перед работой, tools\sync\sync-save.bat после.

:end
echo.
pause
