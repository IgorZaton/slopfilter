import { mkdir, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import * as esbuild from 'esbuild';

const projectRoot = process.cwd();
const runtimeEntry = path.join(projectRoot, 'offscreen', 'offscreen.runtime.js');
const runtimeOut = path.join(projectRoot, 'offscreen', 'offscreen.bundle.js');
const transformersDist = path.join(projectRoot, 'node_modules', '@huggingface', 'transformers', 'dist');
const vendorDir = path.join(projectRoot, 'vendor', 'transformers');

await mkdir(path.dirname(runtimeOut), { recursive: true });
await mkdir(vendorDir, { recursive: true });

await esbuild.build({
  entryPoints: [runtimeEntry],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: runtimeOut,
  sourcemap: false,
  minify: true,
});

const distFiles = await readdir(transformersDist);
const wasmRuntimeFiles = distFiles.filter((file) => /^ort-wasm.*\.(wasm|mjs)$/.test(file));

for (const file of wasmRuntimeFiles) {
  await cp(path.join(transformersDist, file), path.join(vendorDir, file));
}

console.log(`Built ${path.relative(projectRoot, runtimeOut)}`);
console.log(`Copied ${wasmRuntimeFiles.length} ONNX runtime assets to ${path.relative(projectRoot, vendorDir)}`);
