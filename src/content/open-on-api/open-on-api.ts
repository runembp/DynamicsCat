import { showToast } from '../shared';
import { getApiVersion, getDynamicsContext, resolveEntitySetName } from '../dynamics-context';

async function openOnApi(): Promise<void> {
  // Guard: show toast on non-CRM pages instead of silently doing nothing
  if (typeof Xrm === 'undefined' || !Xrm.Page || !Xrm.Page.data) {
    showToast('No CRM record open — navigate to a record first.', 'warn');
    return;
  }

  const id = Xrm.Page.data.entity.getId();
  if (!id) {
    showToast('No record open — navigate to a record first.', 'warn');
    return;
  }

  const entityName = Xrm.Page.data.entity.getEntityName();
  const context = getDynamicsContext();
  if (!context) {
    showToast('No CRM context found.', 'warn');
    return;
  }

  let entitySetName: string;
  try {
    entitySetName = await resolveEntitySetName(context, entityName);
  } catch {
    showToast('Could not resolve entity metadata. Try again.', 'warn');
    return;
  }

  // Strip braces from GUID if present
  const cleanId = id.replace(/^\{|\}$/g, '');
  const apiVersion = await getApiVersion(context);
  const url = `${context.clientUrl}/api/data/${apiVersion}/${entitySetName}(${cleanId})`;
  window.open(url, '_blank');
}

openOnApi();
