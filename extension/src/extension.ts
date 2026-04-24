import * as vscode from 'vscode';
import { Scanner } from './scanner';
import { DiagnosticProvider } from './diagnosticProvider';
import { HoverProvider } from './hoverProvider';
import { CodeActionProvider } from './codeActionProvider';
import { StatusBarManager } from './statusBar';
import { SidebarProvider } from './sidebarProvider';
import { ApiClient } from './apiClient';

let scanner: Scanner;
let diagnosticProvider: DiagnosticProvider;
let statusBarManager: StatusBarManager;
let sidebarProvider: SidebarProvider;
let apiClient: ApiClient;
let outputChannel: vscode.OutputChannel;

/**
 * Main extension activation entry point.
 * Called when VS Code activates the extension.
 */
export async function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('ComplianceAI');
    outputChannel.appendLine('ComplianceAI extension activated');

    // Initialize providers
    scanner = new Scanner(outputChannel);
    diagnosticProvider = new DiagnosticProvider();
    statusBarManager = new StatusBarManager();
    apiClient = new ApiClient(outputChannel);
    sidebarProvider = new SidebarProvider(context, outputChannel);

    // Register hover provider
    const hoverProvider = new HoverProvider(diagnosticProvider);
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(['python', 'terraform', 'yaml', 'typescript', 'javascript'], hoverProvider)
    );

    // Register code action provider
    const codeActionProvider = new CodeActionProvider(diagnosticProvider, outputChannel);
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(['python', 'terraform', 'yaml', 'typescript', 'javascript'], codeActionProvider)
    );

    // Register sidebar WebView
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider)
    );

    // File save event listener - core functionality
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async (document) => {
            const shouldAutoScan = vscode.workspace
                .getConfiguration('complianceai')
                .get<boolean>('enableAutoScan', true);

            if (!shouldAutoScan) {
                return;
            }

            const fileName = document.fileName;
            const supportedExtensions = ['.py', '.tf', '.yaml', '.yml', '.ts', '.js'];
            const isSupportedFile = supportedExtensions.some((ext) => fileName.endsWith(ext));

            if (!isSupportedFile) {
                return;
            }

            outputChannel.appendLine(`File saved: ${fileName}`);
            await handleFileScan(document, context);
        })
    );

    // File open event listener - optional: scan on open
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(async (document) => {
            const fileName = document.fileName;
            const supportedExtensions = ['.py', '.tf', '.yaml', '.yml', '.ts', '.js'];
            const isSupportedFile = supportedExtensions.some((ext) => fileName.endsWith(ext));

            if (!isSupportedFile) {
                return;
            }

            outputChannel.appendLine(`File opened: ${fileName}`);
            // Initial scan on open (optional)
            // Uncomment to enable:
            // await handleFileScan(document, context);
        })
    );

    // Register manual scan command
    context.subscriptions.push(
        vscode.commands.registerCommand('complianceai.scan', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor. Open a file and try again.');
                return;
            }

            outputChannel.appendLine(`Manual scan triggered for: ${editor.document.fileName}`);
            await handleFileScan(editor.document, context);
        })
    );

    // Register apply fix command
    context.subscriptions.push(
        vscode.commands.registerCommand('complianceai.applyFix', async (args: any) => {
            outputChannel.appendLine(`Apply fix command triggered with args: ${JSON.stringify(args)}`);
            // Implementation in codeActionProvider
        })
    );

    // Register show dashboard command
    context.subscriptions.push(
        vscode.commands.registerCommand('complianceai.showDashboard', async () => {
            outputChannel.appendLine('Show dashboard command triggered');
            await vscode.commands.executeCommand('complianceai-sidebar.focus');
        })
    );

    outputChannel.appendLine('ComplianceAI extension fully initialized');
}

/**
 * Handle the complete scan workflow for a file.
 */
async function handleFileScan(document: vscode.TextDocument, context: vscode.ExtensionContext) {
    const fileName = document.fileName;

    // Show loading state in status bar
    statusBarManager.setLoading();

    try {
        outputChannel.appendLine(`Starting scan for: ${fileName}`);

        // Run the scanner
        const results = await scanner.scanFile(fileName);

        if (!results) {
            outputChannel.appendLine('Scan returned no results');
            statusBarManager.setIdle();
            return;
        }

        outputChannel.appendLine(`Scan completed. Found ${results.length} issues`);

        // Parse and create diagnostics
        const diagnostics = diagnosticProvider.createDiagnostics(results, document);

        // Publish diagnostics to VS Code
        const collectionName = vscode.Uri.file(fileName);
        diagnosticProvider.publishDiagnostics(collectionName, diagnostics);

        // Update status bar with compliance score
        const criticalCount = results.filter((r) => r.severity === 'CRITICAL').length;
        const highCount = results.filter((r) => r.severity === 'HIGH').length;
        const mediumCount = results.filter((r) => r.severity === 'MEDIUM').length;
        const lowCount = results.filter((r) => r.severity === 'LOW').length;

        statusBarManager.setStatus({
            critical: criticalCount,
            high: highCount,
            medium: mediumCount,
            low: lowCount,
        });

        // Optional backend sync when JWT is configured.
        const reportPayload = {
            runs: [
                {
                    results: results.map((result) => ({
                        ruleId: result.ruleId,
                        message: { text: result.message },
                        locations: [
                            {
                                physicalLocation: {
                                    artifactLocation: {
                                        uri: result.filePath || fileName,
                                    },
                                    region: {
                                        startLine: result.line,
                                    },
                                },
                            },
                        ],
                        properties: {
                            severity: result.severity,
                            fix: result.fix,
                            framework: result.framework,
                        },
                    })),
                },
            ],
        };
        await apiClient.reportScan(reportPayload);

        // Refresh sidebar dashboard
        sidebarProvider.refresh();

        // Notify if critical issues found
        if (criticalCount > 0) {
            outputChannel.appendLine(`⚠️ CRITICAL ISSUES FOUND: ${criticalCount}`);
            const message = `ComplianceAI found ${criticalCount} critical issue(s). Review immediately.`;
            vscode.window.showWarningMessage(message);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        outputChannel.appendLine(`❌ Error during scan: ${errorMessage}`);
        vscode.window.showErrorMessage(`ComplianceAI Error: ${errorMessage}`);
        statusBarManager.setError();
    }
}

/**
 * Extension deactivation.
 */
export function deactivate() {
    outputChannel.appendLine('ComplianceAI extension deactivated');
    outputChannel.dispose();
}
