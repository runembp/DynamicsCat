import { showToast } from '../shared';

/** Derive Web API version from CRM version string (e.g. "8.2.0.0" → "v8.2"). */
function apiVersionFromCrmVersion(crmVersion: string): string {
  const major = parseInt(crmVersion.split('.')[0] ?? '8', 10);
  if (major >= 9) return 'v9.0';
  return 'v8.2';
}

async function openOnApi(): Promise<void> {
  // Guard: Xrm may be absent on the top frame or non-form iframes
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.data) return;

  const id = Xrm.Page.data.entity.getId();
  if (!id) {
    showToast('No record open — navigate to a record first.', 'warn');
    return;
  }

  const entityName = Xrm.Page.data.entity.getEntityName();
  const clientUrl  = Xrm.Page.context.getClientUrl();
  const apiVersion = apiVersionFromCrmVersion(Xrm.Page.context.getVersion());

  let entitySetName: string;
  try {
    // Try Xrm.Utility.getEntityMetadata first (D365 v9+); fall back to REST for CRM 2016.
    if (typeof Xrm.Utility.getEntityMetadata === 'function') {
      const meta = await Xrm.Utility.getEntityMetadata(entityName, []);
      entitySetName = meta.EntitySetName;
    } else {
      const res  = await fetch(`${clientUrl}/api/data/${apiVersion}/EntityDefinitions(LogicalName='${entityName}')?$select=EntitySetName`);
      const json = await res.json() as { EntitySetName: string };
      entitySetName = json.EntitySetName;
    }
  } catch {
    showToast('Could not resolve entity metadata. Try again.', 'warn');
    return;
  }

  // Strip braces from GUID if present
  const cleanId = id.replace(/^\{|\}$/g, '');
  const url = `${clientUrl}/api/data/${apiVersion}/${entitySetName}(${cleanId})`;
  window.open(url, '_blank');
}

openOnApi();
