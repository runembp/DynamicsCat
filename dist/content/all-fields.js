"use strict";(()=>{function S(e,t){let n;return(...r)=>{clearTimeout(n),n=setTimeout(()=>e(...r),t)}}function N(){let e={};return Xrm.Page.ui.controls.forEach(t=>{let n=t.getName();if(n)try{e[n]=t.getLabel()||n}catch{e[n]=n}}),e}function T(e,t,n){requestAnimationFrame(()=>{let i=e.getBoundingClientRect();e.style.left=i.left+"px",e.style.top=i.top+"px",e.style.right="",e.style.transform=""});let r=!1,o=0,s=0,l=i=>{if(!r)return;let d=Math.max(0,Math.min(i.clientX-o,window.innerWidth-e.offsetWidth)),p=Math.max(0,Math.min(i.clientY-s,window.innerHeight-e.offsetHeight));e.style.left=d+"px",e.style.top=p+"px"},a=()=>{r=!1,t.style.cursor="move"};t.addEventListener("mousedown",i=>{n.contains(i.target)||(r=!0,o=i.clientX-e.offsetLeft,s=i.clientY-e.offsetTop,t.style.cursor="grabbing",i.preventDefault())}),document.addEventListener("mousemove",l),document.addEventListener("mouseup",a),new MutationObserver((i,d)=>{document.contains(e)||(document.removeEventListener("mousemove",l),document.removeEventListener("mouseup",a),d.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}function I(e){let t=document.createElement("textarea");t.value=e,t.style.cssText="position:fixed;opacity:0;pointer-events:none",document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t)}function A(e){navigator.clipboard?.writeText?navigator.clipboard.writeText(e).catch(()=>I(e)):I(e)}function R(e,t){if(document.getElementById(e))return;let n=document.createElement("style");n.id=e,n.textContent=t,(document.head||document.documentElement).appendChild(n)}function x(e){e.addEventListener("keydown",t=>t.stopPropagation()),e.addEventListener("keyup",t=>t.stopPropagation())}function v(e,t){let n=document.createElement("span");return n.className="dcat-copy-val",n.textContent=e,n.title=`Click to copy: ${t}`,n.addEventListener("click",()=>{A(t),n.classList.add("dcat-copied"),setTimeout(()=>n.classList.remove("dcat-copied"),1200)}),n}function D(e){let t=document.createElement("div");t.className="dcat-search";let n=document.createElement("input");n.type="search",n.placeholder=e.placeholder,x(n);let r=S(()=>{e.onFilter(n.value.toLowerCase().trim())},e.debounceMs??100);return n.addEventListener("input",r),t.appendChild(n),{container:t,input:n,triggerFilter:()=>n.dispatchEvent(new Event("input"))}}function U(e,t){return`
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
`}function k(e){let t=document.getElementById(e.panelId);if(t)return t.remove(),null;let n=e.variant??"sidebar";R(e.styleId,U(e.panelId,n)+(e.extraCss??""));let r=document.createElement("div");r.id=e.panelId;let o=document.createElement("div");o.className="dcat-header";let s=document.createElement("span");s.className="dcat-title",s.textContent=e.title;let l=document.createElement("button");l.className="dcat-close",l.title="Close",l.textContent="\u2715",l.addEventListener("click",()=>r.remove()),o.append(s,l);let a=document.createElement("div");return a.className="dcat-body",r.append(o,a),document.body.appendChild(r),T(r,o,l),{panel:r,header:o,closeBtn:l,body:a}}var X="dynamicscat:api-version:",C=new Map;function V(e){return e.replace(/[{}]/g,"").toLowerCase()}function H(){try{if(typeof Xrm<"u"&&Xrm.Utility?.getGlobalContext)return Xrm.Utility.getGlobalContext()}catch(e){console.debug("[DynamicsCat] getGlobalContext failed",e)}return null}function F(){try{if(typeof Xrm<"u"&&Xrm.Page?.context)return Xrm.Page.context}catch(e){console.debug("[DynamicsCat] get legacy context failed",e)}return null}function w(){let e=H(),t=F(),n=e?.getClientUrl?.()??t?.getClientUrl?.()??null;if(!n)return null;let r=e?.userSettings?.userId,o=t?.getUserId?.(),s=r||o?V(String(r??o)):null,l=e?.userSettings?.languageId,a=t?.getUserLcid?.(),i=null;typeof l=="number"&&Number.isInteger(l)?i=l:typeof a=="number"&&Number.isInteger(a)&&(i=a);let d=e?.getVersion?.()??t?.getVersion?.()??null;return{clientUrl:n.replace(/\/$/,""),userId:s,userLanguageId:i,crmVersion:d}}function z(e){let t=new Set,n=e?parseInt(e.split(".")[0]??"",10):Number.NaN,r=e?parseInt(e.split(".")[1]??"",10):Number.NaN;if(Number.isInteger(n)){if(n>=9)return t.add(Number.isInteger(r)?`v${n}.${r}`:"v9.2"),t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),Array.from(t);if(n===8)return t.add(Number.isInteger(r)?`v8.${r}`:"v8.2"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}return t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}function P(e){return`${X}${e.clientUrl.toLowerCase()}`}function B(e){try{return localStorage.getItem(P(e))}catch{return null}}function O(e,t){try{localStorage.setItem(P(e),t)}catch{}}function _(e){return e?.headers?{...e,headers:new Headers(e.headers)}:e}async function W(e){for(let t of z(e.crmVersion)){let n=await fetch(`${e.clientUrl}/api/data/${t}/`,{credentials:"same-origin",headers:{Accept:"application/json"}});if(n.ok)return O(e,t),t;if(n.status!==404&&n.status!==501)throw new Error(`Web API scan failed (${t}, HTTP ${n.status})`)}throw new Error("No supported Dynamics Web API version found")}function j(e){let t=B(e);if(t)return Promise.resolve(t);let n=e.clientUrl.toLowerCase(),r=C.get(n);if(r)return r;let o=W(e).finally(()=>C.delete(n));return C.set(n,o),o}async function b(e,t,n){let r=await j(e),o=await fetch(`${e.clientUrl}/api/data/${r}/${t(r)}`,_(n));if(!o.ok){let s=await o.text();throw new Error(`Web API failed (${r}, HTTP ${o.status}): ${s.slice(0,160)}`)}return await o.json()}async function M(e,t){if(typeof Xrm<"u"&&typeof Xrm.Utility?.getEntityMetadata=="function"){let r=await Xrm.Utility.getEntityMetadata(t,[]);if(r.EntitySetName)return r.EntitySetName}return(await b(e,()=>`EntityDefinitions(LogicalName='${encodeURIComponent(t)}')?$select=EntitySetName`)).EntitySetName}var c="crm-tools-fields-panel",G="crm-tools-fields-style",q=`
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
`;async function Y(){if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.ui||!Xrm.Page.data)return;let e=k({panelId:c,styleId:G,title:"\u{1F4CB} All Fields",extraCss:q});if(!e)return;let{panel:t,header:n,closeBtn:r,body:o}=e,s=document.createElement("button");s.className="cfp-refresh",s.title="Refresh form data",s.textContent="\u21BB",n.insertBefore(s,r);let l=Xrm.Page.data.entity.getEntityName(),a=Xrm.Page.data.entity.getId(),i=document.createElement("div");if(i.className="dcat-subheader",i.append("Entity: "),i.appendChild(v(l,l)),i.append("  |  ID: "),a){let u=a.replace(/^\{|\}$/g,"");i.appendChild(v(a,u))}else i.append("(new record)");t.insertBefore(i,o);let d=document.createElement("table"),p=document.createElement("thead");p.innerHTML="<tr><th>Label</th><th>Schema Name</th><th>Type</th><th>Value</th></tr>",d.appendChild(p);let f=document.createElement("tbody");d.appendChild(f);let m=document.createElement("div");m.className="dcat-no-results",m.textContent="No matching fields.",m.style.display="none";let h=D({placeholder:"Search by label, schema name or value\u2026",onFilter:u=>{let L=0;f.querySelectorAll("tr").forEach(y=>{let $=!u||y.dataset.searchLabel.includes(u)||y.dataset.searchSchema.includes(u)||y.dataset.searchValue.includes(u);y.style.display=$?"":"none",$&&L++}),m.style.display=L===0?"":"none"}});x(h.input),t.insertBefore(h.container,o);let E=async()=>{let u=await J(l,a);ee(f,u),h.triggerFilter()};s.addEventListener("click",()=>{s.disabled=!0,s.classList.add("cfp-spinning"),Xrm.Page.data.refresh(!1).then(async()=>{try{await E()}catch(u){console.error("[DynamicsCat] Loading all fields failed:",u)}finally{s.classList.remove("cfp-spinning"),s.disabled=!1}},u=>{console.error("[DynamicsCat] Refresh failed:",u),s.classList.remove("cfp-spinning"),s.disabled=!1})}),o.appendChild(d),o.appendChild(m);try{await E()}catch(u){console.error("[DynamicsCat] Loading all fields failed:",u),f.innerHTML='<tr><td colspan="4" class="cfp-error">Could not load entity fields.</td></tr>'}requestAnimationFrame(()=>{let u=d.offsetWidth;t.style.width=Math.min(Math.max(u,420),window.innerWidth*.9)+"px"})}async function J(e,t){let n=w();if(!n)throw new Error("Dynamics context is unavailable");let r=await b(n,()=>`EntityDefinitions(LogicalName='${encodeURIComponent(e)}')/Attributes?$select=LogicalName,SchemaName,AttributeType,AttributeOf,IsValidForRead,DisplayName`),o={};if(t)try{o=await K(e,t)}catch(a){console.warn("[DynamicsCat] Saved field values could not be loaded:",a)}let s=new Map(Xrm.Page.data.entity.attributes.get().map(a=>[a.getName(),a])),l=N();return r.value.map(a=>{let i=a.LogicalName,d=s.get(i),p=o[i]??o[`_${i}_value`];return{label:l[i]||a.DisplayName?.UserLocalizedLabel?.Label||i,name:i,type:d?.getAttributeType?.()||a.AttributeType||"\u2014",value:d?Z(d):Q(p)}})}async function K(e,t){let n=w();if(!n)throw new Error("Dynamics context is unavailable");let r=await M(n,e),o=t.replace(/[{}]/g,"");return await b(n,()=>`${r}(${o})`,{headers:{Prefer:'odata.include-annotations="OData.Community.Display.V1.FormattedValue"'}})}function Q(e){return e==null?null:e instanceof Date?e.toLocaleString():typeof e=="object"?JSON.stringify(e):String(e)}function Z(e){try{let t=e.getValue();if(t==null)return null;switch(e.getAttributeType?e.getAttributeType():typeof t){case"lookup":return Array.isArray(t)?t.map(r=>r.name||r.id).join(", "):String(t);case"optionset":case"multiselectoptionset":{let r=e.getText?.();return r!=null?String(r):String(t)}case"datetime":return t instanceof Date?t.toLocaleString():String(t);case"boolean":return t?"Yes":"No";default:return String(t)}}catch{return"(error reading value)"}}function ee(e,t){e.innerHTML="",[...t].sort((r,o)=>r.label.localeCompare(o.label)).forEach(({label:r,name:o,type:s,value:l})=>{let a=document.createElement("tr"),i=document.createElement("td");i.textContent=r;let d=document.createElement("td");d.textContent=o;let p=document.createElement("td"),f=document.createElement("span");f.className="cfp-type",f.textContent=s,p.appendChild(f);let m=document.createElement("td");if(l===null){let g=document.createElement("span");g.className="cfp-null",g.textContent="null",m.appendChild(g)}else m.textContent=l;a.dataset.searchLabel=r.toLowerCase(),a.dataset.searchSchema=o.toLowerCase(),a.dataset.searchValue=(l??"null").toLowerCase(),a.appendChild(i),a.appendChild(d),a.appendChild(p),a.appendChild(m),e.appendChild(a)})}Y();})();
