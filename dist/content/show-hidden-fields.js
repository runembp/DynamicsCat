"use strict";(()=>{var a="crm-tools-show-hidden-style",s="crm-tools-show-hidden-toast";function l(){if(document.getElementById(a))return;let t=document.createElement("style");t.id=a,t.textContent=`
#crm-tools-show-hidden-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2147483647;
  background: #1e64c8;
  color: #fff;
  font-family: Segoe UI, Arial, sans-serif;
  font-size: 13px;
  padding: 10px 16px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  opacity: 1;
  transition: opacity 0.5s ease;
  pointer-events: none;
}
#crm-tools-show-hidden-toast.crm-toast-fade {
  opacity: 0;
}
  `,(document.head||document.documentElement).appendChild(t)}function i(t){let d=document.getElementById(s);d&&d.remove(),l();let e=document.createElement("div");e.id=s,e.textContent=t,document.body.appendChild(e),setTimeout(()=>{e.classList.add("crm-toast-fade")},2500),setTimeout(()=>{e.remove()},3e3)}function r(){if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.ui)return;if(window.__dynamicsCatFieldsRevealed===!0){let d=window.__dynamicsCatRevealedFields??[],e=0;d.forEach(n=>{try{let o=Xrm.Page.ui.controls.get(n);o&&(o.setVisible(!1),e++)}catch{}}),window.__dynamicsCatFieldsRevealed=!1,i(`\u{1F648} ${e} field(s) hidden again`);return}if(window.__dynamicsCatFieldsRevealed===!1&&window.__dynamicsCatRevealedFields&&window.__dynamicsCatRevealedFields.length>0){let d=0;window.__dynamicsCatRevealedFields.forEach(e=>{try{let n=Xrm.Page.ui.controls.get(e);n&&(n.setVisible(!0),d++)}catch{}}),window.__dynamicsCatFieldsRevealed=!0,i(`\u{1F441} ${d} hidden field(s) made visible`);return}let t=[];Xrm.Page.ui.controls.forEach(d=>{try{let e=d;e.getVisible&&e.getVisible()===!1&&(e.setVisible(!0),t.push(d.getName()))}catch{}}),window.__dynamicsCatRevealedFields=t,window.__dynamicsCatFieldsRevealed=t.length>0?!0:void 0,i(t.length>0?`\u{1F441} ${t.length} hidden field(s) made visible`:"No hidden fields found")}r();})();
