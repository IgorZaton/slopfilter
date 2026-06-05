var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * Content script entry point — composition root.
 *
 * Wires together the classifier, platform, renderer, and observer.
 * Follows Dependency Inversion: this module composes abstractions,
 * it doesn't depend on concrete implementation details.
 */
(async function initSlopFilter() {
  'use strict';

  const settings = new SlopFilter.Settings();
  await settings.load();
  const debug = createDebugOverlay(settings.debug);
  debug.set('init');
  debug.set(`loaded (enabled=${settings.enabled})`);

  const platform   = SlopFilter.createPlatform();
  const classifier = SlopFilter.createClassifier({
    threshold: settings.threshold,
  });
  const renderer   = new SlopFilter.ContentRenderer(settings.displayThresholds);

  let stats = { scanned: 0, flagged: 0 };
  let scanInProgress = false;
  let scanQueued = false;

  try {
    chrome.runtime.sendMessage({ type: 'ai:warmup' });
  } catch {
    // Ignore warmup errors; classify will surface runtime failures.
  }

  async function scanPage() {
    if (scanInProgress) {
      scanQueued = true;
      return;
    }

    scanInProgress = true;

    try {
    debug.syncEnabled(settings.debug);
    if (!settings.enabled) {
      debug.set('disabled');
      return;
    }

    let nodes = platform.getContentNodes();
    if (nodes.length === 0) {
      nodes = getFallbackNodes(platform);
    }
    debug.set(`${platform.name} nodes=${nodes.length}`);

    for (const node of nodes) {
      if (platform.isProcessed(node)) continue;

      const text = platform.extractText(node);
      if (!text || !SlopFilter.isClassifiableText(text)) {
        platform.markProcessed(node, 0);
        continue;
      }

      let result;
      try {
        result = await classifier.classify(text);
      } catch (err) {
        platform.markProcessed(node, 0);
        debug.set(`onnx error: ${err && err.message ? err.message : String(err)}`);
        continue;
      }

      platform.markProcessed(node, result.score);
      stats.scanned++;

      if (result.score >= renderer.badgeMin) {
        stats.flagged++;
        renderer.render(node, result, settings.mode);
      }
    }

    broadcastStats();
    debug.set(`scanned=${stats.scanned} flagged=${stats.flagged}`);
    } finally {
      scanInProgress = false;
      if (scanQueued) {
        scanQueued = false;
        scanPage().catch(() => {});
      }
    }
  }

  function getFallbackNodes(platform) {
    if (platform.name === 'LinkedIn') {
      return Array.from(document.querySelectorAll(
        [
          '[data-testid="expandable-text-box"]',
          '[data-test-id="expandable-text-box"]',
          '.feed-shared-update-v2[data-urn]',
          'div[data-urn*="activity"]',
          'div[data-urn*="ugcPost"]',
          '.comments-comment-item',
        ].join(', ')
      ));
    }

    return Array.from(document.querySelectorAll(
      'article, [data-testid="post-container"], [data-testid="comment"], p'
    ));
  }

  function broadcastStats() {
    try {
      chrome.storage.local.set({
        sfStats: { ...stats },
        sfStatsUpdatedAt: Date.now(),
      });
    } catch {
      // Ignore storage write errors.
    }

    try {
      chrome.runtime.sendMessage({
        type: 'stats:update',
        data: { ...stats },
      });
    } catch {
      // Extension context may be invalidated on navigation
    }
  }

  // Allow popup to request stats directly from the active tab.
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'stats:get-tab') {
      sendResponse({ ...stats });
      return true;
    }

    if (msg?.type === 'stats:rescan') {
      fullRescan();
      sendResponse({ ok: true, ...stats });
      return true;
    }

    return false;
  });

  function fullRescan() {
    debug.syncEnabled(settings.debug);
    renderer.clearAll();
    platform.clearAllMarks();
    stats = { scanned: 0, flagged: 0 };
    classifier.threshold = settings.threshold;
    renderer.setThresholds(settings.displayThresholds);
    scanPage().catch(() => {});
  }

  // React to settings changes from the popup
  settings.onChange(() => fullRescan());

  // Also listen for storage changes from other contexts (popup, background)
  chrome.storage.onChanged.addListener((changes) => {
    const relevant = ['enabled', 'mode', 'sensitivity', 'debug'];
    const needsReload = relevant.some(k => k in changes);
    if (needsReload) {
      settings.load().then(() => fullRescan());
    }
  });

  // Start observing the DOM for dynamic content
  const observer = new SlopFilter.DOMObserver(() => {
    scanPage().catch(() => {});
  }, 400);
  observer.start();

  function createDebugOverlay(initiallyEnabled) {
    let enabled = !!initiallyEnabled;
    let el = enabled ? ensureOverlayElement() : null;

    function ensureOverlayElement() {
      if (el?.isConnected) return el;
      const node = document.createElement('div');
      node.id = 'sf-debug';
      node.style.cssText = [
        'position:fixed',
        'right:12px',
        'bottom:12px',
        'z-index:2147483647',
        'background:#111',
        'color:#0f0',
        'font:12px/1.3 monospace',
        'padding:6px 8px',
        'border:1px solid #2d2',
        'border-radius:6px',
        'opacity:0.9',
      ].join(';');
      document.documentElement.appendChild(node);
      return node;
    }

    function removeOverlayElement() {
      if (el?.isConnected) el.remove();
      el = null;
    }

    return {
      syncEnabled(nextEnabled) {
        enabled = !!nextEnabled;
        if (enabled) {
          el = ensureOverlayElement();
          return;
        }
        removeOverlayElement();
      },
      set(text) {
        if (!enabled) return;
        el = ensureOverlayElement();
        el.textContent = `SlopFilter ${text}`;
      },
    };
  }
})().catch((err) => {
  const text = `SlopFilter error: ${err && err.message ? err.message : String(err)}`;
  try {
    chrome.storage.sync.get({ debug: false }, (items) => {
      if (!items?.debug) return;
      const el = document.createElement('div');
      el.id = 'sf-debug-error';
      el.style.cssText = [
        'position:fixed',
        'right:12px',
        'bottom:12px',
        'z-index:2147483647',
        'background:#300',
        'color:#f88',
        'font:12px/1.3 monospace',
        'padding:6px 8px',
        'border:1px solid #f66',
        'border-radius:6px',
        'max-width:50vw',
      ].join(';');
      el.textContent = text;
      document.documentElement.appendChild(el);
    });
  } catch {
    // Suppress fallback UI noise when debug mode is disabled.
  }
  console.error(text);
});
