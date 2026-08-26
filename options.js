const container = document.getElementById('rules-container');
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');
const domainSelect = document.getElementById('domain-select');
const customDomainInput = document.getElementById('custom-domain-input');
const selectorInput = document.getElementById('selector-input');
const saveRuleBtn = document.getElementById('save-rule-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const editorModeLabel = document.getElementById('editor-mode-label');

let editingIndex = null;
let editingDomain = null;

function populateDomainDropdown() {
    chrome.tabs.query({}, (tabs) => {
        const domains = new Set();
        
        tabs.forEach(tab => {
            if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
                try {
                    const url = new URL(tab.url);
                    domains.add(url.hostname);
                } catch (e) {}
            }
        });

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

domainSelect.addEventListener('change', () => {
    if (domainSelect.value === '__custom__') {
        customDomainInput.style.display = 'inline-block';
        customDomainInput.focus();
    } else {
        customDomainInput.style.display = 'none';
    }
});

function resetEditorState(clearText = true) {
    editingIndex = null;
    editingDomain = null;
    editorModeLabel.textContent = "CSS Code Editor";
    saveRuleBtn.textContent = "Save to List";
    cancelEditBtn.style.display = "none";
    if (clearText) selectorInput.value = '';
}

cancelEditBtn.addEventListener('click', () => {
    resetEditorState();
});

saveRuleBtn.addEventListener('click', () => {
    let targetDomain = domainSelect.value;
    if (targetDomain === '__custom__') {
        targetDomain = customDomainInput.value.trim().toLowerCase();
    }

    const cssRule = selectorInput.value.trim();

    if (!targetDomain) {
        alert('Please select or enter a valid domain.');
        return;
    }

    if (!cssRule) {
        alert('Please enter CSS code in the editor box.');
        return;
    }

    chrome.storage.local.get(['HiddenElements'], (result) => {
        const siteRules = result.HiddenElements || {};

        if (editingDomain && editingIndex !== null) {
            if (siteRules[editingDomain]) {
                siteRules[editingDomain].splice(editingIndex, 1);
                if (siteRules[editingDomain].length === 0) {
                    delete siteRules[editingDomain];
                }
            }
        }

        if (!siteRules[targetDomain]) {
            siteRules[targetDomain] = [];
        }

        siteRules[targetDomain].push(cssRule);

        chrome.storage.local.set({ HiddenElements: siteRules }, () => {
            resetEditorState();
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
            const rules = allRules[domain] || [];

            const card = document.createElement('div');
            card.className = 'domain-card';

            const header = document.createElement('div');
            header.className = 'domain-header';
            header.innerHTML = `<span>${domain}</span>`;

            if (rules.length > 0) {
                const clearBtn = document.createElement('button');
                clearBtn.className = 'delete-btn';
                clearBtn.textContent = 'Clear All for Domain';
                clearBtn.onclick = () => {
                    if (editingDomain === domain) resetEditorState();
                    delete allRules[domain];
                    saveAndRefresh(allRules);
                };
                header.appendChild(clearBtn);
            }
            card.appendChild(header);

            if (rules.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'no-rules';
                emptyMsg.textContent = 'No rules for this site.';
                card.appendChild(emptyMsg);
            } else {
                const ul = document.createElement('ul');
                rules.forEach((rule, index) => {
                    const li = document.createElement('li');
                    
                    const textSpan = document.createElement('span');
                    textSpan.textContent = rule;
                    li.appendChild(textSpan);

                    const editItemBtn = document.createElement('button');
                    editItemBtn.className = 'edit-btn';
                    editItemBtn.textContent = 'Edit in Code Box';
                    editItemBtn.onclick = () => {
                        domainSelect.value = domain;
                        customDomainInput.style.display = 'none';
                        selectorInput.value = rule;
                        
                        editingIndex = index;
                        editingDomain = domain;
                        editorModeLabel.textContent = `Editing Rule for: ${domain}`;
                        saveRuleBtn.textContent = "Update Rule";
                        cancelEditBtn.style.display = "inline-block";

                        selectorInput.focus();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    };
                    li.appendChild(editItemBtn);

                    const deleteItemBtn = document.createElement('button');
                    deleteItemBtn.className = 'delete-btn';
                    deleteItemBtn.textContent = 'Delete';
                    deleteItemBtn.onclick = () => {
                        if (editingDomain === domain && editingIndex === index) {
                            resetEditorState();
                        }
                        rules.splice(index, 1);
                        if (rules.length === 0) {
                            delete allRules[domain];
                        } else {
                            allRules[domain] = rules;
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

// Automatically refresh list and dropdown if storage changes externally (e.g. from another tab)
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.HiddenElements) {
        renderRules();
        populateDomainDropdown();
    }
});

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

// Enable Tab key indentation in the CSS editor box
selectorInput.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;

        // Insert 4 spaces at the cursor position
        this.value = this.value.substring(0, start) + "    " + this.value.substring(end);

        // Move the cursor to after the inserted spaces
        this.selectionStart = this.selectionEnd = start + 4;
    }
});

renderRules();
populateDomainDropdown();