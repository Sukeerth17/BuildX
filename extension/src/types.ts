/**
 * Common types used across the ComplianceAI extension.
 */

/**
 * Represents a single compliance finding from a scan.
 */
export interface ScanResult {
  /** Unique rule identifier (e.g., "B105") */
  ruleId: string;
  /** Human-readable description of the issue */
  message: string;
  /** Absolute file path where the issue was found */
  filePath: string;
  /** 1-indexed line number */
  line: number;
  /** Severity level: CRITICAL, HIGH, MEDIUM, LOW */
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  /** AI-generated fix suggestion */
  fix: string;
  /** Compliance framework (e.g., "OWASP A03:2021", "SOC 2 CC6.7") */
  framework: string;
}

/**
 * Status bar compliance score.
 */
export interface ComplianceScore {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/**
 * Dashboard API response from Person 3's backend.
 */
export interface DashboardData {
  /** Overall compliance percentage (0-100) */
  overallScore: number;
  /** Breakdown of findings by severity */
  findings: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  /** List of recent scans */
  recentScans: RecentScan[];
  /** Compliance trends over time */
  trends?: {
    date: string;
    score: number;
  }[];
}

/**
 * A single recent scan record.
 */
export interface RecentScan {
  /** Scan timestamp */
  timestamp: string;
  /** File that was scanned */
  fileName: string;
  /** Number of issues found */
  issueCount: number;
  /** Highest severity level found */
  maxSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}
