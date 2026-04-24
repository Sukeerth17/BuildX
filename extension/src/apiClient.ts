import axios, { AxiosInstance } from 'axios';
import { OutputChannel } from 'vscode';
import * as vscode from 'vscode';
import { DashboardData } from './types';

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
            'apiBaseUrl',
            'http://localhost:5000'
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

            const response = await this.client.get<DashboardData>('/api/compliance/dashboard');

            if (response.status === 200 && response.data) {
                this.outputChannel.appendLine(`[ApiClient] Successfully fetched dashboard data`);
                return response.data;
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

            const response = await this.client.get<{ scans: any[] }>('/api/compliance/scans/recent');

            if (response.status === 200 && response.data && Array.isArray(response.data.scans)) {
                this.outputChannel.appendLine(
                    `[ApiClient] Fetched ${response.data.scans.length} recent scans`
                );
                return response.data.scans;
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
        filePath: string,
        findings: number,
        severity: string
    ): Promise<boolean> {
        try {
            this.outputChannel.appendLine('[ApiClient] Reporting scan...');

            const response = await this.client.post('/api/compliance/scans/report', {
                filePath,
                findings,
                severity,
                timestamp: new Date().toISOString(),
            });

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
}
