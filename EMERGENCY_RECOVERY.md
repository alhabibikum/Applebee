# 🆘 APPLE POINT - EMERGENCY RECOVERY GUIDE

## Problem: Project নষ্ট হয়েছে অথবা Crash হয়েছে

---

## **Option 1: Git এ Revert করুন (সবচেয়ে সহজ)**

```powershell
cd "E:\CELLO AVIATION"

# Last working commit দেখুন
git log --oneline

# Last commit এ ফিরে যান
git reset --hard HEAD~1

# অথবা specific commit এ
git reset --hard <commit-hash>

# node_modules reinstall করুন
npm install

# Dev server চালু করুন
npm run dev
```

---

## **Option 2: Local Backup থেকে Restore করুন**

```powershell
# Script run করুন
.\restore-project.ps1

# Then reinstall dependencies
npm install

# পুরো project reload করুন VS Code এ
# Ctrl+Shift+P > "Developer: Reload Window"
```

---

## **Option 3: GitHub থেকে Clone করুন (Nuclear Option)**

```powershell
# Current corrupted folder rename করুন
Rename-Item "E:\CELLO AVIATION" "E:\CELLO AVIATION_BROKEN"

# Fresh clone করুন
git clone https://github.com/alhabibikum/Applebee.git "E:\CELLO AVIATION"

cd "E:\CELLO AVIATION"

# Dependencies install করুন
npm install

# Dev server চালু করুন
npm run dev
```

---

## **Option 4: Node Modules Corruption Fix**

যদি শুধু `node_modules` corruption হয়েছে:

```powershell
cd "E:\CELLO AVIATION"

# node_modules ডিলিট করুন
Remove-Item node_modules -Recurse -Force

# package-lock.json ডিলিট করুন
Remove-Item package-lock.json

# Fresh install করুন
npm install

# Cache clear করুন
npm cache clean --force
```

---

## **Option 5: Vite Cache Issues**

যদি Vite crash করে:

```powershell
cd "E:\CELLO AVIATION"

# Vite cache clear করুন
Remove-Item ".vite" -Recurse -Force -ErrorAction SilentlyContinue

# Kill existing processes
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# পোর্ট clear করুন (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Fresh start করুন
npm run dev
```

---

## **Regular Prevention Strategy**

### ✅ Weekly Routine:

```powershell
# 1. Backup তৈরি করুন
.\backup-project.ps1

# 2. Git push করুন
git status
git add .
git commit -m "Weekly backup"
git push origin main

# 3. Package updates check করুন (optional)
npm outdated

# 4. Clean install চেষ্টা করুন (monthly)
# Remove-Item node_modules -Recurse -Force
# npm install
```

---

## **Automated Daily Backup (Windows Task Scheduler)**

Create a `.bat` file:

```batch
@echo off
cd E:\CELLO AVIATION
powershell -NoProfile -ExecutionPolicy Bypass -File backup-project.ps1
echo Backup completed at %date% %time% >> E:\CELLO_BACKUPS\backup-log.txt
```

Schedule it via Task Scheduler:
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 11:59 PM
4. Set action: Run the .bat file

---

## **Safety Checklist Before Updates**

- ✅ `git status` চেক করুন (uncommitted changes না থাকা উচিত)
- ✅ `npm run dev` চেষ্টা করে দেখুন
- ✅ `.\backup-project.ps1` run করুন
- ✅ সব changes commit করুন
- ✅ `git push` করুন
- ✅ এখন safely update করুন

---

## **Data Safety Hierarchy**

**সবচেয়ে নিরাপদ থেকে কম নিরাপদ:**

1. GitHub Remote Repository ⭐⭐⭐ (সবচেয়ে নিরাপদ)
2. Local Git History ⭐⭐⭐ (restore করা সহজ)
3. Timestamped Local Backups ⭐⭐ (manual restore প্রয়োজন)
4. VS Code Source Control ⭐⭐ (ঝুঁকিপূর্ণ)
5. Working Directory File (সবচেয়ে ঝুঁকিপূর্ণ)

---

## **Contact During Emergency**

যদি সব কিছু fail হয়:

1. **GitHub restore করুন** (সবসময় কাজ করে)
2. **`git reflog`** ব্যবহার করুন (deleted commits recover করতে)
3. **Local backup use করুন**
4. সবশেষ rescue: Project re-setup করুন

---

**Remember: Daily commits + Weekly backups = Peace of Mind! 🛡️**
