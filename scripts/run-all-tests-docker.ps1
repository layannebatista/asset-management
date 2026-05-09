param(
  [switch]$Build,
  [switch]$NoCache
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host '==> Subindo serviços base (API, Frontend, Allure)...'
if ($Build) {
  if ($NoCache) {
    docker compose build --no-cache asset-management frontend test-backend test-playwright
  } else {
    docker compose build asset-management frontend test-backend test-playwright
  }
}

docker compose up -d postgres asset-management frontend allure allure-ui

Write-Host '==> Limpando containers one-shot anteriores para garantir nova execução...'
docker compose rm -f -s -v clean-allure-results reset-e2e-data test-backend test-playwright | Out-Null

Write-Host '==> Executando limpeza de resultados e reset de massa E2E...'
docker compose up --abort-on-container-exit --exit-code-from clean-allure-results clean-allure-results
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

docker compose up --abort-on-container-exit --exit-code-from reset-e2e-data reset-e2e-data
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host '==> Executando testes backend...'
docker compose up --abort-on-container-exit --exit-code-from test-backend test-backend
$backendExit = $LASTEXITCODE

Write-Host '==> Executando testes Playwright...'
docker compose up --abort-on-container-exit --exit-code-from test-playwright test-playwright
$frontendExit = $LASTEXITCODE

Write-Host '==> Atualizando geração do relatório no Allure...'
try {
  Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5050/allure-docker-service/generate-report?project_id=default' | Out-Null
} catch {
  Write-Warning 'Nao foi possivel acionar a geracao manual do Allure. O serviço ainda deve gerar automaticamente.'
}

Write-Host '==> Allure UI: http://localhost:5252'
Write-Host "==> Resultado final: backend=$backendExit frontend=$frontendExit"

if ($backendExit -ne 0 -or $frontendExit -ne 0) {
  exit 1
}

exit 0
