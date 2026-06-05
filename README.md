# SlopFilter

The ad blocker for AI-generated content. Detects and dims AI slop so you can read what humans actually wrote.

## What it does

SlopFilter is a browser extension that detects likely AI-generated text on social platforms using a **local TMR ONNX classifier** — no cloud APIs, no data leaves your browser.

**Supported platforms:** Reddit, LinkedIn, X/Twitter, Facebook, Instagram, YouTube, Hacker News, Stack Overflow/StackExchange, Medium, Substack (via generic fallback where no dedicated adapter exists)

**Display modes:**
- **Dim** — reduces flagged content to 25% opacity; hover to read
- **Hide** — collapses flagged content behind a clickable banner
- **Badge** — adds a non-intrusive score badge; content stays visible

## How detection works

Each post is scored **0–100** by `onnx-community/tmr-ai-text-detector-ONNX` (quantized q8).

**Sensitivity** (popup) sets badge and dim/hide cutoffs:

| Sensitivity | Badge | Dim / hide |
|-------------|------:|-----------:|
| High | 50+ | 86+ |
| Medium (default) | 65+ | 92+ |
| Low | 80+ | 96+ |

Posts between the badge and dim thresholds get a badge only. In **badge** display mode, dim/hide is never applied regardless of score.

## Install for development

1. Clone this repository
2. Run `npm install`
3. Run `npm run build` (ML bundle + icons)
4. Open `chrome://extensions` in Chrome
5. Enable **Developer mode** (top right)
6. Click **Load unpacked** and select this project folder
7. Navigate to a supported social/forum site — the extension is active

The ONNX model is downloaded on first classification and then cached by the browser.

## Run smoke tests

- `node test/classifier.test.js`
- `node test/settings.test.js`

## Chrome Web Store

**Publish:** [docs/QUICK_PUBLISH.md](docs/QUICK_PUBLISH.md)

```bash
npm run store:assets   # ZIP + screenshot + icons
```

Upload `dist/slopfilter-<version>.zip`. More detail: [docs/CHROME_WEB_STORE.md](docs/CHROME_WEB_STORE.md).

## Architecture

```
src/
├── classifiers/
│   ├── BaseClassifier.js      ← Abstract base (extend for new strategies)
│   ├── OnnxClassifier.js    ← Background bridge to ONNX runtime
│   └── createClassifier.js    ← Classifier factory
├── offscreen/
│   ├── offscreen.html         ← Persistent MV3 offscreen document
│   ├── offscreen.boot.js      ← ONNX model runtime (loads vendor/transformers)
│   └── offscreen.html         ← Offscreen document entry
├── platforms/
│   ├── BasePlatform.js        ← Abstract base (extend for new sites)
│   ├── RedditPlatform.js      ← Reddit DOM adapter
│   ├── LinkedInPlatform.js    ← LinkedIn DOM adapter
│   ├── GenericPlatform.js     ← Generic social/forum fallback adapter
│   └── createPlatform.js      ← Hostname → platform factory
├── renderers/
│   └── ContentRenderer.js     ← Visual treatment (dim/hide/badge)
├── observers/
│   └── DOMObserver.js         ← MutationObserver with debouncing
├── settings/
│   └── Settings.js            ← chrome.storage.sync wrapper
└── content.js                 ← Composition root (wires everything)
```

**Extending the classifier:**
```js
class MyClassifier extends SlopFilter.BaseClassifier {
  async classify(text) {
    return { score, isAI, signals };
  }
}
```

**Adding a new platform:**
```js
class LinkedInPlatform extends SlopFilter.BasePlatform {
  get name() { return 'LinkedIn'; }
  getContentNodes() { /* LinkedIn DOM logic */ }
  extractText(node) { /* LinkedIn text extraction */ }
}
```

## Tech stack

- Pure JavaScript (ES2020+)
- Chrome Manifest V3
- `@huggingface/transformers` (TMR ONNX q8)
- Minimal esbuild step for offscreen ML runtime

## Troubleshooting

- Reload the extension after `npm run build:ml`.
- First classification can take longer while the model downloads (~100 MB).
- Enable **Debug Overlay** in the popup to show diagnostic text in the bottom-right corner.
- If debug overlay is enabled and you see `onnx error: ...` or `no available backend found`, run `npm run build`, reload the extension, and wait for the first model download to finish.
- ONNX runtime files must exist under `vendor/transformers/` (`transformers.min.js`, `ort.bundle.min.mjs`, `ort-wasm-simd-threaded.jsep.*`). Do not use CDN script loading.
- If `LinkedIn nodes=0`, DOM selectors may need updating for your feed layout.
