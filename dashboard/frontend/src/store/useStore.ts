import { create } from "zustand";

export interface ComplianceMapping {
  framework: string;
  control: {
    clause: string;
    excerpt: string;
    rationale: string;
  };
  confidence: number;
}

export interface Finding {
  id: number;
  repo: string;
  file_path: string;
  line_number: number;
  rule_id: string;
  severity: string;
  message: string;
  fix_suggestion: string;
  framework: string;
  category: string;
  mapped_frameworks: string[];
  compliance_mappings: ComplianceMapping[];
  risk_score: number;
  risk_justification: string;
  commit_sha: string;
  status: string;
  created_at: string;
  scanner?: string;
  plain_english?: string;
  is_false_positive?: number;
}

export interface Summary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  pass_rate: number;
}

export interface TrendPoint {
  date: string;
  pass_rate: number;
}

export interface FrameworkScores {
  [key: string]: number;
}

interface AppStore {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;

  findings: Finding[];
  summary: Summary | null;
  trend: TrendPoint[];
  frameworks: FrameworkScores | null;

  setFindings: (f: Finding[]) => void;
  addFinding: (f: Finding) => void;
  setSummary: (s: Summary) => void;
  setTrend: (t: TrendPoint[]) => void;
  setFrameworks: (f: FrameworkScores) => void;
  updateFindingOptimistically: (id: number, status: string) => void;
}

const isBrowser = typeof window !== "undefined";

export const useStore = create<AppStore>((set) => ({
  token: isBrowser ? localStorage.getItem("compliance_token") : null,
  setToken: (token) => {
    if (isBrowser) localStorage.setItem("compliance_token", token);
    set({ token });
  },
  logout: () => {
    if (isBrowser) localStorage.removeItem("compliance_token");
    set({ token: null });
  },

  findings: [],
  summary: null,
  trend: [],
  frameworks: null,

  setFindings: (findings) => set({ findings }),
  addFinding: (finding) => set((state) => ({ findings: [finding, ...state.findings] })),
  setSummary: (summary) => set({ summary }),
  setTrend: (trend) => set({ trend }),
  setFrameworks: (frameworks) => set({ frameworks }),
  updateFindingOptimistically: (id, status) =>
    set((state) => ({
      findings: state.findings.map((f) => (f.id === id ? { ...f, status } : f)),
    })),
}));
