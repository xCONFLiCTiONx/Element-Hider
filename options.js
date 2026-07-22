const container = document.getElementById('rules-container');
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');
const domainSelect = document.getElementById('domain-select');
const customDomainInput = document.getElementById('custom-domain-input');
const selectorInput = document.getElementById('selector-input');
const addRuleBtn = document.getElementById('add-rule-btn');

// Populate dropdown with hostnames from currently open tabs and saved domains
function populateDomainDropdown() {
    chrome.tabs.query({}, (tabs) => {
        const domains = new Set();
        
        // Grab domains from all open HTTP/HTTPS tabs
        tabs.forEach(tab => {
            if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
                try {
                    const url = new URL(tab.url);
                    domains.add(url.hostname);
                } catch (e) {}
            }
        });

        // Also include existing domains already saved in local storage
        chrome.storage.local.get(['HiddenElements'], (result) => {
            const siteRules = result.HiddenElements || {};
            Object.keys(siteRules).forEach(d => domains.add(d));

            domainSelect.innerHTML = '';
            
            if (domains.size === 0) {
                const defaultOpt = document.createElement('option');
                defaultOpt.value = '__custom__';
                defaultOpt.textContent = 'Type Custom Domain...';
                domainSelect.appendChild(defaultOpt);
                customDomainInput.style.display = 'inline-block';
            } else {
                const sortedDomains = Array.from(domains).sort();
                sortedDomains.forEach(domain => {
                    const opt = document.createElement('option');
                    opt.value = domain;
                    opt.textContent = domain;
                    domainSelect.appendChild(opt);
                });

                const customOpt = document.createElement('option');
                customOpt.value = '__custom__';
                customOpt.textContent = '-- Type Custom Domain --';
                domainSelect.appendChild(customOpt);
                customDomainInput.style.display = 'none';
            }
        });
    });
}

// Show text input if user selects "Type Custom Domain"
domainSelect.addEventListener('change', () => {
    if (domainSelect.value === '__custom__') {
        customDomainInput.style.display = 'inline-block';
        customDomainInput.focus();
    } else {
        customDomainInput.style.display = 'none';
    }
});

// Cleans up raw inputs so pasting full CSS blocks or single selectors works seamlessly
function cleanSelector(raw) {
    let cleaned = raw.trim();
    if (cleaned.includes('{')) {
        cleaned = cleaned.split('{')[0].trim();
    }
    return cleaned;
}

// Add rule button handler
addRuleBtn.addEventListener('click', () => {
    let targetDomain = domainSelect.value;
    if (targetDomain === '__custom__') {
        targetDomain = customDomainInput.value.trim().toLowerCase();
    }

    const rawInput = selectorInput.value;
    const cleanedSelector = cleanSelector(rawInput);

    if (!targetDomain) {
        alert('Please select or enter a valid domain.');
        return;
    }

    if (!cleanedSelector) {
        alert('Please enter a selector.');
        return;
    }

    chrome.storage.local.get(['HiddenElements'], (result) => {
        const siteRules = result.HiddenElements || {};

        if (!siteRules[targetDomain]) {
            siteRules[targetDomain] = [];
        }

        // Appends to the existing domain array without deleting old elements
        if (!siteRules[targetDomain].includes(cleanedSelector)) {
            siteRules[targetDomain].push(cleanedSelector);
        }

        chrome.storage.local.set({ HiddenElements: siteRules }, () => {
            selectorInput.value = '';
            if (domainSelect.value === '__custom__') {
                customDomainInput.value = '';
            }
            renderRules();
            populateDomainDropdown();
        });
    });
});

function renderRules() {
    chrome.storage.local.get(['HiddenElements'], (result) => {
        const allRules = result.HiddenElements || {};
        const savedDomains = Object.keys(allRules).sort();
        container.innerHTML = '';

        if (savedDomains.length === 0) {
            container.innerHTML = '<div class="no-rules" style="text-align: center;">No saved rules found.</div>';
            return;
        }

        savedDomains.forEach(domain => {
            const paths = allRules[domain] || [];

            const card = document.createElement('div');
            card.className = 'domain-card';

            const header = document.createElement('div');
            header.className = 'domain-header';
            header.innerHTML = `<span>${domain}</span>`;

            if (paths.length > 0) {
                const clearBtn = document.createElement('button');
                clearBtn.className = 'delete-btn';
                clearBtn.textContent = 'Clear All for Domain';
                clearBtn.onclick = () => {
                    delete allRules[domain];
                    saveAndRefresh(allRules);
                };
                header.appendChild(clearBtn);
            }
            card.appendChild(header);

            if (paths.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'no-rules';
                emptyMsg.textContent = 'No hidden elements for this site.';
                card.appendChild(emptyMsg);
            } else {
                const ul = document.createElement('ul');
                paths.forEach((path, index) => {
                    const li = document.createElement('li');
                    
                    const textSpan = document.createElement('span');
                    textSpan.textContent = path;
                    li.appendChild(textSpan);

                    const deleteItemBtn = document.createElement('button');
                    deleteItemBtn.className = 'delete-btn';
                    deleteItemBtn.textContent = 'Delete';
                    deleteItemBtn.onclick = () => {
                        paths.splice(index, 1);
                        if (paths.length === 0) {
                            delete allRules[domain];
                        } else {
                            allRules[domain] = paths;
                        }
                        saveAndRefresh(allRules);
                    };
                    li.appendChild(deleteItemBtn);
                    ul.appendChild(li);
                });
                card.appendChild(ul);
            }

            container.appendChild(card);
        });
    });
}

function saveAndRefresh(newRules) {
    chrome.storage.local.set({ HiddenElements: newRules }, () => {
        renderRules();
        populateDomainDropdown();
    });
}

// Export stored rules to a JSON file
exportBtn.addEventListener('click', () => {
    chrome.storage.local.get(['HiddenElements'], (result) => {
        const allRules = result.HiddenElements || {};
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allRules, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "element-hider-backup.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });
});

// Import rules from a JSON backup file
importFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedRules = JSON.parse(e.target.result);
            if (importedRules && typeof importedRules === 'object') {
                chrome.storage.local.set({ HiddenElements: importedRules }, () => {
                    renderRules();
                    populateDomainDropdown();
                    alert("Backup imported successfully!");
                });
            } else {
                alert("Invalid backup file format.");
            }
        } catch (err) {
            alert("Error parsing JSON file.");
        }
        importFile.value = '';
    };
    reader.readAsText(file);
});

// Initial load
renderRules();
populateDomainDropdown();