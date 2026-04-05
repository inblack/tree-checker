# Tree Checker Dashboard

A minimalist, high-density diagnostic tool for GEDCOM family trees. It helps you identify duplicates, logic issues, and detached individuals in your genealogy data.

## Demo / How to Host on GitHub

To host this for your own tree:

1.  **Create a New Repository**: Create a repository on GitHub (e.g., `tree-checker`).
2.  **Upload These Files**:
    - `index.html`
    - `index.css`
    - `gedcom.js`
    - `app.js`
3.  **Enable GitHub Pages**:
    - Go to **Settings** > **Pages**.
    - Under "Build and deployment", set the source to **Deploy from a branch**.
    - Select your branch (usually `main`) and the `/root` folder.
    - Click **Save**.
4.  **Visit Your URL**: Your tree checker will be live at `https://[your-username].github.io/[repo-name]/`.

## Features
- **High-Density Diagnostics**: Identified as **❗ Duplicates**, **⚠️ Logic Errors**, and **❗ Disconnected Records**.
- **Multiple Pedigree Check**: Detects individuals linked to more than one birth family.
- **Disconnected Groups**: Identifies individuals or families isolated from the main tree via graph analysis.
- **Privacy First**: No data is ever transmitted or persisted. Everything is parsed locally in your browser.
- **Instant Expansion**: Click any record to see full biography, family units, and sources.

## Requirements
- Works with standard GEDCOM 5.5 / 5.5.1 files.
- Modern web browser with ES6 support.
