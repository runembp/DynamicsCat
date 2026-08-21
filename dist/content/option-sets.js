"use strict";(()=>{function I(e,t){let n;return(...o)=>{clearTimeout(n),n=setTimeout(()=>e(...o),t)}}function A(){let e={};return Xrm.Page.ui.controls.forEach(t=>{let n=t.getName();if(n)try{e[n]=t.getLabel()||n}catch{e[n]=n}}),e}function P(e,t,n){let o=e.ownerDocument,l=o.defaultView??window;requestAnimationFrame(()=>{let d=e.getBoundingClientRect();e.style.left=d.left+"px",e.style.top=d.top+"px",e.style.right="",e.style.transform=""});let c=!1,m=0,s=0,i=d=>{if(!c)return;let f=Math.max(0,Math.min(d.clientX-m,l.innerWidth-e.offsetWidth)),x=Math.max(0,Math.min(d.clientY-s,l.innerHeight-e.offsetHeight));e.style.left=f+"px",e.style.top=x+"px"},h=()=>{c=!1,t.style.cursor="move"};t.addEventListener("mousedown",d=>{n.contains(d.target)||(c=!0,m=d.clientX-e.offsetLeft,s=d.clientY-e.offsetTop,t.style.cursor="grabbing",d.preventDefault())}),o.addEventListener("mousemove",i),o.addEventListener("mouseup",h),new MutationObserver((d,f)=>{o.contains(e)||(o.removeEventListener("mousemove",i),o.removeEventListener("mouseup",h),f.disconnect())}).observe(o.body,{childList:!0,subtree:!0})}function N(e){let t=document.createElement("textarea");t.value=e,t.style.cssText="position:fixed;opacity:0;pointer-events:none",document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t)}function H(e){navigator.clipboard?.writeText?navigator.clipboard.writeText(e).catch(()=>N(e)):N(e)}function D(e,t,n=document){if(n.getElementById(e))return;let o=n.createElement("style");o.id=e,o.textContent=t,(n.head||n.documentElement).appendChild(o)}function L(e){e.addEventListener("keydown",t=>t.stopPropagation()),e.addEventListener("keyup",t=>t.stopPropagation())}function v(e,t){let n=document.createElement("span");return n.className="dcat-copy-val",n.textContent=e,n.title=`Click to copy: ${t}`,n.addEventListener("click",()=>{H(t),n.classList.add("dcat-copied"),setTimeout(()=>n.classList.remove("dcat-copied"),1200)}),n}function X(e){let t=document.createElement("div");t.className="dcat-search";let n=document.createElement("input");n.type="search",n.placeholder=e.placeholder,L(n);let o=I(()=>{e.onFilter(n.value.toLowerCase().trim())},e.debounceMs??100);return n.addEventListener("input",o),t.appendChild(n),{container:t,input:n,triggerFilter:()=>n.dispatchEvent(new Event("input"))}}function B(e,t){return`
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
`}function z(e){let t=e.targetDocument??document,n=t.getElementById(e.panelId);if(n)return n.remove(),null;let o=e.variant??"sidebar";D(e.styleId,B(e.panelId,o)+(e.extraCss??""),t);let l=t.createElement("div");l.id=e.panelId;let c=t.createElement("div");c.className="dcat-header";let m=t.createElement("span");m.className="dcat-title",m.textContent=e.title;let s=t.createElement("button");s.className="dcat-close",s.title="Close",s.textContent="\u2715",s.addEventListener("click",()=>l.remove()),c.append(m,s);let i=t.createElement("div");return i.className="dcat-body",l.append(c,i),t.body.appendChild(l),P(l,c,s),{panel:l,header:c,closeBtn:s,body:i}}var a="crm-tools-optionsets-panel",O="crm-tools-optionsets-style",R=`
#${a} table { width: 100%; border-collapse: collapse; }
#${a} thead th {
  position: sticky; top: 0; background: #f0f4ff;
  border-bottom: 2px solid #1e64c8; padding: 7px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #444; white-space: nowrap;
}
#${a} tbody tr:nth-child(even) { background: #f8f9ff; }
#${a} tbody tr:hover { background: #dceafe; }
#${a} td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8; vertical-align: top;
}
#${a} td:nth-child(1), #${a} th:nth-child(1) { white-space: nowrap; }
#${a} td:nth-child(2), #${a} th:nth-child(2) { white-space: nowrap; }
#${a} td:nth-child(3), #${a} th:nth-child(3) { white-space: nowrap; }
#${a} td:nth-child(4), #${a} th:nth-child(4) { min-width: 180px; max-width: 360px; word-break: break-word; }
#${a} td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#${a} .cop-null { color: #aaa; font-style: italic; }
#${a} .cop-options-list {
  margin: 0; padding: 0 0 0 14px; font-size: 11px; color: #666; list-style: disc;
}
#${a} .cop-options-list li { white-space: nowrap; }
`;function F(){if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.ui||!Xrm.Page.data)return;let e=z({panelId:a,styleId:O,title:"\u{1F518} Option Sets",extraCss:R});if(!e)return;let{panel:t,body:n}=e,o=A(),c=[...Xrm.Page.data.entity.attributes.get().filter(r=>r.getAttributeType()==="optionset"||r.getAttributeType()==="multiselectoptionset")].sort((r,p)=>{let u=(o[r.getName()]||r.getName()).toLowerCase(),b=(o[p.getName()]||p.getName()).toLowerCase();return u.localeCompare(b)}),m=Xrm.Page.data.entity.getEntityName(),s=Xrm.Page.data.entity.getId(),i=document.createElement("div");if(i.className="dcat-subheader",i.append("Entity: "),i.appendChild(v(m,m)),i.append("  |  ID: "),s){let r=s.replace(/^\{|\}$/g,"");i.appendChild(v(s,r))}else i.append("(new record)");i.append(`  |  ${c.length} option set field(s)`),t.insertBefore(i,n);let h=document.createElement("table"),d=document.createElement("thead");d.innerHTML="<tr><th>Label</th><th>Schema Name</th><th>Current Value</th><th>All Options</th></tr>",h.appendChild(d);let f=document.createElement("tbody");c.forEach(r=>{let p=r.getName(),u=o[p]||p,b=r.getText?.()??null,C=[];try{C=r.getOptions()}catch{C=[]}let g=document.createElement("tr");g.dataset.searchLabel=u.toLowerCase(),g.dataset.searchSchema=p.toLowerCase();let S=document.createElement("td");S.textContent=u;let M=document.createElement("td");M.textContent=p;let E=document.createElement("td");if(b===null){let y=document.createElement("span");y.className="cop-null",y.textContent="null",E.appendChild(y)}else E.textContent=b;let k=document.createElement("td"),w=document.createElement("ul");w.className="cop-options-list",C.forEach(y=>{let T=document.createElement("li");T.appendChild(v(String(y.value),String(y.value))),T.append(`: ${y.text}`),w.appendChild(T)}),k.appendChild(w),g.appendChild(S),g.appendChild(M),g.appendChild(E),g.appendChild(k),f.appendChild(g)}),h.appendChild(f);let x=document.createElement("div");x.className="dcat-no-results",x.textContent="No matching fields.",x.style.display="none";let $=X({placeholder:"Search by label or schema name\u2026",onFilter:r=>{let p=0;f.querySelectorAll("tr").forEach(u=>{let b=!r||u.dataset.searchLabel.includes(r)||u.dataset.searchSchema.includes(r);u.style.display=b?"":"none",b&&p++}),x.style.display=p===0?"":"none"}});L($.input),t.insertBefore($.container,n),n.appendChild(h),n.appendChild(x),requestAnimationFrame(()=>{let r=h.offsetWidth;t.style.width=Math.min(Math.max(r,420),window.innerWidth*.9)+"px"})}F();})();
