// Single registry of DynamicsCat actions — consumed by background, popup, and ribbon.
// Adding a new action here automatically wires it into all three surfaces.

export interface ActionDef {
  action: string;
  file: string;
  allFrames?: boolean; // defaults to true
  label: string;
  icon?: string;
  popupBtnId?: string;
  /** If set, the button is hidden until a runtime probe confirms it should appear. */
  conditional?: 'activatable';
}

export const ACTIONS: ActionDef[] = [
  { action: 'injectAllFields',        file: 'content/all-fields.js',          label: 'All Fields',     icon: '📋', popupBtnId: 'btn-all-fields' },
  { action: 'injectOptionSets',       file: 'content/option-sets.js',         label: 'Option Sets',    icon: '🔘', popupBtnId: 'btn-show-option-sets' },
  { action: 'injectShowHiddenFields', file: 'content/show-hidden-fields.js',  label: 'Hidden Fields',  icon: '👁', popupBtnId: 'btn-show-hidden-fields' },
  { action: 'injectDirtyFields',      file: 'content/dirty-fields.js',        label: 'Dirty Fields',   icon: '✏️', popupBtnId: 'btn-dirty-fields' },
  { action: 'injectOverrideReadonly', file: 'content/override-readonly.js',   label: 'Override Readonly', icon: '🔓' },
  { action: 'injectLookupsOpener',    file: 'content/lookups-opener.js',      label: 'Lookups Opener', icon: '🪟' },
  { action: 'openOnApi',              file: 'content/open-on-api.js',         label: 'Open on API',    icon: '🔗', popupBtnId: 'btn-open-on-api' },
  { action: 'jumpToLatest',            file: 'content/jump-to-latest.js',       label: 'Jump to Latest', icon: '🕐', popupBtnId: 'btn-jump-to-latest', allFrames: false },
  { action: 'jumpToLatestQuick',      file: 'content/jump-to-latest-quick.js', label: 'Jump to Latest (Quick)', icon: '⚡', allFrames: false },
  { action: 'injectUnlockAllFields',  file: 'content/unlock-all-fields.js',   label: 'Unlock All Fields' },
  { action: 'activateActivity',      file: 'content/activate-activity.js',    label: 'Activate',       icon: '🔓', popupBtnId: 'btn-activate-activity', conditional: 'activatable' },
  { action: 'injectShortcutsHelp',    file: 'content/shortcuts-help.js',      label: 'Shortcuts',      icon: '⌨️', popupBtnId: 'btn-shortcuts-help', allFrames: false },
];

/** Lookup map from action name to script config, for the background service worker. */
export const ACTION_MAP: Record<string, { file: string; allFrames: boolean }> = Object.fromEntries(
  ACTIONS.map(a => [a.action, { file: a.file, allFrames: a.allFrames ?? true }]),
);
