var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * Generic adapter for social/forum-style feeds.
 *
 * This fallback is intentionally conservative: it targets common feed
 * containers and skips obvious navigation/chrome UI elements.
 */
SlopFilter.GenericPlatform = class GenericPlatform extends SlopFilter.BasePlatform {
  static CONTAINER_SELECTORS = Object.freeze([
    'article',
    '[role="article"]',
    '[data-testid*="post"]',
    '[data-test-id*="post"]',
    '[class*="post"]',
    '[class*="comment"]',
    '[class*="thread"]',
  ]);

  static TEXT_SELECTORS = Object.freeze([
    '[data-testid*="text"]',
    '[class*="content"]',
    '[class*="body"]',
    '.markdown',
    '.md',
    'p',
  ]);

  static EXCLUDE_ANCESTORS = Object.freeze([
    'header',
    'footer',
    'nav',
    'aside',
    'form',
    '[role="navigation"]',
    '[role="search"]',
    '[aria-label*="navigation" i]',
    '[class*="sidebar"]',
    '[class*="menu"]',
  ]);

  get name() { return 'Generic'; }

  getContentNodes() {
    const seen = new Set();
    const nodes = [];

    GenericPlatform.CONTAINER_SELECTORS.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        if (seen.has(node) || this.isProcessed(node)) return;
        if (this._shouldExclude(node)) return;
        const text = this.extractText(node);
        if (!SlopFilter.isClassifiableText(text)) return;
        seen.add(node);
        nodes.push(node);
      });
    });

    return nodes;
  }

  extractText(node) {
    for (const selector of GenericPlatform.TEXT_SELECTORS) {
      const matches = node.querySelectorAll(selector);
      if (matches.length === 0) continue;

      const joined = Array.from(matches)
        .map((el) => (el.innerText || el.textContent || '').trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (SlopFilter.isClassifiableText(joined)) return joined;
    }

    return (node.innerText || node.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  _shouldExclude(node) {
    return GenericPlatform.EXCLUDE_ANCESTORS.some((selector) => {
      try {
        return !!node.closest(selector);
      } catch {
        return false;
      }
    });
  }
};
