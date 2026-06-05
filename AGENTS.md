## Cursor Cloud specific instructions

This is a Chrome browser extension (Manifest V3). The core extension remains plain JavaScript.

- **ONNX runtime setup required:** run `npm install` then `npm run build` (or `build:ml` + `build:icons`), then reload unpacked extension. Core content scripts are plain JavaScript loaded directly by Chrome. Build artifacts (`vendor/transformers/`, generated icons) are gitignored — never commit them. Offscreen ML loads `offscreen/offscreen.boot.js` plus copied `transformers.min.js` WASM assets.
- **Store package:** `npm run package` → `dist/slopfilter-<version>.zip` (see `docs/CHROME_WEB_STORE.md`).
- **Icons:** source `icons/myicon.png`; run `npm run build:icons` for PNGs (gitignored).
- **To test:** Load the project as an unpacked extension in Chrome via `chrome://extensions` → Developer mode → Load unpacked.
- **To run unit tests:** `node test/classifier.test.js` exercises legacy heuristic patterns (dev only). Production detection uses ONNX via `OnnxClassifier`.
- **Content scripts** are injected on `*.reddit.com` and `*.linkedin.com` (see `manifest.json` content_scripts).
- **Architecture follows SOLID principles** — to add a new classification strategy, extend `BaseClassifier`; to support a new platform, extend `BasePlatform`. See `README.md` for details.
- **Popup UI** is in `popup/`. Styles for content injection are in `styles/content.css`.
- **All inference runs locally** — no API keys or secrets required. ONNX model files are fetched once from Hugging Face and cached by the browser.
