# Copies your live Code Garden (the one Herdr runs, in ~/.config/herdr-app) back into this repo.
# Edit and try things in the live install, then run this and commit. (The other direction is
# .\install.ps1 -Update.)
#
#   1. copies mods\garden-agents\plant.js to garden-pane, garden-chrome and garden-gallery
#      in the live install, so the four copies match (Herdr reloads them)
#   2. replaces the repo's layout, theme and mod folders with the live ones, leaving out the
#      files Herdr writes itself (gpui-kit.d.ts, jsconfig.json, *.error)
#   3. runs herdr-app check on every mod in the repo and shows what changed
$ErrorActionPreference = 'Stop'

$HomeDir = if ($env:HERDR_APP_HOME) { $env:HERDR_APP_HOME } else { Join-Path $HOME '.config\herdr-app' }
$Repo = $PSScriptRoot
$Mods = 'garden-chrome', 'garden-spaces', 'garden-agents', 'garden-pane', 'garden-status', 'garden-gallery'
$Skip = 'gpui-kit.d.ts', 'jsconfig.json'

if (-not (Test-Path (Join-Path $HomeDir 'mods\garden-agents'))) { Write-Error "No Code Garden install in $HomeDir (set HERDR_APP_HOME?)" }

$Plant = Join-Path $HomeDir 'mods\garden-agents\plant.js'
foreach ($m in 'garden-pane', 'garden-chrome', 'garden-gallery') {
  $Copy = Join-Path $HomeDir "mods\$m\plant.js"
  if (-not (Test-Path $Copy) -or (Get-FileHash $Plant).Hash -ne (Get-FileHash $Copy).Hash) {
    Copy-Item $Plant $Copy -Force
    Write-Host "plant.js -> $m"
  }
}

Copy-Item (Join-Path $HomeDir 'layouts\code-garden.json'), (Join-Path $HomeDir 'layouts\code-garden.svg') (Join-Path $Repo 'layouts') -Force
Copy-Item (Join-Path $HomeDir 'themes\code-garden.json') (Join-Path $Repo 'themes') -Force
foreach ($m in $Mods) {
  $Dest = Join-Path $Repo "mods\$m"
  if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest -Confirm:$false }
  New-Item -ItemType Directory $Dest | Out-Null
  Get-ChildItem -Force (Join-Path $HomeDir "mods\$m") |
    Where-Object { $Skip -notcontains $_.Name -and $_.Name -notlike '*.error' } |
    ForEach-Object { Copy-Item -Recurse $_.FullName $Dest }
}

$Failed = $false
foreach ($m in $Mods) {
  $Out = & herdr-app check (Join-Path $Repo "mods\$m") 2>&1 | ForEach-Object { "$_" }
  if ($LASTEXITCODE -ne 0) { $Failed = $true }
  $Out | Where-Object { $_ -notmatch 'WARN' } | Select-Object -Last 1
}
git -C $Repo status --short
if ($Failed) { Write-Error 'A check failed: fix it before committing.' }
