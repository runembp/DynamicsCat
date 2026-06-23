// Single source of truth: action name → content script config.
// Used by both the extension popup and the CRM ribbon toolbar.

import { ACTION_MAP } from './actions';
import { parseUserLanguageLcid } from './user-languages';

const DEFAULT_READONLY_SHORTCUT = 'alt';
const DEFAULT_FIELD_CLICK_SHORTCUT = 'ctrl';

chrome.runtime.onMessage.addListener(
  (message: Record<string, unknown>, sender, sendResponse): boolean | undefined => {
    if (message.action === 'openBackgroundTab') {
      const url = message.url as string | undefined;
      if (url) {
        chrome.tabs.create({ url, active: false });
      }
      return undefined;
    }

    const tabId = (message.tabId as number | undefined) ?? sender.tab?.id;
    if (tabId === undefined) return undefined;

    if (message.action === 'probeActivatable') {
      chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        world: 'MAIN',
        func: () => {
          try {
            if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.data) return false;
            const attr = Xrm.Page.getAttribute('statecode');
            if (!attr) return false;
            return attr.getValue() !== 0;
          } catch { return false; }
        },
      }).then(results => {
        const activatable = results.some(r => r.result === true);
        sendResponse({ activatable });
      }).catch(() => sendResponse({ activatable: false }));
      return true; // keep message channel open for async sendResponse
    }

    if (message.action === 'probeUserLanguage') {
      chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        world: 'MAIN',
        func: () => {
          try {
            if (typeof Xrm === 'undefined') return null;
            if (typeof Xrm.Utility?.getGlobalContext === 'function') {
              return Xrm.Utility.getGlobalContext().userSettings?.languageId ?? null;
            }
            return Xrm.Page?.context?.getUserLcid?.() ?? null;
          } catch {
            return null;
          }
        },
      }).then(results => {
        const languageId = results
          .map(result => parseUserLanguageLcid(result.result))
          .find((lcid): lcid is NonNullable<typeof lcid> => lcid !== null) ?? null;
        sendResponse({ languageId });
      }).catch(() => sendResponse({ languageId: null }));
      return true;
    }

    if (message.action === 'injectOverrideReadonly') {
      const config = ACTION_MAP.injectOverrideReadonly;
      void (async () => {
        try {
          const result = await chrome.storage.local.get('readonlyShortcut');
          const shortcutValue = typeof result.readonlyShortcut === 'string'
            ? result.readonlyShortcut
            : DEFAULT_READONLY_SHORTCUT;
          await chrome.scripting.executeScript({
            target: { tabId, allFrames: config.allFrames },
            world: 'MAIN',
            func: (shortcut: string) => {
              document.documentElement.dataset.dynamicsCatReadonlyShortcut = shortcut;
            },
            args: [shortcutValue],
          });
          await chrome.scripting.executeScript({
            target: { tabId, allFrames: config.allFrames },
            files: [config.file],
            world: 'MAIN',
          });
        } catch {
          sendResponse({ ok: false });
          return;
        }
        sendResponse({ ok: true });
      })();
      return true;
    }

    if (message.action === 'injectFieldClick') {
      const config = ACTION_MAP.injectFieldClick;
      void (async () => {
        try {
          const result = await chrome.storage.local.get('fieldClickShortcut');
          const shortcutValue = typeof result.fieldClickShortcut === 'string'
            ? result.fieldClickShortcut
            : DEFAULT_FIELD_CLICK_SHORTCUT;
          await chrome.scripting.executeScript({
            target: { tabId, allFrames: config.allFrames },
            world: 'MAIN',
            func: (shortcut: string) => {
              document.documentElement.dataset.dynamicsCatFieldClickShortcut = shortcut;
            },
            args: [shortcutValue],
          });
          await chrome.scripting.executeScript({
            target: { tabId, allFrames: config.allFrames },
            files: [config.file],
            world: 'MAIN',
          });
        } catch {
          sendResponse({ ok: false });
          return;
        }
        sendResponse({ ok: true });
      })();
      return true;
    }

    const config = ACTION_MAP[message.action as string];
    if (!config) return undefined;

    chrome.scripting.executeScript({
      target: { tabId, allFrames: config.allFrames },
      files: [config.file],
      world: 'MAIN',
    });
    return undefined;
  },
);

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      readonlyShortcut: DEFAULT_READONLY_SHORTCUT,
      fieldClickShortcut: DEFAULT_FIELD_CLICK_SHORTCUT,
    });
  } else if (details.reason === 'update') {
    chrome.storage.local.get(
      ['readonlyShortcut', 'fieldClickShortcut', 'lookupsOpenerShortcut'],
      (result) => {
        const defaults: Record<string, unknown> = {};
        if (result.readonlyShortcut === undefined) defaults.readonlyShortcut = DEFAULT_READONLY_SHORTCUT;
        if (result.fieldClickShortcut === undefined) {
          // Migrate from the previous "lookupsOpenerShortcut" key, falling back to the default.
          defaults.fieldClickShortcut = typeof result.lookupsOpenerShortcut === 'string'
            ? result.lookupsOpenerShortcut
            : DEFAULT_FIELD_CLICK_SHORTCUT;
        }
        if (Object.keys(defaults).length > 0) chrome.storage.local.set(defaults);
        if (result.lookupsOpenerShortcut !== undefined) {
          chrome.storage.local.remove('lookupsOpenerShortcut');
        }
      },
    );
  }
});

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) return;
    const actionName = command === 'jump-to-latest' ? 'jumpToLatest'
      : command === 'jump-to-latest-quick' ? 'jumpToLatestQuick'
      : command === 'show-hidden-fields' ? 'injectShowHiddenFields'
      : command === 'unlock-all-fields' ? 'injectUnlockAllFields'
      : null;
    if (!actionName) return;
    const config = ACTION_MAP[actionName];
    if (!config) return;
    chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: config.allFrames },
      files: [config.file],
      world: 'MAIN',
    });
  });
});
