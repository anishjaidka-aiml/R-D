# 🔧 Fix: EBUSY Error (Resource Busy or Locked)

**Error:** `EBUSY: resource busy or locked` when accessing `.next` folder files

---

## 🐛 **Root Cause**

This is a **Windows + OneDrive** issue:
- OneDrive is trying to sync the `.next` folder
- Dev server is accessing files in `.next`
- Windows file locking conflict

---

## ✅ **Quick Fix (Recommended)**

### **Option 1: Stop Server & Delete .next Folder**

1. **Stop your dev server:**
   ```bash
   # Press Ctrl+C in terminal
   ```

2. **Delete .next folder:**
   ```bash
   # In PowerShell
   Remove-Item -Recurse -Force .next
   
   # Or manually delete the .next folder in File Explorer
   ```

3. **Restart server:**
   ```bash
   npm run dev
   ```

---

## ✅ **Permanent Fix: Exclude .next from OneDrive**

### **Step 1: Exclude .next Folder from OneDrive**

1. **Right-click** on `.next` folder
2. **Select:** "Always keep on this device" or "Free up space"
3. **Or:** Exclude from OneDrive sync

### **Step 2: Add to .gitignore (if not already)**

Make sure `.next` is in `.gitignore`:
```
.next
```

### **Step 3: Add to OneDrive Exclusions**

1. Open **OneDrive Settings**
2. Go to **Sync and backup** → **Advanced settings**
3. Add `.next` to excluded folders

---

## 🔧 **Alternative: Use Different Location**

If OneDrive keeps interfering:

1. **Move project outside OneDrive:**
   ```
   C:\projects\Agentic AI  (instead of OneDrive)
   ```

2. **Or disable OneDrive sync for this folder:**
   - Right-click project folder
   - OneDrive → "Stop syncing this folder"

---

## 🚀 **Quick Command Fix**

Run this in PowerShell (in your project directory):

```powershell
# Stop server first (Ctrl+C), then:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

---

## 📋 **Prevention**

### **Add to .gitignore:**
```
.next/
node_modules/
.env.local
```

### **OneDrive Best Practices:**
- ✅ Keep code projects outside OneDrive
- ✅ Or exclude build folders from sync
- ✅ Use `.gitignore` properly

---

## ✅ **Summary**

**Quick Fix:**
1. Stop server (Ctrl+C)
2. Delete `.next` folder
3. Restart server (`npm run dev`)

**Permanent Fix:**
- Exclude `.next` from OneDrive sync
- Or move project outside OneDrive

---

**This should resolve the EBUSY error! 🎯**
