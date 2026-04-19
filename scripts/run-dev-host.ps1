$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$nodePath = 'C:\nvm4w\nodejs\node.exe'
$tsxPath = Join-Path $repoRoot 'node_modules\tsx\dist\cli.mjs'
$envFilePath = Join-Path $repoRoot '.env.development'
$configuredPort = $null

if (Test-Path $envFilePath) {
  $portLine = Get-Content $envFilePath | Where-Object { $_ -match '^\s*PORT\s*=' } | Select-Object -First 1
  if ($portLine) {
    $configuredPort = (($portLine -split '=', 2)[1]).Trim()
  }
}

$portValue = if ($env:PORT) { $env:PORT } elseif ($configuredPort) { $configuredPort } else { '4000' }
$port = [int]$portValue

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

if ($listener) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
  $commandLine = ''
  $processName = ''

  if ($null -ne $process) {
    if ($null -ne $process.CommandLine) {
      $commandLine = [string]$process.CommandLine
    }

    if ($null -ne $process.Name) {
      $processName = [string]$process.Name
    }
  }

  $isPortfolioBackend =
    $null -ne $process -and
    $processName -eq 'node.exe' -and
    $commandLine -like "*$repoRoot*" -and
    $commandLine -like '*src\server.ts*'

  if (-not $isPortfolioBackend) {
    $occupiedBy = if ($processName) { $processName } else { 'unknown process' }
    Write-Error "Port $port is already in use by PID $($listener.OwningProcess) ($occupiedBy). Stop that process or change PORT before starting the backend."
    exit 1
  }

  Write-Host "Port $port is already in use by the portfolio backend (PID $($listener.OwningProcess)). Restarting it..."
  Stop-Process -Id $listener.OwningProcess -Force

  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Milliseconds 250
    $stillListening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $stillListening) {
      break
    }
  }
}

$env:APP_ENV = 'development'
$env:NODE_ENV = 'development'
$env:PORT = [string]$port

Push-Location $repoRoot
try {
  & $nodePath $tsxPath 'src\server.ts'
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
