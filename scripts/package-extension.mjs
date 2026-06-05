/**
 * Builds a Chrome Web Store upload ZIP from built extension artifacts.
 *
 * Usage:
 *   node scripts/package-extension.mjs
 *
 * Output:
 *   dist/slopfilter-<version>/          (staging folder)
 *   dist/slopfilter-<version>.zip       (upload this)
 */
import archiver from 'archiver';
import {
  access,
  cp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, 'dist');

/** Paths copied into the package (glob * = all files in directory). */
const PACKAGE_PATHS = [
  'manifest.json',
  'background.js',
  'popup',
  'src',
  'styles',
  'icons',
  'vendor',
  { from: 'offscreen/offscreen.html', to: 'offscreen/offscreen.html' },
  { from: 'offscreen/offscreen.boot.js', to: 'offscreen/offscreen.boot.js' },
];

const REQUIRED_ARTIFACTS = [
  'offscreen/offscreen.boot.js',
  'vendor/transformers/transformers.min.js',
  'vendor/transformers/ort-wasm-simd-threaded.jsep.wasm',
  'vendor/transformers/ort.bundle.min.mjs',
  'vendor/transformers',
  'icons/icon-16.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
];

await assertArtifacts();
const manifest = JSON.parse(
  await readFile(path.join(projectRoot, 'manifest.json'), 'utf8')
);
const version = manifest.version;
const slug = `slopfilter-${version}`;
const stageDir = path.join(distRoot, slug);
const zipPath = path.join(distRoot, `${slug}.zip`);

await rm(stageDir, { recursive: true, force: true });
await rm(zipPath, { force: true });
await mkdir(stageDir, { recursive: true });

await stagePackage(stageDir, manifest);
await writeZip(stageDir, zipPath);

const sizeMb = ((await readFile(zipPath)).length / (1024 * 1024)).toFixed(2);
console.log(`\nStaged:  ${path.relative(projectRoot, stageDir)}/`);
console.log(`Upload:  ${path.relative(projectRoot, zipPath)} (${sizeMb} MB)`);
console.log('\nNext: see docs/CHROME_WEB_STORE.md');

async function assertArtifacts() {
  const missing = [];
  for (const rel of REQUIRED_ARTIFACTS) {
    try {
      await access(path.join(projectRoot, rel));
    } catch {
      missing.push(rel);
    }
  }

  if (missing.length === 0) return;

  console.error('Missing build artifacts:\n  ' + missing.join('\n  '));
  console.error('\nRun: npm run build');
  process.exit(1);
}

async function stagePackage(stageDir, manifest) {
  for (const entry of PACKAGE_PATHS) {
    if (typeof entry === 'string') {
      await copyTree(path.join(projectRoot, entry), path.join(stageDir, entry));
      continue;
    }
    await mkdir(path.dirname(path.join(stageDir, entry.to)), { recursive: true });
    await cp(path.join(projectRoot, entry.from), path.join(stageDir, entry.to));
  }

  await writeFile(
    path.join(stageDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  );
}

async function copyTree(src, dest) {
  await cp(src, dest, { recursive: true });
}

function writeZip(sourceDir, zipPath) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}
