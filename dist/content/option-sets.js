"use strict";(()=>{var X="crm-tools-optionsets-panel",S="crm-tools-optionsets-style";function T(){let t=document.getElementById(X);if(t){t.remove();return}if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.ui||!Xrm.Page.data)return;let i={};Xrm.Page.ui.controls.forEach(o=>{let e=o.getName();if(e)try{i[e]=o.getLabel()||e}catch{i[e]=e}});let l=[...Xrm.Page.data.entity.attributes.get().filter(o=>o.getAttributeType()==="optionset"||o.getAttributeType()==="multiselectoptionset")].sort((o,e)=>{let m=(i[o.getName()]||o.getName()).toLowerCase(),h=(i[e.getName()]||e.getName()).toLowerCase();return m.localeCompare(h)});P(),I(l,i)}function P(){if(document.getElementById(S))return;let t=document.createElement("style");t.id=S,t.textContent=`
#crm-tools-optionsets-panel {
  position: fixed; top: 0; right: 0; width: auto; min-width: 420px; max-width: 90vw; max-height: 90vh;
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
#crm-tools-optionsets-panel table { border-collapse: collapse; }
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
#crm-tools-optionsets-panel .cop-options-list {
  margin: 0; padding: 0 0 0 14px; font-size: 11px; color: #666; list-style: disc;
}
#crm-tools-optionsets-panel .cop-options-list li { white-space: nowrap; }
  `,document.head.appendChild(t)}function z(t,i,a){requestAnimationFrame(()=>{let n=t.getBoundingClientRect();t.style.left=n.left+"px",t.style.top=n.top+"px",t.style.right=""});let l=!1,o=0,e=0,m=n=>{if(!l)return;let r=Math.max(0,Math.min(n.clientX-o,window.innerWidth-t.offsetWidth)),c=Math.max(0,Math.min(n.clientY-e,window.innerHeight-t.offsetHeight));t.style.left=r+"px",t.style.top=c+"px"},h=()=>{l=!1,i.style.cursor="move"};i.addEventListener("mousedown",n=>{a.contains(n.target)||(l=!0,o=n.clientX-t.offsetLeft,e=n.clientY-t.offsetTop,i.style.cursor="grabbing",n.preventDefault())}),document.addEventListener("mousemove",m),document.addEventListener("mouseup",h),new MutationObserver((n,r)=>{document.contains(t)||(document.removeEventListener("mousemove",m),document.removeEventListener("mouseup",h),r.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}function I(t,i){let a=document.createElement("div");a.id=X;let l=document.createElement("div");l.className="cop-header";let o=document.createElement("span");o.className="cop-header-title",o.textContent="\u{1F518} Option Sets";let e=document.createElement("button");e.className="cop-close",e.title="Close",e.textContent="\u2715",e.addEventListener("click",()=>a.remove()),l.appendChild(o),l.appendChild(e),a.appendChild(l),z(a,l,e);let m=Xrm.Page.data.entity.getEntityName(),h=Xrm.Page.data.entity.getId(),n=document.createElement("div");n.className="cop-subheader",n.textContent=`Entity: ${m}  |  ID: ${h||"(new record)"}  |  ${t.length} option set field(s)`,a.appendChild(n);let r=document.createElement("div");r.className="cop-search";let c=document.createElement("input");c.type="search",c.placeholder="Search by label or schema name\u2026",c.addEventListener("keydown",s=>s.stopPropagation()),c.addEventListener("keyup",s=>s.stopPropagation()),r.appendChild(c),a.appendChild(r);let g=document.createElement("div");g.className="cop-body";let y=document.createElement("table"),L=document.createElement("thead");L.innerHTML="<tr><th>Label</th><th>Schema Name</th><th>Current Value</th><th>All Options</th></tr>",y.appendChild(L);let C=document.createElement("tbody");t.forEach(s=>{let d=s.getName(),u=i[d]||d,b=s.getText?.()??null,E=[];try{E=s.getOptions()}catch{E=[]}let p=document.createElement("tr");p.dataset.searchLabel=u.toLowerCase(),p.dataset.searchSchema=d.toLowerCase();let N=document.createElement("td");N.textContent=u;let k=document.createElement("td");k.textContent=d;let v=document.createElement("td");if(b===null){let f=document.createElement("span");f.className="cop-null",f.textContent="null",v.appendChild(f)}else v.textContent=b;let A=document.createElement("td"),w=document.createElement("ul");w.className="cop-options-list",E.forEach(f=>{let M=document.createElement("li");M.textContent=`${f.value}: ${f.text}`,w.appendChild(M)}),A.appendChild(w),p.appendChild(N),p.appendChild(k),p.appendChild(v),p.appendChild(A),C.appendChild(p)}),y.appendChild(C);let x=document.createElement("div");x.className="cop-no-results",x.textContent="No matching fields.",x.style.display="none",c.addEventListener("input",()=>{let s=c.value.toLowerCase().trim(),d=0;C.querySelectorAll("tr").forEach(u=>{let b=!s||u.dataset.searchLabel.includes(s)||u.dataset.searchSchema.includes(s);u.style.display=b?"":"none",b&&d++}),x.style.display=d===0?"":"none"}),g.appendChild(y),g.appendChild(x),a.appendChild(g),document.body.appendChild(a),requestAnimationFrame(()=>{let s=y.offsetWidth;a.style.width=Math.min(Math.max(s,420),window.innerWidth*.9)+"px"})}T();})();
