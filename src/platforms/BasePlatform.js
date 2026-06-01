var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * Abstract platform adapter.
 *
 * Each supported website (Reddit, LinkedIn, X, …) gets its own subclass
 * that knows how to find and extract content from the platform's DOM.
 *
 * Follows Interface Segregation — consumers only depend on this contract,
 * not on platform-specific internals.
 *
 * @abstract
 */
SlopFilter.BasePlatform = class BasePlatform {

  static PROCESSED_ATTR = 'data-sf-processed';

  constructor() {
    if (new.target === BasePlatform) {
      throw new Error('BasePlatform is abstract — use a concrete subclass');
    }
  }

  /** @returns {string} Human-readable platform name. */
  get name() {
    throw new Error('Subclasses must implement get name()');
  }

  /**
   * Find all content container nodes on the current page.
   * @returns {HTMLElement[]}
   */
  getContentNodes() {
    throw new Error('Subclasses must implement getContentNodes()');
  }

  /**
   * Extract the text body from a single content node.
   * @param   {HTMLElement} node
   * @returns {string}
   */
  extractText(node) {
    throw new Error('Subclasses must implement extractText()');
  }

  /**
   * Check if a node has already been processed by the filter.
   * @param {HTMLElement} node
   * @returns {boolean}
   */
  isProcessed(node) {
    return node.hasAttribute(BasePlatform.PROCESSED_ATTR);
  }

  /**
   * Mark a node as processed so it's not re-scanned.
   * @param {HTMLElement} node
   * @param {number}      score
   */
  markProcessed(node, score) {
    node.setAttribute(BasePlatform.PROCESSED_ATTR, String(score));
  }

  /**
   * Remove processing marks from all nodes (e.g. on settings change).
   */
  clearAllMarks() {
    document.querySelectorAll(`[${BasePlatform.PROCESSED_ATTR}]`).forEach(el => {
      el.removeAttribute(BasePlatform.PROCESSED_ATTR);
    });
  }

  /**
   * @param {HTMLElement} node
   * @returns {string|null} Author name/username if extractable.
   */
  extractAuthor(node) {
    return null;
  }
};
