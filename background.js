let lastRightClickedElement = null;
let lastRightClickedHostname = null;

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
        lastRightClickedElement = request.path;
        lastRightClickedHostname = request.hostname;
    }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "hideElement" && lastRightClickedElement) {
        if (!tab || !tab.id) return;

        chrome.tabs.sendMessage(tab.id, { 
            action: "hideConfirmed", 
            path: lastRightClickedElement,
            hostname: lastRightClickedHostname
        }, () => {
            if (chrome.runtime.lastError) {
                console.warn("Message error:", chrome.runtime.lastError.message);
            } else {
                lastRightClickedElement = null;
                lastRightClickedHostname = null;
            }
        });
    }
});