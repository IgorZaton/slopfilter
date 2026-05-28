(async function initPopup() {
  'use strict';

  const DEFAULTS = { enabled: true, mode: 'dim', sensitivity: 'medium' };

  // --- DOM refs ---
  const popup       = document.querySelector('.sf-popup');
  const enabledEl   = document.getElementById('sf-enabled');
  const scannedEl   = document.getElementById('sf-scanned');
  const flaggedEl   = document.getElementById('sf-flagged');

  // --- Load current settings ---
  const settings = await chrome.storage.sync.get(DEFAULTS);

  enabledEl.checked = settings.enabled;
  setRadio('sensitivity', settings.sensitivity);
  setRadio('mode', settings.mode);
  updateDisabledState(settings.enabled);

  // --- Load stats from background ---
  try {
    const response = await chrome.runtime.sendMessage({ type: 'stats:get' });
    if (response) {
      scannedEl.textContent = response.scanned || 0;
      flaggedEl.textContent = response.flagged || 0;
    }
  } catch {
    // Background may not be ready yet
  }

  // --- Event handlers ---

  enabledEl.addEventListener('change', () => {
    const enabled = enabledEl.checked;
    updateDisabledState(enabled);
    save({ enabled });
  });

  document.querySelectorAll('input[name="sensitivity"]').forEach(radio => {
    radio.addEventListener('change', () => save({ sensitivity: radio.value }));
  });

  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', () => save({ mode: radio.value }));
  });

  // Live stats updates from content scripts
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'stats:update') {
      scannedEl.textContent = msg.data.scanned || 0;
      flaggedEl.textContent = msg.data.flagged || 0;
    }
  });

  // --- Helpers ---

  async function save(partial) {
    await chrome.storage.sync.set(partial);
  }

  function setRadio(name, value) {
    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) radio.checked = true;
  }

  function updateDisabledState(enabled) {
    popup.classList.toggle('sf-disabled', !enabled);
  }
})();
