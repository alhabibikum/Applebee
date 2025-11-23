@echo off
REM Apple Point Project Backup Script
REM Creates a timestamped backup of the entire project

setlocal enabledelayedexpansion
cd /d "E:\CELLO AVIATION"

set BACKUP_ROOT=E:\CELLO_BACKUPS
if not exist "!BACKUP_ROOT!" mkdir "!BACKUP_ROOT!"

REM Create timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a-%%b)
set BACKUP_NAME=Apple-Point_!mydate!_!mytime!
set BACKUP_PATH=!BACKUP_ROOT!\!BACKUP_NAME!

echo Creating backup: !BACKUP_NAME!
xcopy "E:\CELLO AVIATION" "!BACKUP_PATH!" /E /I /Y /Q

REM Save git status
pushd "E:\CELLO AVIATION"
git status > "!BACKUP_PATH!\GIT_STATUS.txt" 2>&1
git log --oneline -10 >> "!BACKUP_PATH!\GIT_STATUS.txt" 2>&1
popd

echo Backup completed: !BACKUP_PATH!

REM Keep only last 5 backups
echo Checking old backups...
setlocal enabledelayedexpansion
set count=0
for /d %%A in ("!BACKUP_ROOT!\Apple-Point*") do (
    set /a count+=1
    if !count! gtr 5 (
        echo Removing old backup: %%~nxA
        rmdir /s /q "%%A"
    )
)

endlocal
pause
