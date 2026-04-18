"use strict";(()=>{var k="crm-tools-fields-panel",C="crm-tools-fields-style";function N(e,t){let n;return(...a)=>{clearTimeout(n),n=setTimeout(()=>e(...a),t)}}function S(){let e=document.getElementById(k);if(e){e.remove();return}if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.ui||!Xrm.Page.data)return;let t=Xrm.Page.data.entity.attributes.get(),n=T();M(),I(t,n)}function T(){let e={};return Xrm.Page.ui.controls.forEach(t=>{let n=t.getName();if(n)try{e[n]=t.getLabel()||n}catch{e[n]=n}}),e}function M(){if(document.getElementById(C))return;let e=document.createElement("style");e.id=C,e.textContent=`
#crm-tools-fields-panel {
  position: fixed; top: 0; right: 0; width: auto; min-width: 420px; max-width: 90vw; max-height: 90vh;
  background: #fff; border: 2px solid #1e64c8;
  box-shadow: -4px 0 16px rgba(0,0,0,0.18);
  z-index: 2147483647; display: flex; flex-direction: column;
  font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;
}
#crm-tools-fields-panel .cfp-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #1e64c8; color: #fff; padding: 10px 14px; flex-shrink: 0;
  cursor: move; user-select: none;
}
#crm-tools-fields-panel .cfp-header-title { font-size: 14px; font-weight: 600; }
#crm-tools-fields-panel .cfp-close,
#crm-tools-fields-panel .cfp-refresh {
  background: none; border: none; color: #fff; font-size: 18px;
  line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85;
}
#crm-tools-fields-panel .cfp-close:hover,
#crm-tools-fields-panel .cfp-refresh:hover { opacity: 1; }
#crm-tools-fields-panel .cfp-refresh { font-size: 16px; margin-right: 4px; }
#crm-tools-fields-panel .cfp-refresh:disabled { opacity: 0.5; cursor: default; }
@keyframes cfp-spin { to { transform: rotate(360deg); } }
#crm-tools-fields-panel .cfp-refresh.cfp-spinning { display: inline-block; animation: cfp-spin 0.8s linear infinite; }
#crm-tools-fields-panel .cfp-subheader {
  padding: 6px 14px; background: #e8f0fe; font-size: 12px;
  color: #1e64c8; border-bottom: 1px solid #c5d8fb; flex-shrink: 0;
}
#crm-tools-fields-panel .cfp-copy-val {
  cursor: pointer; border-bottom: 1px dashed #1e64c8;
  transition: background 0.15s;
}
#crm-tools-fields-panel .cfp-copy-val:hover { background: #c5d8fb; border-radius: 3px; }
#crm-tools-fields-panel .cfp-copy-val.cfp-copied { background: #b7f0c8; border-bottom-color: #2a9c52; border-radius: 3px; }
#crm-tools-fields-panel .cfp-body { overflow-y: auto; overflow-x: auto; flex: 1; }
#crm-tools-fields-panel table { border-collapse: collapse; }
#crm-tools-fields-panel thead th {
  position: sticky; top: 0; background: #f0f4ff;
  border-bottom: 2px solid #1e64c8; padding: 7px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #444; white-space: nowrap;
}
#crm-tools-fields-panel tbody tr:nth-child(even) { background: #f8f9ff; }
#crm-tools-fields-panel tbody tr:hover { background: #dceafe; }
#crm-tools-fields-panel td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8; vertical-align: top;
}
#crm-tools-fields-panel td:nth-child(1), #crm-tools-fields-panel th:nth-child(1) { white-space: nowrap; }
#crm-tools-fields-panel td:nth-child(2), #crm-tools-fields-panel th:nth-child(2) { white-space: nowrap; }
#crm-tools-fields-panel td:nth-child(3), #crm-tools-fields-panel th:nth-child(3) { white-space: nowrap; }
#crm-tools-fields-panel td:nth-child(4), #crm-tools-fields-panel th:nth-child(4) { min-width: 180px; max-width: 360px; word-break: break-word; }
#crm-tools-fields-panel td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#crm-tools-fields-panel .cfp-type {
  display: inline-block; padding: 1px 6px; border-radius: 10px;
  font-size: 11px; background: #e8e8e8; color: #444;
}
#crm-tools-fields-panel .cfp-null { color: #aaa; font-style: italic; }
#crm-tools-fields-panel .cfp-search {
  padding: 8px 14px; background: #fff; border-bottom: 1px solid #c5d8fb;
  flex-shrink: 0;
}
#crm-tools-fields-panel .cfp-search input {
  width: 100%; box-sizing: border-box; padding: 5px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px; font-size: 13px;
  font-family: Segoe UI, Arial, sans-serif; color: #222; outline: none;
}
#crm-tools-fields-panel .cfp-search input:focus { border-color: #1e64c8; }
#crm-tools-fields-panel .cfp-no-results {
  padding: 16px; text-align: center; color: #888; font-style: italic;
}
  `,document.head.appendChild(e)}function X(e){try{let t=e.getValue();if(t==null)return null;switch(e.getAttributeType?e.getAttributeType():typeof t){case"lookup":return Array.isArray(t)?t.map(a=>a.name||a.id).join(", "):String(t);case"optionset":case"multiselectoptionset":{let a=e.getText?.();return a!=null?String(a):String(t)}case"datetime":return t instanceof Date?t.toLocaleString():String(t);case"boolean":return t?"Yes":"No";default:return String(t)}}catch{return"(error reading value)"}}function P(e,t,n){requestAnimationFrame(()=>{let r=e.getBoundingClientRect();e.style.left=r.left+"px",e.style.top=r.top+"px",e.style.right=""});let a=!1,l=0,o=0,c=r=>{if(!a)return;let s=Math.max(0,Math.min(r.clientX-l,window.innerWidth-e.offsetWidth)),m=Math.max(0,Math.min(r.clientY-o,window.innerHeight-e.offsetHeight));e.style.left=s+"px",e.style.top=m+"px"},p=()=>{a=!1,t.style.cursor="move"};t.addEventListener("mousedown",r=>{n.contains(r.target)||(a=!0,l=r.clientX-e.offsetLeft,o=r.clientY-e.offsetTop,t.style.cursor="grabbing",r.preventDefault())}),document.addEventListener("mousemove",c),document.addEventListener("mouseup",p),new MutationObserver((r,s)=>{document.contains(e)||(document.removeEventListener("mousemove",c),document.removeEventListener("mouseup",p),s.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}function E(e,t,n){e.innerHTML="",[...t].sort((l,o)=>{let c=(n[l.getName()]||l.getName()).toLowerCase(),p=(n[o.getName()]||o.getName()).toLowerCase();return c.localeCompare(p)}).forEach(l=>{let o=l.getName(),c=n[o]||o,p=l.getAttributeType?l.getAttributeType():"\u2014",r=X(l),s=document.createElement("tr"),m=document.createElement("td");m.textContent=c;let d=document.createElement("td");d.textContent=o;let h=document.createElement("td"),f=document.createElement("span");f.className="cfp-type",f.textContent=p,h.appendChild(f);let b=document.createElement("td");if(r===null){let u=document.createElement("span");u.className="cfp-null",u.textContent="null",b.appendChild(u)}else b.textContent=r;s.dataset.searchLabel=c.toLowerCase(),s.dataset.searchSchema=o.toLowerCase(),s.dataset.searchValue=(r??"null").toLowerCase(),s.appendChild(m),s.appendChild(d),s.appendChild(h),s.appendChild(b),e.appendChild(s)})}function z(e){navigator.clipboard?.writeText?navigator.clipboard.writeText(e).catch(()=>w(e)):w(e)}function w(e){let t=document.createElement("textarea");t.value=e,t.style.cssText="position:fixed;opacity:0;pointer-events:none",document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t)}function L(e,t){let n=document.createElement("span");return n.className="cfp-copy-val",n.textContent=e,n.title=`Click to copy: ${t}`,n.addEventListener("click",()=>{z(t),n.classList.add("cfp-copied"),setTimeout(()=>n.classList.remove("cfp-copied"),1200)}),n}function I(e,t){let n=document.createElement("div");n.id=k;let a=document.createElement("div");a.className="cfp-header";let l=document.createElement("span");l.className="cfp-header-title",l.textContent="\u{1F4CB} All Fields";let o=document.createElement("button");o.className="cfp-refresh",o.title="Refresh form data",o.textContent="\u21BB";let c=document.createElement("button");c.className="cfp-close",c.title="Close",c.textContent="\u2715",c.addEventListener("click",()=>n.remove()),a.appendChild(l),a.appendChild(o),a.appendChild(c),n.appendChild(a),P(n,a,c);let p=Xrm.Page.data.entity.getEntityName(),r=Xrm.Page.data.entity.getId(),s=document.createElement("div");if(s.className="cfp-subheader",s.append("Entity: "),s.appendChild(L(p,p)),s.append("  |  ID: "),r){let i=r.replace(/^\{|\}$/g,"");s.appendChild(L(r,i))}else s.append("(new record)");n.appendChild(s);let m=document.createElement("div");m.className="cfp-search";let d=document.createElement("input");d.type="search",d.placeholder="Search by label, schema name or value\u2026",d.addEventListener("keydown",i=>i.stopPropagation()),d.addEventListener("keyup",i=>i.stopPropagation()),m.appendChild(d),n.appendChild(m);let h=document.createElement("div");h.className="cfp-body";let f=document.createElement("table"),b=document.createElement("thead");b.innerHTML="<tr><th>Label</th><th>Schema Name</th><th>Type</th><th>Value</th></tr>",f.appendChild(b);let u=document.createElement("tbody");E(u,e,t),f.appendChild(u);let g=document.createElement("div");g.className="cfp-no-results",g.textContent="No matching fields.",g.style.display="none",d.addEventListener("input",N(()=>{let i=d.value.toLowerCase().trim(),y=0;u.querySelectorAll("tr").forEach(x=>{let v=!i||x.dataset.searchLabel.includes(i)||x.dataset.searchSchema.includes(i)||x.dataset.searchValue.includes(i);x.style.display=v?"":"none",v&&y++}),g.style.display=y===0?"":"none"},100));let A=()=>d.dispatchEvent(new Event("input"));o.addEventListener("click",()=>{o.disabled=!0,o.classList.add("cfp-spinning"),Xrm.Page.data.refresh(!1).then(()=>{let i=Xrm.Page.data.entity.attributes.get(),y=T();E(u,i,y),A(),o.classList.remove("cfp-spinning"),o.disabled=!1},i=>{console.error("[DynamicsCat] Refresh failed:",i),o.classList.remove("cfp-spinning"),o.disabled=!1})}),h.appendChild(f),h.appendChild(g),n.appendChild(h),document.body.appendChild(n),requestAnimationFrame(()=>{let i=f.offsetWidth;n.style.width=Math.min(Math.max(i,420),window.innerWidth*.9)+"px"})}S();})();
