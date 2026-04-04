# Tree Checker Dashboard

A premium web-based diagnostics tool for GEDCOM family trees, inspired by modern genealogy platforms.

## Demo / How to Host on GitHub

To host this for your own tree:

1.  **Create a New Repository**: Create a repository on GitHub (e.g., `my-family-tree`).
2.  **Upload These Files**:
    - `index.html`
    - `index.css`
    - `gedcom.js`
    - `app.js`
    - `family-6.ged` (Make sure your GEDCOM file is named exactly `family-6.ged` in the root).
3.  **Enable GitHub Pages**:
    - Go to **Settings** > **Pages**.
    - Under "Build and deployment", set the source to **Deploy from a branch**.
    - Select your branch (usually `main`) and the `/root` folder.
    - Click **Save**.
4.  **Visit Your URL**: After a minute, your tree checker will be live at `https://[your-username].github.io/[repo-name]/`.

## Features
- **Diagnostics**: Detects duplicates, missing locations, and standardization flags.
- **Privacy**: No data is uploaded to a server (unless you host the file manually); everything is parsed locally in your browser.
- **Scoring**: A tree-wide health score (0-10) to help you prioritize data cleanup.

## Requirements
- Works with standard GEDCOM 5.5 / 5.5.1 files.
- Modern web browser with ES6 support.
