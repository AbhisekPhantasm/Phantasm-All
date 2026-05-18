# Run every project in tooling/projects.registry.json inside playwright-vnc (headed).
# Requires: docker compose up -d from hub (playwright-vnc running).
$ErrorActionPreference = "Continue"
$HubRoot = Split-Path $PSScriptRoot -Parent
Set-Location $HubRoot

$json = Get-Content (Join-Path $HubRoot "tooling\projects.registry.json") -Raw | ConvertFrom-Json
foreach ($p in $json.projects) {
  $id = $p.id
  Write-Host ""
  Write-Host "============================== PROJECT_ID=$id =============================="
  docker compose exec -T playwright-vnc bash -lc "cd /mono/qa-automation-hub && export PHANTASM_MONO_ROOT=/mono CI=true HEADED=1 PROJECT_ID=$id && bash scripts/run-project.sh"
  if ($LASTEXITCODE -ne 0) {
    Write-Host ">>> FAILED: $id (continuing)"
  }
}
Write-Host ""
Write-Host "Done all projects."
