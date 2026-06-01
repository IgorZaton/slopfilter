/**
 * Builds a Chrome Web Store upload ZIP from built extension artifacts.
 *
 * Usage:
 *   node scripts/package-extension.mjs [--channel=beta|release]
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

const channel = parseChannel(process.argv.slice(2));
const overridesPath =
  channel === 'beta'
    ? path.join(projectRoot, 'store', 'beta.overrides.json')
    : null;

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
  { from: 'offscreen/offscreen.bundle.js', to: 'offscreen/offscreen.bundle.js' },
];

const REQUIRED_ARTIFACTS = [
  'offscreen/offscreen.bundle.js',
  'vendor/transformers',
  'icons/icon-16.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
];

await assertArtifacts();
const manifest = await loadManifestForChannel();
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
console.log(`\nChannel: ${channel}`);
console.log(`Staged:  ${path.relative(projectRoot, stageDir)}/`);
console.log(`Upload:  ${path.relative(projectRoot, zipPath)} (${sizeMb} MB)`);
console.log('\nNext: see docs/CHROME_WEB_STORE_BETA.md');

function parseChannel(argv) {
  for (const arg of argv) {
    if (arg.startsWith('--channel=')) {
      const value = arg.slice('--channel='.length);
      if (value === 'beta' || value === 'release') return value;
      throw new Error(`Invalid channel "${value}". Use beta or release.`);
    }
  }
  return 'beta';
}

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

async function loadManifestForChannel() {
  const manifestPath = path.join(projectRoot, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  if (!overridesPath) return manifest;

  const overrides = JSON.parse(await readFile(overridesPath, 'utf8'));
  return mergeManifest(manifest, overrides);
}

function mergeManifest(base, overrides) {
  const merged = { ...base, ...overrides };
  if (overrides.action) {
    merged.action = { ...base.action, ...overrides.action };
  }
  return merged;
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
