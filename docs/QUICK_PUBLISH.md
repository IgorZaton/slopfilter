# Publish today — fastest path

Target: **Chrome Web Store** listing live (review usually **1–3 business days**, sometimes faster).

## Before you start (~15 min)

- [ ] **Developer account:** [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) — pay $5 if not done yet.
- [ ] **Merge to `main`** and push so GitHub Pages deploys the privacy policy (workflow in `.github/workflows/pages.yml`).
- [ ] **Enable Pages:** repo **Settings → Pages → Build and deployment → Source: GitHub Actions** (one-time).

**Privacy policy URL** (after Pages deploys):

```text
https://igorzaton.github.io/slopfilter/privacy-policy.html
```

If the root URL is 404, enable Pages: [Settings → Pages → GitHub Actions](https://github.com/IgorZaton/slopfilter/settings/pages), then run the **Deploy privacy policy to Pages** workflow manually. See [CHROME_WEB_STORE.md](./CHROME_WEB_STORE.md#github-pages-setup).

## Build upload assets (~2 min)

```bash
npm install
npm run store:assets
```

You get:

| File | Use |
|------|-----|
| `dist/slopfilter-<version>.zip` | Upload in dashboard |
| `icons/icon-128.png` | Store icon |
| `store/screenshots/promo-1280x800.png` | Screenshot (swap for real UI later) |

**Smoke test:** `chrome://extensions` → Load unpacked → `dist/slopfilter-<version>/` → open a supported social site.

## Dashboard — new item (~20 min)

1. [Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **New item** → upload `dist/slopfilter-<version>.zip`.
2. **Store listing**
   - **Name:** SlopFilter
   - **Summary:** `Spot likely AI posts on social feeds. Dim, hide, or badge slop — on-device ML, no cloud API.`
   - **Description:** copy from [`store/listing.md`](../store/listing.md)
   - **Category:** Productivity
   - **Language:** English
   - **Icon:** `icons/icon-128.png`
   - **Screenshot:** `store/screenshots/promo-1280x800.png`
   - **Privacy policy:** `https://igorzaton.github.io/slopfilter/privacy-policy.html`
3. **Privacy**
   - No user data sold
   - Single purpose: *Help users identify and visually de-emphasize likely AI-generated social posts using on-device classification.*
4. **Distribution**
   - **Visibility:** Unlisted or Public
   - **Regions:** all / as you prefer
5. **Submit for review**

## Permission justifications (paste if asked)

| Permission | Text |
|------------|------|
| `storage` | Save user settings and scan statistics shown in the popup. |
| `offscreen` | Run local ONNX ML in a persistent offscreen document (MV3 service workers cannot host WASM inference). |
| Social / forum hosts (listed in manifest) | Read post text from supported pages and apply dim/hide/badge treatments. |
| `huggingface.co` | Download open-source ONNX model weights once; cached locally. No user content sent. |

## After submit

- Check dashboard email for review questions (common for ML + host permissions).
- When **Published**, copy the install link and share it.
- Review can reject for screenshot quality — replace promo PNG with a real capture from a supported site if needed.

## If review is slow

- Ensure privacy policy URL loads in an incognito window.
- Confirm the ZIP loads unpacked without errors.
- Reply promptly to any “remote code” / Hugging Face questions: *only model weights are downloaded; executable code is bundled in the extension.*
