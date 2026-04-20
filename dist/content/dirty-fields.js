"use strict";(()=>{var a="crm-tools-dirty-fields-style",d="crm-tools-dirty-toast",o="crm-tools-dirty-toast-style";function s(){if(document.getElementById(o))return;let t=document.createElement("style");t.id=o,t.textContent=`
#${d} {
  position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
  background: #1e64c8; color: #fff;
  font-family: Segoe UI, Arial, sans-serif; font-size: 13px;
  padding: 10px 16px; border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  opacity: 1; transition: opacity 0.5s ease; pointer-events: none;
}
#${d}.crm-dirty-fade { opacity: 0; }
  `,(document.head||document.documentElement).appendChild(t)}function r(t){document.getElementById(d)?.remove(),s();let n=document.createElement("div");n.id=d,n.textContent=t,document.body.appendChild(n),setTimeout(()=>n.classList.add("crm-dirty-fade"),2500),setTimeout(()=>n.remove(),3e3)}function c(t){document.getElementById(a)?.remove();let n=t.map(i=>`[id="${i}_d"]`).join(`,
`),e=document.createElement("style");e.id=a,e.textContent=`
${n} {
  outline: 2px solid #e8a800 !important;
  background-color: rgba(255, 200, 0, 0.18) !important;
}
  `,(document.head||document.documentElement).appendChild(e)}function m(){if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.data)return;if(window.__dynamicsCatDirtyTracking){window.__dynamicsCatDirtyHandler&&Xrm.Page.data.entity.attributes.forEach(e=>{e.removeOnChange(window.__dynamicsCatDirtyHandler)}),document.getElementById(a)?.remove(),window.__dynamicsCatDirtyTracking=!1,window.__dynamicsCatDirtyHandler=void 0,window.__dynamicsCatDirtyFields=void 0;try{(window.top??window).document.documentElement.dataset.dynamicsCatDirtyActive="0"}catch{}r("\u{1F534} Dirty field tracking disabled");return}let t=new Set;Xrm.Page.data.entity.attributes.forEach(e=>{e.getIsDirty()&&t.add(e.getName())}),window.__dynamicsCatDirtyFields=t;let n=e=>{if(!e)return;let i=e.getEventSource();i&&(t.add(i.getName()),c(Array.from(t)))};window.__dynamicsCatDirtyHandler=n,Xrm.Page.data.entity.attributes.forEach(e=>{e.addOnChange(n)}),t.size>0&&c(Array.from(t)),window.__dynamicsCatDirtyTracking=!0;try{(window.top??window).document.documentElement.dataset.dynamicsCatDirtyActive="1"}catch{}r("\u{1F7E2} Dirty field tracking enabled")}m();})();
