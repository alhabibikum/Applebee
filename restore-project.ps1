# Apple Point Project Restore Script
# Backup থেকে project restore করে

param(
    [string]$BackupPath = "E:\CELLO_BACKUPS",
    [string]$ProjectPath = "E:\CELLO AVIATION"
)

$backups = Get-ChildItem $BackupPath -Directory | Sort-Object CreationTime -Descending

if ($backups.Count -eq 0) {
    Write-Host "❌ কোন backup পাওয়া যায়নি!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Available Backups ===" -ForegroundColor Cyan
for ($i = 0; $i -lt [Math]::Min($backups.Count, 10); $i++) {
    Write-Host "[$i] $($backups[$i].Name) - $($backups[$i].CreationTime)" -ForegroundColor Green
}

# User input নিন
$choice = Read-Host "`nRestore করতে backup number দিন (0-9)"

if ($choice -notmatch '^\d+$' -or $choice -ge $backups.Count) {
    Write-Host "❌ Invalid choice" -ForegroundColor Red
    exit 1
}

$selectedBackup = $backups[$choice].FullName
Write-Host "`n⚠️  Warning: Current project will be overwritten!" -ForegroundColor Yellow
$confirm = Read-Host "Continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Cancelled" -ForegroundColor Yellow
    exit 0
}

# Node modules যদি থাকে তাহলে cache বুঝতে দিন
if (Test-Path (Join-Path $ProjectPath "node_modules")) {
    Write-Host "`nRemoving node_modules for clean restore..." -ForegroundColor Gray
    Remove-Item (Join-Path $ProjectPath "node_modules") -Recurse -Force -ErrorAction SilentlyContinue
}

# Project restore করুন
Write-Host "`nRestoring from backup..." -ForegroundColor Yellow
Remove-Item $ProjectPath -Recurse -Force
Copy-Item -Path $selectedBackup -Destination $ProjectPath -Recurse -Force

Write-Host "✓ Project restored successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. npm install    (dependencies reinstall করতে)" -ForegroundColor White
Write-Host "2. npm run dev    (dev server চালু করতে)" -ForegroundColor White
