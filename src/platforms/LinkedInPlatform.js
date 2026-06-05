var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * LinkedIn-specific platform adapter.
 *
 * Supports legacy feed cards (.feed-shared-update-v2) and the newer
 * server-driven UI (SDUI) that uses data-testid="expandable-text-box".
 * Queries pierce open shadow roots because LinkedIn nests content there.
 */
SlopFilter.LinkedInPlatform = class LinkedInPlatform
  extends SlopFilter.BasePlatform {

  static SELECTORS = Object.freeze({
    sduiTextBox: [
      '[data-testid="expandable-text-box"]',
      '[data-test-id="expandable-text-box"]',
    ],
    post: [
      '.feed-shared-update-v2[data-urn*="activity"]',
      '.feed-shared-update-v2[data-urn*="ugcPost"]',
      '.feed-shared-update-v2[data-urn]',
      '[class*="feed-shared-update-v2"][data-urn]',
      'div[data-urn*="activity"]',
      'div[data-urn*="ugcPost"]',
      '[data-test-id="main-feed-activity-card"]',
      '[data-view-name*="feed"]',
    ],
    comment: [
      '.comments-comment-item[data-id]',
      '.comments-comment-item',
      'article.comments-comment-entity',
      '[class*="comments-comment-item"]',
    ],
    postBody: [
      '[data-testid="expandable-text-box"]',
      '[data-test-id="expandable-text-box"]',
      '.feed-shared-inline-show-more-text',
      '[class*="feed-shared-inline-show-more-text"]',
      '.update-components-text',
      '.feed-shared-update-v2__description',
      '.feed-shared-text',
      '[class*="feed-shared-text"]',
    ],
    commentBody: [
      '.comments-comment-item__main-content',
      '[class*="comments-comment-item__main-content"]',
      '.comments-comment-item-content-body',
      '[class*="comments-comment-item-content-body"]',
    ],
    postAuthor: [
      '.update-components-actor__title span[aria-hidden="true"]',
      '.update-components-actor__name span[aria-hidden="true"]',
    ],
    commentAuthor: [
      '.comments-post-meta__name-text',
      '[class*="comments-post-meta__name"]',
    ],
  });

  static CARD_SELECTORS = [
    '.feed-shared-update-v2',
    '[class*="feed-shared-update-v2"]',
    'div[data-urn^="urn:li:"]',
    '[data-view-name*="feed"]',
    'article',
  ];

  static EXCLUDE_ANCESTORS = [
    '#global-nav',
    '.global-nav',
    '.search-global-typeahead',
    '.comments-comment-box',
    '.share-box',
    '.msg-form',
    '.ql-editor',
    'aside.scaffold-layout__aside',
  ];

  static STRIP_FROM_TEXT = [
    'button',
    'nav',
    '[aria-hidden="true"]',
    '.update-components-actor',
    '.social-details-social-counts',
    '.comments-post-meta',
    '.feed-shared-control-menu',
    '[class*="social-actions"]',
  ];

  get name() { return 'LinkedIn'; }

  getContentNodes() {
    const seen = new Set();
    const nodes = [];

    const add = (el) => {
      const resolved = this._resolveNode(el);
      if (!resolved || seen.has(resolved)) return;
      if (this.isProcessed(resolved)) return;
      if (this._shouldExclude(resolved)) return;

      const text = this.extractText(resolved);
      if (!SlopFilter.isClassifiableText(text)) return;

      seen.add(resolved);
      nodes.push(resolved);
    };

    LinkedInPlatform.SELECTORS.sduiTextBox.forEach((selector) => {
      this._queryAllDeep(selector).forEach(add);
    });

    LinkedInPlatform.SELECTORS.post.forEach((selector) => {
      this._queryAllDeep(selector).forEach(add);
    });

    LinkedInPlatform.SELECTORS.comment.forEach((selector) => {
      this._queryAllDeep(selector).forEach(add);
    });

    return nodes;
  }

  extractText(node) {
    if (this._isTextBox(node)) {
      const direct = (node.innerText || node.textContent || '').trim();
      if (direct.length > 0) return direct;
    }

    const isPost = this._isPostNode(node);
    const bodySelectors = isPost
      ? LinkedInPlatform.SELECTORS.postBody
      : LinkedInPlatform.SELECTORS.commentBody;

    for (const selector of bodySelectors) {
      const target = this._querySelectorDeep(node, selector);
      if (target) {
        const text = (target.innerText || target.textContent || '').trim();
        if (text.length > 0) return text;
      }
    }

    return this._extractReadableText(node);
  }

  extractAuthor(node) {
    const authorSelectors = this._isPostNode(node)
      ? LinkedInPlatform.SELECTORS.postAuthor
      : LinkedInPlatform.SELECTORS.commentAuthor;

    for (const selector of authorSelectors) {
      const el = this._querySelectorDeep(node, selector);
      if (el) return el.textContent.trim();
    }

    return null;
  }

  /** @private */
  _resolveNode(el) {
    if (this._isTextBox(el)) {
      return this._topCard(el) || el;
    }
    return el;
  }

  /** @private */
  _topCard(el) {
    let best = null;

    for (let node = el; node && node !== document.body; node = node.parentElement) {
      if (!node.matches) continue;
      for (const selector of LinkedInPlatform.CARD_SELECTORS) {
        try {
          if (node.matches(selector)) best = node;
        } catch {
          // Invalid selector on this node — skip.
        }
      }
    }

    return best;
  }

  /** @private */
  _isTextBox(node) {
    const testId = node.getAttribute?.('data-testid')
      || node.getAttribute?.('data-test-id');
    return testId === 'expandable-text-box';
  }

  /** @private */
  _isPostNode(node) {
    if (this._isTextBox(node)) return true;
    return this._matchesAny(node, LinkedInPlatform.SELECTORS.post);
  }

  /** @private */
  _shouldExclude(node) {
    return LinkedInPlatform.EXCLUDE_ANCESTORS.some((selector) => {
      try {
        return !!node.closest(selector);
      } catch {
        return false;
      }
    });
  }

  /** @private */
  _extractReadableText(node) {
    const clone = node.cloneNode(true);
    LinkedInPlatform.STRIP_FROM_TEXT.forEach((selector) => {
      clone.querySelectorAll(selector).forEach((el) => el.remove());
    });
    return (clone.innerText || clone.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * querySelectorAll that pierces shadow roots.
   * @private
   */
  _queryAllDeep(selector, root = document) {
    const results = [];
    const start = root === document ? document.documentElement : root;
    if (!start) return results;

    const visit = (node) => {
      if (!node || !node.querySelectorAll) return;

      try {
        node.querySelectorAll(selector).forEach((el) => results.push(el));
      } catch {
        // Invalid selector — skip this root.
      }

      const children = node.children || [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        visit(child);
        if (child.shadowRoot) visit(child.shadowRoot);
      }
    };

    visit(start);
    return results;
  }

  /** @private */
  _querySelectorDeep(node, selector) {
    const local = this._querySelector(node, selector);
    if (local) return local;

    const matches = this._queryAllDeep(selector, node);
    return matches.length > 0 ? matches[0] : null;
  }

  /** @private */
  _querySelector(node, selector) {
    let result = node.querySelector(selector);
    if (!result && node.shadowRoot) {
      result = node.shadowRoot.querySelector(selector);
    }
    return result;
  }

  /** @private */
  _matchesAny(node, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    return list.some((selector) => {
      try {
        return node.matches(selector);
      } catch {
        return false;
      }
    });
  }
};
