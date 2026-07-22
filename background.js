chrome.runtime.onInstalled.addListener(() => {
    try {
        chrome.contextMenus.create({
            id: "hideElement",
            title: "Hide Element",
            contexts: ["all"]
        });
    } catch (err) {
        console.error("Error creating context menu:", err);
    }
});

// Open options page directly when clicking the extension icon
chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "saveTarget") {
        // Store target path and hostname persistently so the service worker doesn't lose it if it sleeps
        chrome.storage.local.set({
            tempTarget: request.path,
            tempHostname: request.hostname
        });
    }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "hideElement") {
        if (!tab || !tab.id) return;

        chrome.storage.local.get(['tempTarget', 'tempHostname'], (data) => {
            const targetPath = data.tempTarget;
            const targetHostname = data.tempHostname;

            if (!targetPath) return;

            chrome.tabs.sendMessage(tab.id, { 
                action: "hideConfirmed", 
                path: targetPath,
                hostname: targetHostname
            }, () => {
                if (chrome.runtime.lastError) {
                    console.warn("Message error:", chrome.runtime.lastError.message);
                } else {
                    chrome.storage.local.remove(['tempTarget', 'tempHostname']);
                }
            });
        });
    }
});