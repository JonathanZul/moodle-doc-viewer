# Moodle Docs Viewer

A Firefox extension that opens Word, PowerPoint, and Excel documents in your browser instead of forcing downloads on Moodle sites.

## Features

- Intercepts clicks on document links (.docx, .doc, .pptx, .xlsx, .xls) on Moodle pages
- Opens documents in Google Docs Viewer or Microsoft Office Online
- Configurable Moodle domains
- Quick toggle to enable/disable the extension
- Works with both left-click and middle-click
- Preserves Ctrl+Click and right-click behavior for manual downloads

## Installation

### Firefox (Developer Mode)

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..."
4. Navigate to the extension folder and select `manifest.json`

The extension will now appear in your toolbar.

### Firefox (Permanent Installation)

For permanent installation, the extension needs to be signed by Mozilla or installed from [addons.mozilla.org](https://addons.mozilla.org).

## Usage

1. **Enable/Disable**: Click the extension icon in the toolbar to toggle the extension on or off
2. **Configure Domains**: Click "Settings" in the popup or go to the extension's preferences to add your Moodle domains
3. **Browse Moodle**: When you click on a document link, it will automatically open in the configured viewer

### Default Domains

The extension comes pre-configured with common Moodle URL patterns:
- `*.moodle.*` (matches subdomains like `courses.moodle.edu`)
- `moodle.*` (matches domains starting with moodle)

### Adding Custom Domains

1. Click the extension icon and select "Settings"
2. Enter your Moodle domain (e.g., `lms.myschool.edu`)
3. Click "Add Domain"
4. Click "Save Settings"

## Configuration Options

### File Types
Select which document types should open in the viewer:
- Word Documents (.docx, .doc)
- PowerPoint Presentations (.pptx, .ppt)
- Excel Spreadsheets (.xlsx, .xls)

### Viewer Selection
Choose between:
- **Google Docs Viewer** - Works with most document types
- **Microsoft Office Online** - Better formatting fidelity for Office documents

## Privacy

This extension:
- Only activates on Moodle domains you configure
- Does not collect any user data
- Does not make any external requests except to the document viewer you select
- Stores settings locally using Firefox's sync storage

## Development

### File Structure

```
moodle-doc-viewer/
├── manifest.json      # Extension configuration
├── content.js         # Link interception logic
├── options.html       # Settings page
├── options.js         # Settings logic
├── popup.html         # Toolbar popup
├── popup.js           # Popup logic
├── styles.css         # Shared styles
├── icons/
│   └── icon.svg       # Extension icon
└── README.md
```

### Building for Production

1. Ensure all files are present
2. Zip the contents (not the folder itself)
3. Submit to [addons.mozilla.org](https://addons.mozilla.org) for review

## License

MIT License

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.
