# Publish today — fastest path

Target: **unlisted beta** live in the Chrome Web Store (review usually **1–3 business days**, sometimes faster).

## Before you start (~15 min)

- [ ] **Developer account:** [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) — pay $5 if not done yet.
- [ ] **Merge to `main`** and push so GitHub Pages deploys the privacy policy (workflow in `.github/workflows/pages.yml`).
- [ ] **Enable Pages:** repo **Settings → Pages → Build and deployment → Source: GitHub Actions** (one-time).

**Privacy policy URL** (after Pages deploys):

```text
https://igorzaton.github.io/side-project/privacy-policy.html
```

If the repo is renamed or Pages uses a custom domain, update this URL in the dashboard.

## Build upload assets (~2 min)

```bash
npm install
npm run store:assets
```

You get:

| File | Use |
|------|-----|
| `dist/slopfilter-0.1.0.zip` | Upload in dashboard |
| `icons/icon-128.png` | Store icon |
| `store/screenshots/promo-1280x800.png` | Screenshot (swap for real UI later) |

**Smoke test:** `chrome://extensions` → Load unpacked → `dist/slopfilter-0.1.0/` → open Reddit or LinkedIn.

## Dashboard — new item (~20 min)

1. [Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **New item** → upload `dist/slopfilter-0.1.0.zip`.
2. **Store listing**
   - **Name:** SlopFilter (Beta) *(already in the ZIP manifest)*
   - **Summary:** `Beta: Spot likely AI posts on Reddit & LinkedIn. Dim, hide, or badge slop — on-device ML, no cloud API.`
   - **Description:** copy from [`store/listing-beta.md`](../store/listing-beta.md)
   - **Category:** Productivity
   - **Language:** English
   - **Icon:** `icons/icon-128.png`
   - **Screenshot:** `store/screenshots/promo-1280x800.png`
   - **Privacy policy:** `https://igorzaton.github.io/side-project/privacy-policy.html`
3. **Privacy**
   - No user data sold
   - Single purpose: *Help users identify and visually de-emphasize likely AI-generated social posts on Reddit and LinkedIn using on-device classification.*
4. **Distribution**
   - **Visibility:** Unlisted (beta testers only via link)
   - **Regions:** all / as you prefer
5. **Submit for review**

## Permission justifications (paste if asked)

| Permission | Text |
|------------|------|
| `storage` | Save user settings and local scan statistics. |
| `tabs` / `activeTab` | Show per-site stats in the popup for the active tab. |
| `offscreen` | Run local ONNX ML in a persistent offscreen document (MV3 service workers cannot host WASM inference). |
| Reddit / LinkedIn | Read post text from the page and apply dim/hide/badge treatments. |
| Hugging Face / jsDelivr | Download open-source ONNX model weights once; cached locally. No user content sent. |

## After submit

- Check dashboard email for review questions (common for ML + broad host permissions).
- When **Published**, copy the **unlisted install link** and share with testers.
- Review can reject for screenshot quality — replace promo PNG with a real capture from Reddit/LinkedIn if needed.

## If review is slow

- Ensure privacy policy URL loads in an incognito window.
- Confirm the ZIP loads unpacked without errors.
- Reply promptly to any “remote code” / Hugging Face questions: *only model weights are downloaded; executable code is bundled in the extension.*

## Public release later

```bash
npm run package:release
```

Update listing (drop “Beta”), set visibility to **Public**, new screenshots, submit update.
