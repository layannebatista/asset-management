Param(
  [switch]$NoBuild
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$services = @(
  @{ Name = 'AI Intelligence'; Path = Join-Path $root 'ai-intelligence'; Port = 3100 },
  @{ Name = 'Sprint Reporter'; Path = Join-Path $root 'sprint-reporter'; Port = 3200 }
)

foreach ($service in $services) {
  if (-not (Test-Path $service.Path)) {
    throw "Diretorio nao encontrado: $($service.Path)"
  }

  Write-Host "Iniciando $($service.Name) em http://localhost:$($service.Port)"

  if (-not $NoBuild) {
    npm --prefix $service.Path run build | Out-Host
  }

  Start-Process -FilePath 'npm' -ArgumentList @('--prefix', $service.Path, 'run', 'start') -WindowStyle Minimized | Out-Null
}

Write-Host ''
Write-Host 'Servicos inicializados (janelas minimizadas):'
Write-Host ' - AI Intelligence: http://localhost:3100'
Write-Host ' - Sprint Reporter: http://localhost:3200'
Write-Host ''
Write-Host 'Para iniciar sem build: .\start-services.ps1 -NoBuild'
