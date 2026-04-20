"use strict";(()=>{var l="crm-tools-show-hidden-style",m="crm-tools-show-hidden-toast";function u(){if(document.getElementById(l))return;let e=document.createElement("style");e.id=l,e.textContent=`
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
  `,(document.head||document.documentElement).appendChild(e)}function r(e){let i=document.getElementById(m);i&&i.remove(),u();let n=document.createElement("div");n.id=m,n.textContent=e,document.body.appendChild(n),setTimeout(()=>{n.classList.add("crm-toast-fade")},2500),setTimeout(()=>{n.remove()},3e3)}function f(){try{return(window.top??window).document.documentElement.dataset}catch{return document.documentElement.dataset}}function g(){if(typeof Xrm>"u"||!Xrm.Page||!Xrm.Page.ui)return;let e=f(),i="dynamicsCatToggleLock";if(e[i])return;e[i]="1",setTimeout(()=>{delete e[i]},1e3);let n=e.dynamicsCatHiddenActive==="1",c=e.dynamicsCatRevealedNames,d=c?JSON.parse(c):[];if(n&&d.length>0){let t=0;d.forEach(o=>{try{let s=Xrm.Page.ui.controls.get(o);s&&(s.setVisible(!1),t++)}catch{}}),e.dynamicsCatHiddenActive="0",t===0&&delete e.dynamicsCatRevealedNames,r(`\u{1F648} ${t} field(s) hidden again`);return}if(!n&&d.length>0){let t=0;if(d.forEach(o=>{try{let s=Xrm.Page.ui.controls.get(o);s&&(s.setVisible(!0),t++)}catch{}}),t>0){e.dynamicsCatHiddenActive="1",r(`\u{1F441} ${t} hidden field(s) made visible`);return}delete e.dynamicsCatRevealedNames}let a=[];Xrm.Page.ui.controls.forEach(t=>{try{let o=t;o.getVisible&&o.getVisible()===!1&&(o.setVisible(!0),a.push(t.getName()))}catch{}}),a.length>0?(e.dynamicsCatRevealedNames=JSON.stringify(a),e.dynamicsCatHiddenActive="1",r(`\u{1F441} ${a.length} hidden field(s) made visible`)):r("No hidden fields found")}g();})();
