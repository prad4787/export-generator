# Auto Export Manager

## Overview

Auto Export Manager is a VS Code extension that automatically generates index files for your JavaScript and TypeScript folders, creating a clean and organized export interface. It intelligently handles both ES Modules and CommonJS export styles, making it perfect for mixed codebases.

## Features

- **Smart Export Detection**: Automatically detects and handles both ES Modules and CommonJS exports
- **Multi-Format Support**: Creates appropriate index files (`.js` or `.ts`) based on your source files
- **Mixed Module Support**: Handles folders with mixed ES Modules and CommonJS files
- **Context-Aware**: Generates exports that match your codebase's module system
- **Right-Click Support**: Generate exports directly from the context menu in VS Code's file explorer

## Usage

1. Right-click on any folder in the VS Code explorer
2. Select "Generate Index Exports" from the context menu
3. Or use the Command Palette (Cmd/Ctrl + Shift + P) and type "Generate Index Exports"

## Examples

### JavaScript (CommonJS)
If your folder contains CommonJS modules:

```javascript
// math.js
module.exports = {
    add: (a, b) => a + b
};

// Generated index.js
const math = require('./math');
module.exports = { ...module.exports, ...math };
```

### TypeScript/ES Modules
If your folder contains ES Modules:

```typescript
// user.ts
export interface User {
    id: string;
    name: string;
}

// Generated index.ts
export * from './user';
```

### Mixed Modules
For folders with both types, the extension intelligently handles each file's format:

```typescript
// math.js (CommonJS)
module.exports = { add: (a, b) => a + b };

// user.ts (ES Modules)
export interface User { id: string }

// Generated index.ts
import * as math from './math';
export { math };
export * from './user';
```

## Settings

No configuration needed! The extension automatically detects your module system and generates appropriate exports.

## Requirements

- VS Code version 1.80.0 or higher

## Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/prad4787/export-generator).

## License

This extension is licensed under the [MIT License](LICENSE.md).
