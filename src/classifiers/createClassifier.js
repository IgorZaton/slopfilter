var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * Classifier composition root.
 * Returns the TMR ONNX classifier.
 */
SlopFilter.createClassifier = function createClassifier({
  threshold = 60,
} = {}) {
  return new SlopFilter.OnnxClassifier(threshold);
};
