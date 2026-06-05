/**
 * SlopFilter — background service worker (MV3).
 *
 * Responsibilities:
 *   - Relay stats between content scripts and the popup.
 *   - Could later handle alarms, badge updates, or analytics aggregation.
 */

let currentStats = { scanned: 0, flagged: 0 };
let offscreenReadyPromise = null;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'stats:update':
      currentStats = msg.data;
      updateBadge(currentStats);
      sendResponse({ ok: true });
      break;

    case 'stats:get':
      sendResponse(currentStats);
      break;

    case 'ai:classify':
      classifyWithOnnx(msg.text).then(sendResponse).catch((err) => {
        sendResponse({
          ok: false,
          error: err && err.message ? err.message : String(err),
        });
      });
      break;

    case 'ai:warmup':
      ensureOffscreenDocument()
        .then(() => warmupOffscreenRuntime())
        .then(() => {
          sendResponse({ ok: true });
        })
        .catch((err) => {
          sendResponse({
            ok: false,
            error: err && err.message ? err.message : String(err),
          });
        });
      break;

    case 'ai:classify:offscreen':
      return false;

    default:
      sendResponse({ error: 'unknown message type' });
  }

  return true;
});

function updateBadge(stats) {
  const text = stats.flagged > 0 ? String(stats.flagged) : '';
  const color = stats.flagged > 0 ? '#f87171' : '#4ade80';

  chrome.action.setBadgeText({ text }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({ color }).catch(() => {});
}

async function warmupOffscreenRuntime() {
  return sendOffscreenMessage({ type: 'ai:warmup:offscreen' });
}

async function classifyWithOnnx(text) {
  await ensureOffscreenDocument();
  return sendOffscreenMessage({
    type: 'ai:classify:offscreen',
    text,
  });
}

function sendOffscreenMessage(payload) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(payload, (response) => {
        if (chrome.runtime?.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response || { ok: false, error: 'no response from offscreen runtime' });
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function ensureOffscreenDocument() {
  if (offscreenReadyPromise) return offscreenReadyPromise;

  offscreenReadyPromise = (async () => {
    const url = 'offscreen/offscreen.html';

    if (chrome.offscreen?.hasDocument) {
      const exists = await chrome.offscreen.hasDocument();
      if (exists) return;
    }

    await chrome.offscreen.createDocument({
      url,
      reasons: ['WORKERS'],
      justification: 'Run local ONNX classifier without service worker suspension',
    });
  })();

  try {
    await offscreenReadyPromise;
  } catch (err) {
    offscreenReadyPromise = null;
    throw err;
  }
}
