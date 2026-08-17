# Element Hider

A precision browser tool designed to target and hide unwanted UI elements on any webpage with persistent storage.

## 🚀 Overview

Customizing your web experience has never been easier. **Element Hider** allows you to permanently remove banners, overlays, and distracting elements using simple right-click actions or advanced CSS selectors.

## ✨ Key Features

- **Precision Removal**: Target specific elements and hide them instantly.
- **Persistent Storage**: Your customizations are saved per domain and persist across browser sessions.
- **Advanced CSS Support**: Edit styles or hide elements using raw CSS selectors for maximum flexibility.
- **Domain-Based Management**: Easily view and clear all rules for a specific website.
- **Intelligent Selectors**: Supports attribute, class, and parent-child (`:has()`) selectors.
- **Right-Click Integration**: Quickly hide elements via the context menu.

## 🛠️ Installation

1. Clone or download the extension folder.
2. Go to `chrome://extensions/` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extension directory.

## 📖 Managing Hidden Elements

1. **Options Page**: Right-click the icon and select **Options** to view all managed sites.
2. **Edit/Delete**: 
   - Remove individual selectors with a single click.
   - Use **Clear All for Domain** to reset a site's layout.
3. **Advanced Tweaks**: Modify existing rules to change more than just visibility (e.g., opacity, colors).

## 💡 Selector Tips

- **Best Results**: Use Attribute Selectors like `[data-test-id="label"]` for stability.
- **Angular Apps**: Avoid dynamic Angular attributes (e.g., `_ngcontent-v-123`) as they change on reload.
- **Contextual Hiding**: Use `:has()` to hide containers only when they contain specific child elements.

---
*Clean up the web, one element at a time.*
