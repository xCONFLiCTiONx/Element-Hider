let styleTag = null;
let observer = null;
let lastRightClickedElement = null;

function applyHiddenStyles() {
    try {
        chrome.storage.local.get(['HiddenElements'], (result) => {
            const siteRules = result.HiddenElements || {};
            const currentHostname = window.location.hostname;
            const rules = siteRules[currentHostname] || [];
            
            if (rules.length === 0) {
                if (styleTag) styleTag.textContent = '';
                return;
            }

            const cssRules = rules.join('\n\n');

            if (!styleTag || !document.head.contains(styleTag)) {
                styleTag = document.createElement('style');
                styleTag.id = 'element-hider-injected-styles';
                (document.head || document.documentElement).appendChild(styleTag);
            }
            if (styleTag.textContent !== cssRules) {
                styleTag.textContent = cssRules;
            }

            applyStylesToShadowRoots(document.documentElement, cssRules);
        });
    } catch (e) {}
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

function getElementPath(el) {
    if (el.id) {
        return `#${CSS.escape(el.id)}`;
    } else if (el.hasAttribute('data-qa')) {
        return `[data-qa="${CSS.escape(el.getAttribute('data-qa'))}"]`;
    } else if (el.hasAttribute('data-testid')) {
        return `[data-testid="${CSS.escape(el.getAttribute('data-testid'))}"]`;
    } else if (el.hasAttribute('aria-label')) {
        return `[aria-label="${CSS.escape(el.getAttribute('aria-label'))}"]`;
    } else {
        let tag = el.tagName.toLowerCase();
        let classes = Array.from(el.classList || []).filter(c => 
            !c.startsWith('_') && 
            !c.includes('jw-') && 
            c.length > 2
        );
        
        if (classes.length > 0) {
            return `${tag}.${classes.map(c => CSS.escape(c)).join('.')}`;
        } else {
            let parent = el.parentElement;
            if (parent) {
                let index = Array.from(parent.children).indexOf(el) + 1;
                return `${parent.tagName.toLowerCase()} > ${tag}:nth-child(${index})`;
            } else {
                return tag;
            }
        }
    }
}

document.addEventListener("contextmenu", (event) => {
    if (!event || !event.target) return;
    let el = event.target;
    if (!el.tagName || el.tagName === 'HTML' || el.tagName === 'BODY') return;
    
    let path = getElementPath(el);
    lastRightClickedElement = `${path} {\n    display: none !important;\n}`;
});

function showNotificationPopup() {
    const existing = document.getElementById('element-hider-notification');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'element-hider-notification';
    banner.innerHTML = `
        <span style="font-family: monospace; font-size: 13px;">Element hidden!</span>
        <button id="eh-options-btn" style="background: #007acc; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">View Options Page</button>
        <button id="eh-close-btn" style="background: transparent; color: #aaa; border: none; cursor: pointer; font-size: 14px; padding: 0 4px;">&times;</button>
    `;
    
    banner.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647;
        background: #181818;
        color: #f0f0f0;
        padding: 12px 16px;
        border-radius: 6px;
        border: 1px solid #333;
        box-shadow: 0 6px 16px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: sans-serif;
        transition: opacity 0.5s ease;
        opacity: 1;
    `;

    document.body.appendChild(banner);

    let fadeTimer = null;
    let isHovered = false;

    function startTimer() {
        fadeTimer = setTimeout(() => {
            if (!isHovered) {
                banner.style.opacity = '0';
                setTimeout(() => banner.remove(), 500);
            }
        }, 7000);
    }

    banner.addEventListener('mouseenter', () => {
        isHovered = true;
        if (fadeTimer) clearTimeout(fadeTimer);
    });

    banner.addEventListener('mouseleave', () => {
        isHovered = false;
        startTimer();
    });

    document.addEventListener('click', function dismissOnClick(e) {
        if (!banner.contains(e.target)) {
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 500);
            document.removeEventListener('click', dismissOnClick);
        }
    });

    document.getElementById('eh-options-btn').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "openOptions" });
        banner.remove();
    });

    document.getElementById('eh-close-btn').addEventListener('click', () => {
        banner.style.opacity = '0';
        setTimeout(() => banner.remove(), 500);
    });

    startTimer();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "hideElementClicked" && lastRightClickedElement) {
        const hostname = window.location.hostname;
        chrome.storage.local.get(['HiddenElements'], (result) => {
            const siteRules = result.HiddenElements || {};
            if (!siteRules[hostname]) {
                siteRules[hostname] = [];
            }
            if (!siteRules[hostname].includes(lastRightClickedElement)) {
                siteRules[hostname].push(lastRightClickedElement);
            }
            chrome.storage.local.set({ HiddenElements: siteRules }, () => {
                showNotificationPopup();
                sendResponse({ status: "success" });
            });
        });
        return true;
    }
});