"use strict";(()=>{function T(e,t){let n;return(...a)=>{clearTimeout(n),n=setTimeout(()=>e(...a),t)}}function y(){let e={};return Xrm.Page.ui.controls.forEach(t=>{let n=t.getName();if(n)try{e[n]=t.getLabel()||n}catch{e[n]=n}}),e}function S(e,t,n){requestAnimationFrame(()=>{let r=e.getBoundingClientRect();e.style.left=r.left+"px",e.style.top=r.top+"px",e.style.right="",e.style.transform=""});let a=!1,i=0,o=0,c=r=>{if(!a)return;let d=Math.max(0,Math.min(r.clientX-i,window.innerWidth-e.offsetWidth)),m=Math.max(0,Math.min(r.clientY-o,window.innerHeight-e.offsetHeight));e.style.left=d+"px",e.style.top=m+"px"},l=()=>{a=!1,t.style.cursor="move"};t.addEventListener("mousedown",r=>{n.contains(r.target)||(a=!0,i=r.clientX-e.offsetLeft,o=r.clientY-e.offsetTop,t.style.cursor="grabbing",r.preventDefault())}),document.addEventListener("mousemove",c),document.addEventListener("mouseup",l),new MutationObserver((r,d)=>{document.contains(e)||(document.removeEventListener("mousemove",c),document.removeEventListener("mouseup",l),d.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}function L(e){let t=document.createElement("textarea");t.value=e,t.style.cssText="position:fixed;opacity:0;pointer-events:none",document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t)}function $(e){navigator.clipboard?.writeText?navigator.clipboard.writeText(e).catch(()=>L(e)):L(e)}function I(e,t){if(document.getElementById(e))return;let n=document.createElement("style");n.id=e,n.textContent=t,(document.head||document.documentElement).appendChild(n)}function v(e){e.addEventListener("keydown",t=>t.stopPropagation()),e.addEventListener("keyup",t=>t.stopPropagation())}function E(e,t){let n=document.createElement("span");return n.className="dcat-copy-val",n.textContent=e,n.title=`Click to copy: ${t}`,n.addEventListener("click",()=>{$(t),n.classList.add("dcat-copied"),setTimeout(()=>n.classList.remove("dcat-copied"),1200)}),n}function k(e){let t=document.createElement("div");t.className="dcat-search";let n=document.createElement("input");n.type="search",n.placeholder=e.placeholder,v(n);let a=T(()=>{e.onFilter(n.value.toLowerCase().trim())},e.debounceMs??100);return n.addEventListener("input",a),t.appendChild(n),{container:t,input:n,triggerFilter:()=>n.dispatchEvent(new Event("input"))}}function X(e,t){return`
#${e} { ${t==="dialog"?`position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 380px;
       background: #fff; border: 2px solid #1e64c8; border-radius: 8px;
       box-shadow: 0 4px 24px rgba(0,0,0,0.2);
       z-index: 2147483647; overflow: hidden;
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
`}function M(e){let t=document.getElementById(e.panelId);if(t)return t.remove(),null;let n=e.variant??"sidebar";I(e.styleId,X(e.panelId,n)+(e.extraCss??""));let a=document.createElement("div");a.id=e.panelId;let i=document.createElement("div");i.className="dcat-header";let o=document.createElement("span");o.className="dcat-title",o.textContent=e.title;let c=document.createElement("button");c.className="dcat-close",c.title="Close",c.textContent="\u2715",c.addEventListener("click",()=>a.remove()),i.append(o,c);let l=document.createElement("div");return l.className="dcat-body",a.append(i,l),document.body.appendChild(a),S(a,i,c),{panel:a,header:i,closeBtn:c,body:l}}var s="crm-tools-fields-panel",P="crm-tools-fields-style",B=`
#${s} .cfp-refresh {
  background: none; border: none; color: #fff; font-size: 16px;
  line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85; margin-right: 4px;
}
#${s} .cfp-refresh:hover { opacity: 1; }
#${s} .cfp-refresh:disabled { opacity: 0.5; cursor: default; }
@keyframes cfp-spin { to { transform: rotate(360deg); } }
#${s} .cfp-refresh.cfp-spinning { display: inline-block; animation: cfp-spin 0.8s linear infinite; }
#${s} table { width: 100%; border-collapse: collapse; }
#${s} thead th {
  position: sticky; top: 0; background: #f0f4ff;
  border-bottom: 2px solid #1e64c8; padding: 7px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #444; white-space: nowrap;
}
#${s} tbody tr:nth-child(even) { background: #f8f9ff; }
#${s} tbody tr:hover { background: #dceafe; }
#${s} td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8; vertical-align: top;
}
#${s} td:nth-child(1), #${s} th:nth-child(1) { white-space: nowrap; }
#${s} td:nth-child(2), #${s} th:nth-child(2) { white-space: nowrap; }
#${s} td:nth-child(3), #${s} th:nth-child(3) { white-space: nowrap; }
#${s} td:nth-child(4), #${s} th:nth-child(4) { min-width: 180px; max-width: 360px; word-break: break-word; }
#${s} td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#${s} .cfp-type {
  display: inline-block; padding: 1px 6px; border-radius: 10px;
  font-size: 11px; background: #e8e8e8; color: #444;
}
#${s} .cfp-null { color: #aaa; font-style: italic; }
`;function H(){if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.ui||!Xrm.Page.data)return;let e=M({panelId:s,styleId:P,title:"\u{1F4CB} All Fields",extraCss:B});if(!e)return;let{panel:t,header:n,closeBtn:a,body:i}=e,o=document.createElement("button");o.className="cfp-refresh",o.title="Refresh form data",o.textContent="\u21BB",n.insertBefore(o,a);let c=Xrm.Page.data.entity.getEntityName(),l=Xrm.Page.data.entity.getId(),r=document.createElement("div");if(r.className="dcat-subheader",r.append("Entity: "),r.appendChild(E(c,c)),r.append("  |  ID: "),l){let p=l.replace(/^\{|\}$/g,"");r.appendChild(E(l,p))}else r.append("(new record)");t.insertBefore(r,i);let d=document.createElement("table"),m=document.createElement("thead");m.innerHTML="<tr><th>Label</th><th>Schema Name</th><th>Type</th><th>Value</th></tr>",d.appendChild(m);let f=document.createElement("tbody");d.appendChild(f);let u=document.createElement("div");u.className="dcat-no-results",u.textContent="No matching fields.",u.style.display="none";let h=k({placeholder:"Search by label, schema name or value\u2026",onFilter:p=>{let C=0;f.querySelectorAll("tr").forEach(x=>{let w=!p||x.dataset.searchLabel.includes(p)||x.dataset.searchSchema.includes(p)||x.dataset.searchValue.includes(p);x.style.display=w?"":"none",w&&C++}),u.style.display=C===0?"":"none"}});v(h.input),t.insertBefore(h.container,i);let g=Xrm.Page.data.entity.attributes.get(),N=y();A(f,g,N),o.addEventListener("click",()=>{o.disabled=!0,o.classList.add("cfp-spinning"),Xrm.Page.data.refresh(!1).then(()=>{A(f,Xrm.Page.data.entity.attributes.get(),y()),h.triggerFilter(),o.classList.remove("cfp-spinning"),o.disabled=!1},p=>{console.error("[DynamicsCat] Refresh failed:",p),o.classList.remove("cfp-spinning"),o.disabled=!1})}),i.appendChild(d),i.appendChild(u),requestAnimationFrame(()=>{let p=d.offsetWidth;t.style.width=Math.min(Math.max(p,420),window.innerWidth*.9)+"px"})}function z(e){try{let t=e.getValue();if(t==null)return null;switch(e.getAttributeType?e.getAttributeType():typeof t){case"lookup":return Array.isArray(t)?t.map(a=>a.name||a.id).join(", "):String(t);case"optionset":case"multiselectoptionset":{let a=e.getText?.();return a!=null?String(a):String(t)}case"datetime":return t instanceof Date?t.toLocaleString():String(t);case"boolean":return t?"Yes":"No";default:return String(t)}}catch{return"(error reading value)"}}function A(e,t,n){e.innerHTML="",[...t].sort((i,o)=>{let c=(n[i.getName()]||i.getName()).toLowerCase(),l=(n[o.getName()]||o.getName()).toLowerCase();return c.localeCompare(l)}).forEach(i=>{let o=i.getName(),c=n[o]||o,l=i.getAttributeType?i.getAttributeType():"\u2014",r=z(i),d=document.createElement("tr"),m=document.createElement("td");m.textContent=c;let f=document.createElement("td");f.textContent=o;let u=document.createElement("td"),b=document.createElement("span");b.className="cfp-type",b.textContent=l,u.appendChild(b);let h=document.createElement("td");if(r===null){let g=document.createElement("span");g.className="cfp-null",g.textContent="null",h.appendChild(g)}else h.textContent=r;d.dataset.searchLabel=c.toLowerCase(),d.dataset.searchSchema=o.toLowerCase(),d.dataset.searchValue=(r??"null").toLowerCase(),d.appendChild(m),d.appendChild(f),d.appendChild(u),d.appendChild(h),e.appendChild(d)})}H();})();
