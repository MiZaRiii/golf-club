param([ValidateSet('pull','save','clone')][string]$Mode='pull',[string]$Arg1,[string]$Arg2)
function Done($m,$c=0){Write-Host $m -ForegroundColor ($(if($c){'Red'}else{'Green'})); if(!$env:SYNC_NOPAUSE){Read-Host 'Enter'}; exit $c}
if(!(Get-Command git -EA 0)){Done 'Git not found: https://git-scm.com/download/win' 1}
if($Mode -eq 'clone'){
  if(!$Arg1){$Arg1=Read-Host 'Repo URL'}
  if(!$Arg2){$Arg2=Read-Host 'Folder'}
  if(Test-Path (Join-Path $Arg2 '.git')){Done "Already a repo: $Arg2" 1}
  if(!(git config --global user.name)){git config --global user.name (Read-Host 'Commit name')}
  if(!(git config --global user.email)){git config --global user.email (Read-Host 'Commit email')}
  if((Test-Path $Arg2) -and (Get-ChildItem $Arg2 -Force | Select -First 1)){
    Set-Location $Arg2
    git init -q -b main; git remote add origin $Arg1; git fetch -q origin
    git checkout -B main origin/main; if($LASTEXITCODE){Done 'Local files clash with repo. Nothing changed.' 1}
    git branch -q -u origin/main
  } else { git clone $Arg1 $Arg2; if($LASTEXITCODE){Done 'Clone failed' 1} }
  Done "OK: $Arg2"
}
Set-Location (git -C $PSScriptRoot rev-parse --show-toplevel)
$b=git branch --show-current
if($Mode -eq 'save'){
  git add -A
  git diff --cached --quiet
  if($LASTEXITCODE){git diff --cached --stat; git commit -q -m $(if($Arg1){$Arg1}else{"sync $(Get-Date -f 'yyyy-MM-dd HH:mm') $env:COMPUTERNAME"})}
  else{Write-Host 'No changes'}
}
git pull -q --rebase --autostash origin $b
if($LASTEXITCODE){Done 'Pull conflict. Nothing pushed.' 1}
if($Mode -eq 'save' -and (git log --oneline "origin/$b..HEAD")){git push -q origin $b; if($LASTEXITCODE){Done 'Push failed' 1}}
Done 'OK, in sync'
