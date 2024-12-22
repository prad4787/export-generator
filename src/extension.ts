import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('export-generator.generateExports', async (uri: vscode.Uri) => {
        if (!uri) {
            uri = vscode.workspace.workspaceFolders?.[0].uri!;
        }

        try {
            await generateExports(uri);
            vscode.window.showInformationMessage('Export file generated successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate exports: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

async function hasExports(fileUri: vscode.Uri): Promise<boolean> {
    const content = await vscode.workspace.fs.readFile(fileUri);
    const fileContent = new TextDecoder().decode(content);
    
    // Regular expressions to match different export patterns
    const exportPatterns = [
        /export\s+(const|let|var|function|class|interface|type|enum)\s+/,  // named exports
        /export\s+\{[^}]+\}/,  // grouped exports
        /export\s+\*\s+from/,  // re-exports
        /export\s+default/     // default exports
    ];

    return exportPatterns.some(pattern => pattern.test(fileContent));
}

async function generateExports(folderUri: vscode.Uri) {
    const files = await vscode.workspace.fs.readDirectory(folderUri);
    
    // Get all TypeScript files
    const tsFiles = files.filter(([name, type]) => 
        type === vscode.FileType.File &&
        name.endsWith('.ts') &&
        name !== 'index.ts' &&
        !name.endsWith('.test.ts') &&
        !name.endsWith('.spec.ts')
    );

    // Check each file for exports and build export statements
    const exportStatements: string[] = [];
    
    for (const [fileName] of tsFiles) {
        const fileUri = vscode.Uri.joinPath(folderUri, fileName);
        if (await hasExports(fileUri)) {
            const basename = path.basename(fileName, '.ts');
            exportStatements.push(`export * from './${basename}';`);
        }
    }

    // Only create index.ts if there are files with exports
    if (exportStatements.length > 0) {
        const indexPath = vscode.Uri.joinPath(folderUri, 'index.ts');
        const content = new TextEncoder().encode(exportStatements.join('\n') + '\n');
        await vscode.workspace.fs.writeFile(indexPath, content);
    } else {
        vscode.window.showInformationMessage('No files with exports found in this folder.');
    }
}

export function deactivate() {}