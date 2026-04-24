import * as vscode from 'vscode';
import { ApiClient } from './apiClient';
import { DashboardData } from './types';

/**
 * SidebarProvider: Manages the WebView sidebar that displays the compliance dashboard.
 * Fetches data from Person 3's backend API and renders it as HTML.
 */
export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'complianceai.sidebar';

    private view?: vscode.WebviewView;
    private apiClient: ApiClient;
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.context = context;
        this.outputChannel = outputChannel;
        this.apiClient = new ApiClient(outputChannel);
    }

    /**
     * Resolve the WebView view (called by VS Code).
     */
    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void | Thenable<void> {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri],
        };

        webviewView.webview.html = this.getHtml();

        // Refresh data when the view becomes visible
        webviewView.onDidChangeVisibility(async () => {
            if (webviewView.visible) {
                await this.refresh();
            }
        });

        // Handle messages from the WebView
        webviewView.webview.onDidReceiveMessage((message) => {
            if (message.command === 'refresh') {
                this.refresh();
            } else if (message.command === 'scan') {
                vscode.commands.executeCommand('complianceai.scan');
            }
        });

        // Initial data load
        this.refresh();
    }

    /**
     * Refresh the dashboard with latest data.
     */
    async refresh(): Promise<void> {
        if (!this.view) {
            return;
        }

        try {
            this.outputChannel.appendLine('[Sidebar] Fetching dashboard data...');

            const data = await this.apiClient.getDashboardData();

            if (data) {
                this.updateWebView(data);
            } else {
                this.showError('Failed to fetch dashboard data. Is the backend running?');
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.outputChannel.appendLine(`[Sidebar] Error: ${errorMsg}`);
            this.showError(`Error: ${errorMsg}`);
        }
    }

    /**
     * Update the WebView with new data.
     */
    private updateWebView(data: DashboardData): void {
        if (!this.view) {
            return;
        }

        const html = this.getDashboardHtml(data);
        this.view.webview.html = html;
    }

    /**
     * Show an error message in the WebView.
     */
    private showError(message: string): void {
        if (!this.view) {
            return;
        }

        this.view.webview.html = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 16px; }
        .error { color: #f44747; }
        .info { color: #999; font-size: 12px; margin-top: 8px; }
      </style>
      <div class="error">⚠️ ${message}</div>
      <div class="info">Check that:</div>
      <ul class="info">
        <li>Person 3's backend is running</li>
        <li>API URL is configured correctly in settings</li>
        <li>The extension has internet access</li>
      </ul>
    `;
    }

    /**
     * Get the base HTML structure of the sidebar.
     */
    private getHtml(): string {
        return `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 16px;
          color: #e0e0e0;
          background: var(--vscode-editor-background);
        }
        .container { max-width: 400px; }
        h2 { margin: 16px 0 8px; font-size: 16px; }
        .score-display {
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          margin: 16px 0;
          color: #4ec9b0;
        }
        .findings {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 16px 0;
        }
        .finding-item {
          padding: 12px;
          border-radius: 4px;
          background: var(--vscode-editor-lineHighlightBackground);
          text-align: center;
        }
        .finding-count { font-size: 20px; font-weight: bold; }
        .finding-label { font-size: 12px; color: #999; margin-top: 4px; }
        .critical { border-left: 4px solid #f44747; }
        .high { border-left: 4px solid #ff8800; }
        .medium { border-left: 4px solid #ffcc00; }
        .low { border-left: 4px solid #00ff00; }
        button {
          width: 100%;
          padding: 8px;
          margin: 8px 0;
          border: 1px solid var(--vscode-button-border);
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          cursor: pointer;
          border-radius: 4px;
          font-size: 13px;
        }
        button:hover { background: var(--vscode-button-hoverBackground); }
        .loading { text-align: center; color: #999; }
        .spinner { animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      </style>
      <div class="container">
        <div class="loading">
          <div class="spinner">⏳</div>
          <p>Loading dashboard...</p>
        </div>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        vscode.postMessage({ command: 'refresh' });
      </script>
    `;
    }

    /**
     * Get the dashboard HTML with data.
     */
    private getDashboardHtml(data: DashboardData): string {
        const f = data.findings;
        const topFindings = data.topFindings ?? [];
        const timestamp = new Date().toLocaleTimeString();
        const topFindingsHtml = topFindings.length
            ? topFindings
                  .map(
                      (finding) => `
          <li class="top-finding">
            <span class="sev ${finding.severity.toLowerCase()}">${finding.severity}</span>
            <span class="msg">${finding.message}</span>
            <span class="meta">${finding.filePath ?? ''}${finding.lineNumber ? `:${finding.lineNumber}` : ''}</span>
          </li>
          `
                  )
                  .join('')
            : '<li class="empty">No open findings right now.</li>';

        return `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 16px;
          color: #e0e0e0;
          background: var(--vscode-editor-background);
        }
        .container { max-width: 400px; }
        h2 { margin: 16px 0 8px; font-size: 16px; }
        .score-display {
          font-size: 48px;
          font-weight: bold;
          text-align: center;
          margin: 16px 0;
          color: ${data.overallScore >= 80 ? '#00ff00' : data.overallScore >= 60 ? '#ffcc00' : '#ff4444'};
        }
        .findings {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 16px 0;
        }
        .finding-item {
          padding: 12px;
          border-radius: 4px;
          background: var(--vscode-editor-lineHighlightBackground);
          text-align: center;
        }
        .finding-count { font-size: 20px; font-weight: bold; }
        .finding-label { font-size: 12px; color: #999; margin-top: 4px; }
        .critical { border-left: 4px solid #f44747; }
        .high { border-left: 4px solid #ff8800; }
        .medium { border-left: 4px solid #ffcc00; }
        .low { border-left: 4px solid #00ff00; }
        .top-findings { margin-top: 12px; list-style: none; padding: 0; display: grid; gap: 8px; }
        .top-finding { padding: 8px; border: 1px solid var(--vscode-panel-border); border-radius: 6px; display: grid; gap: 3px; }
        .top-finding .msg { font-size: 12px; }
        .top-finding .meta { font-size: 11px; color: #888; }
        .sev { font-size: 10px; font-weight: 600; letter-spacing: 0.3px; }
        .sev.critical { color: #f44747; }
        .sev.high { color: #ff8800; }
        .sev.medium { color: #ffcc00; }
        .sev.low { color: #4ec9b0; }
        .empty { color: #888; font-size: 12px; }
        button {
          width: 100%;
          padding: 8px;
          margin: 8px 0;
          border: 1px solid var(--vscode-button-border);
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          cursor: pointer;
          border-radius: 4px;
          font-size: 13px;
        }
        button:hover { background: var(--vscode-button-hoverBackground); }
        .last-updated { font-size: 11px; color: #666; margin-top: 12px; }
      </style>
      <div class="container">
        <h2>Compliance Score</h2>
        <div class="score-display">${data.overallScore}%</div>

        <h2>Findings</h2>
        <div class="findings">
          <div class="finding-item critical">
            <div class="finding-count">${f.critical}</div>
            <div class="finding-label">Critical</div>
          </div>
          <div class="finding-item high">
            <div class="finding-count">${f.high}</div>
            <div class="finding-label">High</div>
          </div>
          <div class="finding-item medium">
            <div class="finding-count">${f.medium}</div>
            <div class="finding-label">Medium</div>
          </div>
          <div class="finding-item low">
            <div class="finding-count">${f.low}</div>
            <div class="finding-label">Low</div>
          </div>
        </div>

        <h2>Top Open Findings</h2>
        <ul class="top-findings">
          ${topFindingsHtml}
        </ul>

        <button onclick="scan()">🔍 Scan Current File</button>
        <button onclick="refresh()">🔄 Refresh Dashboard</button>

        <div class="last-updated">Last updated: ${timestamp}</div>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        function scan() {
          vscode.postMessage({ command: 'scan' });
        }
        function refresh() {
          vscode.postMessage({ command: 'refresh' });
        }
      </script>
    `;
    }
}
