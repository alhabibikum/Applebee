# 🛡️ APPLE POINT - SYSTEM HEALTH & MAINTENANCE GUIDE

## Daily Maintenance Checklist

### Morning (Before Development)

```powershell
# 1. System status check
cd "E:\CELLO AVIATION"
git status

# 2. Dependencies সব ঠিক?
npm list --depth=0

# 3. Dev server test করুন
npm run dev
# Ctrl+C দিয়ে বন্ধ করুন

# 4. Backup তৈরি করুন
.\backup-project.ps1
```

### During Development

```powershell
# After significant changes
git add .
git commit -m "feat: Description of changes"

# Every 2-3 hours
git push origin main
```

### Evening (Before Shutdown)

```powershell
# Final backup
.\backup-project.ps1

# Clean state নিশ্চিত করুন
git status  # Should be "nothing to commit, working tree clean"

# Unused branches delete করুন (if any)
git branch -d <branch-name>
```

---

## Weekly Deep Maintenance

### Saturday Morning Routine:

```powershell
cd "E:\CELLO AVIATION"

# 1. Complete backup
.\backup-project.ps1

# 2. Full dependencies check
npm audit
npm outdated

# 3. Try clean install (takes ~2-3 minutes)
Remove-Item node_modules -Recurse -Force
npm install

# 4. Run dev server
npm run dev

# 5. Manual UI testing
# - Check all pages load correctly
# - Test navigation
# - Verify recent features work

# 6. Update any critical dependencies (if needed)
npm update

# 7. Git status
git status
git log --oneline -5
```

---

## Monthly Full System Health Check

### First Sunday of Month:

```powershell
cd "E:\CELLO AVIATION"

# 1. Comprehensive backup
.\backup-project.ps1

# 2. Disk space check
Get-Volume | Where-Object { $_.DriveLetter -eq 'E' } | Select-Object SizeRemaining

# 3. Database check (if using local DB)
# Check indexedDB in DevTools: F12 > Application > IndexedDB

# 4. Git repository integrity
git fsck --full

# 5. Full system reset test (DON'T PUSH YET)
npm run build  # or your build command

# 6. Test production build
# npm run preview  (if applicable)

# 7. Cleanup old backups manually
Get-ChildItem "E:\CELLO_BACKUPS" | Sort-Object CreationTime | Select-Object -First 20

# 8. Update Convex backend if needed
npx convex deploy

# 9. Test all environments working
npm run dev
# Test locally for 5-10 minutes
```

---

## Disk Space Management

### Check available space:

```powershell
# Current project size
(Get-ChildItem "E:\CELLO AVIATION" -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB

# Backup sizes
(Get-ChildItem "E:\CELLO_BACKUPS" -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB

# Node modules size (biggest culprit)
(Get-ChildItem "E:\CELLO AVIATION\node_modules" -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB
```

### Clean up space:

```powershell
# Remove old backups (keep last 3)
Get-ChildItem "E:\CELLO_BACKUPS" -Directory | Sort-Object CreationTime -Descending | Select-Object -Skip 3 | Remove-Item -Recurse -Force

# Clean npm cache
npm cache clean --force

# Remove dist/build folders if they exist
Remove-Item "E:\CELLO AVIATION\dist" -Recurse -Force -ErrorAction SilentlyContinue
```

---

## Git Repository Health

### Check repository status:

```powershell
cd "E:\CELLO AVIATION"

# Repository integrity
git fsck --full

# Dangling objects
git fsck --lost-found

# Count commits
git rev-list --all --count

# Largest files in git
git rev-list --all --objects | Select-String -Pattern '.tsx?|.css|.json' | Sort-Object | Select-Object -Last 20

# Recent activity
git log --stat --oneline -10
```

### Optimize repository:

```powershell
cd "E:\CELLO AVIATION"

# Garbage collection
git gc --aggressive

# Repack objects
git repack -a -d

# Verify integrity again
git fsck --full
```

---

## Environment Variables & Secrets Safety

### Add to .gitignore (already done, verify):

```
.env.local
.env.*.local
node_modules/
dist/
.vite/
```

### Check for accidentally committed secrets:

```powershell
cd "E:\CELLO AVIATION"

# Search for common secret patterns
git log -p | Select-String -Pattern "password|secret|key|token" -Context 2
```

---

## VS Code Workspace Health

### Clear VS Code cache:

```powershell
# Close VS Code

# Clear settings sync
Remove-Item "$env:APPDATA\Code\User\globalStorage" -Recurse -Force -ErrorAction SilentlyContinue

# Clear extension cache
Remove-Item "$env:USERPROFILE\.vscode\extensions" -Recurse -Force -ErrorAction SilentlyContinue

# Reopen VS Code
# Extensions will auto-reinstall
```

---

## Performance Monitoring

### Track build time:

```powershell
# Measure dev server startup
Measure-Command { npm run dev }

# Measure build process (if applicable)
Measure-Command { npm run build }
```

### Monitor resource usage:

```powershell
# Open Task Manager
# Monitor: CPU, Memory, Disk I/O when dev server runs
# Normal: CPU <20%, Memory <500MB, Disk I/O minimal
```

---

## Critical Files Backup Locations

**Files requiring extra protection:**

```
E:\CELLO AVIATION\
  ├── convex/          (Backend logic - CRITICAL)
  ├── src/             (Frontend code - CRITICAL)
  ├── package.json     (Dependencies - CRITICAL)
  ├── tsconfig.json    (Config - CRITICAL)
  ├── .env.local       (Secrets - KEEP SAFE)
  └── .git/            (Full history - CRITICAL)

E:\CELLO_BACKUPS\     (Timestamped snapshots)
  ├── Apple-Point_2025-01-15_14-30-45/
  ├── Apple-Point_2025-01-14_14-30-45/
  └── ... (keep last 5-10)
```

---

## Recovery Time Estimates

| Scenario | Recovery Time | Data Loss |
|----------|--------------|-----------|
| Minor file corruption | 5 min | None (git restore) |
| node_modules broken | 5-10 min | None (npm install) |
| Project won't start | 15 min | None (git reset) |
| Local DB corrupted | 10-20 min | Local data only |
| Entire project crash | 30-45 min | None (git clone) |
| Catastrophic failure | 1-2 hours | None (full restore) |

---

## Emergency Contacts & Resources

- **GitHub Repository:** https://github.com/alhabibikum/Applebee
- **Convex Dashboard:** https://dashboard.convex.dev/
- **Vite Documentation:** https://vitejs.dev/
- **React Documentation:** https://react.dev/

---

## Automation Scripts Created

Located in: `E:\CELLO AVIATION\`

- `backup-project.ps1` - Daily backup creation
- `restore-project.ps1` - Backup restoration
- `EMERGENCY_RECOVERY.md` - This file

**Run backup daily:**
```powershell
.\backup-project.ps1
```

**Run restore when needed:**
```powershell
.\restore-project.ps1
```

---

**Last Updated:** November 2025
**Status:** Production Ready
**Backup Strategy:** Active (Manual Daily + Automated Weekly)
