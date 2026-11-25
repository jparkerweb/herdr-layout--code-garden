# Installs Code Garden into Herdr (Windows PowerShell 5.1+ / PowerShell 7).
#   .\install.ps1             install; refuses to touch anything that already exists
#   .\install.ps1 -Update     replace an earlier Code Garden install with this one
#   .\install.ps1 -NoSwitch   install without switching to the layout
param([switch]$Update, [switch]$NoSwitch)
$ErrorActionPreference = 'Stop'

$HomeDir = if ($env:HERDR_APP_HOME) { $env:HERDR_APP_HOME } else { Join-Path $HOME '.config\herdr-app' }
$Src = $PSScriptRoot
$Mods = 'garden-chrome', 'garden-spaces', 'garden-agents', 'garden-pane', 'garden-status', 'garden-gallery'

if (-not (Test-Path $HomeDir)) {
  Write-Error "Herdr's home folder isn't at $HomeDir. Start Herdr once, or set HERDR_APP_HOME."
}

$Targets = @('layouts\code-garden.json', 'layouts\code-garden.svg', 'themes\code-garden.json') + ($Mods | ForEach-Object { "mods\$_" })
if (-not $Update) {
  $Taken = $Targets | Where-Object { Test-Path (Join-Path $HomeDir $_) }
  if ($Taken) {
    Write-Host "These already exist in ${HomeDir}:" -ForegroundColor Yellow
    $Taken | ForEach-Object { Write-Host "  $_" }
    Write-Host "If they're an earlier Code Garden, run: .\install.ps1 -Update"
    exit 1
  }
}

foreach ($d in 'layouts', 'themes', 'mods') { New-Item -ItemType Directory -Force (Join-Path $HomeDir $d) | Out-Null }
Copy-Item (Join-Path $Src 'layouts\code-garden.json'), (Join-Path $Src 'layouts\code-garden.svg') (Join-Path $HomeDir 'layouts') -Force
Copy-Item (Join-Path $Src 'themes\code-garden.json') (Join-Path $HomeDir 'themes') -Force
foreach ($m in $Mods) {
  $Dest = Join-Path $HomeDir "mods\$m"
  if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest -Confirm:$false }
  Copy-Item -Recurse (Join-Path $Src "mods\$m") $Dest
}
Write-Host "Copied Code Garden into $HomeDir"

if (Get-Command herdr-app -ErrorAction SilentlyContinue) {
  foreach ($m in $Mods) { herdr-app check (Join-Path $HomeDir "mods\$m") }
  if (-not $NoSwitch) {
    herdr-app do layout.switch --name code-garden | Out-Null
    Write-Host "Switched to Code Garden. Ctrl+Shift+L cycles layouts."
  }
} else {
  Write-Host 'herdr-app is not on PATH: switch to "Code Garden" in Herdr''s settings (Look) or with Ctrl+Shift+L.'
}
