#!/bin/bash

# Build script for Moodle Docs Viewer Firefox Extension
# Requirements: curl, zip

set -e

echo "=== Moodle Docs Viewer Build Script ==="

# Create lib directory
mkdir -p lib

# Download third-party libraries
echo "Downloading JSZip v3.10.1..."
curl -L -o lib/jszip.min.js "https://unpkg.com/jszip@3.10.1/dist/jszip.min.js"

echo "Downloading docx-preview v0.3.3..."
curl -L -o lib/docx-preview.min.js "https://unpkg.com/docx-preview@0.3.3/dist/docx-preview.min.js"

# Create extension package
echo "Creating extension package..."
zip -r moodle-docs-viewer.zip . \
    -x "*.git*" \
    -x "*.md" \
    -x ".DS_Store" \
    -x "build.sh"

echo "=== Build complete: moodle-docs-viewer.zip ==="
