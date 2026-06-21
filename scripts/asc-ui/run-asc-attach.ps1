# Attach MindMirror subscriptions on App 1.0 (Playwright — you log in once)
$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir

if (-not (Test-Path "node_modules/playwright")) {
    Write-Host "Installing Playwright..." -ForegroundColor Cyan
    npm init -y | Out-Null
    npm install playwright
    npx playwright install chromium
}

Write-Host "Opening browser — sign in to Apple if asked, then script checks monthly/yearly subs." -ForegroundColor Yellow
node asc-playwright-attach.mjs
