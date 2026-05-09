$rtkBinary = Join-Path $HOME ".local\bin\rtk.exe"

if (-not (Test-Path $rtkBinary)) {
    Write-Error "RTK binary not found at $rtkBinary"
    exit 1
}

& $rtkBinary @args
exit $LASTEXITCODE
