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
      comment: 'shreddit-comment',
      post:    'shreddit-post',
      textBody: [
        '[slot="comment"] .md',
        '[id$="-comment-rtjson-content"]',
        '.RichTextJSON-root',
        'div[data-testid="comment"] .md',
        '.Comment .md',
      ],
      postBody: [
        '[slot="text-body"]',
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

    // Comments
    const comments = document.querySelectorAll(sel.comment);
    comments.forEach(c => {
      if (!this.isProcessed(c)) nodes.push(c);
    });

    // Posts (new Reddit only)
    if (!this._isOldReddit && sel.post) {
      const posts = document.querySelectorAll(sel.post);
      posts.forEach(p => {
        if (!this.isProcessed(p)) nodes.push(p);
      });
    }

    return nodes;
  }

  extractText(node) {
    const sel = this._isOldReddit
      ? RedditPlatform.SELECTORS.oldReddit
      : RedditPlatform.SELECTORS.newReddit;

    const bodySelectors = node.tagName.toLowerCase() === 'shreddit-post'
      ? sel.postBody
      : sel.textBody;

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
};
