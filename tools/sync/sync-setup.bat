@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0..\.."
title Golf Club: первичная привязка к GitHub

where git >nul 2>&1 || (echo Git не найден. Установи Git for Windows: https://git-scm.com/download/win & goto :end)

for /f "delims=" %%i in ('git config user.name') do set GN=%%i
if not defined GN (
  set /p GN=Имя для коммитов: 
  call git config --global user.name "%%GN%%"
)
for /f "delims=" %%i in ('git config user.email') do set GE=%%i
if not defined GE (
  set /p GE=Email для коммитов: 
  call git config --global user.email "%%GE%%"
)

echo.
echo === Текущее состояние ===
git status --short --branch
echo.
echo Сейчас папка будет привязана к ветке main на GitHub. Локальные файлы не удаляются.
pause

git fetch origin || (echo Не удалось связаться с GitHub. Проверь интернет и доступ к репозиторию. & goto :end)
git checkout -B main origin/main
if errorlevel 1 (
  echo.
  echo Git отказался переключиться: локальные файлы совпадают по имени с файлами в репозитории.
  echo Ничего не изменено. Пришли этот вывод Claude.
  goto :end
)
git branch --set-upstream-to=origin/main main >nul
findstr /c:"tools/sync/*.log" .gitignore >nul 2>&1 || type "tools\sync\gitignore.txt" >> .gitignore

echo.
echo === Готово. Состояние после привязки ===
git status --short --branch
echo.
echo Дальше: sync-pull.bat перед работой, sync-save.bat после.

:end
echo.
pause
