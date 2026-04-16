# CRM Chrome Tools

A Chrome Extension for Dynamics CRM 2016 — helper tools for form field inspection, form manipulation, and more.

## Development Setup

### Load the extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `CRMChromeTools` project folder

The extension icon will appear in the toolbar. Pin it for easy access.

### Hello World

Click the extension icon on any tab — you should see an `alert('Hello world')` dialog.

## Project Structure

```
CRMChromeTools/
├── manifest.json     # Chrome Extension manifest (MV3)
├── background.js     # Service worker — handles toolbar icon click events
├── content/          # Scripts injected into CRM pages
├── popup/            # Popup UI panel (future)
└── icons/            # Extension icons
```

## Planned Features

- Show all Dynamics CRM form fields (name, value, type)
- Form manipulation helpers
- UI enhancements for CRM pages
