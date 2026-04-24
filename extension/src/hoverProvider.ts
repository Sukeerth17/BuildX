import * as vscode from 'vscode';
import { DiagnosticProvider } from './diagnosticProvider';

/**
 * HoverProvider: Shows tooltips when hovering over a diagnostic.
 * Displays the issue description and fix suggestion.
 */
export class HoverProvider implements vscode.HoverProvider {
    private diagnosticProvider: DiagnosticProvider;

    constructor(diagnosticProvider: DiagnosticProvider) {
        this.diagnosticProvider = diagnosticProvider;
    }

    /**
     * Provide hover information for a position in a document.
     * @param document - The document
     * @param position - The cursor position
     * @returns Hover content
     */
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.ProviderResult<vscode.Hover> {
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const results = this.diagnosticProvider.getResults(document.fileName);

        // Find diagnostics at this position
        const relevantDiagnostics = diagnostics.filter(
            (diag) => diag.range.contains(position) && diag.source === 'ComplianceAI'
        );

        if (relevantDiagnostics.length === 0) {
            return null;
        }

        const markdownContents: vscode.MarkdownString[] = [];

        for (const diagnostic of relevantDiagnostics) {
            const scanResult = results.find(
                (r) => r.ruleId === diagnostic.code && r.line === position.line + 1
            );

            if (!scanResult) {
                continue;
            }

            const markdown = new vscode.MarkdownString();
            markdown.isTrusted = true;

            // Header: Rule ID and message
            markdown.appendMarkdown(`### ${scanResult.ruleId}: ${scanResult.message}\n\n`);

            // Severity + Scanner attribution (USP 1)
            markdown.appendMarkdown(
                `**Severity:** ${this.getSeverityBadge(scanResult.severity)}  |  **Scanner:** \`${(scanResult as any).scanner || 'unknown'}\`\n\n`
            );

            // Compliance framework (USP 2)
            markdown.appendMarkdown(`**Framework:** \`${scanResult.framework || 'N/A'}\`\n\n`);

            // USP 3: Plain English explanation
            const plainEnglish = (scanResult as any).plainEnglish;
            if (plainEnglish) {
                markdown.appendMarkdown(`---\n\n**💡 What this means:**\n\n${plainEnglish}\n\n`);
            }

            // Fix suggestion
            markdown.appendMarkdown(`---\n\n**🔧 How to fix it:**\n\n${scanResult.fix || '_No fix suggestion available._'}\n\n`);

            markdown.appendMarkdown(
                `[Learn more](https://github.com/Sukeerith17/BuildX) • [Apply Fix](command:complianceai.applyFix?${encodeURIComponent(JSON.stringify({ line: position.line, ruleId: scanResult.ruleId }))})`
            );

            markdownContents.push(markdown);
        }

        return markdownContents.length > 0 ? new vscode.Hover(markdownContents) : null;
    }

    /**
     * Get a severity badge for display.
     */
    private getSeverityBadge(severity: string): string {
        switch (severity.toUpperCase()) {
            case 'CRITICAL':
                return '🔴 **CRITICAL**';
            case 'HIGH':
                return '🟠 **HIGH**';
            case 'MEDIUM':
                return '🟡 **MEDIUM**';
            case 'LOW':
                return '🟢 **LOW**';
            default:
                return `📋 ${severity}`;
        }
    }
}
