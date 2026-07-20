function applyHiddenStyles() {
    try {
        const storedData = localStorage.getItem('HiddenElements');
        if (!storedData) return;
        const hiddenPaths = JSON.parse(storedData);
        hiddenPaths.forEach(path => {
            const elements = document.querySelectorAll(path);
            elements.forEach(el => el.style.display = 'none');
        });
    } catch (e) {
        // Silent
    }
}

applyHiddenStyles();
const observer = new MutationObserver(() => applyHiddenStyles());
observer.observe(document.body, { childList: true, subtree: true });

document.addEventListener("contextmenu", (event) => {
    if (!event || !event.target) return;
    
    const el = event.target;
    if (!el.tagName || el.tagName === 'HTML' || el.tagName === 'BODY') return;
    
    let path = el.tagName.toLowerCase();
    if (el.id) {
        path += '#' + el.id;
    } else if (el.classList && el.classList.length > 0) {
        path += '.' + el.classList[0];
    }
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ action: "saveTarget", path: path }, () => {
            const err = chrome.runtime.lastError;
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "hideConfirmed") {
        try {
            const storedData = localStorage.getItem('HiddenElements') || '[]';
            const paths = JSON.parse(storedData);
            if (!paths.includes(request.path)) {
                paths.push(request.path);
                localStorage.setItem('HiddenElements', JSON.stringify(paths));
                applyHiddenStyles();
            }
            sendResponse({ status: "success" });
        } catch (e) {
            // Silent
        }
    }
    return true;
});