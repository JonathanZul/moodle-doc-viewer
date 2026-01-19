const toggleEnabled = document.getElementById('toggle-enabled');
const popupStatus = document.getElementById('popup-status');
const openOptionsBtn = document.getElementById('open-options');

/**
 * Loads the current enabled state from storage
 */
async function loadState() {
  const result = await browser.storage.sync.get(['enabled']);
  toggleEnabled.checked = result.enabled !== false; // Default to enabled
  updateStatusText();
}

/**
 * Updates the status text based on toggle state
 */
function updateStatusText() {
  popupStatus.textContent = toggleEnabled.checked
    ? 'Documents will open in viewer'
    : 'Documents will download normally';
  popupStatus.className = `popup-status ${toggleEnabled.checked ? 'active' : 'inactive'}`;
}

/**
 * Saves the enabled state to storage
 */
async function saveState() {
  await browser.storage.sync.set({ enabled: toggleEnabled.checked });
  updateStatusText();
}

// Event listeners
toggleEnabled.addEventListener('change', saveState);

openOptionsBtn.addEventListener('click', () => {
  browser.runtime.openOptionsPage();
});

// Initialize
loadState();
