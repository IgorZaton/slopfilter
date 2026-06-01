var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * Applies visual treatments to DOM nodes flagged as AI-generated.
 *
 * Three display modes:
 *   - dim:   Reduce opacity; hover to reveal.
 *   - hide:  Collapse content behind a clickable banner.
 *   - badge: Non-intrusive score badge; content stays fully visible.
 *
 * Single Responsibility: only handles rendering, not detection or observation.
 */
SlopFilter.ContentRenderer = class ContentRenderer {

  static CSS_PREFIX = 'sf';

  static CLASSES = Object.freeze({
    flagged:   'sf-flagged',
    dimmed:    'sf-dimmed',
    hidden:    'sf-hidden',
    badged:    'sf-badged',
    badge:     'sf-badge',
    banner:    'sf-hidden-banner',
    revealed:  'sf-revealed',
    scoreHigh: 'sf-score-high',
    scoreMed:  'sf-score-med',
    scoreLow:  'sf-score-low',
  });

  /**
   * @param {{ badgeMin: number, dimMin: number }} [thresholds]
   */
  constructor(thresholds = SlopFilter.DISPLAY_THRESHOLDS) {
    this.setThresholds(thresholds);
  }

  get badgeMin() { return this._badgeMin; }
  get dimMin() { return this._dimMin; }

  setThresholds({ badgeMin, dimMin } = SlopFilter.DISPLAY_THRESHOLDS) {
    this._badgeMin = Math.max(0, Math.min(100, badgeMin));
    this._dimMin = Math.max(this._badgeMin, Math.min(100, dimMin));
  }

  /**
   * Apply visual treatment to a node.
   * @param {HTMLElement}          node   The content container.
   * @param {ClassificationResult} result Output from a classifier.
   * @param {string}               mode   'dim' | 'hide' | 'badge'
   */
  render(node, result, mode) {
    const score = result.score;
    if (score < this.badgeMin) return;

    this.clear(node);
    node.classList.add(ContentRenderer.CLASSES.flagged);
    node.classList.add(this._scoreClass(score));
    this._applyBadge(node, score);

    if (score < this.dimMin) return;

    if (mode === 'hide') {
      this._applyHide(node, result);
    } else if (mode === 'dim') {
      node.classList.add(ContentRenderer.CLASSES.dimmed);
    }
  }

  /**
   * Remove all SlopFilter treatments from a node.
   * @param {HTMLElement} node
   */
  clear(node) {
    const cl = ContentRenderer.CLASSES;
    Object.values(cl).forEach(c => node.classList.remove(c));

    const badge = node.querySelector(`.${cl.badge}`);
    if (badge) badge.remove();

    const banner = node.querySelector(`.${cl.banner}`);
    if (banner) banner.remove();
  }

  /**
   * Remove treatments from all flagged nodes on the page.
   */
  clearAll() {
    document.querySelectorAll(`.${ContentRenderer.CLASSES.flagged}`).forEach(n => {
      this.clear(n);
    });
  }

  // --- Mode implementations ---

  /** @private */
  _applyHide(node, result) {
    node.classList.add(ContentRenderer.CLASSES.hidden);

    const banner = document.createElement('div');
    banner.className = ContentRenderer.CLASSES.banner;
    banner.textContent = `AI content hidden (score: ${result.score})  — click to reveal`;
    banner.addEventListener('click', (e) => {
      e.stopPropagation();
      node.classList.remove(ContentRenderer.CLASSES.hidden);
      node.classList.add(ContentRenderer.CLASSES.revealed);
      banner.remove();
      this._attachBadge(node, result.score);
    });

    node.insertBefore(banner, node.firstChild);
  }

  /** @private */
  _applyBadge(node, score) {
    node.classList.add(ContentRenderer.CLASSES.badged);
    this._attachBadge(node, score);
  }

  /** @private */
  _attachBadge(node, score) {
    if (node.querySelector(`.${ContentRenderer.CLASSES.badge}`)) return;

    const badge = document.createElement('span');
    badge.className = `${ContentRenderer.CLASSES.badge} ${this._scoreClass(score)}`;
    badge.textContent = `AI ${score}`;
    badge.title = `SlopFilter: ${score}% likelihood of AI-generated content`;

    node.style.position = node.style.position || 'relative';
    node.insertBefore(badge, node.firstChild);
  }

  /** @private */
  _scoreClass(score) {
    if (score >= 80) return ContentRenderer.CLASSES.scoreHigh;
    if (score >= 60) return ContentRenderer.CLASSES.scoreMed;
    return ContentRenderer.CLASSES.scoreLow;
  }
};
