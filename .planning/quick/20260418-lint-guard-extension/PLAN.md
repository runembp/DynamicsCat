---
slug: lint-guard-extension
date: 2026-04-18
status: in-progress
---

# Quick Task: Copilot CLI lint-guard extension

## Goal
Create a Copilot CLI extension that runs ESLint after every `edit` or `create`
call on TypeScript/JavaScript source files, returning lint results as
`additionalContext` so the agent sees and fixes errors immediately.

Note: `onPostToolUse` is the correct hook — linting before an edit is
meaningless (the file hasn't changed). Post-edit lint feeds errors back into
the next agent context turn, acting as a continuous lint-gate.

## Files
- `.github/extensions/lint-guard/extension.mjs` (new)
