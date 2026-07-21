let styleTag = null;

function applyHiddenStyles() {
    try {
        chrome.storage.local.get(['HiddenElements'], (result) => {
            const siteRules = result.HiddenElements || {};
            const currentHostname = window.location.hostname;
            const paths = siteRules[currentHostname] || [];
            
            if (paths.length === 0) {
                if (styleTag) styleTag.textContent = '';
                return;
            }

            // Build a single CSS rule block that forces elements to stay hidden natively
            const cssRules = paths.map(selector => `${selector} { display: none !important; }`).join('\n');

            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'element-hider-injected-styles';
                (document.head || document.documentElement).appendChild(styleTag);
            }
            
            if (styleTag.textContent !== cssRules) {
                styleTag.textContent = cssRules;
            }
        });
    } catch (e) {
        // Silent
    }
}

// Apply immediately on load
applyHiddenStyles();

// Listen for storage changes from the options page or context menu
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.HiddenElements) {
        applyHiddenStyles();
    }
});

document.addEventListener("contextmenu", (event) => {
    if (!event || !event.target) return;
    
    const el = event.target;
    if (!el.tagName || el.tagName === 'HTML' || el.tagName === 'BODY') return;
    
    let path = el.tagName.toLowerCase();
    if (el.hasAttribute('aria-label')) {
        path = `[aria-label="${CSS.escape(el.getAttribute('aria-label'))}"]`;
    } else if (el.hasAttribute('data-test-id')) {
        path = `[data-test-id="${CSS.escape(el.getAttribute('data-test-id'))}"]`;
    } else if (el.id) {
        path += '#' + CSS.escape(el.id);
    } else if (el.classList && el.classList.length > 0) {
        const validClasses = Array.from(el.classList).filter(c => !c.startsWith('_ngcontent'));
        if (validClasses.length > 0) {
            path += '.' + validClasses.map(c => CSS.escape(c)).join('.');
        }
    }
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ action: "saveTarget", path: path, hostname: window.location.hostname }, () => {});
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "hideConfirmed") {
        try {
            chrome.storage.local.get(['HiddenElements'], (result) => {
                const siteRules = result.HiddenElements || {};
                const hostname = request.hostname;
                
                if (!siteRules[hostname]) {
                    siteRules[hostname] = [];
                }
                
                if (!siteRules[hostname].includes(request.path)) {
                    siteRules[hostname].push(request.path);
                    chrome.storage.local.set({ HiddenElements: siteRules }, () => {
                        applyHiddenStyles();
                    });
                }
                sendResponse({ status: "success" });
            });
        } catch (e) {
            // Silent
        }
        return true;
    }
});