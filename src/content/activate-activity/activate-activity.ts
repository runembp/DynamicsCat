import { showToast } from '../shared';

/** Derive Web API version from CRM version string (e.g. "8.2.0.0" → "v8.2"). */
function apiVersionFromCrmVersion(crmVersion: string): string {
  const major = parseInt(crmVersion.split('.')[0] ?? '8', 10);
  if (major >= 9) return 'v9.0';
  return 'v8.2';
}

async function activateActivity(): Promise<void> {
  // Silently bail in frames where Xrm is not available — the script runs in all frames
  // and only the form frame will have Xrm.Page.data populated.
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.data) return;

  // Guard: must be closed (statecode !== 0)
  const statecodeAttr = Xrm.Page.getAttribute('statecode');
  if (!statecodeAttr) {
    showToast('Cannot read statecode on this record.', 'warn');
    return;
  }

  const statecode = statecodeAttr.getValue() as number;
  if (statecode === 0) {
    showToast('Activity is already open.', 'warn');
    return;
  }

  const id = Xrm.Page.data.entity.getId().replace(/^\{|\}$/g, '');
  const entityName = Xrm.Page.data.entity.getEntityName();
  const clientUrl = Xrm.Page.context.getClientUrl();
  const apiVersion = apiVersionFromCrmVersion(Xrm.Page.context.getVersion());

  // Resolve entity set name via metadata
  let entitySetName: string;
  try {
    const res = await fetch(
      `${clientUrl}/api/data/${apiVersion}/EntityDefinitions(LogicalName='${entityName}')?$select=EntitySetName`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { EntitySetName: string };
    entitySetName = json.EntitySetName;
  } catch {
    showToast('Could not resolve entity metadata.', 'warn');
    return;
  }

  // PATCH statecode=0, statuscode=1 to reactivate
  try {
    const patchUrl = `${clientUrl}/api/data/${apiVersion}/${entitySetName}(${id})`;
    const res = await fetch(patchUrl, {
      method: 'PATCH',
      headers: new Headers({
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      }),
      body: JSON.stringify({ statecode: 0, statuscode: 1 }),
    });

    if (!res.ok) {
      const err = await res.text();
      showToast(`Failed to activate: ${res.status} — ${err.slice(0, 120)}`, 'warn');
      return;
    }

    alert('Activity activated successfully!');
    location.reload();
  } catch (e) {
    showToast(`Request failed: ${e instanceof Error ? e.message : String(e)}`, 'warn');
  }
}

activateActivity();
