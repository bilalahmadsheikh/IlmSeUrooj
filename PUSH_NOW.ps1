# Run this in PowerShell - it will push your bilal branch
# Make sure to create a NEW token at https://github.com/settings/tokens first (your old one was exposed!)

Set-Location $PSScriptRoot

Write-Host "Current branch:" -ForegroundColor Cyan
git branch
Write-Host ""
Write-Host "Pushing bilal branch to GitHub..." -ForegroundColor Yellow
Write-Host "When prompted: Username = bushrahhh, Password = your NEW token" -ForegroundColor Gray
Write-Host ""

git push origin bilal
