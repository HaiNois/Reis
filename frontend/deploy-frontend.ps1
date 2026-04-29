# ==============================================================================
# Rei.s Frontend - Build & Package Script for Hostinger cPanel Business
# ------------------------------------------------------------------------------
# Usage (from frontend/ directory):
#   .\deploy-frontend.ps1                    # Build + package only
#   .\deploy-frontend.ps1 -SkipInstall       # Skip npm ci (faster rebuild)
#   .\deploy-frontend.ps1 -OpenExplorer      # Open File Explorer to zip location
#
# Output: frontend/reis-frontend-YYYYMMDD-HHmm.zip
# Upload this ZIP via cPanel -> File Manager -> public_html -> Extract.
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$SkipInstall,
    [switch]$OpenExplorer
)

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptRoot

# Timestamp for zip filename
$Timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$ZipName = "reis-frontend-$Timestamp.zip"
$ZipPath = Join-Path $ScriptRoot $ZipName
$DistPath = Join-Path $ScriptRoot "dist"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " Rei.s Frontend - Hostinger Deploy Packager" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------------------
# 1) Verify prerequisites
# ------------------------------------------------------------------------------
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Path (Join-Path $ScriptRoot "package.json"))) {
    Write-Host "  ERROR: package.json not found. Run this script from frontend/ directory." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path (Join-Path $ScriptRoot ".env.production"))) {
    Write-Host "  ERROR: .env.production not found. Create it before building." -ForegroundColor Red
    exit 1
}

try {
    $nodeVersion = node --version
    Write-Host "  Node: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------------------
# 2) Install dependencies
# ------------------------------------------------------------------------------
if (-not $SkipInstall) {
    Write-Host ""
    Write-Host "[2/5] Installing dependencies (npm ci)..." -ForegroundColor Yellow
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: npm ci failed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "[2/5] Skipping npm install (--SkipInstall)." -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# 3) Clean previous build
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[3/5] Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path $DistPath) {
    Remove-Item -Recurse -Force $DistPath
    Write-Host "  Removed old dist/" -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 4) Production build (Vite picks up .env.production automatically)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[4/5] Building production bundle (npm run build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Build failed." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $DistPath)) {
    Write-Host "  ERROR: dist/ not produced by build." -ForegroundColor Red
    exit 1
}

# Verify .htaccess was copied into dist (Vite copies everything under public/)
$DistHtaccess = Join-Path $DistPath ".htaccess"
if (-not (Test-Path $DistHtaccess)) {
    Write-Host "  WARNING: .htaccess missing from dist/. Copying manually..." -ForegroundColor Yellow
    Copy-Item (Join-Path $ScriptRoot "public\.htaccess") $DistHtaccess
}

$BundleSize = (Get-ChildItem $DistPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ("  Build OK. Bundle size: {0:N2} MB" -f $BundleSize) -ForegroundColor Green

# ------------------------------------------------------------------------------
# 5) Create ZIP archive (contents of dist/, not dist/ itself)
#    Upload this zip via cPanel -> File Manager, extract into public_html/.
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[5/5] Packaging ZIP..." -ForegroundColor Yellow

# Delete stale zip with same name, if any
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

# IMPORTANT: Do NOT use Compress-Archive or [ZipFile]::CreateFromDirectory on Windows.
# Both write entry names with backslash separators, which Linux/LiteSpeed extract as
# files literally named "assets\foo.css" instead of folder "assets/" containing "foo.css".
# Manually create entries with forward-slash paths to match the ZIP spec.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipStream = [System.IO.File]::Open($ZipPath, 'Create')
$zipArchive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    Get-ChildItem -Path $DistPath -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($DistPath.Length + 1).Replace('\', '/')
        $entry = $zipArchive.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        $fileStream = [System.IO.File]::OpenRead($_.FullName)
        try { $fileStream.CopyTo($entryStream) } finally { $fileStream.Close(); $entryStream.Close() }
    }
} finally {
    $zipArchive.Dispose()
    $zipStream.Close()
}

$ZipSize = (Get-Item $ZipPath).Length / 1MB
Write-Host ("  Created: $ZipName ({0:N2} MB)" -f $ZipSize) -ForegroundColor Green

# ------------------------------------------------------------------------------
# Summary & next steps
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " DONE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Zip file: $ZipPath" -ForegroundColor White
Write-Host ""
Write-Host "Next steps (Hostinger cPanel):" -ForegroundColor Yellow
Write-Host "  1. Log in to Hostinger hPanel -> File Manager" -ForegroundColor White
Write-Host "  2. Navigate to public_html/" -ForegroundColor White
Write-Host "  3. (First deploy) Delete the default 'default.php' / 'index.html'" -ForegroundColor White
Write-Host "  4. Upload $ZipName" -ForegroundColor White
Write-Host "  5. Right-click the ZIP -> Extract -> target: public_html/" -ForegroundColor White
Write-Host "  6. Delete the ZIP from server after extraction" -ForegroundColor White
Write-Host "  7. Visit https://reis-sg.online and verify:" -ForegroundColor White
Write-Host "       - Homepage loads" -ForegroundColor White
Write-Host "       - Deep links work (e.g. /products/something)" -ForegroundColor White
Write-Host "       - No mixed-content warnings in browser console" -ForegroundColor White
Write-Host "       - API calls hit https://api.reis-sg.online/api/v1" -ForegroundColor White
Write-Host ""

if ($OpenExplorer) {
    Start-Process explorer.exe -ArgumentList "/select,`"$ZipPath`""
}
