# Compliance CLI

The Compliance CLI is a powerful, parallelized security scanner wrapper designed to detect vulnerabilities and compliance issues across your codebase. It aggregates findings from multiple scanners (Bandit, Trivy, tfsec, Gitleaks, Semgrep, Checkov, Kube-hunter) and produces unified SARIF 2.1 output for easy consumption by dashboard and VS Code extension integrations.

## Features
- **Parallel Execution:** Runs up to 7 industry-standard scanners concurrently via `asyncio`.
- **AI Triage:** Enriches findings with AI-generated context and remediation steps using Ollama.
- **Unified Format:** Outputs findings directly in standard SARIF 2.1 JSON.
- **Backend Integration:** Automatically sends findings to the compliance dashboard API.
- **CI/CD Ready:** Includes a strict `--ci` mode that fails the build if critical vulnerabilities are found.

## Prerequisites
- Python 3.9+
- [Ollama](https://ollama.ai) (running locally for AI triage features)
- Base scanners must be installed and accessible in your PATH:
  - `bandit`
  - `trivy`
  - `tfsec`
  - `gitleaks`
  - `semgrep`
  - `checkov`
  - `kube-hunter`

## Installation

1. Navigate to the `CLI` directory.
2. Create and activate a virtual environment (recommended).
3. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

You can run the CLI against any file or directory. By default, it outputs SARIF to stdout and sends it to the configured dashboard backend.

### Standard Scan
```bash
python main.py scan --file path/to/your/code
```

### Text Output (Human Readable)
```bash
python main.py scan --file path/to/your/code --format text
```

### Pipeline (CI/CD) Mode
Use the `--ci` flag in your pipelines. This will execute the scan normally, but if any `CRITICAL` or `HIGH` severity findings are discovered, the CLI will exit with code `1`, breaking the build.

```bash
python main.py scan --file path/to/your/code --ci
```

## Environment Variables

- `COMPLIANCE_TOKEN`: A JWT token used to authenticate requests to the dashboard API backend.
- `OLLAMA_MODEL`: Override the default `llama3` model for AI Triage.
