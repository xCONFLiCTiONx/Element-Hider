$ErrorActionPreference = 'Stop'

$SourceDir = $PSScriptRoot
$TargetDir = Join-Path $env:LOCALAPPDATA 'xExtensions\Element-Hider'

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

# Mirror extension files to LocalAppData\xExtensions\Element-Hider
$RobocopyArgs = @(
    $SourceDir,
    $TargetDir,
    '/MIR',
    '/XD', 'tests', '.git', '.idea',
    '/XF', '.build.ps1', '*.test.js',
    '/NFL', '/NDL', '/NJH', '/NJS', '/NP'
)

& robocopy @RobocopyArgs | Out-Null
# Robocopy exit codes 0-7 indicate success (with varying levels of changes copied).
if ($LASTEXITCODE -ge 8) {
    throw "robocopy failed with exit code $LASTEXITCODE"
}

Write-Host "Copied Element-Hider to $TargetDir" -ForegroundColor Green
