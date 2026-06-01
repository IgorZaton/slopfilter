import { env, pipeline } from '@huggingface/transformers';

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('vendor/transformers/');

const MODEL_ID = 'onnx-community/tmr-ai-text-detector-ONNX';
const DTYPE = 'q8';

let classifierPromise = null;
let chain = Promise.resolve();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'ai:classify:offscreen') {
    return false;
  }

  chain = chain.then(async () => classifyText(msg.text)).then((result) => {
    sendResponse(result);
  }).catch((err) => {
    sendResponse({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  });

  return true;
});

async function getClassifier() {
  if (classifierPromise) return classifierPromise;

  classifierPromise = pipeline('text-classification', MODEL_ID, {
    dtype: DTYPE,
  });

  try {
    return await classifierPromise;
  } catch (err) {
    classifierPromise = null;
    throw err;
  }
}

async function classifyText(text) {
  if (!text || !text.trim()) {
    return {
      ok: true,
      score: 0,
      isAI: false,
      probability: 0,
      label: 'HUMAN',
    };
  }

  const classifier = await getClassifier();
  const outputs = await classifier(text, {
    top_k: 2,
  });

  const aiProbability = resolveAiProbability(outputs);
  const score = Math.round(aiProbability * 100);

  return {
    ok: true,
    score,
    isAI: aiProbability >= 0.5,
    probability: aiProbability,
    label: aiProbability >= 0.5 ? 'AI' : 'HUMAN',
  };
}

function resolveAiProbability(outputs) {
  const normalized = Array.isArray(outputs) ? outputs : [outputs];
  let ai = 0;

  for (const item of normalized) {
    const label = String(item.label || '').toUpperCase();
    const score = Number(item.score || 0);

    if (label.includes('AI') || label.includes('FAKE') || label === 'LABEL_1') {
      ai = Math.max(ai, score);
    } else if (label.includes('HUMAN') || label.includes('REAL') || label === 'LABEL_0') {
      ai = Math.max(ai, 1 - score);
    }
  }

  return Math.max(0, Math.min(1, ai));
}
