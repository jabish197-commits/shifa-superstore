param([int]$Port = 5175)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot 'frontend')
$env:VITE_DEV_PORT = "$Port"
& npm run dev
