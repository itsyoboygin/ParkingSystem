#!/usr/bin/env pwsh
# start-dev.ps1 — opens two terminal windows and starts backend and frontend

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root 'frontend'
$backend = Join-Path $root 'backend'

Write-Host "Starting backend in a new PowerShell window..."
Start-Process powershell -ArgumentList @('-NoExit', '-Command', "cd '$backend'; if (Test-Path '.venv') { .\.venv\Scripts\Activate }; python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000")

Write-Host "Starting frontend in a new Command Prompt window (uses cmd to avoid PowerShell npm policy)..."
Start-Process cmd -ArgumentList @('/k', "cd /d $frontend && npm run dev")

Write-Host "Launched processes. Check the new windows for logs."
