import * as vscode from 'vscode';
import { ScanResult } from './types';

/**
 * DiagnosticProvider: Converts ScanResult objects into VS Code Diagnostics.
 * Manages the collection and publication of diagnostics to the editor.
 */
export class DiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private resultsMap: Map<string, ScanResult[]> = new Map();

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('complianceai');
    }

    /**
     * Create VS Code Diagnostic objects from scan results.
     * @param results - Array of ScanResult objects
     * @param document - The document that was scanned
     * @returns Array of VS Code Diagnostic objects
     */
    createDiagnostics(results: ScanResult[], document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

        // Store results for later lookup (used by hover provider)
        this.resultsMap.set(document.fileName, results);

        for (const result of results) {
            // VS Code uses 0-based line numbers, SARIF uses 1-based
            const lineIndex = Math.max(0, result.line - 1);
            const lineLength = document.lineAt(lineIndex).text.length;

            // Create range for the entire line
            const range = new vscode.Range(
                new vscode.Position(lineIndex, 0),
                new vscode.Position(lineIndex, lineLength)
            );

            // Determine severity level (diagnostic severity enum)
            const severity = this.mapSeverityToLevel(result.severity);

            // Create the diagnostic
            const diagnostic = new vscode.Diagnostic(
                range,
                `[${result.ruleId}] ${result.message}`,
                severity
            );

            // Add metadata for hover and code action providers
            diagnostic.code = result.ruleId;
            diagnostic.source = 'ComplianceAI';
            (diagnostic as any).scanResult = result;

            // Add clickable link to more information (optional)
            diagnostic.relatedInformation = [
                new vscode.DiagnosticRelatedInformation(
                    new vscode.Location(document.uri, range),
                    `Framework: ${result.framework}`
                ),
            ];

            diagnostics.push(diagnostic);
        }

        return diagnostics;
    }

    /**
     * Publish diagnostics for a file to VS Code.
     * @param uri - File URI
     * @param diagnostics - Array of diagnostics to publish
     */
    publishDiagnostics(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void {
        this.diagnosticCollection.set(uri, diagnostics);
    }

    /**
     * Clear all diagnostics.
     */
    clear(): void {
        this.diagnosticCollection.clear();
    }

    /**
     * Clear diagnostics for a specific file.
     * @param uri - File URI
     */
    clearFile(uri: vscode.Uri): void {
        this.diagnosticCollection.delete(uri);
    }

    /**
     * Get all stored scan results for a file.
     * @param filePath - File path
     * @returns Array of ScanResult objects
     */
    getResults(filePath: string): ScanResult[] {
        return this.resultsMap.get(filePath) || [];
    }

    /**
     * Map compliance severity level to VS Code diagnostic severity.
     */
    private mapSeverityToLevel(severity: string): vscode.DiagnosticSeverity {
        switch (severity.toUpperCase()) {
            case 'CRITICAL':
            case 'HIGH':
                return vscode.DiagnosticSeverity.Error;
            case 'MEDIUM':
                return vscode.DiagnosticSeverity.Warning;
            case 'LOW':
                return vscode.DiagnosticSeverity.Information;
            default:
                return vscode.DiagnosticSeverity.Warning;
        }
    }

    /**
     * Get the diagnostic collection.
     */
    getCollection(): vscode.DiagnosticCollection {
        return this.diagnosticCollection;
    }
}
