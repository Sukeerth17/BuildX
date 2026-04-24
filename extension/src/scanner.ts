import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as vscode from 'vscode';
import { OutputChannel } from 'vscode';
import { ScanResult } from './types';
import { SarifParser } from './sarifParser';

/**
 * Scanner: Manages execution of the compliance-cli tool.
 * Spawns the CLI as a child process and captures SARIF output.
 */
export class Scanner {
    private extensionPath?: string;
    private outputChannel: OutputChannel;
    private sarifParser: SarifParser;

    constructor(outputChannel: OutputChannel, extensionPath?: string) {
        this.extensionPath = extensionPath;
        this.outputChannel = outputChannel;
        this.sarifParser = new SarifParser(outputChannel);
    }

    private resolveCliCommand(): string {
        const configuredCliPath = vscode.workspace
            .getConfiguration('complianceai')
            .get<string>('cliPath', '')
            .trim();

        if (configuredCliPath) {
            return configuredCliPath;
        }

        // 1. Try relative to the workspace folders (most common case)
        for (const folder of vscode.workspace.workspaceFolders ?? []) {
            const possiblePaths = [
                path.resolve(folder.uri.fsPath, 'cli', '.venv', 'bin', 'compliance-cli'),
                path.resolve(folder.uri.fsPath, '..', 'cli', '.venv', 'bin', 'compliance-cli'), // Sibling case
                path.resolve(folder.uri.fsPath, 'venv', 'bin', 'compliance-cli'),
            ];

            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    return p;
                }
            }
        }

        // 2. Try relative to the extension path
        if (this.extensionPath) {
            const possiblePaths = [
                path.resolve(this.extensionPath, '..', 'cli', '.venv', 'bin', 'compliance-cli'),
                path.resolve(this.extensionPath, 'cli', '.venv', 'bin', 'compliance-cli'),
            ];

            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    return p;
                }
            }
        }

        return 'compliance-cli';
    }

    /**
     * Scan a file using the compliance-cli tool.
     * @param filePath - Absolute path to the file to scan
     * @returns Array of ScanResult objects, or null if scan failed
     */
    async scanFile(filePath: string): Promise<ScanResult[] | null> {
        return new Promise((resolve) => {
            try {
                const cliCommand = this.resolveCliCommand();
                const args = ['scan', '--file', filePath, '--format', 'sarif'];

                this.outputChannel.appendLine(`[Scanner] Spawning: ${cliCommand} ${args.join(' ')}`);

                const childProcess = spawn(cliCommand, args, {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    shell: false,
                });

                let stdout = '';
                let stderr = '';

                // Capture stdout (SARIF JSON)
                childProcess.stdout?.on('data', (data) => {
                    stdout += data.toString();
                });

                // Capture stderr (human-readable output)
                childProcess.stderr?.on('data', (data) => {
                    stderr += data.toString();
                    this.outputChannel.appendLine(`[CLI stderr] ${data.toString().trim()}`);
                });

                // Handle process completion
                childProcess.on('close', (code) => {
                    if (code !== 0 && code !== null) {
                        this.outputChannel.appendLine(`[Scanner] CLI exited with code ${code}`);
                        if (stderr) {
                            this.outputChannel.appendLine(`[Scanner] Error: ${stderr}`);
                        }
                        resolve(null);
                        return;
                    }

                    if (!stdout.trim()) {
                        this.outputChannel.appendLine('[Scanner] CLI returned no output');
                        resolve([]);
                        return;
                    }

                    try {
                        const results = this.sarifParser.parse(stdout);
                        this.outputChannel.appendLine(`[Scanner] Parsed ${results.length} results from SARIF`);
                        resolve(results);
                    } catch (error) {
                        const errorMsg = error instanceof Error ? error.message : String(error);
                        this.outputChannel.appendLine(`[Scanner] Failed to parse SARIF JSON: ${errorMsg}`);
                        this.outputChannel.appendLine(`[Scanner] Raw output: ${stdout.substring(0, 500)}`);
                        resolve([]);
                    }
                });

                // Handle process errors (e.g., command not found)
                childProcess.on('error', (error) => {
                    const err = error as NodeJS.ErrnoException;
                    if (err.code === 'ENOENT') {
                        this.outputChannel.appendLine(
                            `[Scanner] ❌ CLI not found at "${cliCommand}". Set complianceai.cliPath or make sure it is installed and in your PATH.`
                        );
                    } else {
                        this.outputChannel.appendLine(`[Scanner] ❌ Process error: ${error.message}`);
                    }
                    resolve(null);
                });
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                this.outputChannel.appendLine(`[Scanner] ❌ Unexpected error: ${errorMsg}`);
                resolve(null);
            }
        });
    }
}
