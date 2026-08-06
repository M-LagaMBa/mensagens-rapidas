const ALLOWED_DOMAINS = ["ascbrazil.com.br", "desk.blip.ai"];

chrome.action.onClicked.addListener((tab) => {
  if (!tab.url) return;

  const isAllowed = ALLOWED_DOMAINS.some((domain) => tab.url.includes(domain));
  if (!isAllowed) return;

  chrome.tabs.sendMessage(tab.id, { action: "toggle_widget" }).catch(() => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["content.js"]
      },
      () => {
        // Após injetar o content.js pela primeira vez, abre o widget direto
        // 
        chrome.tabs.sendMessage(tab.id, { action: "toggle_widget" });
      }
    );
  });
});
