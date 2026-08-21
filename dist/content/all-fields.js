"use strict";(()=>{function I(e,t){let n;return(...r)=>{clearTimeout(n),n=setTimeout(()=>e(...r),t)}}function S(){let e={};return Xrm.Page.ui.controls.forEach(t=>{let n=t.getName();if(n)try{e[n]=t.getLabel()||n}catch{e[n]=n}}),e}function N(e,t,n){requestAnimationFrame(()=>{let a=e.getBoundingClientRect();e.style.left=a.left+"px",e.style.top=a.top+"px",e.style.right="",e.style.transform=""});let r=!1,i=0,s=0,l=a=>{if(!r)return;let d=Math.max(0,Math.min(a.clientX-i,window.innerWidth-e.offsetWidth)),p=Math.max(0,Math.min(a.clientY-s,window.innerHeight-e.offsetHeight));e.style.left=d+"px",e.style.top=p+"px"},o=()=>{r=!1,t.style.cursor="move"};t.addEventListener("mousedown",a=>{n.contains(a.target)||(r=!0,i=a.clientX-e.offsetLeft,s=a.clientY-e.offsetTop,t.style.cursor="grabbing",a.preventDefault())}),document.addEventListener("mousemove",l),document.addEventListener("mouseup",o),new MutationObserver((a,d)=>{document.contains(e)||(document.removeEventListener("mousemove",l),document.removeEventListener("mouseup",o),d.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}function $(e){let t=document.createElement("textarea");t.value=e,t.style.cssText="position:fixed;opacity:0;pointer-events:none",document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t)}function T(e){navigator.clipboard?.writeText?navigator.clipboard.writeText(e).catch(()=>$(e)):$(e)}function R(e,t){if(document.getElementById(e))return;let n=document.createElement("style");n.id=e,n.textContent=t,(document.head||document.documentElement).appendChild(n)}function x(e){e.addEventListener("keydown",t=>t.stopPropagation()),e.addEventListener("keyup",t=>t.stopPropagation())}function v(e,t){let n=document.createElement("span");return n.className="dcat-copy-val",n.textContent=e,n.title=`Click to copy: ${t}`,n.addEventListener("click",()=>{T(t),n.classList.add("dcat-copied"),setTimeout(()=>n.classList.remove("dcat-copied"),1200)}),n}function A(e){let t=document.createElement("div");t.className="dcat-search";let n=document.createElement("input");n.type="search",n.placeholder=e.placeholder,x(n);let r=I(()=>{e.onFilter(n.value.toLowerCase().trim())},e.debounceMs??100);return n.addEventListener("input",r),t.appendChild(n),{container:t,input:n,triggerFilter:()=>n.dispatchEvent(new Event("input"))}}function U(e,t){return`
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
`}function k(e){let t=document.getElementById(e.panelId);if(t)return t.remove(),null;let n=e.variant??"sidebar";R(e.styleId,U(e.panelId,n)+(e.extraCss??""));let r=document.createElement("div");r.id=e.panelId;let i=document.createElement("div");i.className="dcat-header";let s=document.createElement("span");s.className="dcat-title",s.textContent=e.title;let l=document.createElement("button");l.className="dcat-close",l.title="Close",l.textContent="\u2715",l.addEventListener("click",()=>r.remove()),i.append(s,l);let o=document.createElement("div");return o.className="dcat-body",r.append(i,o),document.body.appendChild(r),N(r,i,l),{panel:r,header:i,closeBtn:l,body:o}}var X="dynamicscat:api-version:";function V(e){return e.replace(/[{}]/g,"").toLowerCase()}function F(){try{if(typeof Xrm<"u"&&Xrm.Utility?.getGlobalContext)return Xrm.Utility.getGlobalContext()}catch(e){console.debug("[DynamicsCat] getGlobalContext failed",e)}return null}function H(){try{if(typeof Xrm<"u"&&Xrm.Page?.context)return Xrm.Page.context}catch(e){console.debug("[DynamicsCat] get legacy context failed",e)}return null}function C(){let e=F(),t=H(),n=e?.getClientUrl?.()??t?.getClientUrl?.()??null;if(!n)return null;let r=e?.userSettings?.userId,i=t?.getUserId?.(),s=r||i?V(String(r??i)):null,l=e?.userSettings?.languageId,o=t?.getUserLcid?.(),a=null;typeof l=="number"&&Number.isInteger(l)?a=l:typeof o=="number"&&Number.isInteger(o)&&(a=o);let d=e?.getVersion?.()??t?.getVersion?.()??null;return{clientUrl:n.replace(/\/$/,""),userId:s,userLanguageId:a,crmVersion:d}}function D(e){let t=new Set,n=e?parseInt(e.split(".")[0]??"",10):Number.NaN,r=e?parseInt(e.split(".")[1]??"",10):Number.NaN;if(Number.isInteger(n)){if(n>=9)return t.add(Number.isInteger(r)?`v${n}.${r}`:"v9.2"),t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),Array.from(t);if(n===8)return t.add(Number.isInteger(r)?`v8.${r}`:"v8.2"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}return t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}function M(e){return`${X}${e.clientUrl.toLowerCase()}`}function z(e){try{return localStorage.getItem(M(e))}catch{return null}}function B(e,t){try{localStorage.setItem(M(e),t)}catch{}}function W(e){let t=z(e);return t?[t,...D(e.crmVersion).filter(n=>n!==t)]:D(e.crmVersion)}function j(e){return e?.headers?{...e,headers:new Headers(e.headers)}:e}async function y(e,t,n){let r=[];for(let s of W(e)){let l=`${e.clientUrl}/api/data/${s}/${t(s)}`,o=await fetch(l,j(n));if(o.ok)return B(e,s),{json:await o.json(),version:s};if(r.push({version:s,status:o.status,body:await o.text()}),o.status!==404&&o.status!==501)break}let i=r[r.length-1];throw new Error(i?`Web API failed (${i.version}, HTTP ${i.status}): ${i.body.slice(0,160)}`:"Web API failed before receiving a response")}async function P(e,t){if(typeof Xrm<"u"&&typeof Xrm.Utility?.getEntityMetadata=="function"){let r=await Xrm.Utility.getEntityMetadata(t,[]);if(r.EntitySetName)return r.EntitySetName}return(await y(e,()=>`EntityDefinitions(LogicalName='${encodeURIComponent(t)}')?$select=EntitySetName`)).json.EntitySetName}var c="crm-tools-fields-panel",O="crm-tools-fields-style",_=`
#${c} .cfp-refresh {
  background: none; border: none; color: #fff; font-size: 16px;
  line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85; margin-right: 4px;
}
#${c} .cfp-refresh:hover { opacity: 1; }
#${c} .cfp-refresh:disabled { opacity: 0.5; cursor: default; }
@keyframes cfp-spin { to { transform: rotate(360deg); } }
#${c} .cfp-refresh.cfp-spinning { display: inline-block; animation: cfp-spin 0.8s linear infinite; }
#${c} table { width: 100%; border-collapse: collapse; }
#${c} thead th {
  position: sticky; top: 0; background: #f0f4ff;
  border-bottom: 2px solid #1e64c8; padding: 7px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #444; white-space: nowrap;
}
#${c} tbody tr:nth-child(even) { background: #f8f9ff; }
#${c} tbody tr:hover { background: #dceafe; }
#${c} td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8; vertical-align: top;
}
#${c} td:nth-child(1), #${c} th:nth-child(1) { white-space: nowrap; }
#${c} td:nth-child(2), #${c} th:nth-child(2) { white-space: nowrap; }
#${c} td:nth-child(3), #${c} th:nth-child(3) { white-space: nowrap; }
#${c} td:nth-child(4), #${c} th:nth-child(4) { min-width: 180px; max-width: 360px; word-break: break-word; }
#${c} td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#${c} .cfp-type {
  display: inline-block; padding: 1px 6px; border-radius: 10px;
  font-size: 11px; background: #e8e8e8; color: #444;
}
#${c} .cfp-null { color: #aaa; font-style: italic; }
`;async function G(){if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.ui||!Xrm.Page.data)return;let e=k({panelId:c,styleId:O,title:"\u{1F4CB} All Fields",extraCss:_});if(!e)return;let{panel:t,header:n,closeBtn:r,body:i}=e,s=document.createElement("button");s.className="cfp-refresh",s.title="Refresh form data",s.textContent="\u21BB",n.insertBefore(s,r);let l=Xrm.Page.data.entity.getEntityName(),o=Xrm.Page.data.entity.getId(),a=document.createElement("div");if(a.className="dcat-subheader",a.append("Entity: "),a.appendChild(v(l,l)),a.append("  |  ID: "),o){let u=o.replace(/^\{|\}$/g,"");a.appendChild(v(o,u))}else a.append("(new record)");t.insertBefore(a,i);let d=document.createElement("table"),p=document.createElement("thead");p.innerHTML="<tr><th>Label</th><th>Schema Name</th><th>Type</th><th>Value</th></tr>",d.appendChild(p);let f=document.createElement("tbody");d.appendChild(f);let m=document.createElement("div");m.className="dcat-no-results",m.textContent="No matching fields.",m.style.display="none";let h=A({placeholder:"Search by label, schema name or value\u2026",onFilter:u=>{let w=0;f.querySelectorAll("tr").forEach(b=>{let L=!u||b.dataset.searchLabel.includes(u)||b.dataset.searchSchema.includes(u)||b.dataset.searchValue.includes(u);b.style.display=L?"":"none",L&&w++}),m.style.display=w===0?"":"none"}});x(h.input),t.insertBefore(h.container,i);let E=async()=>{let u=await q(l,o);Q(f,u),h.triggerFilter()};s.addEventListener("click",()=>{s.disabled=!0,s.classList.add("cfp-spinning"),Xrm.Page.data.refresh(!1).then(async()=>{try{await E()}catch(u){console.error("[DynamicsCat] Loading all fields failed:",u)}finally{s.classList.remove("cfp-spinning"),s.disabled=!1}},u=>{console.error("[DynamicsCat] Refresh failed:",u),s.classList.remove("cfp-spinning"),s.disabled=!1})}),i.appendChild(d),i.appendChild(m);try{await E()}catch(u){console.error("[DynamicsCat] Loading all fields failed:",u),f.innerHTML='<tr><td colspan="4" class="cfp-error">Could not load entity fields.</td></tr>'}requestAnimationFrame(()=>{let u=d.offsetWidth;t.style.width=Math.min(Math.max(u,420),window.innerWidth*.9)+"px"})}async function q(e,t){let n=C();if(!n)throw new Error("Dynamics context is unavailable");let{json:r}=await y(n,()=>`EntityDefinitions(LogicalName='${encodeURIComponent(e)}')/Attributes?$select=LogicalName,SchemaName,AttributeType,AttributeOf,IsValidForRead,DisplayName`),i={};if(t)try{i=await Y(e,t)}catch(o){console.warn("[DynamicsCat] Saved field values could not be loaded:",o)}let s=new Map(Xrm.Page.data.entity.attributes.get().map(o=>[o.getName(),o])),l=S();return r.value.map(o=>{let a=o.LogicalName,d=s.get(a),p=i[a]??i[`_${a}_value`];return{label:l[a]||o.DisplayName?.UserLocalizedLabel?.Label||a,name:a,type:d?.getAttributeType?.()||o.AttributeType||"\u2014",value:d?K(d):J(p)}})}async function Y(e,t){let n=C();if(!n)throw new Error("Dynamics context is unavailable");let r=await P(n,e),i=t.replace(/[{}]/g,""),{json:s}=await y(n,()=>`${r}(${i})`,{headers:{Prefer:'odata.include-annotations="OData.Community.Display.V1.FormattedValue"'}});return s}function J(e){return e==null?null:e instanceof Date?e.toLocaleString():typeof e=="object"?JSON.stringify(e):String(e)}function K(e){try{let t=e.getValue();if(t==null)return null;switch(e.getAttributeType?e.getAttributeType():typeof t){case"lookup":return Array.isArray(t)?t.map(r=>r.name||r.id).join(", "):String(t);case"optionset":case"multiselectoptionset":{let r=e.getText?.();return r!=null?String(r):String(t)}case"datetime":return t instanceof Date?t.toLocaleString():String(t);case"boolean":return t?"Yes":"No";default:return String(t)}}catch{return"(error reading value)"}}function Q(e,t){e.innerHTML="",[...t].sort((r,i)=>r.label.localeCompare(i.label)).forEach(({label:r,name:i,type:s,value:l})=>{let o=document.createElement("tr"),a=document.createElement("td");a.textContent=r;let d=document.createElement("td");d.textContent=i;let p=document.createElement("td"),f=document.createElement("span");f.className="cfp-type",f.textContent=s,p.appendChild(f);let m=document.createElement("td");if(l===null){let g=document.createElement("span");g.className="cfp-null",g.textContent="null",m.appendChild(g)}else m.textContent=l;o.dataset.searchLabel=r.toLowerCase(),o.dataset.searchSchema=i.toLowerCase(),o.dataset.searchValue=(l??"null").toLowerCase(),o.appendChild(a),o.appendChild(d),o.appendChild(p),o.appendChild(m),e.appendChild(o)})}G();})();
