# Quick Task 260420-ekz: Dirty-Fields Live Tracking Toggle

**Created:** 2026-04-20
**Status:** in-progress

## Goal

Convert `src/content/dirty-fields/dirty-fields.ts` from a one-shot "snapshot dirty fields now" tool into a **live tracking toggle**. When enabled, the script subscribes to `onChange` on every CRM attribute and highlights each field the moment it changes. Toggling again unsubscribes all handlers and removes highlights.

## Current behaviour

- Press button → reads `Xrm.Page.data.entity.attributes` for currently dirty fields → highlights them once.
- Press again → removes highlights.

## New behaviour

- Press button (tracking OFF) → subscribe `addOnChange` to all attributes → as fields change, add to tracked set and re-render highlights.
- Press button (tracking ON) → `removeOnChange` all handlers → remove highlights → clear state.

## Implementation plan

### 1. Update window state interface (`dirty-fields.ts`)

Replace `__dynamicsCatDirtyHighlighted` with three window globals:
- `__dynamicsCatDirtyTracking: boolean` — is monitoring active
- `__dynamicsCatDirtyHandler: (ctx?: Xrm.Events.EventContext) => void` — handler ref for cleanup
- `__dynamicsCatDirtyFields: Set<string>` — names of changed fields

### 2. Enable path

- Init `trackedFields = new Set<string>()` stored on `window.__dynamicsCatDirtyFields`
- Create `handler(ctx?)` that reads `ctx.getEventSource()` (cast to `Xrm.Attributes.Attribute`), adds `.getName()` to set, re-renders highlights
- Call `attr.addOnChange(handler)` for all attributes
- Set `__dynamicsCatDirtyTracking = true`
- Toast: `🟢 Dirty field tracking enabled`

### 3. Disable path

- Call `attr.removeOnChange(window.__dynamicsCatDirtyHandler!)` for all attributes
- Remove style element
- Clear all three window globals
- Toast: `🔴 Dirty field tracking disabled`

### 4. Build + typecheck + lint

Run `npm run check && npm run build` to verify.

## Files changed

- `src/content/dirty-fields/dirty-fields.ts`
