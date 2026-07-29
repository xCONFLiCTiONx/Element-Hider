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

chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});

// When context menu is clicked, safely send message to content script
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "hideElement") {
        if (tab && tab.id) {
            // Check if URL is valid for content scripts (skip chrome:// or edge:// pages)
            if (tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
                chrome.tabs.sendMessage(tab.id, { action: "hideElementClicked" }, () => {
                    // Catch and suppress errors if connection fails
                    if (chrome.runtime.lastError) {
                        // Content script not yet injected or unavailable on this page
                    }
                });
            }
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openOptions") {
        chrome.runtime.openOptionsPage();
    }
});