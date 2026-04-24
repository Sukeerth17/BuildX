# ComplianceAI Extension - Setup & Development Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd /Users/sukeerth/Desktop/BuildX/Extension
npm install
```

This will:
- Install TypeScript, VS Code API types, ESLint, and Axios
- Create `node_modules/` directory

### 2. Compile TypeScript

```bash
npm run compile
```

Output: `out/extension.js` and all compiled files in the `out/` folder

### 3. Launch the Test Extension

In VS Code:
1. Press **F5** (or **Fn+F5** on Mac)
2. A new VS Code window opens with ComplianceAI loaded
3. Open any `.py`, `.tf`, `.yaml`, `.yml`, `.ts`, or `.js` file
4. The extension should activate (check View > Output > ComplianceAI)

### 4. Check the Output Panel

- Click **View > Output** (or press **Ctrl+Shift+U**)
- Select **"ComplianceAI"** from the dropdown
- You should see: `ComplianceAI extension activated`

---

## Project Structure

```
/Users/sukeerth/Desktop/BuildX/Extension/
├── src/                          # TypeScript source files
│   ├── extension.ts              # 🎯 Main entry point
│   ├── scanner.ts                # Runs compliance-cli as child process
│   ├── sarifParser.ts            # Parses SARIF JSON
│   ├── diagnosticProvider.ts     # Creates VS Code diagnostics
│   ├── hoverProvider.ts          # Hover tooltip handler
│   ├── codeActionProvider.ts     # Lightbulb actions
│   ├── statusBar.ts              # Compliance score badge
│   ├── sidebarProvider.ts        # WebView sidebar dashboard
│   ├── apiClient.ts              # Calls Person 3's API
│   └── types.ts                  # TypeScript interfaces
├── out/                          # Compiled JavaScript (auto-generated)
├── package.json                  # Extension manifest & dependencies
├── tsconfig.json                 # TypeScript compiler config
├── .vscodeignore                 # Files to exclude when packaging
├── README.md                      # User-facing documentation
└── DEVELOPMENT.md                # This file
```

---

## File-by-File Breakdown

### `extension.ts` - The Heart of the Extension

This is the main entry point that VS Code calls when activating the extension.

**What it does:**
1. Creates the output channel for logging
2. Initializes all providers (Scanner, Diagnostics, Hover, CodeAction, StatusBar, Sidebar)
3. Registers event listeners:
   - `onDidSaveTextDocument` → triggers scan on file save
   - `onDidOpenTextDocument` → logs when files open
4. Registers commands:
   - `complianceai.scan` → manual scan (Ctrl+Shift+K)
   - `complianceai.applyFix` → apply fix
   - `complianceai.showDashboard` → open sidebar

**Key flow:**
```
User saves file (.py, .tf, .yaml, etc.)
  ↓
extension.ts detects onDidSaveTextDocument
  ↓
handleFileScan() is called
  ↓
scanner.scanFile(fileName) runs compliance-cli
  ↓
diagnosticProvider creates VS Code Diagnostics
  ↓
Red squiggles appear on problem lines
  ↓
statusBar updates with compliance score
  ↓
sidebarProvider refreshes dashboard
```

### `scanner.ts` - The CLI Bridge

Communicates with Person 1's `compliance-cli` tool.

**What it does:**
1. Spawns `compliance-cli scan -file <path> --format sarif` as a child process
2. Captures stdout (SARIF JSON) and stderr (human messages)
3. Parses the SARIF output into `ScanResult[]` objects
4. Handles errors (CLI not found, invalid output, etc.)

**Key methods:**
- `scanFile(filePath)` → runs the CLI, returns Promise<ScanResult[]>
- `parseSarif(sarifOutput)` → converts SARIF JSON to ScanResult objects

### `diagnosticProvider.ts` - The Squiggle Creator

Converts scan results into VS Code Diagnostics (the red/yellow underlines).

**What it does:**
1. Takes `ScanResult[]` from the scanner
2. Creates `vscode.Diagnostic` objects with:
   - File URI
   - Line range (converted from 1-based to 0-based)
   - Severity (ERROR for Critical/High, WARNING for Medium, INFO for Low)
   - Message and code
3. Publishes diagnostics to VS Code
4. Stores results for later lookup by hover/code action providers

**Key methods:**
- `createDiagnostics(results, document)` → creates Diagnostic[]
- `publishDiagnostics(uri, diagnostics)` → shows them in the editor
- `getResults(filePath)` → retrieves stored results

### `hoverProvider.ts` - The Tooltip

When you hover over a red squiggle, this shows details.

**What it displays:**
- **Issue title**: `[B105] Hard-coded password found`
- **Severity badge**: 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW
- **Framework**: `OWASP A03:2021` or `SOC 2 CC6.7`
- **Fix suggestion**: AI-generated text
- **Links**: "Learn more" and "Apply Fix" buttons

### `codeActionProvider.ts` - The Lightbulb

When you hover over an issue, a lightbulb appears. Clicking it shows:
- **"Apply Fix: [RuleID]"** (quick fix action)
- **"Framework: [Name]"** (info action)

The "Apply Fix" action triggers the `complianceai.applyFix` command.

### `statusBar.ts` - The Badge

Shows compliance status at the bottom of VS Code.

**States:**
- 🔄 Loading: `ComplianceAI: Scanning...`
- ✅ Clear: `ComplianceAI: All Clear` (no issues)
- 🔴 Critical: `ComplianceAI: 🔴 2 Critical | 🟠 1 High` (red)
- 🟠 High: `ComplianceAI: 🟠 3 High | 🟡 2 Medium` (orange)
- 🟡 Medium: `ComplianceAI: 🟡 5 Medium | 🟢 1 Low` (yellow)
- ❌ Error: `ComplianceAI: Error` (red)

Click it to open the sidebar dashboard.

### `sidebarProvider.ts` - The Mini Dashboard

Manages the WebView that appears in the activity bar sidebar.

**Displays:**
- Overall compliance score (0-100%)
- Breakdown: Critical, High, Medium, Low counts
- Buttons: "Scan Current File", "Refresh Dashboard"
- Last updated timestamp

**Data flow:**
1. WebView calls `apiClient.getDashboardData()`
2. Fetches from Person 3's backend
3. Renders as HTML/CSS
4. Buttons trigger commands or refresh

### `apiClient.ts` - The Backend Connector

HTTP client that talks to Person 3's dashboard backend.

**Endpoints it expects:**
- `GET /api/compliance/dashboard` → returns `DashboardData`
- `GET /api/compliance/scans/recent` → returns recent scans
- `POST /api/compliance/scans/report` → submit a scan result

**Configuration:**
- Base URL: `complianceai.apiBaseUrl` (default: `http://localhost:5000`)
- Timeout: 5 seconds
- Auto-retry: No (handled by sidebarProvider)

### `types.ts` - The Type Definitions

TypeScript interfaces for the entire extension:
- `ScanResult` → A single finding
- `ComplianceScore` → Score breakdown
- `DashboardData` → Dashboard API response
- `RecentScan` → A scan record

---

## Development Workflow

### Watch Mode (Auto-Recompile)

```bash
npm run watch
```

This runs TypeScript in watch mode. Any `.ts` file you save automatically recompiles.

**To test changes:**
1. Save your TypeScript file
2. TypeScript auto-compiles (you'll see output)
3. In the test extension window, press **Ctrl+Shift+P** and type **"Reload Window"**
4. VS Code reloads the extension with your changes

### Linting

```bash
npm run lint
```

Checks for TypeScript and style errors. Fix them before pushing!

### Testing

```bash
npm run test
```

(Currently no tests—add them in `src/test/runTest.ts` as the project grows)

---

## Debugging

### View Logs

Click **View > Output** and select **ComplianceAI** from the dropdown.

Key log lines:
- `ComplianceAI extension activated` → extension started
- `[Scanner] Spawning: compliance-cli scan...` → CLI call
- `[Scanner] Parsed N results from SARIF` → successful scan
- `[Scanner] ❌ compliance-cli not found` → CLI missing
- `[ApiClient] Fetching dashboard data...` → sidebar refresh

### Breakpoints (Advanced)

If you need to debug code:
1. Add `debugger;` statement in your TypeScript file
2. Compile: `npm run compile`
3. Press F5 to open test window
4. VS Code debugger will stop at your breakpoint

### Common Issues

#### **"compliance-cli not found"**
```
[Scanner] ❌ compliance-cli not found. Make sure it is installed and in your PATH.
```

**Fix:**
1. Ask Person 1 to install the CLI globally
2. Verify: `compliance-cli --version`
3. Or set `complianceai.cliPath` in settings to the full path

#### **"Failed to parse SARIF JSON"**
```
[Scanner] Failed to parse SARIF JSON: SyntaxError: Unexpected token...
```

**Fix:**
1. Check that Person 1's CLI outputs valid JSON
2. Run manually: `compliance-cli scan -file test.py --format sarif`
3. Paste the output into a JSON validator: https://jsonlint.com/

#### **"Sidebar shows blank"**
```
[ApiClient] Connection refused. Is the backend running?
```

**Fix:**
1. Verify Person 3's backend is running
2. Check the port: `complianceai.apiBaseUrl` should point to it
3. Test with curl: `curl http://localhost:5000/api/compliance/dashboard`

---

## SARIF Contract (Person 1 ↔ Person 2)

The scanner expects this exact SARIF 2.1 JSON structure from the CLI:

```json
{
  "version": "2.1.0",
  "runs": [{
    "results": [{
      "ruleId": "B105",
      "message": { "text": "Hard-coded password detected" },
      "locations": [{
        "physicalLocation": {
          "artifactLocation": { "uri": "path/to/file.py" },
          "region": { "startLine": 42 }
        }
      }],
      "properties": {
        "severity": "CRITICAL",
        "fix": "Use os.getenv() instead of hard-coded string",
        "framework": "OWASP A02:2021"
      }
    }]
  }]
}
```

### Required Fields per Finding

| Field | Type | Example | Required |
|-------|------|---------|----------|
| `ruleId` | string | `B105` | ✅ Yes |
| `message.text` | string | `Hard-coded password` | ✅ Yes |
| `locations[0].physicalLocation.artifactLocation.uri` | string | `src/app.py` | ✅ Yes |
| `locations[0].physicalLocation.region.startLine` | number | `42` | ✅ Yes |
| `properties.severity` | enum | `CRITICAL \| HIGH \| MEDIUM \| LOW` | ✅ Yes |
| `properties.fix` | string | `Use environment variable` | ✅ Yes |
| `properties.framework` | string | `SOC 2 CC6.7` | ✅ Yes |

If any required field is missing, the scanner will log an error and skip that finding.

---

## Extension Configuration (package.json)

Users can configure the extension via Settings:

```json
{
  "complianceai.cliPath": "compliance-cli",
  "complianceai.autoScan": true,
  "complianceai.enableDiagnostics": true,
  "complianceai.apiBaseUrl": "http://localhost:5000",
  "complianceai.severityThreshold": "MEDIUM"
}
```

You can add more settings by editing the `"configuration"` section in `package.json`.

---

## Building for Release

### Create a VSIX Package

```bash
npm run compile
npx vsce package
```

Creates `complianceai-0.1.0.vsix` ready to install on other machines.

### Update Version

Edit `package.json`:
```json
{
  "version": "0.2.0"
}
```

---

## Git Workflow

Make sure you never commit:
- `node_modules/` (already in .gitignore)
- `out/` (already in .gitignore)

Safe commands:
```bash
git add src/ package.json tsconfig.json README.md .vscodeignore
git commit -m "Add feature: X"
git push origin feature/X
```

---

## Next Steps

### Week 1 (You are here)
- ✅ Create extension project structure
- ✅ Set up file watcher
- ⏳ Wait for Person 1 to provide CLI

### Week 2
- Connect to Person 1's CLI
- Test SARIF parsing
- Implement diagnostics, hover, code actions

### Week 3
- Implement sidebar dashboard
- Connect to Person 3's API
- Polish UI and error handling

### Week 4
- End-to-end testing
- Package as VSIX
- Prepare for hackathon demo

---

## Support & Questions

**For Person 1 (CLI):**
- Need: Command to run, SARIF JSON example, CLI installation steps

**For Person 3 (Backend):**
- Need: API endpoint documentation, DashboardData schema, authentication (if any)

**For troubleshooting:**
- Check the ComplianceAI Output panel
- Read this DEVELOPMENT.md
- Search GitHub issues (if the repo is public)

---

Built with ❤️ by Person 2 for the Hackathon 2.0 Project
