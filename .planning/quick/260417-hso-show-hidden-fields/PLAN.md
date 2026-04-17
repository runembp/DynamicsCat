---
quick_id: 260417-hso
slug: show-hidden-fields
description: Add Show Hidden Fields tool to MojnTools extension
---

# Show Hidden Fields Tool

## Goal
Add a new "Show Hidden Fields" tool that sets all hidden form controls to visible using Xrm.Page.ui.controls.setVisible(true).

## Tasks
1. Create src/content/show-hidden-fields.ts (toast-based one-shot action)
2. Create src/content/show-hidden-fields.css (stub)
3. Update popup.html + popup.ts (new button + handler)
4. Update ribbon-toolbar.ts (new dropdown button)
5. Update background.ts (new message handler)
6. Update build.js (new entrypoint + CSS copy)
7. Build + typecheck + commit
