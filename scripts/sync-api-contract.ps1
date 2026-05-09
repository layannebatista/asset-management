$ErrorActionPreference = 'Stop'

$rootDir = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $rootDir 'backend'
$openApiFile = Join-Path $rootDir 'openapi/openapi.yaml'
$postmanFile = Join-Path $rootDir 'postman/collection.json'
$serverPort = 18080

Write-Host '[sync-api-contract] iniciando backend para exportar OpenAPI'
$mavenExe = if (Test-Path (Join-Path $backendDir 'mvnw.cmd')) { Join-Path $backendDir 'mvnw.cmd' } else { 'mvn' }
$process = Start-Process -FilePath $mavenExe -ArgumentList '-q','-DskipTests',"-Dspring-boot.run.arguments=--server.port=$serverPort",'-Dspring-boot.run.profiles=test','spring-boot:run' -WorkingDirectory $backendDir -PassThru -WindowStyle Hidden

try {
  $ready = $false
  for ($i = 0; $i -lt 180; $i++) {
    try {
      Invoke-WebRequest -Uri "http://localhost:$serverPort/v3/api-docs.yaml" -OutFile $openApiFile -TimeoutSec 5
      $ready = $true
      break
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  if (-not $ready) {
    throw '[sync-api-contract] timeout aguardando /v3/api-docs.yaml'
  }

  Write-Host "[sync-api-contract] OpenAPI atualizado em $openApiFile"
  Write-Host '[sync-api-contract] gerando Postman a partir do OpenAPI'

  npm exec --yes openapi-to-postmanv2 -- -s $openApiFile -o $postmanFile -p | Out-Host

  Write-Host '[sync-api-contract] contrato sincronizado com sucesso'
} finally {
  if ($process -and -not $process.HasExited) {
    Stop-Process -Id $process.Id -Force
  }
}
