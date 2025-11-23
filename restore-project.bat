@echo off
REM Apple Point Project Restore Script
REM Restore project from timestamped backup

setlocal enabledelayedexpansion
set BACKUP_ROOT=E:\CELLO_BACKUPS

if not exist "!BACKUP_ROOT!" (
    echo No backups found at !BACKUP_ROOT!
    pause
    exit /b 1
)

echo === Available Backups ===
set count=0
for /d %%A in ("!BACKUP_ROOT!\Apple-Point*") do (
    echo [!count!] %%~nxA
    set backup[!count!]=%%A
    set /a count+=1
)

if !count! equ 0 (
    echo No backups available
    pause
    exit /b 1
)

set /p choice="Select backup number: "

if not defined backup[%choice%] (
    echo Invalid selection
    pause
    exit /b 1
)

echo.
echo WARNING: Current project will be overwritten!
set /p confirm="Continue? (yes/no): "

if /i not "%confirm%"=="yes" (
    echo Cancelled
    pause
    exit /b 0
)

echo.
echo Removing node_modules...
rmdir /s /q "E:\CELLO AVIATION\node_modules" 2>nul

echo Restoring from backup...
rmdir /s /q "E:\CELLO AVIATION" 2>nul
xcopy "!backup[%choice%]!" "E:\CELLO AVIATION" /E /I /Y /Q

echo.
echo Restore completed!
echo Next steps:
echo 1. npm install
echo 2. npm run dev
echo.
pause
