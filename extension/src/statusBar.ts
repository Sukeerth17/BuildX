import * as vscode from 'vscode';
import { ComplianceScore } from './types';

/**
 * StatusBarManager: Manages the compliance score badge in the VS Code status bar.
 * Shows the current compliance status and allows quick access to the dashboard.
 */
export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private privacyBadge: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.name = 'ComplianceAI';
        this.statusBarItem.command = 'complianceai.showDashboard';
        this.statusBarItem.show();
        this.setIdle();

        // USP 4: Permanent air-gap privacy indicator
        this.privacyBadge = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            99
        );
        this.privacyBadge.name = 'ComplianceAI Privacy';
        this.privacyBadge.text = '$(lock) Air-Gapped';
        this.privacyBadge.tooltip = 'ComplianceAI: Your code never leaves this machine. All AI runs locally via Ollama.';
        this.privacyBadge.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
        this.privacyBadge.show();
    }

    /**
     * Show a loading state while scanning.
     */
    setLoading(): void {
        this.statusBarItem.text = '$(sync~spin) ComplianceAI: Scanning...';
        this.statusBarItem.color = undefined;
    }

    /**
     * Update the status bar with compliance scores.
     * @param score - Compliance score breakdown
     */
    setStatus(score: ComplianceScore): void {
        const total = score.critical + score.high + score.medium + score.low;

        // Determine overall color based on severity
        let color: string | undefined;
        if (score.critical > 0) {
            color = 'rgb(255, 0, 0)'; // Red for critical
        } else if (score.high > 0) {
            color = 'rgb(255, 165, 0)'; // Orange for high
        } else if (score.medium > 0) {
            color = 'rgb(255, 255, 0)'; // Yellow for medium
        } else if (score.low > 0) {
            color = 'rgb(0, 255, 0)'; // Green for low only
        }

        // Build status text with emoji indicators
        let statusText = 'ComplianceAI: ';
        if (total === 0) {
            statusText += '✅ All Clear';
        } else {
            const parts = [];
            if (score.critical > 0) {
                parts.push(`🔴 ${score.critical} Critical`);
            }
            if (score.high > 0) {
                parts.push(`🟠 ${score.high} High`);
            }
            if (score.medium > 0) {
                parts.push(`🟡 ${score.medium} Medium`);
            }
            if (score.low > 0) {
                parts.push(`🟢 ${score.low} Low`);
            }
            statusText += parts.join(' | ');
        }

        this.statusBarItem.text = statusText;
        this.statusBarItem.color = color;
    }

    /**
     * Show an idle state (no active scan).
     */
    setIdle(): void {
        this.statusBarItem.text = '$(circle-large-filled) ComplianceAI: Ready';
        this.statusBarItem.color = undefined;
    }

    /**
     * Show an error state.
     */
    setError(): void {
        this.statusBarItem.text = '$(error) ComplianceAI: Error';
        this.statusBarItem.color = 'rgb(255, 0, 0)';
    }

    /**
     * Dispose of the status bar item.
     */
    dispose(): void {
        this.statusBarItem.dispose();
        this.privacyBadge.dispose();
    }
}
