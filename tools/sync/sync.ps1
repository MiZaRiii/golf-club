param([ValidateSet('pull','save','clone')][string]$Mode='pull',[string]$Arg1,[string]$Arg2)
$ErrorActionPreference='Continue'
[Console]::OutputEncoding=[Text.Encoding]::UTF8
function Fail($m){Write-Host $m -ForegroundColor Red; if(!$env:SYNC_NOPAUSE){Read-Host 'Enter'}; exit 1}
function Ok($m){Write-Host $m -ForegroundColor Green}
if(!(Get-Command git -EA 0)){Fail 'Git не найден: https://git-scm.com/download/win'}

if($Mode -eq 'clone'){
  if(!$Arg1){$Arg1=Read-Host 'URL репозитория'}
  if(!$Arg2){$Arg2=Read-Host 'Папка'}
  if(Test-Path (Join-Path $Arg2 '.git')){Fail "Уже репозиторий: $Arg2"}
  if(!(git config --global user.name)){git config --global user.name (Read-Host 'Имя для коммитов')}
  if(!(git config --global user.email)){git config --global user.email (Read-Host 'Email для коммитов')}
  if((Test-Path $Arg2) -and (Get-ChildItem $Arg2 -Force | Select -First 1)){
    Push-Location $Arg2
    git init -q -b main; git remote add origin $Arg1; git fetch -q origin
    git checkout -B main origin/main; if($LASTEXITCODE){Pop-Location; Fail 'Локальные файлы конфликтуют с репозиторием. Ничего не изменено.'}
    git branch -q -u origin/main; Pop-Location
  } else { git clone $Arg1 $Arg2; if($LASTEXITCODE){Fail 'Клонирование не удалось'} }
  Ok "Готово: $Arg2"; if(!$env:SYNC_NOPAUSE){Read-Host 'Enter'}; exit 0
}

Set-Location (git -C $PSScriptRoot rev-parse --show-toplevel)
$b=git branch --show-current
if($Mode -eq 'save'){
  git add -A
  git diff --cached --quiet
  if($LASTEXITCODE){
    git diff --cached --stat
    $msg= if($Arg1){$Arg1}else{"sync $(Get-Date -f 'yyyy-MM-dd HH:mm') $env:COMPUTERNAME"}
    git commit -q -m $msg
  } else {Write-Host 'Новых изменений нет'}
}
git pull -q --rebase --autostash origin $b
if($LASTEXITCODE){Fail 'Конфликт при получении изменений. Ничего не отправлено.'}
if($Mode -eq 'save'){
  if(git log --oneline "origin/$b..HEAD"){git push -q origin $b; if($LASTEXITCODE){Fail 'Push не удался'}}
  Ok 'Готово, всё в облаке'
} else {Ok 'Готово, папка актуальна'}
if(!$env:SYNC_NOPAUSE){Read-Host 'Enter'}
