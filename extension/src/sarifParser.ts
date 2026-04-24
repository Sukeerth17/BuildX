import { OutputChannel } from 'vscode';
import { ScanResult } from './types';

/**
 * SarifParser: Parses SARIF JSON output from the CLI and turns it into ScanResult objects.
 */
export class SarifParser {
    private outputChannel?: OutputChannel;

    constructor(outputChannel?: OutputChannel) {
        this.outputChannel = outputChannel;
    }

    /**
     * Parse SARIF 2.1 JSON string output.
     * @param sarifOutputString - SARIF JSON string
     * @returns Array of ScanResult objects
     */
    parse(sarifOutputString: string): ScanResult[] {
        const results: ScanResult[] = [];

        let sarifOutput;
        try {
            sarifOutput = JSON.parse(sarifOutputString);
        } catch (e) {
            if (this.outputChannel) {
                this.outputChannel.appendLine(`[SarifParser] Failed to parse JSON string: ${e}`);
            }
            return results;
        }

        if (!sarifOutput || !sarifOutput.runs || sarifOutput.runs.length === 0) {
            return results;
        }

        const run = sarifOutput.runs[0];
        if (!run.results || !Array.isArray(run.results)) {
            return results;
        }

        for (const finding of run.results) {
            try {
                const result: ScanResult = {
                    ruleId: finding.ruleId || 'UNKNOWN',
                    message: finding.message?.text || 'Unknown issue',
                    filePath: finding.locations?.[0]?.physicalLocation?.artifactLocation?.uri || '',
                    line: finding.locations?.[0]?.physicalLocation?.region?.startLine || 0,
                    severity: finding.properties?.severity || 'MEDIUM',
                    fix: finding.properties?.fix || 'No fix suggestion available',
                    framework: finding.properties?.framework || 'Unknown',
                };

                if (result.filePath && result.line > 0) {
                    results.push(result);
                }
            } catch (error) {
                if (this.outputChannel) {
                    this.outputChannel.appendLine(`[SarifParser] Error parsing finding: ${error}`);
                }
            }
        }

        return results;
    }
}
