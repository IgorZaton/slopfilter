/**
 * SlopFilter — background service worker (MV3).
 *
 * Responsibilities:
 *   - Relay stats between content scripts and the popup.
 *   - Could later handle alarms, badge updates, or analytics aggregation.
 */

let currentStats = { scanned: 0, flagged: 0 };

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
