// Content script: change-user-language
// Runs in MAIN world. Reads LCID from document element dataset (set by background) and updates current user's UserSettings via Xrm.WebApi.

(async () => {
  try {
    const raw = (document.documentElement as HTMLElement).dataset?.dynamicscatSelectedLanguage
      ?? document.documentElement.getAttribute('data-dynamicscat-selected-language');
    if (!raw) {
      console.error('[DynamicsCat] No LCID found on document element.');
      return;
    }
    const lcid = parseInt(String(raw), 10);
    if (!lcid || isNaN(lcid)) {
      console.error('[DynamicsCat] Invalid LCID:', raw);
      return;
    }

    // remove marker
    try {
      const el = document.documentElement as HTMLElement;
      if (el.dataset && el.dataset.dynamicscatSelectedLanguage !== undefined) {
        delete (el.dataset as DOMStringMap).dynamicscatSelectedLanguage;
      }
    } catch (err) {
      console.debug('[DynamicsCat] clearing dataset failed', err);
    }

    function getUserId(): string | null {
      try {
        if (typeof Xrm !== 'undefined' && Xrm.Utility && Xrm.Utility.getGlobalContext) {
          const ctx = Xrm.Utility.getGlobalContext();
          if (ctx?.userSettings?.userId) return String(ctx.userSettings.userId);
        }
        if (typeof Xrm !== 'undefined' && Xrm.Page && Xrm.Page.context && Xrm.Page.context.getUserId) {
          return String(Xrm.Page.context.getUserId());
        }
      } catch (err) {
        console.debug('[DynamicsCat] getUserId failed', err);
      }
      return null;
    }

    const rawUserId = getUserId();
    if (!rawUserId) {
      alert('DynamicsCat: Cannot determine current user. Language change aborted.');
      return;
    }
    const userId = rawUserId.replace(/[{}]/g, '');

    if (typeof Xrm !== 'undefined' && Xrm.WebApi && typeof Xrm.WebApi.updateRecord === 'function') {
      Xrm.WebApi.updateRecord('usersettings', userId, { uilanguageid: lcid })
        .then(() => {
          // reload to apply new UI language
          window.location.reload();
        })
        .catch((err) => {
          alert('DynamicsCat: Failed to change language: ' + (err?.message ?? JSON.stringify(err)));
        });
      return;
    }

    alert('DynamicsCat: Automatic language change not supported in this environment. Change language via CRM personal settings.');
  } catch (e) {
    console.error('[DynamicsCat] change-user-language error', e);
  }
})();
