// DOM elements
const documentTitle = document.getElementById('document-title');
const documentContainer = document.getElementById('document-container');
const loadingIndicator = document.getElementById('loading-indicator');
const errorContainer = document.getElementById('error-container');
const errorMessage = document.getElementById('error-message');
const downloadBtn = document.getElementById('download-btn');
const printBtn = document.getElementById('print-btn');
const downloadFallbackBtn = document.getElementById('download-fallback-btn');
const closeBtn = document.getElementById('close-btn');

// Store document info for download
let currentDocument = null;

/**
 * Shows the loading indicator
 */
function showLoading() {
  loadingIndicator.hidden = false;
  errorContainer.hidden = true;
  documentContainer.innerHTML = '';
}

/**
 * Hides the loading indicator
 */
function hideLoading() {
  loadingIndicator.hidden = true;
}

/**
 * Shows an error message
 */
function showError(message) {
  hideLoading();
  errorContainer.hidden = false;
  errorMessage.textContent = message;
  documentContainer.innerHTML = '';
}

/**
 * Triggers download of the original file
 */
function downloadOriginalFile() {
  if (!currentDocument || !currentDocument.data) {
    alert('No document data available');
    return;
  }

  const blob = new Blob([new Uint8Array(currentDocument.data)], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = currentDocument.filename || 'document.docx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Prints the document
 */
function printDocument() {
  window.print();
}

/**
 * Renders the document using docx-preview
 */
async function renderDocument(arrayBuffer, filename) {
  try {
    // Check if docx library is loaded
    if (typeof docx === 'undefined') {
      throw new Error('Document rendering library not loaded. Please reload the page.');
    }

    // Render the document
    await docx.renderAsync(arrayBuffer, documentContainer, null, {
      className: 'docx-viewer',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      experimental: false,
      trimXmlDeclaration: true,
      debug: false
    });

    // Update title and enable buttons
    documentTitle.textContent = filename;
    document.title = `${filename} - Moodle Docs Viewer`;
    downloadBtn.disabled = false;
    printBtn.disabled = false;

    hideLoading();

  } catch (error) {
    console.error('Error rendering document:', error);
    throw new Error(`Failed to render document: ${error.message}`);
  }
}

/**
 * Loads and displays the document from storage
 */
async function loadDocument() {
  showLoading();

  try {
    // Retrieve document data from storage
    const result = await browser.storage.local.get(['tempDoc']);

    if (!result.tempDoc || !result.tempDoc.data) {
      throw new Error('No document found. The document data may have expired.');
    }

    currentDocument = result.tempDoc;

    // Convert array back to ArrayBuffer
    const uint8Array = new Uint8Array(currentDocument.data);
    const arrayBuffer = uint8Array.buffer;

    // Render the document
    await renderDocument(arrayBuffer, currentDocument.filename);

    // Clear the temporary storage after successful render
    await browser.storage.local.remove(['tempDoc']);

  } catch (error) {
    console.error('Error loading document:', error);
    showError(error.message || 'Failed to load document');
  }
}

// Event listeners
downloadBtn.addEventListener('click', downloadOriginalFile);
printBtn.addEventListener('click', printDocument);
downloadFallbackBtn.addEventListener('click', () => {
  if (currentDocument && currentDocument.url) {
    window.open(currentDocument.url, '_blank');
  } else {
    downloadOriginalFile();
  }
});
closeBtn.addEventListener('click', () => window.close());

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + P for print
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    if (!printBtn.disabled) {
      printDocument();
    }
  }
  // Ctrl/Cmd + S for save/download
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (!downloadBtn.disabled) {
      downloadOriginalFile();
    }
  }
  // Escape to close
  if (e.key === 'Escape') {
    window.close();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', loadDocument);
