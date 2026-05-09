Param(
  [string]$Version = 'v0.37.2',
  [string]$InstallDir = "$HOME\.local\bin"
)

$ErrorActionPreference = 'Stop'

function Write-Info($message) { Write-Host "[INFO] $message" -ForegroundColor Cyan }
function Write-Ok($message) { Write-Host "[OK]   $message" -ForegroundColor Green }
function Write-Warn($message) { Write-Host "[WARN] $message" -ForegroundColor Yellow }

$target = 'rtk-x86_64-pc-windows-msvc.zip'
$url = "https://github.com/rtk-ai/rtk/releases/download/$Version/$target"
$tempDir = Join-Path $env:TEMP ("rtk-install-" + [guid]::NewGuid().ToString('N'))
$zipPath = Join-Path $tempDir $target

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

Write-Info "Baixando RTK de $url"
Invoke-WebRequest -Uri $url -OutFile $zipPath

Write-Info "Extraindo pacote"
Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force

$binary = Get-ChildItem -Path $tempDir -Filter rtk.exe -Recurse -File | Select-Object -First 1
if (-not $binary) {
  throw 'Nao foi possivel localizar rtk.exe no pacote baixado.'
}

$dest = Join-Path $InstallDir 'rtk.exe'
Copy-Item -Path $binary.FullName -Destination $dest -Force
Write-Ok "RTK instalado em $dest"

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ([string]::IsNullOrWhiteSpace($userPath)) { $userPath = '' }

$normalizedPath = $userPath.Split(';') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
if ($normalizedPath -notcontains $InstallDir) {
  $newPath = if ($userPath) { "$userPath;$InstallDir" } else { $InstallDir }
  [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
  Write-Ok "PATH de usuario atualizado com: $InstallDir"
  Write-Warn 'Feche e reabra o terminal para recarregar o PATH.'
} else {
  Write-Info 'Diretorio de instalacao ja esta no PATH de usuario.'
}

$rtkInCurrentSession = Get-Command rtk -ErrorAction SilentlyContinue
if ($rtkInCurrentSession) {
  Write-Ok "RTK disponivel nesta sessao: $($rtkInCurrentSession.Source)"
} else {
  Write-Warn 'RTK ainda nao visivel nesta sessao atual (esperado apos atualizar PATH).'
  Write-Info "Teste em novo terminal: Get-Command rtk"
}

Remove-Item -Path $tempDir -Recurse -Force
Write-Ok 'Instalacao concluida.'
