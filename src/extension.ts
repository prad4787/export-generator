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

async function hasExports(fileUri: vscode.Uri): Promise<{ hasExports: boolean; isCommonJS: boolean }> {
    const content = await vscode.workspace.fs.readFile(fileUri);
    const fileContent = new TextDecoder().decode(content);
    
    // Regular expressions to match different export patterns
    const esModulePatterns = [
        /export\s+(const|let|var|function|class|interface|type|enum|abstract)\s+/,  // named exports
        /export\s+\{[^}]+\}/,  // grouped exports
        /export\s+\*\s+from/,  // re-exports
        /export\s+default/     // default exports
    ];

    const commonJSPatterns = [
        /module\.exports\s*=/,           // module.exports assignment
        /exports\.[a-zA-Z0-9_$]+\s*=/,   // exports.something assignment
    ];

    const hasESMExports = esModulePatterns.some(pattern => pattern.test(fileContent));
    const hasCommonJSExports = commonJSPatterns.some(pattern => pattern.test(fileContent));

    return {
        hasExports: hasESMExports || hasCommonJSExports,
        isCommonJS: hasCommonJSExports
    };
}

async function generateExports(folderUri: vscode.Uri) {
    const files = await vscode.workspace.fs.readDirectory(folderUri);
    
    // Get all TypeScript and JavaScript files
    const jstsFiles = files.filter(([name, type]) => 
        type === vscode.FileType.File &&
        (name.endsWith('.ts') || name.endsWith('.js')) &&
        name !== 'index.ts' &&
        name !== 'index.js' &&
        !name.endsWith('.test.ts') &&
        !name.endsWith('.test.js') &&
        !name.endsWith('.spec.ts') &&
        !name.endsWith('.spec.js')
    );

    // Check each file for exports and build export statements
    const exportStatements: string[] = [];
    let hasJsFiles = false;
    let hasTsFiles = false;
    let isCommonJSOnly = true;
    
    for (const [fileName] of jstsFiles) {
        const fileUri = vscode.Uri.joinPath(folderUri, fileName);
        const { hasExports: hasAnyExports, isCommonJS } = await hasExports(fileUri);
        
        if (hasAnyExports) {
            const exportName = fileName.replace(/\.(ts|js)$/, '');
            if (fileName.endsWith('.js')) {
                hasJsFiles = true;
                if (!isCommonJS) {
                    isCommonJSOnly = false;
                }
                if (isCommonJS) {
                    exportStatements.push(`const ${exportName} = require('./${exportName}');`);
                    exportStatements.push(`module.exports = { ...module.exports, ...${exportName} };`);
                } else {
                    exportStatements.push(`export * from './${exportName}';`);
                }
            } else if (fileName.endsWith('.ts')) {
                hasTsFiles = true;
                isCommonJSOnly = false;
                exportStatements.push(`export * from './${exportName}';`);
            }
        }
    }

    if (exportStatements.length > 0) {
        // Determine the index file type based on the source files
        let indexFileName: string;
        let fileContent: string;

        if (hasJsFiles && !hasTsFiles) {
            indexFileName = 'index.js';
            if (isCommonJSOnly) {
                // If all JS files use CommonJS, combine the exports using module.exports
                fileContent = exportStatements.join('\n') + '\n';
            } else {
                // If any JS file uses ES modules, use ES module syntax
                fileContent = exportStatements.join('\n') + '\n';
            }
        } else {
            indexFileName = 'index.ts';  // Default to TypeScript if mixed or only TypeScript files
            fileContent = exportStatements.join('\n') + '\n';
        }
        
        const indexFileUri = vscode.Uri.joinPath(folderUri, indexFileName);
        const content = new TextEncoder().encode(fileContent);
        await vscode.workspace.fs.writeFile(indexFileUri, content);
    } else {
        vscode.window.showInformationMessage('No files with exports found in this folder.');
    }
}

export function deactivate() {}