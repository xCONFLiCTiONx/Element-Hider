const container = document.getElementById('rules-container');

function renderRules() {
    chrome.storage.local.get(['HiddenElements'], (result) => {
        const allRules = result.HiddenElements || {};

        // Get all unique domains from currently open tabs + already saved rules
        chrome.tabs.query({}, (tabs) => {
            const domainSet = new Set(Object.keys(allRules));

            tabs.forEach(tab => {
                if (tab.url && tab.url.startsWith('http')) {
                    try {
                        const host = new URL(tab.url).hostname;
                        domainSet.add(host);
                    } catch (e) {}
                }
            });

            const sortedDomains = Array.from(domainSet).sort();
            container.innerHTML = '';

            if (sortedDomains.length === 0) {
                container.innerHTML = '<div class="no-rules">No open tabs or saved rules found.</div>';
                return;
            }

            sortedDomains.forEach(domain => {
                const paths = allRules[domain] || [];

                const card = document.createElement('div');
                card.className = 'domain-card';

                const header = document.createElement('div');
                header.className = 'domain-header';
                header.innerHTML = `<span>${domain}</span>`;

                // Button to wipe the entire domain key if desired
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

                        // Delete individual item out of the array
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
    });
}

function saveAndRefresh(newRules) {
    chrome.storage.local.set({ HiddenElements: newRules }, () => {
        renderRules();
    });
}

renderRules();