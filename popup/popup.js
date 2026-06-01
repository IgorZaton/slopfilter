(async function initPopup() {
  'use strict';

  const DEFAULTS = { enabled: true, mode: 'dim', sensitivity: 'medium' };

  const SENSITIVITY_THRESHOLDS = {
    high:   { badgeMin: 50, dimMin: 86 },
    medium: { badgeMin: 65, dimMin: 92 },
    low:    { badgeMin: 80, dimMin: 96 },
  };

  // --- DOM refs ---
  const popup       = document.querySelector('.sf-popup');
  const enabledEl   = document.getElementById('sf-enabled');
  const scannedEl   = document.getElementById('sf-scanned');
  const flaggedEl   = document.getElementById('sf-flagged');
  const sensitivityHintEl = document.getElementById('sf-sensitivity-hint');

  // --- Load current settings ---
  const settings = await storageSyncGet(DEFAULTS);

  enabledEl.checked = settings.enabled;
  setRadio('sensitivity', settings.sensitivity);
  updateSensitivityHint(settings.sensitivity);
  setRadio('mode', settings.mode);
  updateDisabledState(settings.enabled);

  // --- Load stats from background ---
  await loadStats();

  // --- Event handlers ---

  enabledEl.addEventListener('change', () => {
    const enabled = enabledEl.checked;
    updateDisabledState(enabled);
    save({ enabled });
  });

  document.querySelectorAll('input[name="sensitivity"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateSensitivityHint(radio.value);
      save({ sensitivity: radio.value });
    });
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

  // Reliable cross-context stats updates.
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes.sfStats?.newValue) return;
    const stats = changes.sfStats.newValue;
    scannedEl.textContent = stats.scanned || 0;
    flaggedEl.textContent = stats.flagged || 0;
  });

  // --- Helpers ---

  async function save(partial) {
    await storageSyncSet(partial);
  }

  async function loadStats() {
    // First, read latest tab-independent stats snapshot.
    try {
      const local = await storageLocalGet(['sfStats']);
      if (local?.sfStats) {
        scannedEl.textContent = local.sfStats.scanned || 0;
        flaggedEl.textContent = local.sfStats.flagged || 0;
      }
    } catch {
      // Ignore and continue.
    }

    // Prefer direct tab stats; this avoids background-context compatibility issues.
    try {
      let activeTabs = await tabsQuery({ active: true, lastFocusedWindow: true });
      let activeTab = activeTabs[0];
      if (!activeTab) {
        activeTabs = await tabsQuery({ active: true, currentWindow: true });
        activeTab = activeTabs[0];
      }
      if (activeTab?.id != null) {
        const tabStats = await tabsSendMessage(activeTab.id, { type: 'stats:get-tab' });
        if (tabStats) {
          scannedEl.textContent = tabStats.scanned || 0;
          flaggedEl.textContent = tabStats.flagged || 0;
          return;
        }
      }
    } catch {
      // Not on a supported page, or content script unavailable.
    }

    // Fallback to background stats.
    try {
      const response = await runtimeSendMessage({ type: 'stats:get' });
      if (response) {
        scannedEl.textContent = response.scanned || 0;
        flaggedEl.textContent = response.flagged || 0;
      }
    } catch {
      // Background may not be ready yet.
    }
  }

  function updateSensitivityHint(level) {
    const t = SENSITIVITY_THRESHOLDS[level] || SENSITIVITY_THRESHOLDS.medium;
    sensitivityHintEl.textContent =
      `Badge at ${t.badgeMin}+ · dim/hide at ${t.dimMin}+`;
  }

  function setRadio(name, value) {
    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) radio.checked = true;
  }

  function updateDisabledState(enabled) {
    popup.classList.toggle('sf-disabled', !enabled);
  }

  function storageSyncGet(defaults) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.get(defaults, (items) => {
          if (chrome.runtime?.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(items || { ...defaults });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  function storageLocalGet(keys) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get(keys, (items) => {
          if (chrome.runtime?.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(items || {});
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  function storageSyncSet(values) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.set(values, () => {
          if (chrome.runtime?.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  function tabsQuery(queryInfo) {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.query(queryInfo, (tabs) => {
          if (chrome.runtime?.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(tabs || []);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  function tabsSendMessage(tabId, message) {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime?.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  function runtimeSendMessage(message) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime?.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(response);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
})();
