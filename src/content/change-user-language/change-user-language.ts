// Content script: change-user-language
// Runs in MAIN world. Reads LCID from document element dataset (set by background) and updates current user's UserSettings via Xrm.WebApi or direct Web API PATCH.

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
    const userId = rawUserId.replace(/[{}]/g, '').toLowerCase();

    // Try Xrm.WebApi.updateRecord when available
    if (typeof Xrm !== 'undefined' && Xrm.WebApi && typeof Xrm.WebApi.updateRecord === 'function') {
      try {
        await Xrm.WebApi.updateRecord('usersettings', userId, { uilanguageid: lcid });
        window.location.reload();
        return;
      } catch (err) {
        console.debug('[DynamicsCat] Xrm.WebApi.updateRecord failed, falling back to direct Web API', err);
      }
    }

    // Fallback: issue direct PATCH to Web API endpoint in page context
    function getClientUrl(): string | null {
      try {
        if (typeof Xrm !== 'undefined' && Xrm.Utility && Xrm.Utility.getGlobalContext) {
          return Xrm.Utility.getGlobalContext().getClientUrl();
        }
        if (typeof Xrm !== 'undefined' && Xrm.Page && Xrm.Page.context && Xrm.Page.context.getClientUrl) {
          return Xrm.Page.context.getClientUrl();
        }
      } catch (err) {
        console.debug('[DynamicsCat] getClientUrl failed', err);
      }
      return null;
    }

    const clientUrl = getClientUrl();
    if (!clientUrl) {
      alert('DynamicsCat: Automatic language change not supported in this environment. Change language via CRM personal settings.');
      return;
    }

    async function tryPatch(baseUrl: string): Promise<boolean> {
      const versions = ['v9.2', 'v9.1', 'v9.0', 'v8.2'];
      for (const ver of versions) {
        try {
          const url = `${baseUrl.replace(/\/$/, '')}/api/data/${ver}/usersettingscollection(${userId})`;
          const res = await fetch(url, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: {
              'OData-MaxVersion': '4.0',
              'OData-Version': '4.0',
              'Accept': 'application/json',
              'Content-Type': 'application/json; charset=utf-8',
              'If-Match': '*',
            },
            body: JSON.stringify({ uilanguageid: lcid }),
          });
          if (res.status === 204 || res.status === 200) return true;
          // 404 might mean wrong version or path — try next
        } catch (err) {
          console.debug('[DynamicsCat] Web API patch attempt failed for version', ver, err);
        }
      }
      return false;
    }

    const patched = await tryPatch(clientUrl);
    if (patched) {
      window.location.reload();
      return;
    }

    alert('DynamicsCat: Failed to change language via Web API. Change language via CRM personal settings.');
  } catch (e) {
    console.error('[DynamicsCat] change-user-language error', e);
  }
})();
