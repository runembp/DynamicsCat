"use strict";(()=>{var r="crm-tools-dirty-fields-style",i="crm-tools-dirty-toast",a="crm-tools-dirty-toast-style";function s(){if(document.getElementById(a))return;let t=document.createElement("style");t.id=a,t.textContent=`
#${i} {
  position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
  background: #1e64c8; color: #fff;
  font-family: Segoe UI, Arial, sans-serif; font-size: 13px;
  padding: 10px 16px; border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  opacity: 1; transition: opacity 0.5s ease; pointer-events: none;
}
#${i}.crm-dirty-fade { opacity: 0; }
  `,(document.head||document.documentElement).appendChild(t)}function d(t){document.getElementById(i)?.remove(),s();let e=document.createElement("div");e.id=i,e.textContent=t,document.body.appendChild(e),setTimeout(()=>e.classList.add("crm-dirty-fade"),2500),setTimeout(()=>e.remove(),3e3)}function c(t){document.getElementById(r)?.remove();let e=t.flatMap(n=>[`[id="${n}"]`,`[id="${n}_d"]`,`[id="${n}_c"]`]).join(`,
`),o=document.createElement("style");o.id=r,o.textContent=`
${e} {
  outline: 2px solid #e8a800 !important;
  background-color: rgba(255, 200, 0, 0.18) !important;
}
  `,(document.head||document.documentElement).appendChild(o)}function l(){if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.data)return;if(window.__dynamicsCatDirtyHighlighted){document.getElementById(r)?.remove(),window.__dynamicsCatDirtyHighlighted=!1,d("\u{1F504} Dirty field highlights removed");return}let t=Xrm.Page.data.entity.attributes.get().filter(e=>e.getIsDirty());if(t.length===0){d("\u2705 No dirty fields");return}c(t.map(e=>e.getName())),window.__dynamicsCatDirtyHighlighted=!0,d(`\u270F\uFE0F ${t.length} dirty field(s) highlighted`)}l();})();
