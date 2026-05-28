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

  const platform   = new SlopFilter.RedditPlatform();
  const classifier = new SlopFilter.HeuristicClassifier(settings.threshold);
  const renderer   = new SlopFilter.ContentRenderer();

  let stats = { scanned: 0, flagged: 0 };

  function scanPage() {
    if (!settings.enabled) return;

    const nodes = platform.getContentNodes();

    for (const node of nodes) {
      if (platform.isProcessed(node)) continue;

      const text = platform.extractText(node);
      if (!text) {
        platform.markProcessed(node, 0);
        continue;
      }

      const result = classifier.classify(text);
      platform.markProcessed(node, result.score);
      stats.scanned++;

      if (result.isAI) {
        stats.flagged++;
        renderer.render(node, result, settings.mode);
      }
    }

    broadcastStats();
  }

  function broadcastStats() {
    try {
      chrome.runtime.sendMessage({
        type: 'stats:update',
        data: { ...stats },
      });
    } catch {
      // Extension context may be invalidated on navigation
    }
  }

  function fullRescan() {
    renderer.clearAll();
    platform.clearAllMarks();
    stats = { scanned: 0, flagged: 0 };
    classifier.threshold = settings.threshold;
    scanPage();
  }

  // React to settings changes from the popup
  settings.onChange(() => fullRescan());

  // Also listen for storage changes from other contexts (popup, background)
  chrome.storage.onChanged.addListener((changes) => {
    const relevant = ['enabled', 'mode', 'sensitivity'];
    const needsReload = relevant.some(k => k in changes);
    if (needsReload) {
      settings.load().then(() => fullRescan());
    }
  });

  // Start observing the DOM for dynamic content
  const observer = new SlopFilter.DOMObserver(scanPage, 400);
  observer.start();
})();
