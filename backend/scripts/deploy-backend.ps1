# ==============================================================================
# Rei.s Backend - Build & Package Script for Hostinger cPanel Business
# ------------------------------------------------------------------------------
# Usage (from backend/ directory):
#   .\scripts\deploy-backend.ps1                # Full build + package
#   .\scripts\deploy-backend.ps1 -SkipInstall   # Skip npm ci (faster rebuild)
#   .\scripts\deploy-backend.ps1 -OpenExplorer  # Reveal ZIP in Explorer
#
# Output: backend/reis-backend-YYYYMMDD-HHmm.zip
# Contents: dist/, prisma/, package.json, package-lock.json, .npmrc, README.md
# Excluded: node_modules/, .env*, src/, scripts/, *.ts (source), tsconfig.json
#
# After ZIP is uploaded to Hostinger Node.js App root:
#   1. Extract via cPanel File Manager
#   2. Click "Run NPM Install" in Node.js App page
#   3. Open cPanel Terminal:
#        cd ~/api && npx prisma generate && npx prisma migrate deploy
#   4. Click "Restart" in Node.js App page
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$SkipInstall,
    [switch]$OpenExplorer
)

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendRoot = Split-Path -Parent $ScriptRoot
Set-Location $BackendRoot

$Timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$ZipName = "reis-backend-$Timestamp.zip"
$ZipPath = Join-Path $BackendRoot $ZipName
$DistPath = Join-Path $BackendRoot "dist"
$PrismaPath = Join-Path $BackendRoot "prisma"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " Rei.s Backend - Hostinger Deploy Packager" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------------------
# 1) Verify prerequisites
# ------------------------------------------------------------------------------
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Path (Join-Path $BackendRoot "package.json"))) {
    Write-Host "  ERROR: package.json not found. Run from backend/ root." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $PrismaPath)) {
    Write-Host "  ERROR: prisma/ folder not found." -ForegroundColor Red
    exit 1
}

try {
    $nodeVersion = node --version
    Write-Host "  Node: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not in PATH." -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------------------
# 2) Install dependencies (so build sees up-to-date deps)
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
# 3) Clean & rebuild dist/
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[3/5] Building TypeScript (npm run build)..." -ForegroundColor Yellow
if (Test-Path $DistPath) {
    Remove-Item -Recurse -Force $DistPath
    Write-Host "  Removed old dist/" -ForegroundColor Green
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: TypeScript build failed." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $DistPath)) {
    Write-Host "  ERROR: dist/ not produced." -ForegroundColor Red
    exit 1
}

$DistSize = (Get-ChildItem $DistPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ("  dist/ built. Size: {0:N2} MB" -f $DistSize) -ForegroundColor Green

# ------------------------------------------------------------------------------
# 4) Stage files into a temporary deploy folder
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[4/5] Staging deploy bundle..." -ForegroundColor Yellow

$StagePath = Join-Path $BackendRoot ".deploy-stage"
if (Test-Path $StagePath) { Remove-Item -Recurse -Force $StagePath }
New-Item -ItemType Directory -Path $StagePath | Out-Null

# dist/ - compiled JS
Copy-Item -Recurse $DistPath (Join-Path $StagePath "dist")

# prisma/ - schema + migrations (server runs `prisma migrate deploy`)
$PrismaStage = Join-Path $StagePath "prisma"
New-Item -ItemType Directory -Path $PrismaStage | Out-Null
Copy-Item (Join-Path $PrismaPath "schema.prisma") $PrismaStage
$MigrationsPath = Join-Path $PrismaPath "migrations"
if (Test-Path $MigrationsPath) {
    Copy-Item -Recurse $MigrationsPath $PrismaStage
}

# package.json + package-lock.json - needed for `npm install` on server
Copy-Item (Join-Path $BackendRoot "package.json") $StagePath
$LockPath = Join-Path $BackendRoot "package-lock.json"
if (Test-Path $LockPath) {
    Copy-Item $LockPath $StagePath
}

Write-Host "  Staged: dist/, prisma/, package.json, package-lock.json" -ForegroundColor Green

# ------------------------------------------------------------------------------
# 5) Create ZIP - manual entries with forward-slash paths so Linux/LiteSpeed
#    extracts a real folder structure (NEVER use Compress-Archive - it writes
#    backslash entry names that extract as literal `dist\index.js` files).
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[5/5] Packaging ZIP..." -ForegroundColor Yellow

if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipStream = [System.IO.File]::Open($ZipPath, 'Create')
$zipArchive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    Get-ChildItem -Path $StagePath -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($StagePath.Length + 1).Replace('\', '/')
        $entry = $zipArchive.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        $fileStream = [System.IO.File]::OpenRead($_.FullName)
        try { $fileStream.CopyTo($entryStream) } finally { $fileStream.Close(); $entryStream.Close() }
    }
} finally {
    $zipArchive.Dispose()
    $zipStream.Close()
}

# Cleanup stage
Remove-Item -Recurse -Force $StagePath

$ZipSize = (Get-Item $ZipPath).Length / 1MB
Write-Host ("  Created: $ZipName ({0:N2} MB)" -f $ZipSize) -ForegroundColor Green

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " DONE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Zip file: $ZipPath" -ForegroundColor White
Write-Host ""
Write-Host "FIRST-DEPLOY checklist (Hostinger cPanel):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [A] Create MySQL database (cPanel -> MySQL Databases)" -ForegroundColor White
Write-Host "      - DB name: <user>_reis_db" -ForegroundColor Gray
Write-Host "      - DB user: <user>_reis  (grant ALL PRIVILEGES)" -ForegroundColor Gray
Write-Host ""
Write-Host "  [B] Create Node.js App (cPanel -> Setup Node.js App)" -ForegroundColor White
Write-Host "      - Node version: 20.x" -ForegroundColor Gray
Write-Host "      - Application root: ~/api" -ForegroundColor Gray
Write-Host "      - Application URL: reis-sg.online/api" -ForegroundColor Gray
Write-Host "      - Application startup file: dist/index.js" -ForegroundColor Gray
Write-Host "      - Environment: Production" -ForegroundColor Gray
Write-Host ""
Write-Host "  [C] Set Environment Variables in Node.js App page" -ForegroundColor White
Write-Host "      Use values from backend/.env.production.example" -ForegroundColor Gray
Write-Host "      (DO NOT upload .env file - cPanel manages env vars)" -ForegroundColor Gray
Write-Host ""
Write-Host "  [D] Upload ZIP -> File Manager -> ~/api/ -> Extract" -ForegroundColor White
Write-Host "      Delete ZIP after extraction." -ForegroundColor Gray
Write-Host ""
Write-Host "  [E] Run NPM Install (button on Node.js App page)" -ForegroundColor White
Write-Host ""
Write-Host "  [F] Open cPanel Terminal:" -ForegroundColor White
Write-Host "        source /home/USER/nodevenv/api/20/bin/activate" -ForegroundColor Gray
Write-Host "        cd ~/api" -ForegroundColor Gray
Write-Host "        npx prisma generate" -ForegroundColor Gray
Write-Host "        npx prisma migrate deploy" -ForegroundColor Gray
Write-Host ""
Write-Host "  [G] Click 'Restart' on Node.js App page" -ForegroundColor White
Write-Host ""
Write-Host "  [H] Verify: curl https://reis-sg.online/api/v1/products?limit=1" -ForegroundColor White
Write-Host "             (should return paginated JSON with success:true)" -ForegroundColor Gray
Write-Host "      Note: /health route lives at /health in Express but Passenger" -ForegroundColor Gray
Write-Host "      forwards full path including /api, so /api/health -> 404." -ForegroundColor Gray
Write-Host "      Use any /api/v1/* endpoint instead." -ForegroundColor Gray
Write-Host ""

if ($OpenExplorer) {
    Start-Process explorer.exe -ArgumentList "/select,`"$ZipPath`""
}
