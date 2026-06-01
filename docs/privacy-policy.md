# SlopFilter Privacy Policy

**Last updated:** June 2026  
**Applies to:** SlopFilter and SlopFilter (Beta) browser extensions

## Summary

SlopFilter runs entirely in your browser. We do not operate servers that receive your browsing data, posts, or classification results.

## What the extension accesses

- **Page content on Reddit and LinkedIn** — post text is read from the page DOM so it can be scored locally. Text is not sent to our servers.
- **Extension storage** — your settings (sensitivity, display mode, enabled sites) are stored with `chrome.storage.sync` in your Google account’s Chrome sync data, if sync is enabled.
- **Local statistics** — scan/flag counts shown in the popup are kept in `chrome.storage.local` on your device.

## What leaves your device

On first use (and when the model cache is cleared), the extension downloads the open-source **TMR AI text detector** model files from [Hugging Face](https://huggingface.co/) (`onnx-community/tmr-ai-text-detector-ONNX`). Those files are cached by the browser. No API keys or account credentials are required.

The extension may also load ONNX WebAssembly runtime files bundled inside the extension package (`vendor/transformers/`).

## What we do not collect

- No analytics or tracking SDKs
- No accounts or sign-in
- No sale or sharing of personal data
- No cloud classification API — inference runs on your machine

## Third parties

- **Hugging Face** — model hosting only; governed by [Hugging Face’s privacy policy](https://huggingface.co/privacy).
- **Google Chrome Web Store** — distribution and updates; governed by Google’s policies.

## Children

SlopFilter is not directed at children under 13.

## Changes

We may update this policy for new features (e.g. additional sites). The “Last updated” date will change accordingly.

## Contact

For beta feedback or privacy questions, open an issue in the project repository or contact the maintainer listed on the Chrome Web Store listing.
