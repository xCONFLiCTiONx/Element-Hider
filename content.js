let styleTag = null;
let observer = null;

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

            const cssRules = paths.map(selector => `${selector} { display: none !important; }`).join('\n');

            // Apply to main document
            if (!styleTag || !document.head.contains(styleTag)) {
                styleTag = document.createElement('style');
                styleTag.id = 'element-hider-injected-styles';
                (document.head || document.documentElement).appendChild(styleTag);
            }
            if (styleTag.textContent !== cssRules) {
                styleTag.textContent = cssRules;
            }

            // Recursively apply to all open Shadow DOM roots (fixes Pluto TV components)
            applyStylesToShadowRoots(document.documentElement, cssRules);
        });
    } catch (e) {
        // Silent
    }
}

function applyStylesToShadowRoots(root, cssRules) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.shadowRoot) {
            let shadowStyle = node.shadowRoot.getElementById('element-hider-shadow-styles');
            if (!shadowStyle) {
                shadowStyle = document.createElement('style');
                shadowStyle.id = 'element-hider-shadow-styles';
                node.shadowRoot.appendChild(shadowStyle);
            }
            if (shadowStyle.textContent !== cssRules) {
                shadowStyle.textContent = cssRules;
            }
            applyStylesToShadowRoots(node.shadowRoot, cssRules);
        }
    }
}

function initObserver() {
    if (observer) return;
    observer = new MutationObserver(() => {
        applyHiddenStyles();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
}

applyHiddenStyles();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver);
} else {
    initObserver();
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.HiddenElements) {
        applyHiddenStyles();
    }
});

document.addEventListener("contextmenu", (event) => {
    if (!event || !event.target) return;
    
    let el = event.target;
    if (!el.tagName || el.tagName === 'HTML' || el.tagName === 'BODY') return;
    
    let path = '';
    if (el.id) {
        path = `#${CSS.escape(el.id)}`;
    } else if (el.hasAttribute('data-qa')) {
        path = `[data-qa="${CSS.escape(el.getAttribute('data-qa'))}"]`;
    } else if (el.hasAttribute('data-testid')) {
        path = `[data-testid="${CSS.escape(el.getAttribute('data-testid'))}"]`;
    } else if (el.hasAttribute('aria-label')) {
        path = `[aria-label="${CSS.escape(el.getAttribute('aria-label'))}"]`;
    } else {
        let tag = el.tagName.toLowerCase();
        let classes = Array.from(el.classList || []).filter(c => 
            !c.startsWith('_') && 
            !c.includes('jw-') && 
            c.length > 2
        );
        
        if (classes.length > 0) {
            path = `${tag}.${classes.map(c => CSS.escape(c)).join('.')}`;
        } else {
            let parent = el.parentElement;
            if (parent) {
                let index = Array.from(parent.children).indexOf(el) + 1;
                path = `${parent.tagName.toLowerCase()} > ${tag}:nth-child(${index})`;
            } else {
                path = tag;
            }
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