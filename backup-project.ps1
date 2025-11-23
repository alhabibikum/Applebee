# Apple Point Project Backup Script
# এটি project এর সম্পূর্ণ backup তৈরি করে

param(
    [string]$BackupPath = "E:\CELLO_BACKUPS",
    [string]$ProjectPath = "E:\CELLO AVIATION"
)

# Backup directory তৈরি করুন
if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath | Out-Null
    Write-Host "✓ Backup directory created: $BackupPath" -ForegroundColor Green
}

# Timestamp সহ backup folder তৈরি করুন
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "Apple-Point_$timestamp"
$fullBackupPath = Join-Path $BackupPath $backupName

# Project copy করুন
Write-Host "Backing up project..." -ForegroundColor Yellow
Copy-Item -Path $ProjectPath -Destination $fullBackupPath -Recurse -Force

# Git status save করুন
$gitStatus = Join-Path $fullBackupPath "GIT_STATUS.txt"
Push-Location $ProjectPath
git status > $gitStatus
git log --oneline -10 >> $gitStatus
Pop-Location

Write-Host "✓ Backup completed: $fullBackupPath" -ForegroundColor Green
Write-Host "✓ Project size: $(((Get-ChildItem $fullBackupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB).ToString('F2')) MB" -ForegroundColor Green

# সবচেয়ে পুরানো 5 টি backup ছাড়া বাকি delete করুন
$backups = Get-ChildItem $BackupPath -Directory | Sort-Object CreationTime -Descending
if ($backups.Count -gt 5) {
    $backups | Select-Object -Skip 5 | ForEach-Object {
        Write-Host "Removing old backup: $($_.Name)" -ForegroundColor Gray
        Remove-Item $_.FullName -Recurse -Force
    }
}
