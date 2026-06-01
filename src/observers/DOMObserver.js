var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * Watches the DOM for new content nodes (SPAs load content dynamically).
 * Uses MutationObserver with debouncing to avoid excessive processing.
 *
 * Single Responsibility: only observes DOM mutations and fires callbacks.
 */
SlopFilter.DOMObserver = class DOMObserver {

  /**
   * @param {Function} callback  Called with no args when new nodes may exist.
   * @param {number}   [debounceMs=300] Minimum interval between callback fires.
   */
  constructor(callback, debounceMs = 300) {
    this._callback = callback;
    this._debounceMs = debounceMs;
    this._timer = null;
    this._observer = null;
  }

  /**
   * Start observing the document body for child/subtree additions.
   */
  start() {
    if (this._observer) return;

    this._observer = new MutationObserver(() => this._scheduleCallback());

    this._observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Fire once immediately to scan existing content
    this._callback();
  }

  /**
   * Stop observing.
   */
  stop() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  /** @private */
  _scheduleCallback() {
    if (this._timer) return;
    this._timer = setTimeout(() => {
      this._timer = null;
      this._callback();
    }, this._debounceMs);
  }
};
