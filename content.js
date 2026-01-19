// Supported document extensions for viewer redirection
const VIEWABLE_EXTENSIONS = ['.docx', '.doc', '.pptx', '.xlsx', '.xls'];
const GOOGLE_VIEWER_BASE = 'https://docs.google.com/viewer?url=';

// Extension state - enabled by default until we confirm storage
let extensionEnabled = true;

// Load extension state from storage (Firefox uses Promise-based browser API)
browser.storage.sync.get(['enabled']).then((result) => {
  extensionEnabled = result.enabled !== false;
});

// Listen for storage changes to update state in real-time
browser.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    extensionEnabled = changes.enabled.newValue;
  }
});

/**
 * Checks if a URL points to a viewable document type
 */
function isViewableDocument(url) {
  if (!url) return false;
  const lowercaseUrl = url.toLowerCase().split('?')[0]; // Remove query params for extension check
  return VIEWABLE_EXTENSIONS.some(ext => lowercaseUrl.endsWith(ext));
}

/**
 * Converts a potentially relative URL to an absolute URL
 */
function toAbsoluteUrl(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Handle protocol-relative URLs
  if (url.startsWith('//')) {
    return window.location.protocol + url;
  }
  // Handle relative URLs
  return new URL(url, window.location.href).href;
}

/**
 * Builds the Google Docs Viewer URL for a document
 */
function buildViewerUrl(documentUrl) {
  const absoluteUrl = toAbsoluteUrl(documentUrl);
  return GOOGLE_VIEWER_BASE + encodeURIComponent(absoluteUrl);
}

/**
 * Finds the closest anchor element from an event target
 * Handles cases where user clicks on child elements within a link
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
 * Main click handler using event delegation on document body
 * Intercepts clicks on document links and redirects to viewer
 */
function interceptDocumentLinks(event) {
  // Skip if extension is disabled
  if (!extensionEnabled) return;

  // Don't interfere with modified clicks (Ctrl, Cmd, Shift, right-click)
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) {
    return;
  }

  const anchor = findAnchorElement(event.target);
  if (!anchor) return;

  const href = anchor.href;
  if (!isViewableDocument(href)) return;

  // Prevent the default download behavior
  event.preventDefault();
  event.stopPropagation();

  // Open in Google Docs Viewer
  const viewerUrl = buildViewerUrl(href);
  window.open(viewerUrl, '_blank');
}

/**
 * Handles middle-click (new tab) on document links
 */
function interceptMiddleClick(event) {
  if (!extensionEnabled) return;
  if (event.button !== 1) return; // Middle click only

  const anchor = findAnchorElement(event.target);
  if (!anchor) return;

  const href = anchor.href;
  if (!isViewableDocument(href)) return;

  event.preventDefault();
  event.stopPropagation();

  const viewerUrl = buildViewerUrl(href);
  window.open(viewerUrl, '_blank');
}

/**
 * Adds visual indicator to document links that will be redirected
 */
function markViewableLinks() {
  if (!extensionEnabled) return;

  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    if (isViewableDocument(link.href) && !link.dataset.moodleViewerMarked) {
      link.dataset.moodleViewerMarked = 'true';
      link.title = (link.title ? link.title + ' - ' : '') + 'Opens in Google Docs Viewer';
    }
  });
}

// Set up event listeners with capture phase for early interception
document.addEventListener('click', interceptDocumentLinks, true);
document.addEventListener('auxclick', interceptMiddleClick, true);

// Mark existing links and watch for dynamically added content
markViewableLinks();

// Use MutationObserver to handle dynamically loaded content (common in Moodle)
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
