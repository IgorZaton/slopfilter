import { pipeline } from '@huggingface/transformers';

const MODEL_ID = 'onnx-community/tmr-ai-text-detector-ONNX';
const text = process.argv.slice(2).join('\n');

if (!text.trim()) {
  console.error('Usage: node scripts/score-text.mjs "<text>"');
  process.exit(1);
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

const classifier = await pipeline('text-classification', MODEL_ID, { dtype: 'q8' });
const outputs = await classifier(text, { top_k: 2 });
const aiProbability = resolveAiProbability(outputs);
const score = Math.round(aiProbability * 100);

console.log(JSON.stringify({
  model: MODEL_ID,
  dtype: 'q8',
  score,
  isAI: score >= 60,
  aiProbability,
  raw: outputs,
}, null, 2));
