# 🚀 ComplianceAI - 5-Minute Quick Start

**Status:** ✅ Everything is ready. Just press F5!

---

## ⚡ Step-by-Step (5 minutes)

### Step 1: Verify Setup (1 minute)
```bash
cd /Users/sukeerth/Desktop/BuildX/Extension
npm run compile
# Expected: No errors, just finishes
```

### Step 2: Launch Extension (1 minute)
- In VS Code: **Press F5** (or Fn+F5 on Mac)
- Wait for test window to open
- You should see a new VS Code window with ComplianceAI loaded

### Step 3: Verify Activation (1 minute)
- In test window: Click **View → Output** (or Ctrl+Shift+U)
- Select **"ComplianceAI"** from dropdown
- You should see: `ComplianceAI extension activated` ✅

### Step 4: Check UI Elements (1 minute)
- ✅ **Status bar** at bottom left shows "ComplianceAI"
- ✅ **Sidebar** shows "ComplianceAI" icon in activity bar (left edge)
- Both should be visible

### Step 5: Test File Watcher (1 minute)
- Create a file: `test.py`
- Add some code:
  ```python
  password = "hardcoded123"
  ```
- **Save it** (Ctrl+S)
- Check Output panel → Should see scan attempt logs

---

## ✅ Success = You See This

```
[Extension] Starting ComplianceAI...
[Extension] ComplianceAI extension activated
[Extension] File saved: test.py
[Scanner] Spawning: compliance-cli scan -file test.py --format sarif
```

If you see this, **the extension is working!** ✅

---

## ❌ If Something's Wrong

| Symptom | Fix |
|---------|-----|
| "Command not found: npm" | Install Node.js from nodejs.org |
| "TypeScript errors" | Run `npm install` first |
| Test window doesn't open | Click F5 again, wait 5 seconds |
| "ComplianceAI not in Output" | Click View → Output, select ComplianceAI |
| No status bar visible | Restart VS Code |
| CLI error "not found" | Person 1 hasn't shared the CLI yet (expected) |

---

## 📚 Need More Details?

| Want to know... | Read this |
|-----------------|-----------|
| How to use it | README.md |
| How to develop | DEVELOPMENT.md |
| How to test | READY_TO_TEST.md |
| Quick reference | QUICK_REFERENCE.md |
| Everything | COMPLETION_SUMMARY.md |

---

## 🎯 What's Next?

1. **Share with team:**
   - Give Person 1: `TEAM_HANDOFF.md` (Person 1 section)
   - Give Person 3: `TEAM_HANDOFF.md` (Person 3 section)

2. **Wait for deliverables:**
   - Person 1: Builds compliance-cli
   - Person 3: Runs backend API

3. **Once ready, red squiggles appear automatically!**

---

## 📞 You're All Set! 

The extension is **100% complete and ready**.

Next steps are out of your hands—waiting on Person 1 (CLI) and Person 3 (API).

**Press F5 and enjoy!** 🎉

---

**Questions?** Check QUICK_REFERENCE.md
