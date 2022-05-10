import path = require('path');
import * as vscode from 'vscode';
import { Uri } from "vscode";
const fs = require('fs');

export function activate(context: vscode.ExtensionContext) {
	let exporter = new Exporter();

	let disposable = vscode.commands.registerCommand('export-problems.exportProblems', () => {
		exporter.exportProblems();
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

class Problem {
	constructor() {
		this.path = '';
		this.severity = '';
		this.code = '';
		this.target = Uri.parse('my:uri', true);
		this.message = '';
		this.startLine = 0;
		this.startCharacter = 0;
	}

	path: string;
	severity: string;
	code: string | number;
    target: Uri;
    message: string;
    startLine: number;
    startCharacter: number;

	public toString(): string {
		return this.formatOutput(this.path) + ',' + this.formatOutput(this.code.toString()) + ',' + this.formatOutput(this.severity) + ',' + this.formatOutput(this.message)+ ',' + this.formatOutput(this.startLine.toString()) + ','  + this.formatOutput(this.startCharacter.toString()) + ',' + this.formatOutput(this.target.toString());
	}

	private formatOutput(input: string): string {
		if (input.includes(",")) {
			return '"' + input + '"';	
		} else {
			return input;
		}
	}
}

class Exporter {
	public exportProblems() {
		let diagnostics = vscode.languages.getDiagnostics();

		let filePath = '';
		if (vscode.workspace.workspaceFolders !== undefined){
			filePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
		} else {
			vscode.window.showErrorMessage('Export Problems: Working folder not found.');
		}

		let problems: Problem[] = [];

		for (var [currUri, currDiagnostics] of diagnostics) {
			for (let currDiagnostic of currDiagnostics) {
				let currProblem: Problem = new Problem();
				
				if (currUri.fsPath.startsWith(filePath)){
					currProblem.path = currUri.fsPath.substring(filePath.length + 1);
				} else {
					currProblem.path = currUri.fsPath;
				}

				currProblem.severity = vscode.DiagnosticSeverity[currDiagnostic.severity];
				
                if (typeof currDiagnostic.code === "string" || typeof currDiagnostic.code === "number") {
					currProblem.code = currDiagnostic.code;
				} else if (currDiagnostic.code?.value !== undefined) {
                    currProblem.code = currDiagnostic.code.value;
                    currProblem.target = currDiagnostic.code.target;
                }

				currProblem.message = currDiagnostic.message;
				currProblem.startLine = currDiagnostic.range.start.line + 1;
				currProblem.startCharacter = currDiagnostic.range.start.character + 1;

				problems.push(currProblem);
			}
		}

		let header = 'File,Severity,Code,Message,Line,Column,Target\r\n';

		fs.writeFile(path.join(filePath, 'problems.csv'), header + problems.join('\r\n'), (err: any) => {
            if (err) {
                vscode.window.showErrorMessage(err.toString());
            }
        });

		vscode.window.showInformationMessage('Export Problems: csv exported!');
	}
}
