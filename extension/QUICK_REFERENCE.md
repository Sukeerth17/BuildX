# ComplianceAI - Quick Reference Card

## 🎯 One-Minute Setup

```bash
cd /Users/sukeerth/Desktop/BuildX/Extension
npm install              # Install dependencies
npm run compile          # Compile TypeScript to JavaScript
# Then press F5 in VS Code to test
```

---

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **F5** | Launch extension in test window |
| **Ctrl+Shift+K** (Cmd+Shift+K on Mac) | Manual scan current file |
| **Ctrl+Shift+U** | Open Output panel |
| **Ctrl+Shift+P** | Command palette |
| **Hover** over squiggle | Show tooltip with fix suggestion |
| **Click lightbulb** | Show "Apply Fix" action |

---

## 📝 File Structure

```
/extension
├── src/               # TypeScript source (you edit these)
├── out/               # Compiled JavaScript (auto-generated)
├── node_modules/      # Dependencies (auto-generated)
├── package.json       # Project manifest
├── tsconfig.json      # TypeScript config
└── README.md          # Documentation
```

---

## 🔧 Common Commands

```bash
# Development
npm run compile         # One-time compilation
npm run watch          # Auto-compile on save
npm run lint           # Check for errors

# Testing
npm test               # Run test suite (if exists)

# Release
npx vsce package       # Create .vsix file for distribution
```

---

## 🔌 Extension Configuration (Settings)

Open VS Code Settings and search for "ComplianceAI":

```json
{
  "complianceai.cliPath": "compliance-cli",
  "complianceai.autoScan": true,
  "complianceai.enableDiagnostics": true,
  "complianceai.apiBaseUrl": "http://localhost:5000",
  "complianceai.severityThreshold": "MEDIUM"
}
```

---

## 📊 Expected Output - File Watcher

When you save a Python file:

```
[Extension] File saved: /path/to/file.py
[Scanner] Spawning: compliance-cli scan -file /path/to/file.py --format sarif
[Scanner] CLI returned with code 0
[Scanner] Parsed 2 results from SARIF
[StatusBar] Updated: 🔴 1 Critical | 🟠 1 High
[ApiClient] Reporting scan to backend...
```

---

## 🚨 Error Messages & Fixes

| Error | Fix |
|-------|-----|
| `compliance-cli not found` | Install Person 1's CLI or set `cliPath` setting |
| `Failed to parse SARIF JSON` | Check CLI output format (should be valid SARIF 2.1) |
| `Connection refused` | Start Person 3's backend API server |
| `Command not found: complianceai.scan` | Reload window (Ctrl+Shift+P → "Reload Window") |

---

## 📈 Data Flow

```
User saves file
    ↓
extension.ts detects onDidSaveTextDocument
    ↓
statusBar shows: "$(loading~spin) Scanning..."
    ↓
Scanner spawns: compliance-cli scan -file <path> --format sarif
    ↓
Parse SARIF JSON → ScanResult[]
    ↓
Create Diagnostics → Red squiggles in editor
    ↓
statusBar updates: "🔴 2 Critical | 🟠 1 High"
    ↓
apiClient.reportScan() → sends to Person 3's backend
    ↓
sidebarProvider.refresh() → updates dashboard
```

---

## 🔍 Hover Over Squiggle

```
Rule ID       [B105] Hard-coded password detected
Severity      🔴 CRITICAL
Framework     OWASP A02:2021
Fix           Use os.getenv() instead of hard-coded string
              Apply Fix | Learn More
```

---

## 💡 Lightbulb Menu

Click the lightbulb icon to see:
- **Apply Fix: B105** (Quick Fix - solves the issue)
- **Framework: OWASP A02:2021** (Info - learn more)

---

## 📊 Status Bar States

| State | Display | Color |
|-------|---------|-------|
| Loading | `🔄 ComplianceAI: Scanning...` | Default |
| All Clear | `✅ ComplianceAI: All Clear` | Green |
| Issues | `🔴 2 Critical \| 🟠 1 High \| 🟡 3 Medium` | Red/Orange/Yellow |
| Error | `❌ ComplianceAI: Error` | Red |

---

## 📲 Sidebar Dashboard

Appears in the activity bar (left sidebar):

```
┌─────────────────────────┐
│     ComplianceAI        │
├─────────────────────────┤
│                         │
│      Compliance: 78%    │
│     [████████░░]        │
│                         │
│  🔴 Critical:    0      │
│  🟠 High:       2      │
│  🟡 Medium:     1      │
│  🟢 Low:        0      │
│                         │
│  [Scan File] [Refresh]  │
│                         │
│  Last updated: 2 mins   │
└─────────────────────────┘
```

---

## 🌐 API Endpoints

Person 3's backend should provide:

```
GET  /api/compliance/dashboard
     → Returns { overallScore, findings, recentScans, trends }

GET  /api/compliance/scans/recent
     → Returns [{ timestamp, fileName, issueCount, maxSeverity }]

POST /api/compliance/scans/report
     Body: { filePath, findings[], severity }
     → Returns { success: true }
```

---

## 🐛 Debug Mode

Add `debugger;` statement in TypeScript:

```typescript
async function handleScan() {
  debugger;  // Execution pauses here
  // ... rest of code
}
```

Then:
1. Compile: `npm run compile`
2. Press F5 to launch test window
3. Debugger pauses on this line

---

## 📚 File Reference

| File | Purpose | Key Functions |
|------|---------|---|
| `extension.ts` | Entry point | `activate()`, file watcher |
| `scanner.ts` | CLI runner | `scanFile()`, `parseSarif()` |
| `diagnosticProvider.ts` | Red squiggles | `createDiagnostics()`, `publishDiagnostics()` |
| `hoverProvider.ts` | Hover tooltips | `provideHover()` |
| `codeActionProvider.ts` | Lightbulb | `provideCodeActions()` |
| `statusBar.ts` | Status badge | `setLoading()`, `setStatus()` |
| `sidebarProvider.ts` | Dashboard | `resolveWebviewView()`, `refresh()` |
| `apiClient.ts` | Backend connector | `getDashboardData()`, `reportScan()` |

---

## ✅ Testing Checklist

- [ ] F5 launches test window
- [ ] Output shows "extension activated"
- [ ] Status bar appears
- [ ] Sidebar appears
- [ ] Save file triggers scan
- [ ] Hover shows tooltip
- [ ] Lightbulb appears
- [ ] Status updates after scan
- [ ] Dashboard shows data (if backend running)

---

## 🎓 SARIF Contract

Minimum required for Person 1's CLI output:

```json
{
  "version": "2.1.0",
  "runs": [{
    "results": [{
      "ruleId": "B105",
      "message": { "text": "Found issue" },
      "locations": [{
        "physicalLocation": {
          "artifactLocation": { "uri": "path/to/file.py" },
          "region": { "startLine": 42 }
        }
      }],
      "properties": {
        "severity": "CRITICAL",
        "fix": "Use this instead...",
        "framework": "OWASP A02:2021"
      }
    }]
  }]
}
```

Required fields: `ruleId`, `message.text`, `locations[0].physicalLocation`, `startLine`, `severity`, `fix`, `framework`

---

## 📞 Support

- **Issues?** Check Output panel (View → Output → ComplianceAI)
- **Questions?** See DEVELOPMENT.md
- **Setup help?** See README.md
- **Ready to test?** See READY_TO_TEST.md

---

**ComplianceAI Extension - Ready for Launch! 🚀**
