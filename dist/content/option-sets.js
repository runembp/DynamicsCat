"use strict";(()=>{function I(e,o){let t;return(...a)=>{clearTimeout(t),t=setTimeout(()=>e(...a),o)}}function X(){let e={};return Xrm.Page.ui.controls.forEach(o=>{let t=o.getName();if(t)try{e[t]=o.getLabel()||t}catch{e[t]=t}}),e}function z(e,o,t){requestAnimationFrame(()=>{let n=e.getBoundingClientRect();e.style.left=n.left+"px",e.style.top=n.top+"px",e.style.right="",e.style.transform=""});let a=!1,i=0,c=0,d=n=>{if(!a)return;let p=Math.max(0,Math.min(n.clientX-i,window.innerWidth-e.offsetWidth)),r=Math.max(0,Math.min(n.clientY-c,window.innerHeight-e.offsetHeight));e.style.left=p+"px",e.style.top=r+"px"},l=()=>{a=!1,o.style.cursor="move"};o.addEventListener("mousedown",n=>{t.contains(n.target)||(a=!0,i=n.clientX-e.offsetLeft,c=n.clientY-e.offsetTop,o.style.cursor="grabbing",n.preventDefault())}),document.addEventListener("mousemove",d),document.addEventListener("mouseup",l),new MutationObserver((n,p)=>{document.contains(e)||(document.removeEventListener("mousemove",d),document.removeEventListener("mouseup",l),p.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}function A(e){let o=document.createElement("textarea");o.value=e,o.style.cssText="position:fixed;opacity:0;pointer-events:none",document.body.appendChild(o),o.select(),document.execCommand("copy"),document.body.removeChild(o)}function P(e){navigator.clipboard?.writeText?navigator.clipboard.writeText(e).catch(()=>A(e)):A(e)}var R="crm-tools-optionsets-panel",O="crm-tools-optionsets-style";function H(){let e=document.getElementById(R);if(e){e.remove();return}if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.ui||!Xrm.Page.data)return;let o=X(),a=[...Xrm.Page.data.entity.attributes.get().filter(i=>i.getAttributeType()==="optionset"||i.getAttributeType()==="multiselectoptionset")].sort((i,c)=>{let d=(o[i.getName()]||i.getName()).toLowerCase(),l=(o[c.getName()]||c.getName()).toLowerCase();return d.localeCompare(l)});D(),B(a,o)}function D(){if(document.getElementById(O))return;let e=document.createElement("style");e.id=O,e.textContent=`
#crm-tools-optionsets-panel {
  position: fixed; top: 0; right: 0; width: auto; min-width: 550px; max-width: 90vw; max-height: 90vh;
  background: #fff; border: 2px solid #1e64c8;
  box-shadow: -4px 0 16px rgba(0,0,0,0.18);
  z-index: 2147483647; display: flex; flex-direction: column;
  font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;
}
#crm-tools-optionsets-panel .cop-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #1e64c8; color: #fff; padding: 10px 14px; flex-shrink: 0;
  cursor: move; user-select: none;
}
#crm-tools-optionsets-panel .cop-header-title { font-size: 14px; font-weight: 600; }
#crm-tools-optionsets-panel .cop-close {
  background: none; border: none; color: #fff; font-size: 18px;
  line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85;
}
#crm-tools-optionsets-panel .cop-close:hover { opacity: 1; }
#crm-tools-optionsets-panel .cop-subheader {
  padding: 6px 14px; background: #e8f0fe; font-size: 12px;
  color: #1e64c8; border-bottom: 1px solid #c5d8fb; flex-shrink: 0;
}
#crm-tools-optionsets-panel .cop-body { overflow-y: auto; overflow-x: auto; flex: 1; }
#crm-tools-optionsets-panel table { width: 100%; border-collapse: collapse; }
#crm-tools-optionsets-panel thead th {
  position: sticky; top: 0; background: #f0f4ff;
  border-bottom: 2px solid #1e64c8; padding: 7px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #444; white-space: nowrap;
}
#crm-tools-optionsets-panel tbody tr:nth-child(even) { background: #f8f9ff; }
#crm-tools-optionsets-panel tbody tr:hover { background: #dceafe; }
#crm-tools-optionsets-panel td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8; vertical-align: top;
}
#crm-tools-optionsets-panel td:nth-child(1), #crm-tools-optionsets-panel th:nth-child(1) { white-space: nowrap; }
#crm-tools-optionsets-panel td:nth-child(2), #crm-tools-optionsets-panel th:nth-child(2) { white-space: nowrap; }
#crm-tools-optionsets-panel td:nth-child(3), #crm-tools-optionsets-panel th:nth-child(3) { white-space: nowrap; }
#crm-tools-optionsets-panel td:nth-child(4), #crm-tools-optionsets-panel th:nth-child(4) { min-width: 180px; max-width: 360px; word-break: break-word; }
#crm-tools-optionsets-panel td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#crm-tools-optionsets-panel .cop-null { color: #aaa; font-style: italic; }
#crm-tools-optionsets-panel .cop-search {
  padding: 8px 14px; background: #fff; border-bottom: 1px solid #c5d8fb;
  flex-shrink: 0;
}
#crm-tools-optionsets-panel .cop-search input {
  width: 100%; box-sizing: border-box; padding: 5px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px; font-size: 13px;
  font-family: Segoe UI, Arial, sans-serif; color: #222; outline: none;
}
#crm-tools-optionsets-panel .cop-search input:focus { border-color: #1e64c8; }
#crm-tools-optionsets-panel .cop-no-results {
  padding: 16px; text-align: center; color: #888; font-style: italic;
}
#crm-tools-optionsets-panel .cop-copy-val {
  cursor: pointer; border-bottom: 1px dashed #1e64c8;
  transition: background 0.15s;
}
#crm-tools-optionsets-panel .cop-copy-val:hover { background: #c5d8fb; border-radius: 3px; }
#crm-tools-optionsets-panel .cop-copy-val.cop-copied { background: #b7f0c8; border-bottom-color: #2a9c52; border-radius: 3px; }
#crm-tools-optionsets-panel .cop-options-list {
  margin: 0; padding: 0 0 0 14px; font-size: 11px; color: #666; list-style: disc;
}
#crm-tools-optionsets-panel .cop-options-list li { white-space: nowrap; }
  `,document.head.appendChild(e)}function L(e,o){let t=document.createElement("span");return t.className="cop-copy-val",t.textContent=e,t.title=`Click to copy: ${o}`,t.addEventListener("click",()=>{P(o),t.classList.add("cop-copied"),setTimeout(()=>t.classList.remove("cop-copied"),1200)}),t}function B(e,o){let t=document.createElement("div");t.id=R;let a=document.createElement("div");a.className="cop-header";let i=document.createElement("span");i.className="cop-header-title",i.textContent="\u{1F518} Option Sets";let c=document.createElement("button");c.className="cop-close",c.title="Close",c.textContent="\u2715",c.addEventListener("click",()=>t.remove()),a.appendChild(i),a.appendChild(c),t.appendChild(a),z(t,a,c);let d=Xrm.Page.data.entity.getEntityName(),l=Xrm.Page.data.entity.getId(),n=document.createElement("div");if(n.className="cop-subheader",n.append("Entity: "),n.appendChild(L(d,d)),n.append("  |  ID: "),l){let s=l.replace(/^\{|\}$/g,"");n.appendChild(L(l,s))}else n.append("(new record)");n.append(`  |  ${e.length} option set field(s)`),t.appendChild(n);let p=document.createElement("div");p.className="cop-search";let r=document.createElement("input");r.type="search",r.placeholder="Search by label or schema name\u2026",r.addEventListener("keydown",s=>s.stopPropagation()),r.addEventListener("keyup",s=>s.stopPropagation()),p.appendChild(r),t.appendChild(p);let g=document.createElement("div");g.className="cop-body";let y=document.createElement("table"),k=document.createElement("thead");k.innerHTML="<tr><th>Label</th><th>Schema Name</th><th>Current Value</th><th>All Options</th></tr>",y.appendChild(k);let v=document.createElement("tbody");e.forEach(s=>{let m=s.getName(),f=o[m]||m,x=s.getText?.()??null,C=[];try{C=s.getOptions()}catch{C=[]}let u=document.createElement("tr");u.dataset.searchLabel=f.toLowerCase(),u.dataset.searchSchema=m.toLowerCase();let N=document.createElement("td");N.textContent=f;let S=document.createElement("td");S.textContent=m;let E=document.createElement("td");if(x===null){let h=document.createElement("span");h.className="cop-null",h.textContent="null",E.appendChild(h)}else E.textContent=x;let M=document.createElement("td"),w=document.createElement("ul");w.className="cop-options-list",C.forEach(h=>{let T=document.createElement("li");T.appendChild(L(String(h.value),String(h.value))),T.append(`: ${h.text}`),w.appendChild(T)}),M.appendChild(w),u.appendChild(N),u.appendChild(S),u.appendChild(E),u.appendChild(M),v.appendChild(u)}),y.appendChild(v);let b=document.createElement("div");b.className="cop-no-results",b.textContent="No matching fields.",b.style.display="none",r.addEventListener("input",I(()=>{let s=r.value.toLowerCase().trim(),m=0;v.querySelectorAll("tr").forEach(f=>{let x=!s||f.dataset.searchLabel.includes(s)||f.dataset.searchSchema.includes(s);f.style.display=x?"":"none",x&&m++}),b.style.display=m===0?"":"none"},100)),g.appendChild(y),g.appendChild(b),t.appendChild(g),document.body.appendChild(t),requestAnimationFrame(()=>{let s=y.offsetWidth;t.style.width=Math.min(Math.max(s,420),window.innerWidth*.9)+"px"})}H();})();
