import { access, cp, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const transformersDist = path.join(projectRoot, 'node_modules', '@huggingface', 'transformers', 'dist');
const onnxWebDist = path.join(projectRoot, 'node_modules', 'onnxruntime-web', 'dist');
const vendorDir = path.join(projectRoot, 'vendor', 'transformers');

await mkdir(vendorDir, { recursive: true });

const requiredFiles = [
  { from: path.join(transformersDist, 'transformers.min.js'), to: 'transformers.min.js' },
  { from: path.join(transformersDist, 'ort-wasm-simd-threaded.jsep.mjs'), to: 'ort-wasm-simd-threaded.jsep.mjs' },
  { from: path.join(transformersDist, 'ort-wasm-simd-threaded.jsep.wasm'), to: 'ort-wasm-simd-threaded.jsep.wasm' },
  { from: path.join(onnxWebDist, 'ort.bundle.min.mjs'), to: 'ort.bundle.min.mjs' },
];

const optionalFiles = [
  { from: path.join(onnxWebDist, 'ort-wasm-simd-threaded.mjs'), to: 'ort-wasm-simd-threaded.mjs' },
  { from: path.join(onnxWebDist, 'ort-wasm-simd-threaded.wasm'), to: 'ort-wasm-simd-threaded.wasm' },
];

let copied = 0;

for (const file of [...requiredFiles, ...optionalFiles]) {
  try {
    await access(file.from);
  } catch {
    if (requiredFiles.includes(file)) {
      throw new Error(`Missing required ONNX asset: ${file.from}`);
    }
    continue;
  }

  await cp(file.from, path.join(vendorDir, file.to));
  copied++;
}

console.log(`Copied ${copied} ONNX runtime assets to ${path.relative(projectRoot, vendorDir)}`);
console.log('Offscreen runtime: offscreen/offscreen.boot.js (no esbuild bundle)');
