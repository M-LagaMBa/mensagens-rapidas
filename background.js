chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes("ascbrazil.com.br")) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_widget" }).catch(() => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
    });
  }
});