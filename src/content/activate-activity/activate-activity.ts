import { showToast } from '../shared';
import { getDynamicsContext, resolveEntitySetName, send } from '../dynamics-context';

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
  const context = getDynamicsContext();
  if (!context) {
    showToast('No CRM context found.', 'warn');
    return;
  }

  // Resolve entity set name via metadata
  let entitySetName: string;
  try {
    entitySetName = await resolveEntitySetName(context, entityName);
  } catch {
    showToast('Could not resolve entity metadata.', 'warn');
    return;
  }

  // PATCH statecode=0, statuscode=1 to reactivate
  try {
    await send(
      context,
      () => `${entitySetName}(${id})`,
      {
        method: 'PATCH',
        headers: new Headers({
          'Content-Type': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
        }),
        body: JSON.stringify({ statecode: 0, statuscode: 1 }),
      },
    );

    alert('Activity activated successfully!');
    location.reload();
  } catch (e) {
    showToast(`Request failed: ${e instanceof Error ? e.message : String(e)}`, 'warn');
  }
}

activateActivity();
