$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot 'backend')
if (-not (Test-Path '.\venv\Scripts\python.exe')) { throw 'Create backend/venv and install requirements first; see README.md.' }
& .\venv\Scripts\python.exe manage.py migrate --noinput
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& .\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
