var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * ONNX-backed classifier client.
 * Delegates inference to the background/offscreen runtime.
 */
SlopFilter.OnnxClassifier = class OnnxClassifier extends SlopFilter.BaseClassifier {

  constructor(threshold = 60) {
    super(threshold);
  }

  async classify(text) {
    if (!SlopFilter.isClassifiableText(text)) {
      return { score: 0, isAI: false, signals: [] };
    }

    const response = await this._sendMessage({
      type: 'ai:classify',
      text,
    });

    if (!response?.ok) {
      throw new Error(response?.error || 'ONNX classifier failed');
    }

    const score = this._clampScore(response.score);
    return {
      score,
      isAI: score >= this.threshold,
      signals: [{
        name: 'onnxTmr',
        score,
        maxScore: 100,
        details: {
          probability: response.probability,
          label: response.label,
        },
      }],
    };
  }

  _clampScore(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  }

  _sendMessage(payload) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(payload, (response) => {
          if (chrome.runtime?.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
};
