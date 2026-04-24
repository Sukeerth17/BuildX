import axios, { AxiosInstance } from 'axios';
import { OutputChannel } from 'vscode';
import * as vscode from 'vscode';
import { BackendFinding, DashboardData, TopFinding } from './types';

/**
 * ApiClient: Communicates with Person 3's dashboard backend.
 * Fetches compliance scores, trends, and recent scan data.
 */
export class ApiClient {
    private client: AxiosInstance;
    private outputChannel: OutputChannel;

    constructor(outputChannel: OutputChannel) {
        this.outputChannel = outputChannel;

        const baseUrl = vscode.workspace.getConfiguration('complianceai').get<string>(
            'backendUrl',
            'http://localhost:8000'
        );

        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.outputChannel.appendLine(`[ApiClient] Initialized with baseURL: ${baseUrl}`);
    }

    /**
     * Fetch the dashboard data from the backend.
     * @returns DashboardData object or null if failed
     */
    async getDashboardData(): Promise<DashboardData | null> {
        try {
            this.outputChannel.appendLine('[ApiClient] Fetching dashboard data...');

            const [summaryResponse, findingsResponse] = await Promise.all([
                this.client.get<{ critical: number; high: number; medium: number; low: number; pass_rate: number }>(
                    '/api/v1/findings/summary'
                ),
                this.client.get<BackendFinding[]>('/api/v1/findings'),
            ]);

            if (summaryResponse.status === 200 && findingsResponse.status === 200) {
                const summary = summaryResponse.data;
                const findings = findingsResponse.data ?? [];
                const recentOpenFindings = findings
                    .filter((finding) => finding.status === 'open')
                    .slice(0, 3);

                const dashboardData: DashboardData = {
                    overallScore: summary.pass_rate,
                    findings: {
                        critical: summary.critical,
                        high: summary.high,
                        medium: summary.medium,
                        low: summary.low,
                    },
                    recentScans: findings.slice(0, 10).map((finding) => ({
                        timestamp: finding.created_at,
                        fileName: finding.file_path,
                        issueCount: 1,
                        maxSeverity: finding.severity,
                    })),
                    topFindings: recentOpenFindings.map<TopFinding>((finding) => ({
                        id: finding.id,
                        repo: finding.repo,
                        filePath: finding.file_path,
                        lineNumber: finding.line_number,
                        message: finding.message,
                        severity: finding.severity,
                    })),
                };

                this.outputChannel.appendLine(
                    `[ApiClient] Dashboard loaded. summary + ${findings.length} findings`
                );
                return dashboardData;
            }

            return null;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    this.outputChannel.appendLine(
                        '[ApiClient] ❌ Connection refused. Is the backend running?'
                    );
                } else if (error.response) {
                    this.outputChannel.appendLine(
                        `[ApiClient] API error: ${error.response.status} ${error.response.statusText}`
                    );
                } else {
                    this.outputChannel.appendLine(`[ApiClient] Request error: ${error.message}`);
                }
            } else {
                this.outputChannel.appendLine(`[ApiClient] Unexpected error: ${error}`);
            }
            return null;
        }
    }

    /**
     * Fetch recent scans from the backend.
     * @returns Array of recent scan records
     */
    async getRecentScans(): Promise<any[]> {
        try {
            this.outputChannel.appendLine('[ApiClient] Fetching recent scans...');

            const response = await this.client.get<BackendFinding[]>('/api/v1/findings');

            if (response.status === 200 && Array.isArray(response.data)) {
                const scans = response.data.slice(0, 20).map((finding) => ({
                    timestamp: finding.created_at,
                    fileName: finding.file_path,
                    issueCount: 1,
                    maxSeverity: finding.severity,
                }));
                this.outputChannel.appendLine(
                    `[ApiClient] Fetched ${scans.length} recent scans`
                );
                return scans;
            }

            return [];
        } catch (error) {
            this.outputChannel.appendLine(`[ApiClient] Error fetching recent scans: ${error}`);
            return [];
        }
    }

    /**
     * Report a scan result to the backend.
     * @param filePath - File that was scanned
     * @param findings - Number of findings
     * @param severity - Highest severity found
     * @returns Success or failure
     */
    async reportScan(
        findingsSarif: Record<string, unknown>,
        commitSha = 'local-scan'
    ): Promise<boolean> {
        const token = this.getJwtToken();
        if (!token) {
            this.outputChannel.appendLine(
                '[ApiClient] JWT token missing. Skipping findings upload to backend.'
            );
            return false;
        }

        try {
            this.outputChannel.appendLine('[ApiClient] Reporting scan...');

            const response = await this.client.post(
                '/api/v1/findings',
                {
                    commit_sha: commitSha,
                    ...findingsSarif,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 201 || response.status === 200) {
                this.outputChannel.appendLine('[ApiClient] Scan report submitted successfully');
                return true;
            }

            return false;
        } catch (error) {
            this.outputChannel.appendLine(`[ApiClient] Error reporting scan: ${error}`);
            return false;
        }
    }

    private getJwtToken(): string {
        return (
            vscode.workspace.getConfiguration('complianceai').get<string>('jwtToken', '').trim()
        );
    }
}
