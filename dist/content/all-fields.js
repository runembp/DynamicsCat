"use strict";(()=>{function M(e,t){let n;return(...r)=>{clearTimeout(n),n=setTimeout(()=>e(...r),t)}}function U(){let e={};return Xrm.Page.ui.controls.forEach(t=>{let n=t.getName();if(n)try{e[n]=t.getLabel()||n}catch{e[n]=n}}),e}function V(e,t,n){let r=e.ownerDocument,o=r.defaultView??window;requestAnimationFrame(()=>{let i=e.getBoundingClientRect();e.style.left=i.left+"px",e.style.top=i.top+"px",e.style.right="",e.style.transform=""});let d=!1,s=0,a=0,c=i=>{if(!d)return;let p=Math.max(0,Math.min(i.clientX-s,o.innerWidth-e.offsetWidth)),m=Math.max(0,Math.min(i.clientY-a,o.innerHeight-e.offsetHeight));e.style.left=p+"px",e.style.top=m+"px"},u=()=>{d=!1,t.style.cursor="move"};t.addEventListener("mousedown",i=>{n.contains(i.target)||(d=!0,s=i.clientX-e.offsetLeft,a=i.clientY-e.offsetTop,t.style.cursor="grabbing",i.preventDefault())}),r.addEventListener("mousemove",c),r.addEventListener("mouseup",u),new MutationObserver((i,p)=>{r.contains(e)||(r.removeEventListener("mousemove",c),r.removeEventListener("mouseup",u),p.disconnect())}).observe(r.body,{childList:!0,subtree:!0})}function N(e){let t=document.createElement("textarea");t.value=e,t.style.cssText="position:fixed;opacity:0;pointer-events:none",document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t)}function P(e){navigator.clipboard?.writeText?navigator.clipboard.writeText(e).catch(()=>N(e)):N(e)}var D="crm-tools-toast-container";function v(e,t="info"){let n=document.getElementById(D);n||(n=document.createElement("div"),n.id=D,n.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(n));let r=document.createElement("div");r.style.cssText=["background: "+(t==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),r.textContent=e,n.appendChild(r),setTimeout(()=>{r.style.opacity="0",setTimeout(()=>r.remove(),350)},3500)}function K(e,t,n=document){if(n.getElementById(e))return;let r=n.createElement("style");r.id=e,r.textContent=t,(n.head||n.documentElement).appendChild(r)}function w(e){e.addEventListener("keydown",t=>t.stopPropagation()),e.addEventListener("keyup",t=>t.stopPropagation())}function S(e,t){let n=document.createElement("span");return n.className="dcat-copy-val",n.textContent=e,n.title=`Click to copy: ${t}`,n.addEventListener("click",()=>{P(t),n.classList.add("dcat-copied"),setTimeout(()=>n.classList.remove("dcat-copied"),1200)}),n}function R(e){let t=document.createElement("div");t.className="dcat-search";let n=document.createElement("input");n.type="search",n.placeholder=e.placeholder,w(n);let r=M(()=>{e.onFilter(n.value.toLowerCase().trim())},e.debounceMs??100);return n.addEventListener("input",r),t.appendChild(n),{container:t,input:n,triggerFilter:()=>n.dispatchEvent(new Event("input"))}}function _(e,t){return`
#${e} { ${t==="dialog"?`position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 380px;
       max-height: 90vh;
       background: #fff; border: 2px solid #1e64c8; border-radius: 8px;
       box-shadow: 0 4px 24px rgba(0,0,0,0.2);
       z-index: 2147483647; overflow: visible;
       font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;`:`position: fixed; top: 0; right: 0; width: auto; min-width: 550px; max-width: 90vw; max-height: 90vh;
       background: #fff; border: 2px solid #1e64c8;
       box-shadow: -4px 0 16px rgba(0,0,0,0.18);
       z-index: 2147483647; display: flex; flex-direction: column;
       font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;`} }
#${e} .dcat-header {
  display: flex; align-items: center; gap: 6px;
  background: #1e64c8; color: #fff; padding: 10px 14px; flex-shrink: 0;
  cursor: move; user-select: none;
}
#${e} .dcat-title { font-size: 14px; font-weight: 600; flex: 1; }
#${e} .dcat-close {
  background: none; border: none; color: #fff; font-size: 18px;
  line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85;
}
#${e} .dcat-close:hover { opacity: 1; }
#${e} .dcat-body { ${t==="dialog"?"padding: 14px; display: flex; flex-direction: column; gap: 10px;":"overflow-y: auto; overflow-x: auto; flex: 1;"} }
#${e} .dcat-subheader {
  padding: 6px 14px; background: #e8f0fe; font-size: 12px;
  color: #1e64c8; border-bottom: 1px solid #c5d8fb; flex-shrink: 0;
}
#${e} .dcat-search {
  padding: 8px 14px; background: #fff; border-bottom: 1px solid #c5d8fb; flex-shrink: 0;
}
#${e} .dcat-search input {
  width: 100%; box-sizing: border-box; padding: 5px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px; font-size: 13px;
  font-family: Segoe UI, Arial, sans-serif; color: #222; outline: none;
}
#${e} .dcat-search input:focus { border-color: #1e64c8; }
#${e} .dcat-copy-val {
  cursor: pointer; border-bottom: 1px dashed #1e64c8; transition: background 0.15s;
}
#${e} .dcat-copy-val:hover { background: #c5d8fb; border-radius: 3px; }
#${e} .dcat-copy-val.dcat-copied { background: #b7f0c8; border-bottom-color: #2a9c52; border-radius: 3px; }
#${e} .dcat-no-results {
  padding: 16px; text-align: center; color: #888; font-style: italic;
}
`}function H(e){let t=e.targetDocument??document,n=t.getElementById(e.panelId);if(n)return n.remove(),null;let r=e.variant??"sidebar";K(e.styleId,_(e.panelId,r)+(e.extraCss??""),t);let o=t.createElement("div");o.id=e.panelId;let d=t.createElement("div");d.className="dcat-header";let s=t.createElement("span");s.className="dcat-title",s.textContent=e.title;let a=t.createElement("button");a.className="dcat-close",a.title="Close",a.textContent="\u2715",a.addEventListener("click",()=>o.remove()),d.append(s,a);let c=t.createElement("div");return c.className="dcat-body",o.append(d,c),t.body.appendChild(o),V(o,d,a),{panel:o,header:d,closeBtn:a,body:c}}var q="dynamicscat:api-version:",$=new Map;function G(e){return e.replace(/[{}]/g,"").toLowerCase()}function J(){try{if(typeof Xrm<"u"&&Xrm.Utility?.getGlobalContext)return Xrm.Utility.getGlobalContext()}catch(e){console.debug("[DynamicsCat] getGlobalContext failed",e)}return null}function Y(){try{if(typeof Xrm<"u"&&Xrm.Page?.context)return Xrm.Page.context}catch(e){console.debug("[DynamicsCat] get legacy context failed",e)}return null}function C(){let e=J(),t=Y(),n=e?.getClientUrl?.()??t?.getClientUrl?.()??null;if(!n)return null;let r=e?.userSettings?.userId,o=t?.getUserId?.(),d=r||o?G(String(r??o)):null,s=e?.userSettings?.languageId,a=t?.getUserLcid?.(),c=null;typeof s=="number"&&Number.isInteger(s)?c=s:typeof a=="number"&&Number.isInteger(a)&&(c=a);let u=e?.getVersion?.()??t?.getVersion?.()??null;return{clientUrl:n.replace(/\/$/,""),userId:d,userLanguageId:c,crmVersion:u}}function Q(e){let t=new Set,n=e?parseInt(e.split(".")[0]??"",10):Number.NaN,r=e?parseInt(e.split(".")[1]??"",10):Number.NaN;if(Number.isInteger(n)){if(n>=9)return t.add(Number.isInteger(r)?`v${n}.${r}`:"v9.2"),t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),Array.from(t);if(n===8)return t.add(Number.isInteger(r)?`v8.${r}`:"v8.2"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}return t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}function F(e){return`${q}${e.clientUrl.toLowerCase()}`}function Z(e){try{return localStorage.getItem(F(e))}catch{return null}}function ee(e,t){try{localStorage.setItem(F(e),t)}catch{}}function X(e){return e?.headers?{...e,headers:new Headers(e.headers)}:e}async function te(e){for(let t of Q(e.crmVersion)){let n=await fetch(`${e.clientUrl}/api/data/${t}/`,{credentials:"same-origin",headers:{Accept:"application/json"}});if(n.ok)return ee(e,t),t;if(n.status!==404&&n.status!==501)throw new Error(`Web API scan failed (${t}, HTTP ${n.status})`)}throw new Error("No supported Dynamics Web API version found")}function z(e){let t=Z(e);if(t)return Promise.resolve(t);let n=e.clientUrl.toLowerCase(),r=$.get(n);if(r)return r;let o=te(e).finally(()=>$.delete(n));return $.set(n,o),o}async function E(e,t,n){let r=await z(e),o=await fetch(`${e.clientUrl}/api/data/${r}/${t(r)}`,X(n));if(!o.ok){let d=await o.text();throw new Error(`Web API failed (${r}, HTTP ${o.status}): ${d.slice(0,160)}`)}return await o.json()}async function O(e,t,n){let r=await z(e),o=await fetch(`${e.clientUrl}/api/data/${r}/${t(r)}`,X(n));if(!o.ok){let d=await o.text();throw new Error(`Web API failed (${r}, HTTP ${o.status}): ${d.slice(0,160)}`)}return o}async function A(e,t){if(typeof Xrm<"u"&&typeof Xrm.Utility?.getEntityMetadata=="function"){let r=await Xrm.Utility.getEntityMetadata(t,[]);if(r.EntitySetName)return r.EntitySetName}return(await E(e,()=>`EntityDefinitions(LogicalName='${encodeURIComponent(t)}')?$select=EntitySetName`)).EntitySetName}var T={hiddenActive:"dynamicsCatHiddenActive",dirtyActive:"dynamicsCatDirtyActive",readonlyOverrideActive:"dynamicsCatReadonlyOverrideActive",readonlySilentInject:"dynamicsCatReadonlySilentInject",readonlyShortcut:"dynamicsCatReadonlyShortcut",fieldClickActive:"dynamicsCatFieldClickActive",fieldClickSilentInject:"dynamicsCatFieldClickSilentInject",fieldClickShortcut:"dynamicsCatFieldClickShortcut",revealedNames:"dynamicsCatRevealedNames",unlockAllActive:"dynamicsCatUnlockAllActive",unlockedNames:"dynamicsCatUnlockedNames",toggleLock:"dynamicsCatToggleLock",activatable:"dynamicsCatActivatable"};function ne(){try{return(window.top??window).document.documentElement.dataset}catch{return document.documentElement.dataset}}function B(e=1e3){let t=ne();return t[T.toggleLock]?!1:(t[T.toggleLock]="1",setTimeout(()=>{delete t[T.toggleLock]},e),!0)}var l="crm-tools-fields-panel",re="crm-tools-fields-style",j=728,oe=`
#${l} {
  top: 16px; left: 16px; right: auto; transform: none;
  box-sizing: border-box; width: ${j}px; min-width: 400px; max-width: 90vw;
  resize: both; overflow: hidden; min-height: 280px;
  height: 720px;
}
#${l} .cfp-refresh {
  background: none; border: none; color: #fff; font-size: 16px;
  line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85; margin-right: 4px;
}
#${l} .cfp-refresh:hover { opacity: 1; }
#${l} .cfp-refresh:disabled { opacity: 0.5; cursor: default; }
@keyframes cfp-spin { to { transform: rotate(360deg); } }
#${l} .cfp-refresh.cfp-spinning { display: inline-block; animation: cfp-spin 0.8s linear infinite; }
#${l} table { width: 100%; border-collapse: collapse; }
#${l} thead th {
  position: sticky; top: 0; background: #f0f4ff;
  border-bottom: 2px solid #1e64c8; padding: 7px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #444; white-space: nowrap; cursor: pointer;
}
#${l} thead th:hover { background: #dfe9ff; }
#${l} thead th:focus { outline: 2px solid #1e64c8; outline-offset: -2px; }
#${l} thead th::after { content: ' \u2195'; color: #888; }
#${l} thead th[aria-sort="ascending"]::after { content: ' \u2191'; color: #1e64c8; }
#${l} thead th[aria-sort="descending"]::after { content: ' \u2193'; color: #1e64c8; }
#${l} tbody tr:nth-child(even) { background: #f8f9ff; }
#${l} tbody tr:hover { background: #dceafe; }
#${l} td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8; vertical-align: top;
}
#${l} td:nth-child(1), #${l} th:nth-child(1) { white-space: nowrap; }
#${l} td:nth-child(2), #${l} th:nth-child(2) { white-space: nowrap; }
#${l} td:nth-child(3), #${l} th:nth-child(3) { white-space: nowrap; }
#${l} td:nth-child(4), #${l} th:nth-child(4) { min-width: 180px; max-width: 360px; word-break: break-word; }
#${l} td:nth-child(5), #${l} th:nth-child(5) { white-space: nowrap; }
#${l} td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#${l} .cfp-type {
  display: inline-block; padding: 1px 6px; border-radius: 10px;
  font-size: 11px; background: #e8e8e8; color: #444;
}
#${l} .cfp-null { color: #aaa; font-style: italic; }
#${l} .cfp-value { display: flex; align-items: flex-start; gap: 6px; }
#${l} .cfp-value-text { flex: 1; min-width: 0; }
#${l} .cfp-edit {
  flex: none; padding: 0 3px; border: 0; background: none; color: #1e64c8;
  cursor: pointer; font-size: 14px; line-height: 1.2; opacity: 0.7;
}
#${l} .cfp-edit:hover { opacity: 1; }
#${l} .cfp-editor { display: flex; gap: 5px; min-width: 230px; }
#${l} .cfp-editor input {
  min-width: 0; flex: 1; padding: 3px 6px; border: 1px solid #bbb;
  border-radius: 3px; font: inherit; color: #222;
}
#${l} .cfp-editor input:focus { border-color: #1e64c8; outline: none; }
#${l} .cfp-save {
  padding: 3px 8px; border: 1px solid #1e64c8; border-radius: 3px;
  background: #1e64c8; color: #fff; cursor: pointer; font: inherit;
}
#${l} .cfp-save:disabled { opacity: 0.55; cursor: default; }
#${l} .cfp-cancel {
  padding: 3px 6px; border: 1px solid #aaa; border-radius: 3px;
  background: #fff; color: #555; cursor: pointer; font: inherit;
}
#${l} .cfp-update-mode {
  display: inline-block; padding: 2px 6px; border-radius: 10px;
  font-size: 11px; font-weight: 600;
}
#${l} .cfp-update-form { background: #fff3cd; color: #795600; }
#${l} .cfp-update-api { background: #d9ecff; color: #145a96; }
#${l} .cfp-update-readonly { background: #eee; color: #666; }
`;async function ae(){if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.ui||!Xrm.Page.data||!B())return;let e=ie(),t=H({panelId:l,styleId:re,title:"\u{1F4CB} All Fields",extraCss:oe,targetDocument:e});if(!t)return;let{panel:n,header:r,closeBtn:o,body:d}=t;se(n,e);let s=document.createElement("button");s.className="cfp-refresh",s.title="Refresh form data",s.textContent="\u21BB",r.insertBefore(s,o);let a=Xrm.Page.data.entity.getEntityName(),c=Xrm.Page.data.entity.getId(),u=document.createElement("div");if(u.className="dcat-subheader",u.append("Entity: "),u.appendChild(S(a,a)),u.append("  |  ID: "),c){let f=c.replace(/^\{|\}$/g,"");u.appendChild(S(c,f))}else u.append("(new record)");n.insertBefore(u,d);let i=document.createElement("table"),p=document.createElement("thead");p.innerHTML=["<tr>",'<th data-sort-key="label">Label</th>','<th data-sort-key="schema">Schema Name</th>','<th data-sort-key="type">Type</th>','<th data-sort-key="value">Value</th>','<th data-sort-key="updateMode">Edit via</th>',"</tr>"].join(""),i.appendChild(p);let m=document.createElement("tbody");i.appendChild(m);let h=ye(p,m),g=document.createElement("div");g.className="dcat-no-results",g.textContent="No matching fields.",g.style.display="none";let b=R({placeholder:"Search by label, schema name or value\u2026",onFilter:f=>{let k=0;m.querySelectorAll("tr").forEach(x=>{let I=!f||x.dataset.searchLabel.includes(f)||x.dataset.searchSchema.includes(f)||x.dataset.searchValue.includes(f);x.style.display=I?"":"none",I&&k++}),g.style.display=k===0?"":"none"}});w(b.input),n.insertBefore(b.container,d);let y=async()=>{let f=await ce(a,c);ge(m,f,a,c),h(),b.triggerFilter()};s.addEventListener("click",()=>{s.disabled=!0,s.classList.add("cfp-spinning"),Xrm.Page.data.refresh(!1).then(async()=>{try{await y()}catch(f){console.error("[DynamicsCat] Loading all fields failed:",f)}finally{s.classList.remove("cfp-spinning"),s.disabled=!1}},f=>{console.error("[DynamicsCat] Refresh failed:",f),s.classList.remove("cfp-spinning"),s.disabled=!1})}),d.appendChild(i),d.appendChild(g);try{await y()}catch(f){console.error("[DynamicsCat] Loading all fields failed:",f),m.innerHTML='<tr><td colspan="5" class="cfp-error">Could not load entity fields.</td></tr>'}}function ie(){try{return window.top?.document??document}catch{return document}}function se(e,t){let n=t.defaultView??window,r=16,o=Math.min(j,n.innerWidth-r*2),d=Math.min(720,n.innerHeight-r*2);e.style.width=`${o}px`,e.style.height=`${d}px`,e.style.maxWidth=`${n.innerWidth-r*2}px`,e.style.maxHeight=`${n.innerHeight-r*2}px`,e.style.left=`${Math.max(r,(n.innerWidth-o)/2)}px`,e.style.top=`${Math.max(r,(n.innerHeight-d)/2)}px`,e.style.right="",e.style.transform=""}async function ce(e,t){let n=C();if(!n)throw new Error("Dynamics context is unavailable");let r=await E(n,()=>`EntityDefinitions(LogicalName='${encodeURIComponent(e)}')/Attributes?$select=LogicalName,SchemaName,AttributeType,AttributeOf,IsValidForRead,IsValidForUpdate,DisplayName`),o={};if(t)try{o=await pe(e,t)}catch(a){console.warn("[DynamicsCat] Saved field values could not be loaded:",a)}let d=new Map(Xrm.Page.data.entity.attributes.get().map(a=>[a.getName(),a])),s=U();return r.value.map(a=>{let c=a.LogicalName,u=d.get(c)??null,i=o[c]??o[`_${c}_value`],p=u?u.getValue():i,m=a.AttributeOf===null&&ue(u?.getAttributeType?.()||a.AttributeType)&&le(a.IsValidForUpdate);return{label:s[c]||a.DisplayName?.UserLocalizedLabel?.Label||c,name:c,type:u?.getAttributeType?.()||a.AttributeType||"\u2014",value:u?fe(u):me(i),rawValue:p,updateMode:m&&de(u)?"form":m&&t?"api":"readonly",formAttribute:u}})}function le(e){return e===!0||typeof e=="object"&&e?.Value===!0}function de(e){if(!e)return!1;try{return e.getUserPrivilege().canUpdate}catch{return!1}}function ue(e){return["boolean","datetime","decimal","double","integer","memo","money","multiselectoptionset","picklist","state","status","string","optionset"].includes((e??"").toLowerCase())}async function pe(e,t){let n=C();if(!n)throw new Error("Dynamics context is unavailable");let r=await A(n,e),o=t.replace(/[{}]/g,"");return await E(n,()=>`${r}(${o})`,{headers:{Prefer:'odata.include-annotations="OData.Community.Display.V1.FormattedValue"'}})}function me(e){return e==null?null:e instanceof Date?e.toLocaleString():typeof e=="object"?JSON.stringify(e):String(e)}function fe(e){try{let t=e.getValue();if(t==null)return null;switch(e.getAttributeType?e.getAttributeType():typeof t){case"lookup":return Array.isArray(t)?t.map(r=>r.name||r.id).join(", "):String(t);case"optionset":case"multiselectoptionset":{let r=e.getText?.();return r!=null?String(r):String(t)}case"datetime":return t instanceof Date?t.toLocaleString():String(t);case"boolean":return t?"Yes":"No";default:return String(t)}}catch{return"(error reading value)"}}function ge(e,t,n,r){e.innerHTML="",t.forEach(o=>{let{label:d,name:s,type:a,value:c,updateMode:u}=o,i=document.createElement("tr"),p=document.createElement("td");p.textContent=d;let m=document.createElement("td");m.textContent=s;let h=document.createElement("td"),g=document.createElement("span");g.className="cfp-type",g.textContent=a,h.appendChild(g);let L=document.createElement("td");W(L,o,n,r,i);let b=document.createElement("td"),y=document.createElement("span");y.className=`cfp-update-mode cfp-update-${u}`,y.textContent=u==="form"?"Form":u==="api"?"Web API":"Read only",y.title=u==="form"?"Updates the form value; saved by the normal CRM save action.":u==="api"?"Saves immediately through the Dynamics Web API.":"This field type or metadata does not allow updates here.",b.appendChild(y),i.dataset.searchLabel=d.toLowerCase(),i.dataset.searchSchema=s.toLowerCase(),i.dataset.searchValue=(c??"null").toLowerCase(),i.dataset.sortLabel=d,i.dataset.sortSchema=s,i.dataset.sortType=a,i.dataset.sortValue=c??"",i.dataset.sortUpdateMode=u,i.appendChild(p),i.appendChild(m),i.appendChild(h),i.appendChild(L),i.appendChild(b),e.appendChild(i)})}function ye(e,t){let n="label",r="ascending",o=Array.from(e.querySelectorAll("th[data-sort-key]")),d=new Intl.Collator(void 0,{numeric:!0,sensitivity:"base"}),s=()=>{let c=Array.from(t.querySelectorAll("tr")),u=`sort${n[0].toUpperCase()}${n.slice(1)}`,i=r==="ascending"?1:-1;c.sort((p,m)=>d.compare(p.dataset[u]??"",m.dataset[u]??"")*i),c.forEach(p=>t.appendChild(p)),o.forEach(p=>{let m=p.dataset.sortKey===n;p.setAttribute("aria-sort",m?r:"none")})},a=c=>{n===c?r=r==="ascending"?"descending":"ascending":(n=c,r="ascending"),s()};return o.forEach(c=>{c.tabIndex=0,c.setAttribute("role","button");let u=c.dataset.sortKey;c.addEventListener("click",()=>a(u)),c.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),a(u))})}),s(),s}function W(e,t,n,r,o){e.innerHTML="";let d=document.createElement("div");d.className="cfp-value";let s=document.createElement("span");if(s.className="cfp-value-text",s.textContent=t.value??"null",t.value===null&&s.classList.add("cfp-null"),d.appendChild(s),t.updateMode!=="readonly"){let a=document.createElement("button");a.className="cfp-edit",a.type="button",a.textContent="\u270E",a.title=`Edit ${t.name}`,a.setAttribute("aria-label",`Edit ${t.name}`),a.addEventListener("click",()=>{e.innerHTML="",e.appendChild(be(t,n,r,o,()=>W(e,t,n,r,o))),e.querySelector("input")?.focus()}),d.appendChild(a)}e.appendChild(d)}function be(e,t,n,r,o){let d=document.createElement("div");d.className="cfp-editor";let s=document.createElement("input");s.type="text",s.value=he(e.rawValue),s.placeholder="null",s.title=xe(e.type),w(s);let a=document.createElement("button");a.className="cfp-save",a.textContent="Save";let c=document.createElement("button");c.className="cfp-cancel",c.type="button",c.textContent="Cancel",c.addEventListener("click",o);let u=async()=>{a.disabled=!0,c.disabled=!0,a.textContent=e.updateMode==="api"?"Saving\u2026":"Applying\u2026";try{let i=ve(s.value,e.type);e.updateMode==="form"&&e.formAttribute?(e.formAttribute.setValue(i),e.formAttribute.fireOnChange(),v(`${e.name} updated on form; save the CRM record to persist it.`)):e.updateMode==="api"&&(await Ce(t,n,e.name,i),v(`${e.name} saved through Web API.`)),e.rawValue=i,e.value=we(i),r.dataset.searchValue=(e.value??"null").toLowerCase(),r.dataset.sortValue=e.value??"",o()}catch(i){console.error(`[DynamicsCat] Updating ${e.name} failed:`,i),v(`Could not update ${e.name}: ${i instanceof Error?i.message:String(i)}`,"warn"),a.textContent="Save"}finally{a.disabled=!1,c.disabled=!1}};return a.addEventListener("click",()=>{u()}),s.addEventListener("keydown",i=>{i.key==="Enter"?(i.preventDefault(),u()):i.key==="Escape"&&(i.preventDefault(),o())}),d.append(s,a,c),d}function he(e){return e==null?"":e instanceof Date?e.toISOString():Array.isArray(e)?e.join(","):String(e)}function xe(e){switch(e.toLowerCase()){case"boolean":return"Use true or false. Empty sets null.";case"datetime":return"Use a valid date/time. Empty sets null.";case"multiselectoptionset":return"Use comma-separated option numbers. Empty sets null.";case"picklist":case"state":case"status":case"optionset":return"Use the numeric option value. Empty sets null.";default:return"Empty sets null."}}function ve(e,t){let n=t.toLowerCase();if(e==="")return null;if(n==="boolean"){let r=e.trim().toLowerCase();if(r==="true"||r==="1"||r==="yes")return!0;if(r==="false"||r==="0"||r==="no")return!1;throw new Error("Expected true or false.")}if(n==="datetime"){let r=new Date(e);if(Number.isNaN(r.getTime()))throw new Error("Expected a valid date/time.");return r}if(n==="multiselectoptionset"){let r=e.split(",").map(o=>Number(o.trim()));if(r.some(o=>!Number.isInteger(o)))throw new Error("Expected comma-separated option numbers.");return r}if(["decimal","double","integer","money","picklist","state","status","optionset"].includes(n)){let r=Number(e);if(!Number.isFinite(r))throw new Error("Expected a number.");return r}return e}function we(e){return e===null?null:e instanceof Date?e.toLocaleString():Array.isArray(e)?e.join(", "):String(e)}async function Ce(e,t,n,r){let o=C();if(!o)throw new Error("Dynamics context is unavailable.");let d=await A(o,e),s=t.replace(/[{}]/g,""),a=r instanceof Date?r.toISOString():Array.isArray(r)?r.join(","):r;await O(o,()=>`${d}(${s})`,{method:"PATCH",credentials:"same-origin",headers:{"OData-MaxVersion":"4.0","OData-Version":"4.0",Accept:"application/json","Content-Type":"application/json; charset=utf-8","If-Match":"*"},body:JSON.stringify({[n]:a})})}ae();})();
