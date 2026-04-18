---
slug: lint-guard-extension
date: 2026-04-18
status: complete
commit: 704fc1d
---

# Summary: lint-guard Copilot CLI extension

## What was done
Created `.github/extensions/lint-guard/extension.mjs` — a Copilot CLI extension
that registers an `onPostToolUse` hook. After every `edit` or `create` call on a
`.ts`/`.js`/`.mjs` file inside `src/`, it runs `npx eslint <file>` and returns
any errors as `additionalContext`. The agent sees lint failures immediately in its
next context turn and fixes them before proceeding.

`onPostToolUse` is the correct hook — linting before an edit is meaningless
(the file hasn't changed yet). Post-edit is the lint-gate pattern.
