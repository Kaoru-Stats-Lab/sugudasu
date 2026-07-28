/**
 * Side Panel 起動 · タブ抽出中継（optional host 前提）
 */

const CONTENT_FILES = ['content/adapters/google_maps.js', 'content/extract.js'];

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'MENTION_PING') {
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === 'MENTION_EXTRACT_ACTIVE_TAB') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
          sendResponse({ ok: false, error: 'active_tab_missing' });
          return;
        }
        try {
          const res = await chrome.tabs.sendMessage(tab.id, { type: 'MENTION_EXTRACT' });
          sendResponse({
            ok: true,
            tab: { id: tab.id, url: tab.url, title: tab.title },
            signals: res?.signals || null,
            error: res?.error || null,
          });
        } catch {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: CONTENT_FILES,
          });
          const res = await chrome.tabs.sendMessage(tab.id, { type: 'MENTION_EXTRACT' });
          sendResponse({
            ok: true,
            tab: { id: tab.id, url: tab.url, title: tab.title },
            signals: res?.signals || null,
            error: res?.error || null,
          });
        }
      } catch (err) {
        sendResponse({ ok: false, error: String(err?.message || err) });
      }
    })();
    return true;
  }

  return false;
});
