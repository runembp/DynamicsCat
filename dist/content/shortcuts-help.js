"use strict";(()=>{var h={hiddenActive:"dynamicsCatHiddenActive",dirtyActive:"dynamicsCatDirtyActive",readonlyOverrideActive:"dynamicsCatReadonlyOverrideActive",readonlySilentInject:"dynamicsCatReadonlySilentInject",readonlyShortcut:"dynamicsCatReadonlyShortcut",fieldClickActive:"dynamicsCatFieldClickActive",fieldClickSilentInject:"dynamicsCatFieldClickSilentInject",fieldClickShortcut:"dynamicsCatFieldClickShortcut",revealedNames:"dynamicsCatRevealedNames",unlockAllActive:"dynamicsCatUnlockAllActive",unlockedNames:"dynamicsCatUnlockedNames",toggleLock:"dynamicsCatToggleLock",activatable:"dynamicsCatActivatable"};function v(){try{return(window.top??window).document.documentElement.dataset}catch{return document.documentElement.dataset}}function x(e){return v()[h[e]]}function y(e,t,o){let n=e.ownerDocument,i=n.defaultView??window;requestAnimationFrame(()=>{let r=e.getBoundingClientRect();e.style.left=r.left+"px",e.style.top=r.top+"px",e.style.right="",e.style.transform=""});let c=!1,d=0,a=0,s=r=>{if(!c)return;let u=Math.max(0,Math.min(r.clientX-d,i.innerWidth-e.offsetWidth)),m=Math.max(0,Math.min(r.clientY-a,i.innerHeight-e.offsetHeight));e.style.left=u+"px",e.style.top=m+"px"},p=()=>{c=!1,t.style.cursor="move"};t.addEventListener("mousedown",r=>{o.contains(r.target)||(c=!0,d=r.clientX-e.offsetLeft,a=r.clientY-e.offsetTop,t.style.cursor="grabbing",r.preventDefault())}),n.addEventListener("mousemove",s),n.addEventListener("mouseup",p),new MutationObserver((r,u)=>{n.contains(e)||(n.removeEventListener("mousemove",s),n.removeEventListener("mouseup",p),u.disconnect())}).observe(n.body,{childList:!0,subtree:!0})}function C(e,t,o=document){if(o.getElementById(e))return;let n=o.createElement("style");n.id=e,n.textContent=t,(o.head||o.documentElement).appendChild(n)}function E(e,t){return`
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
`}function b(e){let t=e.targetDocument??document,o=t.getElementById(e.panelId);if(o)return o.remove(),null;let n=e.variant??"sidebar";C(e.styleId,E(e.panelId,n)+(e.extraCss??""),t);let i=t.createElement("div");i.id=e.panelId;let c=t.createElement("div");c.className="dcat-header";let d=t.createElement("span");d.className="dcat-title",d.textContent=e.title;let a=t.createElement("button");a.className="dcat-close",a.title="Close",a.textContent="\u2715",a.addEventListener("click",()=>i.remove()),c.append(d,a);let s=t.createElement("div");return s.className="dcat-body",i.append(c,s),t.body.appendChild(i),y(i,c,a),{panel:i,header:c,closeBtn:a,body:s}}var l="crm-tools-shortcuts-panel",k="crm-tools-shortcuts-style",S="alt",T="ctrl",w=`
#${l} table { width: 100%; border-collapse: collapse; }
#${l} td { padding: 8px 4px; border-bottom: 1px solid #e8e8e8; vertical-align: middle; }
#${l} tr:last-child td { border-bottom: none; }
#${l} .dcat-keys { white-space: nowrap; width: 1%; }
#${l} kbd {
  display: inline-block; font-family: Consolas, monospace; font-size: 12px;
  background: #f0f4ff; border: 1px solid #c5d8fb; border-bottom-width: 2px;
  border-radius: 4px; padding: 2px 7px; color: #1e64c8;
  min-width: 12px; text-align: center;
}
#${l} .dcat-plus { color: #888; margin: 0 3px; }
#${l} .dcat-action { padding-left: 16px; color: #333; }
`;function g(e){let t=e.split("+").map(o=>o.charAt(0).toUpperCase()+o.slice(1));return t.push("Click"),t}function L(){let e=b({panelId:l,styleId:k,title:"\u2328\uFE0F Keyboard Shortcuts",variant:"dialog",extraCss:w});if(!e)return;let t=x("readonlyShortcut")||S,o=x("fieldClickShortcut")||T,n=[{keys:g(t),action:"Unlock field"},{keys:g(o),action:"Open lookup field"},{keys:g(o),action:"Copy field logical name (on label)"},{keys:["Alt","A"],action:"Show all hidden fields"},{keys:["Alt","U"],action:"Unlock all fields"},{keys:["Alt","O"],action:"Toggle Jump to Latest panel"},{keys:["Alt","Shift","O"],action:"Repeat last Jump to Latest search"}],i=document.createElement("table"),c=document.createElement("tbody");n.forEach(d=>{let a=document.createElement("tr"),s=document.createElement("td");s.className="dcat-keys",d.keys.forEach((r,u)=>{if(u>0){let f=document.createElement("span");f.className="dcat-plus",f.textContent="+",s.appendChild(f)}let m=document.createElement("kbd");m.textContent=r,s.appendChild(m)});let p=document.createElement("td");p.className="dcat-action",p.textContent=d.action,a.append(s,p),c.appendChild(a)}),i.appendChild(c),e.body.appendChild(i)}L();})();
