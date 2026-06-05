/**
 * Renders icons/myicon.png into PNGs required by manifest.json and Chrome Web Store.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, 'icons', 'myicon.png');
const outDir = path.join(projectRoot, 'icons');
const sizes = [16, 48, 128];

await mkdir(outDir, { recursive: true });

for (const size of sizes) {
  const outPath = path.join(outDir, `icon-${size}.png`);
  await sharp(sourcePath).resize(size, size).png().toFile(outPath);
  console.log(`Wrote ${path.relative(projectRoot, outPath)}`);
}
