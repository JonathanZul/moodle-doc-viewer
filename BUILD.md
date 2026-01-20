# Build Instructions for Moodle Docs Viewer

## Overview

This extension uses unminified source code for all custom JavaScript. The only minified files are third-party open-source libraries (JSZip and docx-preview) downloaded from npm.

## Requirements

- Any operating system (macOS, Windows, Linux)
- curl or wget (for downloading libraries)
- zip (for packaging)

No Node.js, npm, or build tools are required.

## Build Steps

### 1. Download third-party libraries

The extension uses two open-source libraries:

**JSZip v3.10.1** (MIT License)
- Source: https://github.com/Stuk/jszip
- Download: https://unpkg.com/jszip@3.10.1/dist/jszip.min.js

**docx-preview v0.3.3** (MIT License)
- Source: https://github.com/nicnguyen/docx-preview
- Download: https://unpkg.com/docx-preview@0.3.3/dist/docx-preview.min.js

To download, run:
```bash
mkdir -p lib
curl -L -o lib/jszip.min.js "https://unpkg.com/jszip@3.10.1/dist/jszip.min.js"
curl -L -o lib/docx-preview.min.js "https://unpkg.com/docx-preview@0.3.3/dist/docx-preview.min.js"
```

### 2. Package the extension

```bash
zip -r moodle-docs-viewer.zip . -x "*.git*" -x "*.md" -x ".DS_Store" -x "build.sh"
```

## File Structure

```
moodle-doc-viewer/
├── manifest.json          # Extension manifest
├── content.js             # Content script (unminified, custom code)
├── viewer.html            # Document viewer page
├── viewer.js              # Viewer logic (unminified, custom code)
├── viewer.css             # Viewer styles
├── popup.html             # Extension popup
├── popup.js               # Popup logic (unminified, custom code)
├── options.html           # Settings page
├── options.js             # Settings logic (unminified, custom code)
├── styles.css             # Shared styles
├── icons/
│   └── icon.svg           # Extension icon
└── lib/
    ├── jszip.min.js       # Third-party library (MIT)
    └── docx-preview.min.js # Third-party library (MIT)
```

## Verification

All custom source files (content.js, viewer.js, popup.js, options.js) are unminified and human-readable. The only minified files are the third-party libraries which can be verified by comparing checksums with the official npm packages.
