# ComplianceAI — VS Code Extension

> Real-time compliance & security scanning inside VS Code, powered by the ComplianceAI CLI and dashboard backend.

---

## Features

| Feature | Description |
|---|---|
| 🔍 **Auto-scan on save** | Every supported file is scanned automatically when saved |
| 🔴 **Red squiggles** | Inline diagnostics highlight each finding on the exact line |
| 💡 **Hover tooltips** | Hover over a squiggle to see severity, framework, and AI fix suggestion |
| 🔧 **Fix button (lightbulb)** | One-click apply of the AI-suggested fix; triggers a re-scan on next save |
| 📊 **Status bar badge** | Shows `✅ 100%` or `❌ 3 critical` after every scan |
| 🗂️ **Sidebar dashboard** | Pass rate, finding counts, and top 3 critical issues from the live backend |

---

## Supported Languages

- Python (`.py`)
- TypeScript / JavaScript (`.ts`, `.js`)
- Terraform (`.tf`)
- YAML (`.yaml`, `.yml`)

---

## Installation

### Prerequisites

1. **Node.js ≥ 18** and **npm**
2. **ComplianceAI CLI** installed and on your `PATH`:
   ```bash
   cd ../cli
   pip install -e .
   # Verify:
   compliance-cli --version
   ```
3. *(Optional)* Person 3's dashboard backend running at `http://localhost:8000`

### Install the Extension

#### Option A — Run from Source (Dev / Hackathon)

```bash
cd extension
npm install
npm run compile
```

Then press **F5** in VS Code to launch the **Extension Development Host**.

#### Option B — Install the `.vsix` Package

```bash
cd extension
npm install
npm run compile
npx vsce package          # generates complianceai-0.0.1.vsix
code --install-extension complianceai-0.0.1.vsix
```

---

## Configuration

Open **Settings → Extensions → ComplianceAI**:

| Setting | Default | Description |
|---|---|---|
| `complianceai.jwtToken` | *(empty)* | JWT token for the dashboard backend |
| `complianceai.backendUrl` | `http://localhost:8000` | Backend API base URL |
| `complianceai.enableAutoScan` | `true` | Auto-scan on every file save |
| `complianceai.severityThreshold` | `MEDIUM` | Minimum severity to display |

Or set them directly in `settings.json`:

```json
{
  "complianceai.backendUrl": "http://localhost:8000",
  "complianceai.jwtToken": "your-jwt-token-here",
  "complianceai.enableAutoScan": true,
  "complianceai.severityThreshold": "LOW"
}
```

---

## Usage

### Auto-scan
Open any `.py`, `.ts`, `.yaml`, or `.tf` file and **save it** (`Ctrl+S` / `Cmd+S`).  
The extension will:
1. Run the CLI scanner in the background
2. Parse the SARIF output
3. Render squiggles on vulnerable lines
4. Update the status bar badge

### Manual scan
- Open the Command Palette (`Ctrl+Shift+P`) → **ComplianceAI: Run Scan**
- Or press **`Ctrl+Shift+K`** (`Cmd+Shift+K` on Mac)

### Clear diagnostics
Command Palette → **ComplianceAI: Clear Diagnostics**

---

## Testing

A ready-made vulnerable test file is included:

```
extension/test-fixtures/vulnerable.py
```

Open it in VS Code, save it, and verify:

| Test | Expected Result |
|---|---|
| Squiggles on correct lines | Lines 20, 28, 36, 41, 42, 48 get red/orange squiggles |
| Hover tooltip | Shows severity badge, framework tag, and AI fix |
| Fix button | Lightbulb → Apply Fix → code is replaced → save re-triggers scan |
| CLI not installed | Error message: `ComplianceAI: CLI not found` appears in notification |
| Backend offline | Sidebar shows: *"Could not fetch data from the server"* |

---

## Troubleshooting

### No squiggles appear
- Open **Output → ComplianceAI** to see scan logs
- Check that `compliance-cli` is on your PATH: `which compliance-cli`
- Confirm the file language is detected correctly (bottom-right of VS Code)

### Sidebar shows error
- Confirm Person 3's backend is running: `curl http://localhost:8000/api/v1/findings`
- Check your JWT token in settings

### TypeScript compile errors
```bash
npm install
npm run compile
```

---

## Project Structure

```
extension/
├── src/
│   ├── extension.ts          # Activation, file-watcher, command registration
│   ├── scanner.ts            # Spawns the compliance-cli subprocess
│   ├── sarifParser.ts        # Converts SARIF JSON → ScanResult[]
│   ├── diagnosticProvider.ts # ScanResult[] → vscode.Diagnostic[]
│   ├── hoverProvider.ts      # Hover tooltip with fix suggestion
│   ├── codeActionProvider.ts # Lightbulb → WorkspaceEdit apply fix
│   ├── statusBar.ts          # Status bar badge manager
│   ├── sidebarProvider.ts    # WebviewViewProvider for sidebar panel
│   ├── apiClient.ts          # HTTP client for backend (Person 3)
│   └── types.ts              # Shared TypeScript interfaces
├── test-fixtures/
│   └── vulnerable.py         # Known-vulnerable file for manual testing
├── out/                      # Compiled JS output (git-ignored)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Team Integration

| Person | Responsibility | Integration point |
|---|---|---|
| **Person 1 (CLI)** | `compliance-cli` binary | `scanner.ts` spawns it, reads SARIF from stdout |
| **Person 2 (Extension)** | This extension | Bridges CLI ↔ VS Code ↔ Dashboard |
| **Person 3 (Backend)** | REST API at `:8000` | `apiClient.ts` calls `GET /api/v1/findings` with JWT |

---

## License

MIT — Hackathon Project
