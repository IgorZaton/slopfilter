var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * Heuristic-based AI content classifier.
 *
 * Scores text 0-100 using five independent signal detectors:
 *   1. Filler phrase frequency    (0-35)
 *   2. Sentence length uniformity (0-25)
 *   3. Structural patterns        (0-20)
 *   4. Repetitive sentence openers(0-10)
 *   5. Transition word abuse      (0-10)
 *
 * Runs entirely locally — no network calls, no API keys.
 */
SlopFilter.HeuristicClassifier = class HeuristicClassifier
  extends SlopFilter.BaseClassifier {

  constructor(threshold = 60) {
    super(threshold);
    this._patterns = SlopFilter.Patterns;
  }

  classify(text) {
    if (!text || text.length < this._patterns.MIN_TEXT_LENGTH) {
      return { score: 0, isAI: false, signals: [] };
    }

    const signals = [
      this._scoreFillerPhrases(text),
      this._scoreSentenceUniformity(text),
      this._scoreStructuralPatterns(text),
      this._scoreRepetitiveOpeners(text),
      this._scoreTransitionAbuse(text),
    ];

    const score = Math.min(100, signals.reduce((sum, s) => sum + s.score, 0));

    return {
      score,
      isAI: score >= this._threshold,
      signals,
    };
  }

  // --- Private signal detectors ---

  /** @returns {Signal} */
  _scoreFillerPhrases(text) {
    const MAX = 35;
    const matches = [];
    let raw = 0;

    for (const { pattern, weight } of this._patterns.FILLER_PHRASES) {
      const match = text.match(pattern);
      if (match) {
        matches.push(match[0]);
        raw += weight;
      }
    }

    const wordCount = this._countWords(text);
    const density = wordCount > 0 ? raw / (wordCount / 100) : 0;
    // Dampen score for shorter texts to reduce false positives
    const lengthFactor = Math.min(1, wordCount / 150);
    const score = Math.min(MAX, Math.round(density * 3.5 * lengthFactor));

    return { name: 'fillerPhrases', score, maxScore: MAX, details: { matches } };
  }

  /** @returns {Signal} */
  _scoreSentenceUniformity(text) {
    const MAX = 25;
    const sentences = this._splitSentences(text);
    if (sentences.length < 4) {
      return { name: 'sentenceUniformity', score: 0, maxScore: MAX, details: {} };
    }

    const lengths = sentences.map(s => s.split(/\s+/).length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + (l - avg) ** 2, 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    const coeffOfVariation = avg > 0 ? stdDev / avg : 1;

    // Low variation = likely AI. Human writing has CoV typically 0.4-0.8+.
    // AI writing often sits around 0.15-0.35.
    let score = 0;
    if (coeffOfVariation < 0.20) score = MAX;
    else if (coeffOfVariation < 0.30) score = Math.round(MAX * 0.75);
    else if (coeffOfVariation < 0.40) score = Math.round(MAX * 0.45);
    else if (coeffOfVariation < 0.50) score = Math.round(MAX * 0.15);

    return {
      name: 'sentenceUniformity',
      score,
      maxScore: MAX,
      details: { avgLength: +avg.toFixed(1), stdDev: +stdDev.toFixed(2), coeffOfVariation: +coeffOfVariation.toFixed(3) },
    };
  }

  /** @returns {Signal} */
  _scoreStructuralPatterns(text) {
    const MAX = 20;
    let raw = 0;

    const emDashCount = (text.match(this._patterns.EM_DASH_REGEX) || []).length;
    const bulletCount = (text.match(this._patterns.BULLET_REGEX) || []).length;
    const numberedCount = (text.match(this._patterns.NUMBERED_LIST_REGEX) || []).length;

    const wordCount = this._countWords(text);
    const per100 = wordCount > 0 ? 100 / wordCount : 0;

    if (emDashCount * per100 > 1.5) raw += 6;
    else if (emDashCount * per100 > 0.8) raw += 3;

    if (bulletCount >= 5) raw += 6;
    else if (bulletCount >= 3) raw += 3;

    if (numberedCount >= 5) raw += 5;
    else if (numberedCount >= 3) raw += 2;

    // Combined list+dash heavy = strong signal
    if (bulletCount + numberedCount >= 4 && emDashCount >= 3) raw += 3;

    const score = Math.min(MAX, raw);

    return {
      name: 'structuralPatterns',
      score,
      maxScore: MAX,
      details: { emDashCount, bulletCount, numberedCount },
    };
  }

  /** @returns {Signal} */
  _scoreRepetitiveOpeners(text) {
    const MAX = 10;
    const sentences = this._splitSentences(text);
    if (sentences.length < 5) {
      return { name: 'repetitiveOpeners', score: 0, maxScore: MAX, details: {} };
    }

    const openers = sentences
      .map(s => (s.match(/^\s*(\w+)/) || [])[1])
      .filter(Boolean)
      .map(w => w.toLowerCase());

    const freq = {};
    openers.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

    const topWord = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    if (!topWord) {
      return { name: 'repetitiveOpeners', score: 0, maxScore: MAX, details: {} };
    }

    const ratio = topWord[1] / openers.length;

    let score = 0;
    if (ratio > 0.50) score = MAX;
    else if (ratio > 0.40) score = Math.round(MAX * 0.7);
    else if (ratio > 0.30) score = Math.round(MAX * 0.35);

    return {
      name: 'repetitiveOpeners',
      score,
      maxScore: MAX,
      details: { topOpener: topWord[0], count: topWord[1], total: openers.length },
    };
  }

  /** @returns {Signal} */
  _scoreTransitionAbuse(text) {
    const MAX = 10;
    const sentences = this._splitSentences(text);
    if (sentences.length < 4) {
      return { name: 'transitionAbuse', score: 0, maxScore: MAX, details: {} };
    }

    const starters = this._patterns.TRANSITION_STARTERS;
    let hits = 0;

    for (const sentence of sentences) {
      const firstWord = (sentence.match(/^\s*(\w+)/) || [])[1];
      if (firstWord && starters.includes(firstWord.toLowerCase())) {
        hits++;
      }
    }

    const ratio = hits / sentences.length;
    let score = 0;
    if (ratio > 0.35) score = MAX;
    else if (ratio > 0.25) score = Math.round(MAX * 0.7);
    else if (ratio > 0.15) score = Math.round(MAX * 0.35);

    return {
      name: 'transitionAbuse',
      score,
      maxScore: MAX,
      details: { transitionCount: hits, sentenceCount: sentences.length },
    };
  }

  // --- Helpers ---

  _splitSentences(text) {
    return text
      .split(/[.!?\n]+/)
      .map(s => s.replace(/^[\s•\-\*\d\.\)]+/, '').trim())
      .filter(s => s.length > 5);
  }

  _countWords(text) {
    return (text.match(/\b\w+\b/g) || []).length;
  }
};
