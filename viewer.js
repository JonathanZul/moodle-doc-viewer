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
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const zoomResetBtn = document.getElementById('zoom-reset-btn');
const zoomLevelDisplay = document.getElementById('zoom-level');

// Store document info for download
let currentDocument = null;

// Zoom state
let currentZoom = 100;
const ZOOM_STEP = 25;
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;

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
 * Updates the zoom level display and applies zoom
 */
function updateZoom() {
  zoomLevelDisplay.textContent = `${currentZoom}%`;
  documentContainer.style.transform = `scale(${currentZoom / 100})`;

  // Adjust container width to prevent horizontal scrollbar issues
  if (currentZoom > 100) {
    documentContainer.style.width = `${100 / (currentZoom / 100)}%`;
  } else {
    documentContainer.style.width = '100%';
  }
}

/**
 * Zooms in the document
 */
function zoomIn() {
  if (currentZoom < MAX_ZOOM) {
    currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
    updateZoom();
  }
}

/**
 * Zooms out the document
 */
function zoomOut() {
  if (currentZoom > MIN_ZOOM) {
    currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
    updateZoom();
  }
}

/**
 * Resets zoom to 100%
 */
function resetZoom() {
  currentZoom = 100;
  updateZoom();
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
zoomInBtn.addEventListener('click', zoomIn);
zoomOutBtn.addEventListener('click', zoomOut);
zoomResetBtn.addEventListener('click', resetZoom);
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
  // Ctrl/Cmd + Plus for zoom in
  if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
    e.preventDefault();
    zoomIn();
  }
  // Ctrl/Cmd + Minus for zoom out
  if ((e.ctrlKey || e.metaKey) && e.key === '-') {
    e.preventDefault();
    zoomOut();
  }
  // Ctrl/Cmd + 0 for reset zoom
  if ((e.ctrlKey || e.metaKey) && e.key === '0') {
    e.preventDefault();
    resetZoom();
  }
  // Escape to close
  if (e.key === 'Escape') {
    window.close();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', loadDocument);
