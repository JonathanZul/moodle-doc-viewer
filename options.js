const DEFAULT_SETTINGS = {
  domains: ['*.moodle.*', 'moodle.*'],
  fileTypes: {
    word: true,
    powerpoint: true,
    excel: true
  },
  viewer: 'google'
};

// DOM elements
const domainInput = document.getElementById('new-domain');
const addDomainBtn = document.getElementById('add-domain');
const domainList = document.getElementById('domain-list');
const typeDocx = document.getElementById('type-docx');
const typePptx = document.getElementById('type-pptx');
const typeXlsx = document.getElementById('type-xlsx');
const viewerRadios = document.querySelectorAll('input[name="viewer"]');
const saveBtn = document.getElementById('save-settings');
const resetBtn = document.getElementById('reset-defaults');
const statusMessage = document.getElementById('status-message');

let currentDomains = [];

/**
 * Loads saved settings from browser storage
 */
async function loadSettings() {
  const result = await browser.storage.sync.get(['domains', 'fileTypes', 'viewer']);

  currentDomains = result.domains || DEFAULT_SETTINGS.domains;
  const fileTypes = result.fileTypes || DEFAULT_SETTINGS.fileTypes;
  const viewer = result.viewer || DEFAULT_SETTINGS.viewer;

  renderDomainList();

  typeDocx.checked = fileTypes.word;
  typePptx.checked = fileTypes.powerpoint;
  typeXlsx.checked = fileTypes.excel;

  document.querySelector(`input[name="viewer"][value="${viewer}"]`).checked = true;
}

/**
 * Renders the list of configured domains
 */
function renderDomainList() {
  domainList.innerHTML = '';

  if (currentDomains.length === 0) {
    domainList.innerHTML = '<li class="empty-state">No domains configured. Add a domain above.</li>';
    return;
  }

  currentDomains.forEach((domain, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="domain-text">${domain}</span>
      <button class="btn btn-remove" data-index="${index}" title="Remove domain">Remove</button>
    `;
    domainList.appendChild(li);
  });
}

/**
 * Adds a new domain to the list
 */
function addDomain() {
  const domain = domainInput.value.trim();

  if (!domain) {
    showStatus('Please enter a domain', 'error');
    return;
  }

  if (currentDomains.includes(domain)) {
    showStatus('Domain already exists', 'error');
    return;
  }

  currentDomains.push(domain);
  domainInput.value = '';
  renderDomainList();
  showStatus('Domain added. Click Save to apply changes.', 'info');
}

/**
 * Removes a domain from the list by index
 */
function removeDomain(index) {
  currentDomains.splice(index, 1);
  renderDomainList();
  showStatus('Domain removed. Click Save to apply changes.', 'info');
}

/**
 * Saves all settings to browser storage
 */
async function saveSettings() {
  const settings = {
    domains: currentDomains,
    fileTypes: {
      word: typeDocx.checked,
      powerpoint: typePptx.checked,
      excel: typeXlsx.checked
    },
    viewer: document.querySelector('input[name="viewer"]:checked').value
  };

  await browser.storage.sync.set(settings);
  showStatus('Settings saved!', 'success');
}

/**
 * Resets all settings to defaults
 */
async function resetToDefaults() {
  currentDomains = [...DEFAULT_SETTINGS.domains];
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
addDomainBtn.addEventListener('click', addDomain);

domainInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addDomain();
  }
});

domainList.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-remove')) {
    const index = parseInt(e.target.dataset.index, 10);
    removeDomain(index);
  }
});

saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetToDefaults);

// Initialize
loadSettings();
