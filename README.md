# Element Hider
Chrome Extension

A browser tool designed to hide specific elements on a webpage.

> **New:** You can now edit styles using pure CSS and default action is still hiding. But you can go into the options and change any element you like on a page.

## Web Element Removal
A precision tool that allows you to target and hide unwanted UI elements (like banners or overlays) on any webpage, with persistent storage so your customizations stay in place.

## How to Manage Hidden Elements
To view, manage, or delete your hidden elements across all your saved sites and open tabs:

1. **Open Extension Options:** Right-click the Element Hider extension icon in your toolbar and select **Options**, or go to your Chrome extensions page (`chrome://extensions`), find Element Hider, and click **Extension options**.
2. **View Managed Sites:** The options page will automatically display all rules grouped by domain, pulling from your saved preferences and any currently open tabs.
3. **Edit or Delete:** 
    * Click the **Delete** button next to any individual selector string to remove it instantly.
    * Click **Clear All for Domain** to completely remove all rules for a specific website.

## CSS Selector Cheat Sheet for Element Hider

### 1. Attribute Selectors (Most Reliable)
Target elements using developer test IDs or specific attributes. These rarely change.
* **Format:** `[attribute="value"]`
* **Example:** `[data-test-id="label"]` targets any element with that exact test ID.
* **Example:** `[aria-label="Settings"]` targets elements by their accessibility label.

### 2. Class Selectors
Target elements using their class names. Use specific classes to avoid accidentally hiding other elements.
* **Format:** `.class-name`
* **Example:** `.mat-mdc-snack-bar-label` targets the specific snackbar text class.

### 3. Combining Selectors (Parent to Child)
Target a specific wrapper or container *only when* it holds a unique child element.
* **Format:** `parent-selector:has(child-selector)`
* **Example:** `div.container:has([data-test-id="label"])` hides the outer container only if it contains that specific error label.

### 4. What to Avoid
* **Dynamic Angular Attributes (`_ngcontent-...`):** Avoid these entirely because the random numbers and letters change every time the page or application reloads.
* **Overly Generic Classes:** Avoid using generic class names like `.container` or `.wrapper` by themselves, as they will hide multiple unrelated elements across the page.