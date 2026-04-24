# 🤝 ComplianceAI - Team Handoff Guide

**For:** Person 1 (CLI Developer) & Person 3 (Backend Developer)  
**From:** Person 2 (VS Code Extension Developer)  
**Date:** April 24, 2025  

---

## 👋 Hello Team!

I've completed the VS Code extension for ComplianceAI. This document explains:
1. **What the extension does**
2. **What I need from you**
3. **How to verify integration**

---

## 📋 What the Extension Does

The ComplianceAI VS Code extension:

1. **Watches files** - Monitors when user saves `.py`, `.tf`, `.yaml`, `.ts`, `.js` files
2. **Calls your CLI** - Runs `compliance-cli scan -file <path> --format sarif` (Person 1)
3. **Parses output** - Converts SARIF JSON to VS Code diagnostics
4. **Shows issues** - Red squiggles, hover tooltips, lightbulb fixes
5. **Updates status** - Compliance score badge in status bar
6. **Fetches metrics** - Gets dashboard data from your API (Person 3)
7. **Shows dashboard** - Sidebar WebView displaying findings

---

## 👤 Person 1: The CLI Integration

### What I'm Expecting from You

**Command that will be executed:**
```bash
compliance-cli scan -file /path/to/file.py --format sarif
```

**Input:**
- File path (absolute path to a Python, Terraform, YAML, TypeScript, or JavaScript file)

**Expected Output (stdout):**
SARIF 2.1 JSON format with these **required fields per finding**:

```json
{
  "version": "2.1.0",
  "runs": [{
    "results": [
      {
        "ruleId": "B105",
        "message": {
          "text": "Hard-coded password detected"
        },
        "locations": [{
          "physicalLocation": {
            "artifactLocation": {
              "uri": "path/to/file.py"
            },
            "region": {
              "startLine": 42
            }
          }
        }],
        "properties": {
          "severity": "CRITICAL",
          "fix": "Use os.getenv() instead of hard-coded string",
          "framework": "OWASP A02:2021 - Cryptographic Failures"
        }
      },
      {
        "ruleId": "B106",
        "message": {
          "text": "Possible SQL injection"
        },
        "locations": [{
          "physicalLocation": {
            "artifactLocation": {
              "uri": "path/to/file.py"
            },
            "region": {
              "startLine": 67
            }
          }
        }],
        "properties": {
          "severity": "HIGH",
          "fix": "Use parameterized queries",
          "framework": "OWASP A03:2021 - Injection"
        }
      }
    ]
  }]
}
```

### Required SARIF Fields

Every finding **must have**:

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `ruleId` | string | `B105` | Unique identifier for the rule |
| `message.text` | string | `Hard-coded password` | Short description of the issue |
| `locations[0].physicalLocation.artifactLocation.uri` | string | `src/app.py` | File path (relative or absolute) |
| `locations[0].physicalLocation.region.startLine` | number | `42` | Line number (1-based) |
| `properties.severity` | enum | `CRITICAL \| HIGH \| MEDIUM \| LOW` | Issue severity |
| `properties.fix` | string | `Use os.getenv()` | AI-generated fix suggestion |
| `properties.framework` | string | `OWASP A02:2021` | Compliance framework or standard |

### Error Handling

**If CLI fails:**
- Return non-zero exit code
- Write error message to stderr (will be logged)
- Extension will show: "❌ compliance-cli failed: [error message]"

**If no issues found:**
- Return valid SARIF with empty `results` array
- Extension will show: "✅ All Clear"

### Configuration

Users can configure the CLI path in VS Code settings:
```json
{
  "complianceai.cliPath": "/usr/local/bin/compliance-cli"
}
```

Default: `"compliance-cli"` (assumes it's in PATH)

### Testing the CLI Manually

In VS Code terminal, try:
```bash
compliance-cli scan -file test.py --format sarif
```

Pipe to https://jsonlint.com/ to validate JSON:
```bash
compliance-cli scan -file test.py --format sarif | jq '.'
```

---

## 👤 Person 3: The Backend API Integration

### What I'm Expecting from You

**Base URL** (configurable):
```
http://localhost:5000
```

**Three API endpoints needed:**

### 1. GET /api/compliance/dashboard

**Purpose:** Fetch overall dashboard metrics for the sidebar widget

**Response (DashboardData):**
```json
{
  "overallScore": 78,
  "findings": {
    "critical": 2,
    "high": 3,
    "medium": 5,
    "low": 1
  },
  "recentScans": [
    {
      "timestamp": "2025-04-24T10:30:00Z",
      "fileName": "app.py",
      "issueCount": 3,
      "maxSeverity": "CRITICAL"
    },
    {
      "timestamp": "2025-04-24T10:15:00Z",
      "fileName": "database.py",
      "issueCount": 1,
      "maxSeverity": "HIGH"
    }
  ],
  "trends": [
    { "date": "2025-04-20", "score": 65 },
    { "date": "2025-04-21", "score": 68 },
    { "date": "2025-04-22", "score": 72 },
    { "date": "2025-04-23", "score": 75 },
    { "date": "2025-04-24", "score": 78 }
  ]
}
```

**Response Fields:**
- `overallScore` (0-100): Calculated compliance percentage
- `findings.critical/high/medium/low` (number): Count by severity
- `recentScans` (array): Up to 10 recent scans
- `trends` (array): Score history for the past 7 days

**Errors:**
- 500: Backend error → Extension shows "Failed to load dashboard"
- 503: Service unavailable → Extension shows "Backend unavailable"

### 2. GET /api/compliance/scans/recent

**Purpose:** Fetch recent scan history for detailed view (optional)

**Response (RecentScan[]):**
```json
[
  {
    "timestamp": "2025-04-24T10:30:00Z",
    "fileName": "app.py",
    "issueCount": 3,
    "maxSeverity": "CRITICAL"
  },
  {
    "timestamp": "2025-04-24T10:15:00Z",
    "fileName": "database.py",
    "issueCount": 1,
    "maxSeverity": "HIGH"
  }
]
```

### 3. POST /api/compliance/scans/report

**Purpose:** Submit scan results from the extension to your backend

**Request Body:**
```json
{
  "filePath": "/path/to/file.py",
  "findings": [
    {
      "ruleId": "B105",
      "message": "Hard-coded password",
      "line": 42,
      "severity": "CRITICAL",
      "fix": "Use os.getenv()",
      "framework": "OWASP A02:2021"
    }
  ],
  "severity": "CRITICAL"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scan reported successfully"
}
```

**Errors:**
- 400: Invalid request → Extension logs error
- 401: Unauthorized → Extension logs "Authentication required"
- 500: Server error → Extension logs "Failed to report scan"

### Configuration

Users configure the API URL in VS Code settings:
```json
{
  "complianceai.apiBaseUrl": "https://api.example.com"
}
```

Default: `"http://localhost:5000"`

### Testing the API

In terminal:
```bash
# Test dashboard endpoint
curl http://localhost:5000/api/compliance/dashboard

# Test recent scans
curl http://localhost:5000/api/compliance/scans/recent

# Test report endpoint
curl -X POST http://localhost:5000/api/compliance/scans/report \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "test.py",
    "findings": [],
    "severity": "LOW"
  }'
```

---

## 🔗 How Everything Connects

```
User saves file
    ↓
Extension detects save
    ↓
    ├─→ Person 1's CLI ────────────→ SARIF JSON
    │                                    ↓
    │                        Extension parses & shows issues
    │
    └─→ Person 3's Backend API ──→ Dashboard metrics
                                        ↓
                            Extension shows in sidebar
```

---

## ✅ Integration Checklist

### For Person 1 (CLI)

- [ ] CLI installed and executable as `compliance-cli`
- [ ] CLI accepts `--format sarif` flag
- [ ] CLI outputs valid SARIF 2.1 JSON
- [ ] All required fields present in findings
- [ ] Tested manually: `compliance-cli scan -file test.py --format sarif`
- [ ] JSON validates at https://jsonlint.com/

### For Person 3 (Backend)

- [ ] Backend running at `http://localhost:5000`
- [ ] GET `/api/compliance/dashboard` responds with DashboardData
- [ ] GET `/api/compliance/scans/recent` responds with RecentScan[]
- [ ] POST `/api/compliance/scans/report` accepts findings
- [ ] All endpoints return proper JSON
- [ ] Error handling in place (500, 503 codes)
- [ ] Tested with curl commands above

### For Person 2 (Me)

- [ ] Extension builds: `npm run compile` ✅
- [ ] Extension runs: F5 launches test window ✅
- [ ] File watcher works: Save file triggers scan ✅
- [ ] Status bar appears ✅
- [ ] Sidebar appears ✅
- [ ] Integration with CLI: Red squiggles appear
- [ ] Integration with API: Dashboard loads data

---

## 🧪 Full Integration Test

Once all 3 pieces are ready, test like this:

1. **Start the backend** (Person 3):
   ```bash
   npm start  # or however you start it
   # Should be accessible at http://localhost:5000
   ```

2. **Verify CLI** (Person 1):
   ```bash
   compliance-cli --version
   compliance-cli scan -file test.py --format sarif | jq '.'
   ```

3. **Launch extension** (Person 2):
   - Press F5 in VS Code
   - Create `test.py` with compliance issues
   - Save it

4. **Verify end-to-end**:
   - ✅ Red squiggles appear on problem lines
   - ✅ Hover shows tooltip with fix
   - ✅ Lightbulb shows "Apply Fix" action
   - ✅ Status bar shows "🔴 X Critical | 🟠 Y High"
   - ✅ Sidebar shows dashboard with data

---

## 📞 Communication Protocol

### If CLI Output is Invalid

**Symptom:** Extension shows "[Scanner] Failed to parse SARIF JSON"

**Debug:**
1. Ask Person 1 to run: `compliance-cli scan -file test.py --format sarif`
2. Paste output to: https://jsonlint.com/
3. Check that all required fields are present
4. Share the output with me (Person 2)

**Fix:** Adjust CLI output to match expected format

### If Backend is Down

**Symptom:** Sidebar shows "Failed to load dashboard" or nothing

**Debug:**
1. Check if backend is running
2. Try: `curl http://localhost:5000/api/compliance/dashboard`
3. Check error logs in backend

**Fix:** Start backend server

### If Extension Can't Find CLI

**Symptom:** "❌ compliance-cli not found"

**Debug:**
1. Person 1 shares install instructions
2. User installs globally: `npm install -g compliance-cli`
3. Or user sets full path in settings

**Fix:** Proper CLI installation or path configuration

---

## 📝 Document Exchange

**I'm giving you:**
1. This handoff guide (you're reading it)
2. SARIF contract specification (in README.md)
3. API requirements (above)
4. Extension source code (for reference)

**I need from you:**
1. **Person 1:** CLI executable + SARIF output examples
2. **Person 3:** Backend running + API endpoints working

**Share with each other:**
1. **Person 1 → Person 2:** SARIF JSON examples for testing
2. **Person 3 → Person 2:** API response examples
3. **Person 1 ↔ Person 3:** Coordinate on findings data format

---

## 🚀 Timeline

| Week | Milestone |
|------|-----------|
| **Week 1** | Extension complete ✅, CLI ready (Person 1?), Backend ready (Person 3?) |
| **Week 2** | Integration testing, red squiggles appear |
| **Week 3** | Full end-to-end working, polish UI |
| **Week 4** | Demo ready, package as VSIX, prepare marketplace |

---

## 🎯 Success Criteria

**Integration is successful when:**
1. ✅ Save a file in test extension
2. ✅ CLI runs automatically
3. ✅ Red squiggles appear on problem lines
4. ✅ Hover shows tooltip with fix
5. ✅ Status bar updates with counts
6. ✅ Sidebar dashboard shows data
7. ✅ Lightbulb actions work
8. ✅ No errors in output panel

---

## 📞 Questions?

**For Person 1 (CLI):**
- Where is the CLI installed? → Tell me the path
- What's a sample SARIF output? → Share an example
- Does the CLI need special flags? → Document them

**For Person 3 (Backend):**
- How do I test your API? → Share curl examples
- What's the schema for DashboardData? → I've documented it above
- Does the API need authentication? → Tell me the headers

**For Me (Person 2):**
- How do I debug the extension? → Check Output panel
- How do I update the extension? → Edit .ts, then `npm run compile`
- How do I repackage it? → `npx vsce package`

---

## 🎉 You're Set!

Everything on my end is complete. Now it's your turn:

**Person 1:** Build the CLI that outputs SARIF JSON  
**Person 3:** Build the backend API with the 3 endpoints  
**Person 2 (me):** Connect them all together  

Once both of you are ready, we'll have a working ComplianceAI extension!

---

**Let's ship this! 🚀**

Questions? Check:
- README.md (User documentation)
- DEVELOPMENT.md (Technical details)
- QUICK_REFERENCE.md (Quick answers)
- This file (Team coordination)

---

**Built by Person 2 for ComplianceAI Hackathon Project**  
**Status: 🟢 READY FOR INTEGRATION**
