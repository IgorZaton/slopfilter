# SlopFilter

The ad blocker for AI-generated content. Detects and dims AI slop so you can read what humans actually wrote.

## What it does

SlopFilter is a browser extension that detects likely AI-generated text on social platforms using **local linguistic heuristics** — no cloud APIs, no data leaves your browser.

**Supported platforms:** Reddit (more coming soon)

**Display modes:**
- **Dim** — reduces flagged content to 25% opacity; hover to read
- **Hide** — collapses flagged content behind a clickable banner
- **Badge** — adds a non-intrusive score badge; content stays visible

## How detection works

Text is scored 0–100 using five independent signals:

| Signal | Max Score | What it detects |
|--------|-----------|----------------|
| Filler phrases | 35 | "delve into", "it's worth noting", "in today's fast-paced world"… |
| Sentence uniformity | 25 | AI writes suspiciously even-length sentences |
| Structural patterns | 20 | Em-dash abuse, excessive bullet/numbered lists |
| Repetitive openers | 10 | "The… The… The… This… This…" |
| Transition abuse | 10 | Overuse of "Furthermore", "Moreover", "Additionally"… |

Score 60+ = likely AI (medium sensitivity). Adjustable via popup.

## Install for development

1. Clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select this project folder
5. Navigate to Reddit — the extension is active

No build step. No npm. No dependencies.

## Architecture

```
src/
├── classifiers/
│   ├── BaseClassifier.js      ← Abstract base (extend for new strategies)
│   └── HeuristicClassifier.js ← Linguistic heuristic implementation
├── platforms/
│   ├── BasePlatform.js        ← Abstract base (extend for new sites)
│   └── RedditPlatform.js      ← Reddit DOM adapter
├── renderers/
│   └── ContentRenderer.js     ← Visual treatment (dim/hide/badge)
├── observers/
│   └── DOMObserver.js         ← MutationObserver with debouncing
├── settings/
│   └── Settings.js            ← chrome.storage.sync wrapper
├── data/
│   └── patterns.js            ← Detection pattern data
└── content.js                 ← Composition root (wires everything)
```

**Extending the classifier:**
```js
class LLMClassifier extends SlopFilter.BaseClassifier {
  classify(text) {
    // Your LLM-based classification logic
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
- No external dependencies
- No build step
