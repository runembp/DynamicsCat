"use strict";(()=>{function I(e,n){let t;return(...a)=>{clearTimeout(t),t=setTimeout(()=>e(...a),n)}}function A(){let e={};return Xrm.Page.ui.controls.forEach(n=>{let t=n.getName();if(t)try{e[t]=n.getLabel()||t}catch{e[t]=t}}),e}function P(e,n,t){requestAnimationFrame(()=>{let o=e.getBoundingClientRect();e.style.left=o.left+"px",e.style.top=o.top+"px",e.style.right="",e.style.transform=""});let a=!1,l=0,p=0,s=o=>{if(!a)return;let m=Math.max(0,Math.min(o.clientX-l,window.innerWidth-e.offsetWidth)),g=Math.max(0,Math.min(o.clientY-p,window.innerHeight-e.offsetHeight));e.style.left=m+"px",e.style.top=g+"px"},d=()=>{a=!1,n.style.cursor="move"};n.addEventListener("mousedown",o=>{t.contains(o.target)||(a=!0,l=o.clientX-e.offsetLeft,p=o.clientY-e.offsetTop,n.style.cursor="grabbing",o.preventDefault())}),document.addEventListener("mousemove",s),document.addEventListener("mouseup",d),new MutationObserver((o,m)=>{document.contains(e)||(document.removeEventListener("mousemove",s),document.removeEventListener("mouseup",d),m.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}function N(e){let n=document.createElement("textarea");n.value=e,n.style.cssText="position:fixed;opacity:0;pointer-events:none",document.body.appendChild(n),n.select(),document.execCommand("copy"),document.body.removeChild(n)}function H(e){navigator.clipboard?.writeText?navigator.clipboard.writeText(e).catch(()=>N(e)):N(e)}function B(e,n){if(document.getElementById(e))return;let t=document.createElement("style");t.id=e,t.textContent=n,(document.head||document.documentElement).appendChild(t)}function L(e){e.addEventListener("keydown",n=>n.stopPropagation()),e.addEventListener("keyup",n=>n.stopPropagation())}function y(e,n){let t=document.createElement("span");return t.className="dcat-copy-val",t.textContent=e,t.title=`Click to copy: ${n}`,t.addEventListener("click",()=>{H(n),t.classList.add("dcat-copied"),setTimeout(()=>t.classList.remove("dcat-copied"),1200)}),t}function X(e){let n=document.createElement("div");n.className="dcat-search";let t=document.createElement("input");t.type="search",t.placeholder=e.placeholder,L(t);let a=I(()=>{e.onFilter(t.value.toLowerCase().trim())},e.debounceMs??100);return t.addEventListener("input",a),n.appendChild(t),{container:n,input:t,triggerFilter:()=>t.dispatchEvent(new Event("input"))}}function D(e,n){return`
#${e} { ${n==="dialog"?`position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 380px;
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
#${e} .dcat-body { ${n==="dialog"?"padding: 14px; display: flex; flex-direction: column; gap: 10px;":"overflow-y: auto; overflow-x: auto; flex: 1;"} }
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
`}function z(e){let n=document.getElementById(e.panelId);if(n)return n.remove(),null;let t=e.variant??"sidebar";B(e.styleId,D(e.panelId,t)+(e.extraCss??""));let a=document.createElement("div");a.id=e.panelId;let l=document.createElement("div");l.className="dcat-header";let p=document.createElement("span");p.className="dcat-title",p.textContent=e.title;let s=document.createElement("button");s.className="dcat-close",s.title="Close",s.textContent="\u2715",s.addEventListener("click",()=>a.remove()),l.append(p,s);let d=document.createElement("div");return d.className="dcat-body",a.append(l,d),document.body.appendChild(a),P(a,l,s),{panel:a,header:l,closeBtn:s,body:d}}var r="crm-tools-optionsets-panel",O="crm-tools-optionsets-style",R=`
#${r} table { width: 100%; border-collapse: collapse; }
#${r} thead th {
  position: sticky; top: 0; background: #f0f4ff;
  border-bottom: 2px solid #1e64c8; padding: 7px 10px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; color: #444; white-space: nowrap;
}
#${r} tbody tr:nth-child(even) { background: #f8f9ff; }
#${r} tbody tr:hover { background: #dceafe; }
#${r} td {
  padding: 5px 10px; border-bottom: 1px solid #e8e8e8; vertical-align: top;
}
#${r} td:nth-child(1), #${r} th:nth-child(1) { white-space: nowrap; }
#${r} td:nth-child(2), #${r} th:nth-child(2) { white-space: nowrap; }
#${r} td:nth-child(3), #${r} th:nth-child(3) { white-space: nowrap; }
#${r} td:nth-child(4), #${r} th:nth-child(4) { min-width: 180px; max-width: 360px; word-break: break-word; }
#${r} td:nth-child(2) {
  font-family: Consolas, monospace; font-size: 12px; color: #555;
}
#${r} .cop-null { color: #aaa; font-style: italic; }
#${r} .cop-options-list {
  margin: 0; padding: 0 0 0 14px; font-size: 11px; color: #666; list-style: disc;
}
#${r} .cop-options-list li { white-space: nowrap; }
`;function F(){if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.ui||!Xrm.Page.data)return;let e=z({panelId:r,styleId:O,title:"\u{1F518} Option Sets",extraCss:R});if(!e)return;let{panel:n,body:t}=e,a=A(),p=[...Xrm.Page.data.entity.attributes.get().filter(i=>i.getAttributeType()==="optionset"||i.getAttributeType()==="multiselectoptionset")].sort((i,c)=>{let u=(a[i.getName()]||i.getName()).toLowerCase(),h=(a[c.getName()]||c.getName()).toLowerCase();return u.localeCompare(h)}),s=Xrm.Page.data.entity.getEntityName(),d=Xrm.Page.data.entity.getId(),o=document.createElement("div");if(o.className="dcat-subheader",o.append("Entity: "),o.appendChild(y(s,s)),o.append("  |  ID: "),d){let i=d.replace(/^\{|\}$/g,"");o.appendChild(y(d,i))}else o.append("(new record)");o.append(`  |  ${p.length} option set field(s)`),n.insertBefore(o,t);let m=document.createElement("table"),g=document.createElement("thead");g.innerHTML="<tr><th>Label</th><th>Schema Name</th><th>Current Value</th><th>All Options</th></tr>",m.appendChild(g);let v=document.createElement("tbody");p.forEach(i=>{let c=i.getName(),u=a[c]||c,h=i.getText?.()??null,C=[];try{C=i.getOptions()}catch{C=[]}let f=document.createElement("tr");f.dataset.searchLabel=u.toLowerCase(),f.dataset.searchSchema=c.toLowerCase();let S=document.createElement("td");S.textContent=u;let M=document.createElement("td");M.textContent=c;let E=document.createElement("td");if(h===null){let x=document.createElement("span");x.className="cop-null",x.textContent="null",E.appendChild(x)}else E.textContent=h;let k=document.createElement("td"),w=document.createElement("ul");w.className="cop-options-list",C.forEach(x=>{let T=document.createElement("li");T.appendChild(y(String(x.value),String(x.value))),T.append(`: ${x.text}`),w.appendChild(T)}),k.appendChild(w),f.appendChild(S),f.appendChild(M),f.appendChild(E),f.appendChild(k),v.appendChild(f)}),m.appendChild(v);let b=document.createElement("div");b.className="dcat-no-results",b.textContent="No matching fields.",b.style.display="none";let $=X({placeholder:"Search by label or schema name\u2026",onFilter:i=>{let c=0;v.querySelectorAll("tr").forEach(u=>{let h=!i||u.dataset.searchLabel.includes(i)||u.dataset.searchSchema.includes(i);u.style.display=h?"":"none",h&&c++}),b.style.display=c===0?"":"none"}});L($.input),n.insertBefore($.container,t),t.appendChild(m),t.appendChild(b),requestAnimationFrame(()=>{let i=m.offsetWidth;n.style.width=Math.min(Math.max(i,420),window.innerWidth*.9)+"px"})}F();})();
