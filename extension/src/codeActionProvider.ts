import * as vscode from 'vscode';
import { DiagnosticProvider } from './diagnosticProvider';
import { OutputChannel } from 'vscode';

/**
 * CodeActionProvider: Shows the lightbulb "Apply Fix" action.
 * Allows users to apply AI-suggested fixes with one click.
 */
export class CodeActionProvider implements vscode.CodeActionProvider {
  private diagnosticProvider: DiagnosticProvider;
  private outputChannel: OutputChannel;

  constructor(diagnosticProvider: DiagnosticProvider, outputChannel: OutputChannel) {
    this.diagnosticProvider = diagnosticProvider;
    this.outputChannel = outputChannel;
  }

  /**
   * Provide code actions for a position in a document.
   * @param document - The document
   * @param range - The selected range
   * @param context - The code action context
   * @returns Array of code actions
   */
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const codeActions: vscode.CodeAction[] = [];

    const diagnostics = context.diagnostics.filter(
      (diag) => diag.source === 'ComplianceAI'
    );

    if (diagnostics.length === 0) {
      return codeActions;
    }

    const results = this.diagnosticProvider.getResults(document.fileName);

    for (const diagnostic of diagnostics) {
      const scanResult = results.find(
        (r) => r.ruleId === diagnostic.code && r.line === range.start.line + 1
      );

      if (!scanResult) {
        continue;
      }

      // Create "Apply Fix" code action
      const applyFixAction = new vscode.CodeAction(
        `Apply Fix: ${scanResult.ruleId}`,
        vscode.CodeActionKind.QuickFix
      );

      applyFixAction.command = {
        command: 'complianceai.applyFix',
        title: 'Apply Fix',
        arguments: [document.uri, scanResult],
      };

      applyFixAction.diagnostics = [diagnostic];
      applyFixAction.isPreferred = scanResult.severity === 'CRITICAL';

      codeActions.push(applyFixAction);

      // Create informational code action (no-op, just for context)
      const infoAction = new vscode.CodeAction(
        `Framework: ${scanResult.framework}`,
        vscode.CodeActionKind.Refactor
      );

      codeActions.push(infoAction);
    }

    return codeActions;
  }

  /**
   * Resolve a code action (optional, for performance).
   */
  resolveCodeAction?(
    codeAction: vscode.CodeAction
  ): vscode.ProviderResult<vscode.CodeAction> {
    return codeAction;
  }
}
