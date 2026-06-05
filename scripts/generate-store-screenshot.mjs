/**
 * Store listing screenshot (1280×800) for Chrome Web Store.
 * Replace with real UI captures later if you prefer.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const outDir = path.join(projectRoot, 'store', 'screenshots');
const outPath = path.join(outDir, 'promo-1280x800.png');

const width = 1280;
const height = 800;

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="80" y="120" fill="#ffffff" font-family="system-ui,sans-serif" font-size="56" font-weight="700">SlopFilter</text>
  <text x="80" y="180" fill="#a0a0b8" font-family="system-ui,sans-serif" font-size="28">The ad blocker for AI-generated content</text>
  <rect x="80" y="240" width="520" height="420" rx="16" fill="#0f0f1a" stroke="#333" stroke-width="2"/>
  <text x="110" y="300" fill="#4ade80" font-family="system-ui,sans-serif" font-size="22" font-weight="600">● Enabled</text>
  <text x="110" y="350" fill="#e0e0e0" font-family="system-ui,sans-serif" font-size="18">Sensitivity: Medium</text>
  <text x="110" y="390" fill="#e0e0e0" font-family="system-ui,sans-serif" font-size="18">Display: Dim</text>
  <text x="110" y="440" fill="#888" font-family="system-ui,sans-serif" font-size="16">Scanned: 42 · Flagged: 7</text>
  <rect x="110" y="480" width="460" height="48" rx="8" fill="#252540"/>
  <text x="130" y="512" fill="#c0c0d0" font-family="system-ui,sans-serif" font-size="15">Reddit · LinkedIn</text>
  <rect x="680" y="260" width="520" height="72" rx="8" fill="#1e1e32" opacity="0.35"/>
  <text x="700" y="305" fill="#888" font-family="system-ui,sans-serif" font-size="16">Likely AI post (dimmed)</text>
  <rect x="680" y="360" width="520" height="120" rx="8" fill="#1e1e32"/>
  <text x="700" y="400" fill="#e0e0e0" font-family="system-ui,sans-serif" font-size="16">Human-written post — full opacity</text>
  <rect x="680" y="500" width="520" height="72" rx="8" fill="#1e1e32" opacity="0.35"/>
  <text x="700" y="545" fill="#888" font-family="system-ui,sans-serif" font-size="16">Score 94 — badge + dim</text>
  <rect x="1050" y="280" width="48" height="24" rx="4" fill="#f87171"/>
  <text x="1062" y="297" fill="#fff" font-family="system-ui,sans-serif" font-size="12" font-weight="600">94</text>
  <text x="80" y="740" fill="#666" font-family="system-ui,sans-serif" font-size="18">On-device ML · No cloud API · Reddit &amp; LinkedIn</text>
</svg>
`;

await mkdir(outDir, { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log(`Wrote ${path.relative(projectRoot, outPath)}`);
