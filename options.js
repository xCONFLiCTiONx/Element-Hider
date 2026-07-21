const container = document.getElementById('rules-container');
const exportBtn = document.getElementById('export-btn');
const importFile = document.getElementById('import-file');

function renderRules() {
    chrome.storage.local.get(['HiddenElements'], (result) => {
        const allRules = result.HiddenElements || {};

        // Only pull explicitly saved rules (ignore open tabs so export/import only manages true stored data)
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
                    alert("Backup imported successfully!");
                });
            } else {
                alert("Invalid backup file format.");
            }
        } catch (err) {
            alert("Error parsing JSON file.");
        }
        importFile.value = ''; // Reset input
    };
    reader.readAsText(file);
});

renderRules();