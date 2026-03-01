// Background service worker — Manifest V3
// Listens for tab updates and clears stale cache entries older than 1 hour.

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== 'complete') return;

  // Prune cache entries older than 1 hour
  chrome.storage.local.get(null, (items) => {
    const expired = Object.entries(items)
      .filter(([, v]) => v?.ts && Date.now() - v.ts > 3_600_000)
      .map(([k]) => k);
    if (expired.length) chrome.storage.local.remove(expired);
  });
});
