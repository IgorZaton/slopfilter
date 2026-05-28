var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * Abstract base classifier.
 *
 * Subclass this to implement different classification strategies
 * (heuristic, LLM-based, hybrid, etc.) without changing consumers.
 *
 * Follows Open/Closed and Liskov Substitution — any subclass can
 * replace BaseClassifier wherever it's used.
 *
 * @abstract
 */
SlopFilter.BaseClassifier = class BaseClassifier {

  /**
   * @param {number} threshold Score at or above which text is considered AI-generated.
   */
  constructor(threshold = 60) {
    if (new.target === BaseClassifier) {
      throw new Error('BaseClassifier is abstract — use a concrete subclass');
    }
    this._threshold = threshold;
  }

  get threshold() { return this._threshold; }
  set threshold(value) { this._threshold = Math.max(0, Math.min(100, value)); }

  /**
   * Classify text and return a detailed result.
   *
   * @param   {string} text  Raw text to classify.
   * @returns {ClassificationResult}
   *
   * @typedef  {Object} ClassificationResult
   * @property {number}   score    0-100 overall score.
   * @property {boolean}  isAI     Whether score >= threshold.
   * @property {Signal[]} signals  Breakdown of contributing signals.
   *
   * @typedef  {Object} Signal
   * @property {string} name      Signal identifier.
   * @property {number} score     Partial score from this signal.
   * @property {number} maxScore  Maximum possible for this signal.
   * @property {Object} [details] Signal-specific diagnostic data.
   */
  classify(text) {
    throw new Error('Subclasses must implement classify()');
  }

  /**
   * Convenience method — classify and return only the boolean verdict.
   * @param {string} text
   * @returns {boolean}
   */
  isAIGenerated(text) {
    return this.classify(text).isAI;
  }
};
