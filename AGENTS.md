## Cursor Cloud specific instructions

This is a Chrome browser extension (Manifest V3) with zero external dependencies and no build step.

- **No `npm install` or build commands needed.** All source is plain JavaScript loaded directly by Chrome.
- **To test:** Load the project as an unpacked extension in Chrome via `chrome://extensions` → Developer mode → Load unpacked.
- **To run unit tests on the classifier:** Use Node.js directly — the classifier classes can be loaded in Node by prepending `var SlopFilter = {};` and using `require()` or pasting into a REPL. There is no formal test framework yet.
- **Content scripts** are injected on `*.reddit.com` only (see `manifest.json` content_scripts).
- **Architecture follows SOLID principles** — to add a new classification strategy, extend `BaseClassifier`; to support a new platform, extend `BasePlatform`. See `README.md` for details.
- **Popup UI** is in `popup/`. Styles for content injection are in `styles/content.css`.
- **All detection runs locally** — no network calls, no API keys, no secrets required.
