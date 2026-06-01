var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * Reddit-specific platform adapter.
 *
 * Handles both new Reddit (shreddit-comment / www.reddit.com)
 * and old Reddit (old.reddit.com) DOM structures.
 */
SlopFilter.RedditPlatform = class RedditPlatform
  extends SlopFilter.BasePlatform {

  // Selector groups — easily updatable when Reddit changes DOM
  static SELECTORS = Object.freeze({
    newReddit: {
      comment: [
        'shreddit-comment',
        'div[data-testid="comment"]',
        '[data-testid="comment"]',
      ],
      post: [
        'shreddit-post',
        'article',
        'div[data-testid="post-container"]',
      ],
      textBody: [
        '[slot="comment"] .md',
        '[id$="-comment-rtjson-content"]',
        '.RichTextJSON-root',
        'div[data-testid="comment"] .md',
        '[data-testid="comment"] [data-click-id="text"]',
        '.Comment .md',
      ],
      postBody: [
        '[slot="text-body"]',
        '[data-click-id="text"]',
        '[data-testid="post-content"] [data-click-id="text"]',
        'div[data-testid="post-content"] .md',
        '.Post .md',
      ],
      author: [
        '[slot="commentMeta"] a[href*="/user/"]',
        'a[data-testid="comment_author_link"]',
      ],
    },
    oldReddit: {
      comment:  '.comment',
      textBody: ['.md'],
      author:   ['.author'],
    },
  });

  get name() { return 'Reddit'; }

  get _isOldReddit() {
    return location.hostname === 'old.reddit.com';
  }

  getContentNodes() {
    const sel = this._isOldReddit
      ? RedditPlatform.SELECTORS.oldReddit
      : RedditPlatform.SELECTORS.newReddit;

    const nodes = [];
    const seen = new Set();

    const pushUnique = (node) => {
      if (!node || seen.has(node)) return;
      if (this.isProcessed(node)) return;
      seen.add(node);
      nodes.push(node);
    };

    // Comments
    const commentSelectors = Array.isArray(sel.comment) ? sel.comment : [sel.comment];
    commentSelectors.forEach((selector) => {
      const comments = document.querySelectorAll(selector);
      comments.forEach(c => pushUnique(c));
    });

    // Posts
    if (sel.post) {
      const postSelectors = Array.isArray(sel.post) ? sel.post : [sel.post];
      postSelectors.forEach((selector) => {
        const posts = document.querySelectorAll(selector);
        posts.forEach(p => pushUnique(p));
      });
    }

    // Keep only nodes with some readable text to avoid noisy wrappers.
    return nodes.filter((node) => this.extractText(node).length >= 20);
  }

  extractText(node) {
    const sel = this._isOldReddit
      ? RedditPlatform.SELECTORS.oldReddit
      : RedditPlatform.SELECTORS.newReddit;

    const isPostNode = this._matchesAny(node, sel.post);
    const bodySelectors = isPostNode ? sel.postBody : sel.textBody;

    // Try each selector until we find text content
    for (const selector of bodySelectors) {
      const target = this._querySelector(node, selector);
      if (target) {
        const text = target.innerText || target.textContent || '';
        if (text.trim().length > 0) return text.trim();
      }
    }

    // Fallback: grab all paragraph text within the node
    const paragraphs = this._querySelectorAll(node, 'p');
    if (paragraphs.length > 0) {
      return Array.from(paragraphs).map(p => p.textContent).join(' ').trim();
    }

    return '';
  }

  extractAuthor(node) {
    const sel = this._isOldReddit
      ? RedditPlatform.SELECTORS.oldReddit
      : RedditPlatform.SELECTORS.newReddit;

    for (const selector of sel.author) {
      const el = this._querySelector(node, selector);
      if (el) return el.textContent.trim();
    }

    // shreddit-comment stores author as an attribute
    if (node.getAttribute && node.getAttribute('author')) {
      return node.getAttribute('author');
    }

    return null;
  }

  /**
   * Query inside a node, handling shadow DOM if present.
   * @private
   */
  _querySelector(node, selector) {
    let result = node.querySelector(selector);
    if (!result && node.shadowRoot) {
      result = node.shadowRoot.querySelector(selector);
    }
    return result;
  }

  /** @private */
  _querySelectorAll(node, selector) {
    let results = node.querySelectorAll(selector);
    if (results.length === 0 && node.shadowRoot) {
      results = node.shadowRoot.querySelectorAll(selector);
    }
    return results;
  }

  /** @private */
  _matchesAny(node, selectors) {
    if (!selectors) return false;
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
