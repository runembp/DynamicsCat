"use strict";(()=>{var h={hiddenActive:"dynamicsCatHiddenActive",dirtyActive:"dynamicsCatDirtyActive",readonlyOverrideActive:"dynamicsCatReadonlyOverrideActive",readonlySilentInject:"dynamicsCatReadonlySilentInject",readonlyShortcut:"dynamicsCatReadonlyShortcut",lookupsOpenerActive:"dynamicsCatLookupsOpenerActive",lookupsOpenerSilentInject:"dynamicsCatLookupsOpenerSilentInject",lookupsOpenerShortcut:"dynamicsCatLookupsOpenerShortcut",revealedNames:"dynamicsCatRevealedNames",unlockAllActive:"dynamicsCatUnlockAllActive",unlockedNames:"dynamicsCatUnlockedNames",toggleLock:"dynamicsCatToggleLock",activatable:"dynamicsCatActivatable"};function v(){try{return(window.top??window).document.documentElement.dataset}catch{return document.documentElement.dataset}}function m(e){return v()[h[e]]}function x(e,t,n){requestAnimationFrame(()=>{let o=e.getBoundingClientRect();e.style.left=o.left+"px",e.style.top=o.top+"px",e.style.right="",e.style.transform=""});let r=!1,i=0,c=0,a=o=>{if(!r)return;let l=Math.max(0,Math.min(o.clientX-i,window.innerWidth-e.offsetWidth)),p=Math.max(0,Math.min(o.clientY-c,window.innerHeight-e.offsetHeight));e.style.left=l+"px",e.style.top=p+"px"},s=()=>{r=!1,t.style.cursor="move"};t.addEventListener("mousedown",o=>{n.contains(o.target)||(r=!0,i=o.clientX-e.offsetLeft,c=o.clientY-e.offsetTop,t.style.cursor="grabbing",o.preventDefault())}),document.addEventListener("mousemove",a),document.addEventListener("mouseup",s),new MutationObserver((o,l)=>{document.contains(e)||(document.removeEventListener("mousemove",a),document.removeEventListener("mouseup",s),l.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}function E(e,t){if(document.getElementById(e))return;let n=document.createElement("style");n.id=e,n.textContent=t,(document.head||document.documentElement).appendChild(n)}function C(e,t){return`
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
`}function g(e){let t=document.getElementById(e.panelId);if(t)return t.remove(),null;let n=e.variant??"sidebar";E(e.styleId,C(e.panelId,n)+(e.extraCss??""));let r=document.createElement("div");r.id=e.panelId;let i=document.createElement("div");i.className="dcat-header";let c=document.createElement("span");c.className="dcat-title",c.textContent=e.title;let a=document.createElement("button");a.className="dcat-close",a.title="Close",a.textContent="\u2715",a.addEventListener("click",()=>r.remove()),i.append(c,a);let s=document.createElement("div");return s.className="dcat-body",r.append(i,s),document.body.appendChild(r),x(r,i,a),{panel:r,header:i,closeBtn:a,body:s}}var d="crm-tools-shortcuts-panel",k="crm-tools-shortcuts-style",S="alt",T="ctrl",w=`
#${d} table { width: 100%; border-collapse: collapse; }
#${d} td { padding: 8px 4px; border-bottom: 1px solid #e8e8e8; vertical-align: middle; }
#${d} tr:last-child td { border-bottom: none; }
#${d} .dcat-keys { white-space: nowrap; width: 1%; }
#${d} kbd {
  display: inline-block; font-family: Consolas, monospace; font-size: 12px;
  background: #f0f4ff; border: 1px solid #c5d8fb; border-bottom-width: 2px;
  border-radius: 4px; padding: 2px 7px; color: #1e64c8;
  min-width: 12px; text-align: center;
}
#${d} .dcat-plus { color: #888; margin: 0 3px; }
#${d} .dcat-action { padding-left: 16px; color: #333; }
`;function y(e){let t=e.split("+").map(n=>n.charAt(0).toUpperCase()+n.slice(1));return t.push("Click"),t}function L(){let e=g({panelId:d,styleId:k,title:"\u2328\uFE0F Keyboard Shortcuts",variant:"dialog",extraCss:w});if(!e)return;let t=m("readonlyShortcut")||S,n=m("lookupsOpenerShortcut")||T,r=[{keys:y(t),action:"Unlock field"},{keys:y(n),action:"Open lookup field"},{keys:["Alt","A"],action:"Show all hidden fields"},{keys:["Alt","U"],action:"Unlock all fields"}],i=document.createElement("table"),c=document.createElement("tbody");r.forEach(a=>{let s=document.createElement("tr"),o=document.createElement("td");o.className="dcat-keys",a.keys.forEach((p,b)=>{if(b>0){let u=document.createElement("span");u.className="dcat-plus",u.textContent="+",o.appendChild(u)}let f=document.createElement("kbd");f.textContent=p,o.appendChild(f)});let l=document.createElement("td");l.className="dcat-action",l.textContent=a.action,s.append(o,l),c.appendChild(s)}),i.appendChild(c),e.body.appendChild(i)}L();})();
