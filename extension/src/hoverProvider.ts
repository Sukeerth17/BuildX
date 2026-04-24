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

            // Build hover content
            markdown.appendMarkdown(`### ${scanResult.ruleId}: ${scanResult.message}\n\n`);
            markdown.appendMarkdown(`**Severity:** ${this.getSeverityBadge(scanResult.severity)}\n\n`);
            markdown.appendMarkdown(`**Framework:** \`${scanResult.framework}\`\n\n`);
            markdown.appendMarkdown(`### Fix Suggestion\n\n`);
            markdown.appendMarkdown(`${scanResult.fix}\n\n`);
            markdown.appendMarkdown(
                `[Learn more](https://github.com/Sukeerth17/BuildX) • [Apply Fix](command:complianceai.applyFix?${encodeURIComponent(JSON.stringify({ line: position.line, ruleId: scanResult.ruleId }))})`
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
