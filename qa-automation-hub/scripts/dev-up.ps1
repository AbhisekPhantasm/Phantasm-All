# Start Jenkins + playwright-vnc (Xvfb + noVNC) from the hub root.
$HubRoot = Split-Path $PSScriptRoot -Parent
Set-Location $HubRoot
docker compose up -d --build
Write-Host ""
Write-Host "Jenkins: http://localhost:8080/"
Write-Host "noVNC:   http://127.0.0.1:6080/vnc.html   (or /novnc/vnc.html)"
Write-Host ""
Write-Host "Optional — run every registered project (headed, long):"
Write-Host "  .\scripts\run-all-projects-vnc.ps1"
