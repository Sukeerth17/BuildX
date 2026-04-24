# compliance-cli

`compliance-cli` is a local-first security scanning command-line tool that runs multiple security scanners against a single target, normalizes their findings, optionally enriches them with local AI triage, emits SARIF or text output, and can forward SARIF results to a dashboard backend.

This repository currently packages the CLI layer and scanner adapters for:

- SAST with Bandit and Semgrep
- Secrets detection with Gitleaks
- Dependency and filesystem scanning with Trivy
- IaC scanning with tfsec and Checkov
- Kubernetes-focused scanning with kube-hunter
- AI-assisted triage through a local Ollama endpoint

The code is designed around a "single command, many scanners" workflow:

1. You pass one target with `scan --file ...`.
2. The CLI fans that target out to every configured scanner concurrently.
3. Findings are normalized into one internal schema.
4. AI triage adds plain-English explanations, framework mappings, and fix suggestions.
5. Findings are emitted as SARIF or text.
6. SARIF output is optionally POSTed to a dashboard service.

## What This Project Does Today

Implemented behavior in the current codebase:

- One CLI group with one command: `scan`
- Concurrent execution of seven scanner adapters
- Text output for terminal-friendly review
- SARIF 2.1.0 JSON output to stdout
- CI mode that exits non-zero when `HIGH` or `CRITICAL` findings exist
- Local AI enrichment through `http://localhost:11434/api/generate`
- Graceful degradation when optional scanners or services are unavailable
- Optional dashboard submission to `http://localhost:8000/api/v1/findings`

Important current limitations:

- `requirements.txt` contains runtime dependencies that are not fully mirrored in `setup.py`
- Configuration is loaded from `.compliance.yml`, but the loaded values are not yet enforced in the scan pipeline
- `accepted_risks.json` exists, but accepted-risk suppression is not currently applied
- The single `--file` argument is forwarded to every scanner, even though some tools are better suited to directories, repos, images, or cluster targets
- CLI startup imports all modules eagerly, so missing Python dependencies can prevent even `--help` from running

## Repository Layout

```text
.
|-- README.md
|-- main.py
|-- setup.py
|-- requirements.txt
|-- config.py
|-- ai_triage.py
|-- api_sender.py
|-- framework_map.py
|-- sarif_writer.py
|-- accepted_risks.json
|-- example.py
|-- example_vulnerable.py
|-- example_sarif_output.json
`-- scanners/
    |-- __init__.py
    |-- bandit_runner.py
    |-- checkov_runner.py
    |-- gitleaks_runner.py
    |-- kube_runner.py
    |-- semgrep_runner.py
    |-- tfsec_runner.py
    `-- trivy_runner.py
```

High-level module responsibilities:

- `main.py`: Click-based entrypoint and scan orchestration
- `scanners/*.py`: One adapter per scanner, each returning findings in a shared internal format
- `ai_triage.py`: Local AI enrichment and false-positive filtering
- `sarif_writer.py`: Conversion from internal findings into SARIF 2.1.0
- `api_sender.py`: Optional POST to a dashboard service
- `config.py`: Loads `.compliance.yml` with defaults
- `framework_map.py`: Deterministic compliance fallback mapping when AI enrichment does not provide one

## Prerequisites

### Python

Use a dedicated virtual environment. Python 3.11 is a safe baseline for this project layout.

### External CLI tools

Some scanners are Python packages, but others must already exist on your `PATH`:

- `bandit`
- `semgrep`
- `checkov`
- `kube-hunter`
- `trivy`
- `tfsec`
- `gitleaks`
- `git` (used to attach `commit_sha` when sending results to the dashboard)

If a scanner executable is missing, that adapter logs an error to stderr and returns no findings instead of crashing the whole scan.

### Optional local services

These are not required for the CLI to run, but they enable richer behavior:

- Ollama at `http://localhost:11434`
- A local Ollama model named `llama3.1:8b`
- Dashboard API at `http://localhost:8000/api/v1/findings`

## Installation

### 1. Create and activate a virtual environment

```bash
python3.11 -m venv .venv
source .venv/bin/activate
```

If `python3.11` is not available on your machine, use the Python 3 interpreter your environment standardizes on.

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

This step is important. The editable package metadata in `setup.py` currently includes only a subset of runtime dependencies, while `requirements.txt` includes additional packages such as `requests` and `aiohttp` that are needed by `api_sender.py` and `ai_triage.py`.

### 3. Optionally install the console script

```bash
pip install -e .
```

After that, you can use either:

```bash
python main.py scan --help
```

or:

```bash
compliance-cli scan --help
```

### 4. Install non-Python scanner binaries

The repo does not vendor installers for `trivy`, `tfsec`, or `gitleaks`. Install them separately using your platform's preferred package manager and verify they resolve on `PATH`.

## Quick Start

### Show command help

```bash
python main.py scan --help
```

### Scan the intentionally vulnerable example file

```bash
python main.py scan --file example_vulnerable.py --format text
```

### Emit SARIF to stdout

```bash
python main.py scan --file example_vulnerable.py
```

### Run in CI mode

```bash
python main.py scan --file example_vulnerable.py --ci
echo $?
```

On the sample vulnerable file, Bandit should be able to flag issues associated with:

- `B602`: shell invocation with `shell=True`
- `B303`: weak MD5 hashing
- `B105`: hardcoded password material
- `B101`: use of `assert` in security-sensitive logic

## Command Reference

The CLI currently exposes a single command:

```bash
compliance-cli scan --file PATH [--format sarif|text] [--ci]
```

### Options

- `--file`, `-f`, `-file`
  Path to the target passed to every scanner adapter.

- `--format`
  Output format. Supported values:
  - `sarif` (default): prints SARIF JSON to stdout and then attempts dashboard submission
  - `text`: prints one line per finding to stderr

- `--ci`
  When enabled, the command exits with status code `1` if any finding has severity `HIGH` or `CRITICAL`. Otherwise it exits `0`.

### Output behavior

The current implementation uses stdout and stderr differently:

- Progress messages are written to stderr
- Text findings are written to stderr
- SARIF JSON is written to stdout
- Dashboard submission logs are printed as plain terminal messages

That split matters if you are piping SARIF into another tool or capturing output in CI.

## Scan Pipeline

The runtime flow in `main.py` is:

1. Print a scan banner
2. Load configuration from `.compliance.yml`
3. Run all scanner adapters concurrently with `asyncio.gather(...)`
4. Merge every adapter's normalized findings into one list
5. Send each finding through AI triage
6. Drop findings marked as false positives by AI triage
7. Write SARIF or text output
8. If SARIF mode is active, POST the SARIF payload to the dashboard backend
9. If CI mode is active, exit non-zero on `HIGH` or `CRITICAL`

## Scanner Matrix

| Scanner | Adapter | Current invocation style | Typical use case | Notes |
| --- | --- | --- | --- | --- |
| Bandit | `run_bandit` | `bandit -f json -q <file>` | Python SAST | Only runs when the target ends with `.py` |
| Trivy | `run_trivy` | `trivy fs --format json -q <target>` | Filesystem and dependency scanning | Works best on directories or repos, but receives the same `--file` target as every other scanner |
| tfsec | `run_tfsec` | `tfsec <target> --format json` | Terraform and IaC scanning | Best suited to Terraform directories |
| Gitleaks | `run_gitleaks` | `gitleaks detect --source <target> ...` | Secrets scanning | Writes `gitleaks-report.json` to the current working directory, then removes it |
| Semgrep | `run_semgrep` | `semgrep scan --config=auto --json -q <target>` | SAST and code pattern scanning | Severity is normalized from Semgrep's native levels |
| Checkov | `run_checkov` | `checkov -f <target> -o json --quiet` | IaC scanning | Defaults severity to `HIGH` because severity is not always present |
| kube-hunter | `run_kube_hunter` | `kube-hunter --remote <target> --report json` | Kubernetes exposure scanning | Semantically expects a remote target; the current CLI still forwards the `--file` value |

## Internal Finding Schema

Every scanner adapter returns findings in a shared dictionary shape that looks like this:

```python
{
    "rule_id": "B105",
    "message": "Possible hardcoded password",
    "file_path": "example_vulnerable.py",
    "line_number": 14,
    "severity": "HIGH",
    "fix_suggestion": "",
    "framework": "",
    "scanner": "bandit",
}
```

After AI triage, findings may also include:

- `plain_english_explanation`
- `is_false_positive`
- `false_positive_reason`

## AI Triage

`ai_triage.py` sends each normalized finding to a local Ollama endpoint:

- URL: `http://localhost:11434/api/generate`
- Model: `llama3.1:8b`
- Timeout: 15 seconds per request
- Transport: local HTTP only

The enrichment step asks the model to return structured JSON with:

- whether the finding is a false positive
- a plain-English explanation
- a compliance or framework mapping
- a concrete fix suggestion

If the AI call fails because Ollama is offline, slow, or returns invalid JSON:

- the scan continues
- the finding is kept
- `is_false_positive` falls back to `False`
- framework mapping falls back to deterministic rules in `framework_map.py`

False-positive handling today:

- Findings marked `is_false_positive=True` by AI triage are removed from the final output
- A count of excluded findings is logged to stderr

## SARIF Output

SARIF is generated in `sarif_writer.py` and returned as a formatted JSON string.

The current contract is centered on:

- `runs[0].results`
- `ruleId`
- `message.text`
- `locations[0].physicalLocation.artifactLocation.uri`
- `locations[0].physicalLocation.region.startLine`
- `properties.severity`
- `properties.fix`
- `properties.framework`
- `properties.scanner`
- `properties.plain_english`
- `properties.is_false_positive`

Example command:

```bash
python main.py scan --file example_vulnerable.py --format sarif > findings.sarif.json
```

Note that dashboard submission is also attempted in default SARIF mode. If you want human-readable terminal output without dashboard POST behavior, use `--format text`.

## Dashboard Submission

When output format is `sarif`, `api_sender.py` attempts to POST the generated payload to:

```text
http://localhost:8000/api/v1/findings
```

Behavior details:

- Request body starts as the SARIF JSON object
- A `commit_sha` field is appended before sending
- `commit_sha` is read from `git rev-parse HEAD`
- If Git metadata is unavailable, `commit_sha` becomes `"unknown"`
- If `COMPLIANCE_TOKEN` is set, it is sent as `Authorization: Bearer <token>`
- Network errors are logged as warnings and do not crash the scan

### Environment variable

```bash
export COMPLIANCE_TOKEN=your-token-here
```

## Configuration

Configuration is loaded from a `.compliance.yml` file in the current working directory.

Current defaults from `config.py`:

```yaml
severity_threshold: LOW
ignored_rules: []
accepted_risks_file: cli/accepted_risks.json
```

Example config:

```yaml
severity_threshold: MEDIUM
ignored_rules:
  - B101
  - CKV_AWS_20
accepted_risks_file: cli/accepted_risks.json
```

### Current implementation status

The config file is parsed successfully, but those settings are not yet applied to filter or suppress findings in `main.py`. In other words:

- `severity_threshold` is not currently enforcing a minimum reported severity
- `ignored_rules` is not currently removing matching findings
- `accepted_risks_file` is not currently used to suppress accepted items

This is an important behavior gap to keep in mind if you are integrating the CLI into CI or relying on policy controls.

## Accepted Risks

The repository includes an `accepted_risks.json` file with entries shaped like:

```json
[
  {
    "rule_id": "B101",
    "file_path": "tests/test_example.py",
    "reason": "assert statements are expected in test files",
    "accepted_by": "admin",
    "accepted_at": "2026-04-01"
  }
]
```

At the moment, this file is documentation and sample data only. The scan pipeline does not read it during result filtering.

## Severity Handling

Severity normalization is adapter-specific:

- Bandit severities are mapped directly into `LOW`, `MEDIUM`, `HIGH`
- Semgrep maps `INFO -> LOW`, `WARNING -> MEDIUM`, `ERROR -> HIGH`
- Gitleaks findings are forced to `CRITICAL`
- Checkov findings default to `HIGH`
- Trivy, tfsec, and kube-hunter largely pass through their reported severities

CI mode treats both `HIGH` and `CRITICAL` as failing severities.

## Troubleshooting

### `ModuleNotFoundError: No module named 'aiohttp'`

Install the full dependency set:

```bash
pip install -r requirements.txt
```

This can happen even if you already ran `pip install -e .`, because `setup.py` does not currently include every runtime dependency used by the codebase.

### `bandit`, `trivy`, `tfsec`, `gitleaks`, or another scanner is not installed

Install the missing tool and make sure it is on your `PATH`. The CLI will otherwise skip that scanner and continue.

### No AI explanations or fix suggestions appear

Check that:

- Ollama is running locally
- `llama3.1:8b` is available
- `http://localhost:11434/api/generate` is reachable

If Ollama is unavailable, the scan still works, but AI-enriched fields may be empty and framework mapping will rely on deterministic fallback logic.

### Dashboard submission warnings appear

This is non-fatal. Verify that:

- the backend is listening on `localhost:8000`
- your token, if required, is present in `COMPLIANCE_TOKEN`
- your environment permits local HTTP requests

### `scan --help` fails before showing help

The CLI imports all dependencies at startup. If one required Python package is missing, Click never gets a chance to render help text. Install the Python requirements first.

## Development Notes

If you want to add another scanner adapter, the current pattern is:

1. Create a new module under `scanners/`
2. Return findings in the shared internal dictionary format
3. Import and schedule the adapter in `main.py`
4. Keep output compatible with `sarif_writer.py`
5. Add deterministic framework fallbacks in `framework_map.py` if useful

Areas that would improve the project significantly:

- apply `.compliance.yml` policy controls during result filtering
- use accepted-risk suppression before output generation
- split target types into `--file`, `--dir`, `--image`, or `--cluster` instead of forwarding one value to every scanner
- defer optional imports so `--help` works even in partially configured environments
- make dashboard submission configurable rather than coupled to SARIF mode
- expand test coverage for parser edge cases and scanner failures

## Example Developer Workflow

```bash
# 1. Set up the environment
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Optionally install the console entry point
pip install -e .

# 3. Run a local scan
python main.py scan --file example_vulnerable.py --format text

# 4. Produce SARIF for downstream tooling
python main.py scan --file example_vulnerable.py > findings.sarif.json

# 5. Fail the build on serious findings
python main.py scan --file example_vulnerable.py --ci
```

## Summary

`compliance-cli` already has the core shape of a useful local security aggregation CLI:

- multiple scanner adapters
- one normalized finding model
- optional AI-assisted explanations
- SARIF output for downstream systems
- CI-friendly exit behavior

The biggest gap right now is not scanning breadth, but policy enforcement and operational polish. The README intentionally calls those gaps out so users know exactly what is production-ready, what is optional, and what still needs implementation.
