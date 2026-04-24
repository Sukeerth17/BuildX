import type { Finding, Summary, TrendPoint, FrameworkScores } from "../store/useStore";

// Mock data — backend (localhost:8000) is not available in preview.
// Same shape as original API contract.

const REPOS = ["payments-api", "auth-service", "web-frontend", "data-pipeline", "infra-terraform"];
const FRAMEWORKS = ["soc2", "gdpr", "hipaa", "pcidss", "owasp", "iso27001"];
const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const STATUSES = ["open", "open", "open", "fixed", "accepted"];
const RULES = [
  { id: "SEC-001", msg: "Hardcoded API key detected in source file" },
  { id: "SEC-014", msg: "Missing TLS verification on outbound HTTP client" },
  { id: "SEC-027", msg: "User input concatenated into SQL query (injection risk)" },
  { id: "PII-003", msg: "PII fields logged without redaction" },
  { id: "AUD-009", msg: "Audit log missing for privileged operation" },
  { id: "CRY-021", msg: "Weak hashing algorithm (MD5) used for passwords" },
  { id: "AUTH-012", msg: "Endpoint missing authentication middleware" },
  { id: "CFG-008", msg: "Public S3 bucket detected in IaC" },
];
const FILES = [
  "src/handlers/checkout.ts",
  "internal/auth/middleware.go",
  "app/services/user.py",
  "lib/db/queries.ts",
  "infra/s3.tf",
  "src/utils/crypto.ts",
];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = rng(42);

function makeFindings(): Finding[] {
  const out: Finding[] = [];
  const now = Date.now();
  for (let i = 0; i < 48; i++) {
    const rule = RULES[Math.floor(rand() * RULES.length)];
    const sev = SEVERITIES[Math.floor(rand() * SEVERITIES.length)];
    out.push({
      id: i + 1,
      repo: REPOS[Math.floor(rand() * REPOS.length)],
      file_path: FILES[Math.floor(rand() * FILES.length)],
      line_number: Math.floor(rand() * 280) + 1,
      rule_id: rule.id,
      severity: sev,
      message: rule.msg,
      fix_suggestion: `// Suggested fix for ${rule.id}\n// Replace insecure pattern with the secure equivalent.\nconst secret = process.env.SECRET; // load from secret manager`,
      framework: FRAMEWORKS[Math.floor(rand() * FRAMEWORKS.length)],
      commit_sha: Math.floor(rand() * 0xfffffff).toString(16).padStart(7, "0") + "abc1234",
      status: STATUSES[Math.floor(rand() * STATUSES.length)],
      created_at: new Date(now - Math.floor(rand() * 14) * 86400000).toISOString(),
    });
  }
  return out;
}

const ALL_FINDINGS = makeFindings();

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms));
}

export const login = async (username: string, _password: string) => {
  return delay({ access_token: `demo-token-${username}-${Date.now()}` }, 400);
};

export const getFindings = async (filters?: {
  severity?: string;
  status?: string;
  repo?: string;
  framework?: string;
}): Promise<Finding[]> => {
  let data = ALL_FINDINGS;
  if (filters?.severity) data = data.filter((f) => f.severity === filters.severity);
  if (filters?.status) data = data.filter((f) => f.status === filters.status);
  if (filters?.repo) data = data.filter((f) => f.repo === filters.repo);
  if (filters?.framework)
    data = data.filter((f) => f.framework.toLowerCase().includes(filters.framework!.toLowerCase()));
  return delay(data);
};

export const getSummary = async (): Promise<Summary> => {
  const s: Summary = {
    critical: ALL_FINDINGS.filter((f) => f.severity === "CRITICAL" && f.status === "open").length,
    high: ALL_FINDINGS.filter((f) => f.severity === "HIGH" && f.status === "open").length,
    medium: ALL_FINDINGS.filter((f) => f.severity === "MEDIUM" && f.status === "open").length,
    low: ALL_FINDINGS.filter((f) => f.severity === "LOW" && f.status === "open").length,
    pass_rate:
      Math.round(
        (ALL_FINDINGS.filter((f) => f.status !== "open").length / ALL_FINDINGS.length) * 1000,
      ) / 10,
  };
  return delay(s);
};

export const getTrend = async (): Promise<TrendPoint[]> => {
  const out: TrendPoint[] = [];
  const today = new Date();
  let val = 72;
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    val = Math.max(55, Math.min(96, val + (Math.random() - 0.45) * 8));
    out.push({ date: d.toISOString().split("T")[0], pass_rate: Math.round(val * 10) / 10 });
  }
  return delay(out);
};

export const getFrameworks = async (): Promise<FrameworkScores> => {
  return delay({
    soc2: 88.4,
    gdpr: 76.2,
    hipaa: 91.5,
    pcidss: 64.8,
    owasp: 82.1,
    iso27001: 79.3,
  });
};

export const getSnapshots = async () => {
  const out: any[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({
      id: i,
      snapshot_date: d.toISOString().split("T")[0],
      soc2: 85 + Math.random() * 10,
      gdpr: 70 + Math.random() * 18,
      hipaa: 85 + Math.random() * 12,
      pcidss: 60 + Math.random() * 15,
    });
  }
  return delay(out);
};

export const updateFindingStatus = async (id: number, status: string) => {
  const f = ALL_FINDINGS.find((x) => x.id === id);
  if (f) f.status = status;
  return delay({ ok: true });
};

export const generateAuditReport = async (_startDate: string, _endDate: string) => {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  const response = await fetch(`${apiBase}/api/v1/audit/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ start_date: _startDate, end_date: _endDate }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to generate report (${response.status}): ${body || response.statusText}`);
  }

  return response.blob();
};

export const streamAIChat = async function* (message: string) {
  const reply = `Based on current findings, ${message.toLowerCase().includes("gdpr") ? "GDPR posture dropped because new PII logging issues were detected in the auth-service repo." : "your top risks involve hardcoded secrets and missing authentication on internal endpoints. I recommend prioritizing CRITICAL findings in payments-api first, then rotating any leaked keys."}\n\nKey actions:\n  • Rotate exposed credentials\n  • Add auth middleware to public routes\n  • Review the 3 CRITICAL findings in payments-api`;
  for (const word of reply.split(" ")) {
    await new Promise((r) => setTimeout(r, 35));
    yield word + " ";
  }
};
