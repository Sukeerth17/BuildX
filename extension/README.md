# ComplianceAI - VS Code Extension

## Overview

**ComplianceAI** is a real-time compliance and security scanning VS Code extension that integrates with the hackathon's three-person build:

- **Person 1**: `compliance-cli` (the scanning engine)
- **Person 2**: This extension (the VS Code UI layer)
- **Person 3**: Dashboard backend (the analytics layer)

When you save a Python, Terraform, YAML, or TypeScript file, ComplianceAI automatically runs compliance checks and shows problems directly in your editor with AI-powered fix suggestions.

## Features

✅ **Real-time Scanning** - Runs on every file save  
✅ **Red Squiggles** - Visual indicators on problem lines  
✅ **Hover Tooltips** - Detailed explanations when you hover  
✅ **Lightbulb Actions** - "Apply Fix" with one click  
✅ **Compliance Score Badge** - Status bar shows overall health  
✅ **Mini Dashboard** - Sidebar panel with analytics  
✅ **SARIF Integration** - Parses Person 1's output format  

## Getting Started

### Prerequisites

1. **Node.js** (v14+) and npm
2. **VS Code** (v1.85.0+)
3. **compliance-cli** installed by Person 1
   ```bash
   # Verify it works:
   compliance-cli scan -file test.py --format sarif
   ```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sukeerth17/BuildX.git
   cd BuildX/Extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Compile TypeScript**
   ```bash
   npm run compile
   ```

4. **Launch the test extension** (in VS Code)
   - Press `F5` to open a new VS Code window with the extension loaded
   - The extension activates when you open any Python/Terraform/YAML/TypeScript file

5. **Check the Output panel**
   - Click **View > Output**
   - Select **"ComplianceAI"** from the dropdown
   - You should see activation logs

### Development Workflow

```bash
# Watch TypeScript files and recompile on change
npm run watch

# Lint the code
npm run lint

# Run tests (when available)
npm run test
```

## Configuration

Open **Settings** (Ctrl+, / Cmd+,) and search for `complianceai`:

| Setting | Description | Default |
|---------|-------------|---------|
| `complianceai.cliPath` | Path to compliance-cli executable | `compliance-cli` |
| `complianceai.autoScan` | Auto-scan on file save | `true` |
| `complianceai.enableDiagnostics` | Show red squiggles | `true` |
| `complianceai.apiBaseUrl` | Person 3's backend URL | `http://localhost:5000` |
| `complianceai.severityThreshold` | Minimum severity to show | `MEDIUM` |

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `ComplianceAI: Scan Current File` | Ctrl+Shift+K (Cmd+Shift+K on Mac) | Manually scan the active file |
| `ComplianceAI: Apply Fix` | (via lightbulb) | Apply AI-suggested fix to a line |
| `ComplianceAI: Show Dashboard` | (via sidebar) | Open the mini compliance dashboard |

## Architecture

### Folder Structure

```
/extension/
├── src/
│   ├── extension.ts            # Main entry point
│   ├── scanner.ts              # Runs compliance-cli as child process
│   ├── sarifParser.ts          # Parses SARIF JSON → VS Code diagnostics
│   ├── diagnosticProvider.ts   # Creates Diagnostic objects
│   ├── hoverProvider.ts        # Hover tooltip handler
│   ├── codeActionProvider.ts   # Lightbulb "Apply Fix" actions
│   ├── statusBar.ts            # Compliance score badge
│   ├── sidebarProvider.ts      # WebView mini-dashboard
│   └── apiClient.ts            # Calls Person 3's API
├── package.json                # Extension manifest
├── tsconfig.json               # TypeScript config
├── .vscodeignore               # Packaging exclusions
└── README.md                   # This file
```

### Data Flow

```
[User saves file]
    ↓
[extension.ts detects file save]
    ↓
[scanner.ts spawns compliance-cli]
    ↓
[CLI returns SARIF JSON to stdout]
    ↓
[sarifParser.ts converts to VS Code Diagnostics]
    ↓
[diagnosticProvider.ts shows red squiggles]
    ↓
[hoverProvider.ts shows tooltips on hover]
    ↓
[codeActionProvider.ts shows lightbulb on hover]
    ↓
[statusBar.ts updates compliance score badge]
    ↓
[sidebarProvider.ts fetches latest data from Person 3's API]
```

## Troubleshooting

### Extension doesn't activate
- **Symptom**: No ComplianceAI output in the Output panel
- **Fix**: Make sure you have a Python/Terraform/YAML/TypeScript file open in the editor

### "compliance-cli not found"
- **Symptom**: Error message in Output panel
- **Fix**: 
  1. Verify Person 1's CLI is installed: `which compliance-cli` (or `where` on Windows)
  2. If not installed, ask Person 1 to install it globally
  3. Update the `complianceai.cliPath` setting if it's installed in a non-standard location

### No diagnostics showing
- **Symptom**: Scan runs but no red squiggles appear
- **Fix**:
  1. Check `complianceai.enableDiagnostics` is `true`
  2. Check the severity threshold isn't filtering out all issues
  3. Look at the Output panel to see if the scanner found any problems

### Dashboard sidebar is blank
- **Symptom**: Sidebar opens but shows no data
- **Fix**:
  1. Verify Person 3's backend is running at `complianceai.apiBaseUrl`
  2. Check the browser console (F12 in the WebView) for API errors
  3. Ensure the backend returns valid JSON

## SARIF Contract (Person 1 ↔ Person 2)

The extension expects the CLI to output **SARIF 2.1** JSON on stdout with this structure:

```json
{
  "version": "2.1.0",
  "runs": [{
    "results": [{
      "ruleId": "B105",
      "message": { "text": "Hard-coded password found" },
      "locations": [{
        "physicalLocation": {
          "artifactLocation": { "uri": "path/to/file.py" },
          "region": { "startLine": 42 }
        }
      }],
      "properties": {
        "severity": "CRITICAL",
        "fix": "Use environment variable instead of hard-coded string",
        "framework": "OWASP A02:2021"
      }
    }]
  }]
}
```

### Required Fields
- `ruleId`: Unique identifier for the rule
- `message.text`: Human-readable problem description
- `locations[0].physicalLocation.artifactLocation.uri`: File path
- `locations[0].physicalLocation.region.startLine`: 1-indexed line number
- `properties.severity`: `CRITICAL | HIGH | MEDIUM | LOW`
- `properties.fix`: AI-generated fix suggestion text
- `properties.framework`: Framework/standard (e.g., "SOC 2 CC6.7")

## Contributing

To contribute:
1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit your changes: `git commit -am 'Add my feature'`
3. Push to the branch: `git push origin feature/my-feature`
4. Create a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Check this README's Troubleshooting section
- Review the Output panel logs
- Open an issue on GitHub

---

**Built by Person 2 for the Hackathon 2.0 Project**
