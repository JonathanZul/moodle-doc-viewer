// Supported document extensions for client-side viewing
const VIEWABLE_EXTENSIONS = ['.docx'];
const DEFAULT_MAX_FILE_SIZE = 20; // MB

console.log('[Moodle Docs Viewer] Content script loaded on:', window.location.href);

// Extension state
let extensionEnabled = true;
let maxFileSizeMB = DEFAULT_MAX_FILE_SIZE;

// Load extension state from storage
browser.storage.sync.get(['enabled', 'maxFileSize']).then((result) => {
  extensionEnabled = result.enabled !== false;
  maxFileSizeMB = result.maxFileSize || DEFAULT_MAX_FILE_SIZE;
});

// Listen for storage changes to update state in real-time
browser.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    extensionEnabled = changes.enabled.newValue;
  }
  if (changes.maxFileSize) {
    maxFileSizeMB = changes.maxFileSize.newValue;
  }
});

/**
 * Checks if a URL points to a viewable document type
 */
function isViewableDocument(url) {
  if (!url) return false;
  const lowercaseUrl = url.toLowerCase().split('?')[0];
  return VIEWABLE_EXTENSIONS.some(ext => lowercaseUrl.endsWith(ext));
}

/**
 * Checks if an anchor element links to a Moodle resource
 * We'll intercept all Moodle resource links and check file type on fetch
 */
function isMoodleResource(anchor) {
  const href = anchor.href || '';
  return href.includes('/mod/resource/view.php');
}

/**
 * Extracts filename from URL or Content-Disposition header
 */
function extractFilename(url, contentDisposition) {
  if (contentDisposition) {
    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      return match[1].replace(/['"]/g, '');
    }
  }
  const urlPath = url.split('?')[0];
  const segments = urlPath.split('/');
  return segments[segments.length - 1] || 'document.docx';
}

/**
 * Converts a potentially relative URL to an absolute URL
 */
function toAbsoluteUrl(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('//')) {
    return window.location.protocol + url;
  }
  return new URL(url, window.location.href).href;
}

/**
 * Finds the closest anchor element from an event target
 */
function findAnchorElement(target) {
  let element = target;
  while (element && element !== document.body) {
    if (element.tagName === 'A' && element.href) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

/**
 * Shows a loading indicator on the clicked link
 */
function showLoadingState(anchor) {
  const originalText = anchor.textContent;
  const originalStyle = anchor.style.cssText;
  anchor.style.opacity = '0.6';
  anchor.style.cursor = 'wait';
  anchor.dataset.originalText = originalText;
  anchor.dataset.originalStyle = originalStyle;
  return () => {
    anchor.style.cssText = originalStyle;
    delete anchor.dataset.originalText;
    delete anchor.dataset.originalStyle;
  };
}

/**
 * Shows an error notification to the user
 */
function showError(message, anchor) {
  console.error('[Moodle Docs Viewer]', message);

  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #dc3545;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 400px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 5000);
}

/**
 * Fetches the document with credentials and opens in viewer
 */
async function fetchAndOpenDocument(url, anchor) {
  console.log('[Moodle Docs Viewer] fetchAndOpenDocument called with:', url);
  const restoreLink = showLoadingState(anchor);

  try {
    const absoluteUrl = toAbsoluteUrl(url);
    console.log('[Moodle Docs Viewer] Fetching:', absoluteUrl);

    // Fetch the file with credentials (includes session cookies)
    // This will automatically follow redirects (e.g., from view.php to pluginfile.php)
    const response = await fetch(absoluteUrl, {
      credentials: 'include',
      redirect: 'follow',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/octet-stream, */*'
      }
    });

    console.log('[Moodle Docs Viewer] Response status:', response.status, 'URL:', response.url);
    console.log('[Moodle Docs Viewer] Content-Type:', response.headers.get('content-type'));

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
    }

    // Check content type to determine if it's a Word document
    const contentType = response.headers.get('content-type') || '';
    const finalUrl = response.url; // URL after redirects

    // Check if it's a Word document by content-type or final URL
    const isWordDoc = contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml') ||
                      contentType.includes('application/msword') ||
                      finalUrl.toLowerCase().endsWith('.docx') ||
                      finalUrl.toLowerCase().includes('.docx?');

    if (!isWordDoc) {
      console.log('[Moodle Docs Viewer] Not a Word document, opening normally...');
      restoreLink();
      // Open the original URL in a new tab
      window.open(url, '_blank');
      return;
    }

    console.log('[Moodle Docs Viewer] Word document detected, rendering...');

    // Check file size
    const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      throw new Error(`File too large (${Math.round(parseInt(contentLength) / 1024 / 1024)}MB). Maximum size is ${maxFileSizeMB}MB.`);
    }

    const blob = await response.blob();

    // Double check size after download
    if (blob.size > maxSizeBytes) {
      throw new Error(`File too large (${Math.round(blob.size / 1024 / 1024)}MB). Maximum size is ${maxFileSizeMB}MB.`);
    }

    // Get filename
    const filename = extractFilename(absoluteUrl, response.headers.get('content-disposition'));

    // Convert blob to array for storage
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const dataArray = Array.from(uint8Array);

    // Store document data temporarily
    await browser.storage.local.set({
      tempDoc: {
        data: dataArray,
        filename: filename,
        url: absoluteUrl,
        timestamp: Date.now()
      }
    });

    // Open the viewer page
    const viewerUrl = browser.runtime.getURL('viewer.html');
    window.open(viewerUrl, '_blank');

  } catch (error) {
    showError(error.message || 'Failed to open document', anchor);

    // Offer fallback download
    if (confirm('Would you like to download the file normally instead?')) {
      window.open(url, '_blank');
    }
  } finally {
    restoreLink();
  }
}

/**
 * Main click handler using event delegation on document body
 */
function interceptDocumentLinks(event) {
  console.log('[Moodle Docs Viewer] Click detected, enabled:', extensionEnabled);

  if (!extensionEnabled) return;

  // Don't interfere with modified clicks (Ctrl, Cmd, Shift, right-click)
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) {
    return;
  }

  const anchor = findAnchorElement(event.target);
  if (!anchor) {
    console.log('[Moodle Docs Viewer] No anchor found');
    return;
  }

  const href = anchor.href;
  console.log('[Moodle Docs Viewer] Clicked link:', href);

  const isDirectDocx = isViewableDocument(href);
  const isMoodleRes = isMoodleResource(anchor);

  console.log('[Moodle Docs Viewer] isDirectDocx:', isDirectDocx, 'isMoodleResource:', isMoodleRes);

  if (!isDirectDocx && !isMoodleRes) {
    console.log('[Moodle Docs Viewer] Not a viewable document');
    return;
  }

  console.log('[Moodle Docs Viewer] Intercepting document link!');

  // Prevent the default download behavior
  event.preventDefault();
  event.stopPropagation();

  // Fetch and open in viewer
  fetchAndOpenDocument(href, anchor);
}

/**
 * Handles middle-click (new tab) on document links
 */
function interceptMiddleClick(event) {
  if (!extensionEnabled) return;
  if (event.button !== 1) return;

  const anchor = findAnchorElement(event.target);
  if (!anchor) return;

  const href = anchor.href;
  const isDirectDocx = isViewableDocument(href);
  const isMoodleRes = isMoodleResource(anchor);

  if (!isDirectDocx && !isMoodleRes) return;

  event.preventDefault();
  event.stopPropagation();

  fetchAndOpenDocument(href, anchor);
}

/**
 * Adds visual indicator to document links that will be viewed
 */
function markViewableLinks() {
  if (!extensionEnabled) return;

  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    if (link.dataset.moodleViewerMarked) return;

    const isDirectDocx = isViewableDocument(link.href);
    const isMoodleRes = isMoodleResource(link);

    if (isDirectDocx || isMoodleRes) {
      link.dataset.moodleViewerMarked = 'true';
      link.title = (link.title ? link.title + ' - ' : '') + 'Opens in Document Viewer';
    }
  });
}

// Set up event listeners with capture phase for early interception
document.addEventListener('click', interceptDocumentLinks, true);
document.addEventListener('auxclick', interceptMiddleClick, true);

// Mark existing links and watch for dynamically added content
markViewableLinks();

// Use MutationObserver to handle dynamically loaded content
const observer = new MutationObserver((mutations) => {
  let hasNewNodes = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      hasNewNodes = true;
      break;
    }
  }
  if (hasNewNodes) {
    markViewableLinks();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Clean up old temporary documents on page load (older than 5 minutes)
browser.storage.local.get(['tempDoc']).then((result) => {
  if (result.tempDoc && result.tempDoc.timestamp) {
    const age = Date.now() - result.tempDoc.timestamp;
    if (age > 5 * 60 * 1000) {
      browser.storage.local.remove(['tempDoc']);
    }
  }
});
