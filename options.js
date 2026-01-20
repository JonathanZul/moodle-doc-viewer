const DEFAULT_SETTINGS = {
  maxFileSize: 20, // MB
  enabled: true
};

// DOM elements
const maxFileSizeInput = document.getElementById('max-file-size');
const saveBtn = document.getElementById('save-settings');
const resetBtn = document.getElementById('reset-defaults');
const statusMessage = document.getElementById('status-message');

/**
 * Loads saved settings from browser storage
 */
async function loadSettings() {
  const result = await browser.storage.sync.get(['maxFileSize', 'enabled']);

  maxFileSizeInput.value = result.maxFileSize || DEFAULT_SETTINGS.maxFileSize;
}

/**
 * Saves all settings to browser storage
 */
async function saveSettings() {
  const maxFileSize = parseInt(maxFileSizeInput.value, 10);

  if (isNaN(maxFileSize) || maxFileSize < 1 || maxFileSize > 50) {
    showStatus('File size limit must be between 1 and 50 MB', 'error');
    return;
  }

  const settings = {
    maxFileSize: maxFileSize,
    enabled: true
  };

  await browser.storage.sync.set(settings);
  showStatus('Settings saved!', 'success');
}

/**
 * Resets all settings to defaults
 */
async function resetToDefaults() {
  await browser.storage.sync.set(DEFAULT_SETTINGS);
  loadSettings();
  showStatus('Settings reset to defaults', 'success');
}

/**
 * Shows a status message to the user
 */
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.hidden = false;

  setTimeout(() => {
    statusMessage.hidden = true;
  }, 3000);
}

// Event listeners
saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetToDefaults);

// Allow saving with Enter key
maxFileSizeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    saveSettings();
  }
});

// Initialize
loadSettings();
