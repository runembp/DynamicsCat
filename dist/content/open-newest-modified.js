"use strict";(()=>{function O(e,o,c){requestAnimationFrame(()=>{let s=e.getBoundingClientRect();e.style.left=s.left+"px",e.style.top=s.top+"px",e.style.right="",e.style.transform=""});let i=!1,g=0,x=0,p=s=>{if(!i)return;let y=Math.max(0,Math.min(s.clientX-g,window.innerWidth-e.offsetWidth)),r=Math.max(0,Math.min(s.clientY-x,window.innerHeight-e.offsetHeight));e.style.left=y+"px",e.style.top=r+"px"},v=()=>{i=!1,o.style.cursor="move"};o.addEventListener("mousedown",s=>{c.contains(s.target)||(i=!0,g=s.clientX-e.offsetLeft,x=s.clientY-e.offsetTop,o.style.cursor="grabbing",s.preventDefault())}),document.addEventListener("mousemove",p),document.addEventListener("mouseup",v),new MutationObserver((s,y)=>{document.contains(e)||(document.removeEventListener("mousemove",p),document.removeEventListener("mouseup",v),y.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}var z="crm-tools-toast-container";function b(e,o="info"){let c=document.getElementById(z);c||(c=document.createElement("div"),c.id=z,c.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(c));let i=document.createElement("div");i.style.cssText=["background: "+(o==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),i.textContent=e,c.appendChild(i),setTimeout(()=>{i.style.opacity="0",setTimeout(()=>i.remove(),350)},3500)}var n="crm-tools-newest-modified-panel",U="crm-tools-newest-modified-style",_="crm-tools-newest-modified-list",X="crm-tools-entity-cache",B=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;function H(e){return parseInt(e.split(".")[0]??"8",10)>=9?"v9.0":"v8.2"}function w(e){return e.DisplayName?.UserLocalizedLabel?.Label??e.LogicalName}function V(e){try{let o=sessionStorage.getItem(X);if(!o)return null;let c=JSON.parse(o);return c.clientUrl===e?c.entities:null}catch{return null}}function F(e,o){try{sessionStorage.setItem(X,JSON.stringify({clientUrl:e,entities:o}))}catch{}}async function Y(){let e=document.getElementById(n);if(e){e.remove();return}if(typeof Xrm>"u"||!Xrm.Page?.context)return;let o=Xrm.Page.context.getClientUrl(),c=H(Xrm.Page.context.getVersion());G();let i=document.createElement("div");i.id=n;let g=document.createElement("div");g.className="cnm-header";let x=document.createElement("span");x.className="cnm-title",x.textContent="\u{1F550} Jump to Latest";let p=document.createElement("button");p.className="cnm-close",p.textContent="\u2715",p.title="Close",p.addEventListener("click",()=>i.remove()),g.append(x,p);let v=document.createElement("div");v.className="cnm-body";let s=document.createElement("div");s.className="cnm-row";let y=document.createElement("label");y.className="cnm-label",y.textContent="Entity";let r=document.createElement("input");r.type="text",r.className="cnm-input",r.placeholder="Loading\u2026",r.disabled=!0,r.setAttribute("list",_),r.setAttribute("autocomplete","off");let $=document.createElement("datalist");$.id=_,r.addEventListener("keyup",t=>t.stopPropagation()),s.append(y,r,$);let C=document.createElement("div");C.className="cnm-row";let N=document.createElement("label");N.className="cnm-label",N.textContent="Record ID";let u=document.createElement("input");u.type="text",u.className="cnm-input",u.placeholder="Optional GUID\u2026",u.addEventListener("keyup",t=>t.stopPropagation()),u.addEventListener("keydown",t=>{t.key==="Enter"&&M(),t.stopPropagation()}),C.append(N,u);let L="modifiedon",k=document.createElement("div");k.className="cnm-row";let I=document.createElement("span");I.className="cnm-label",I.textContent="Sort by";let T=[],S=(t,a)=>{let d=document.createElement("button");return d.className="cnm-sort-btn"+(a===L?" cnm-sort-active":""),d.textContent=t,T.push(d),d.addEventListener("click",()=>{d.disabled||(L=a,T.forEach(E=>E.classList.remove("cnm-sort-active")),d.classList.add("cnm-sort-active"))}),d};k.append(I,S("Newest Modified","modifiedon"),S("Newest Created","createdon"));let D=document.createElement("div");D.className="cnm-row cnm-action-row";let l=document.createElement("button");l.className="cnm-open-btn",l.textContent="Open Record",l.disabled=!0;let m=document.createElement("input");m.type="number",m.className="cnm-within-input",m.min="1",m.value="14",m.title="Limit search to last N days (leave empty for all time)",m.addEventListener("keyup",t=>t.stopPropagation()),m.addEventListener("keydown",t=>t.stopPropagation()),D.append(m,l),u.addEventListener("input",()=>{let t=B.test(u.value.trim());T.forEach(a=>{a.disabled=t})}),v.append(s,C,k,D),i.append(g,v),document.body.appendChild(i),O(i,g,p);let h=[],P=V(o);if(P)h=P;else try{h=(await(await fetch(`${o}/api/data/${c}/EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute`)).json()).value.filter(d=>d.EntitySetName).sort((d,E)=>w(d).localeCompare(w(E))),F(o,h)}catch{r.placeholder="Failed to load entities",b("Could not load entity list.","warn");return}for(let t of h){let a=document.createElement("option");a.value=w(t),a.label=t.LogicalName,$.appendChild(a)}r.placeholder="Type entity name\u2026",r.disabled=!1,l.disabled=!1;let M=async()=>{let t=r.value.trim().toLowerCase();if(!t){b("Enter an entity name.","warn");return}let a=h.find(f=>w(f).toLowerCase()===t||f.LogicalName.toLowerCase()===t);if(!a){b(`Entity "${r.value.trim()}" not found.`,"warn");return}let d=u.value.trim();if(B.test(d)){let f=d.replace(/^\{|\}$/g,"");window.open(`${o}/main.aspx?pagetype=entityrecord&etn=${a.LogicalName}&id=%7B${f}%7D`,"_blank"),i.remove();return}let E=m.value?parseInt(m.value,10):null,R="";if(E!==null){let f=new Date(Date.now()-E*864e5).toISOString();R=`&$filter=${L}%20ge%20${f}`}l.disabled=!0,l.textContent="Opening\u2026";try{let f=`${o}/api/data/${c}/${a.EntitySetName}?$select=${a.PrimaryIdAttribute}&$orderby=${L}%20desc&$top=1${R}`;console.log("[DynamicsCat] OData query:",f);let A=await(await fetch(f,{headers:{Accept:"application/json","OData-MaxVersion":"4.0","OData-Version":"4.0"}})).json();if(!A.value?.length){b(`No records found for "${w(a)}".`,"warn");return}let j=(A.value[0][a.PrimaryIdAttribute]??"").replace(/^\{|\}$/g,"");if(!j){b("Could not determine record ID.","warn");return}window.open(`${o}/main.aspx?pagetype=entityrecord&etn=${a.LogicalName}&id=%7B${j}%7D`,"_blank"),i.remove()}catch{b("Failed to fetch record.","warn")}finally{l.disabled=!1,l.textContent="Open Record"}};l.addEventListener("click",()=>{M()}),r.addEventListener("keydown",t=>{t.key==="Enter"&&M(),t.stopPropagation()})}function G(){if(document.getElementById(U))return;let e=document.createElement("style");e.id=U,e.textContent=`
#${n} {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 340px;
  background: #fff; border: 2px solid #1e64c8; border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  z-index: 2147483647; overflow: hidden;
  font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;
}
#${n} .cnm-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #1e64c8; color: #fff; padding: 10px 14px;
  cursor: move; user-select: none;
}
#${n} .cnm-title { font-size: 14px; font-weight: 600; }
#${n} .cnm-close {
  background: none; border: none; color: #fff;
  font-size: 16px; line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85;
}
#${n} .cnm-close:hover { opacity: 1; }
#${n} .cnm-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
#${n} .cnm-row { display: flex; align-items: center; gap: 8px; }
#${n} .cnm-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: #80868b; min-width: 54px; flex-shrink: 0;
}
#${n} .cnm-input {
  flex: 1; min-width: 0; padding: 6px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px;
  font-size: 13px; font-family: inherit; color: #222; outline: none;
}
#${n} .cnm-input:focus { border-color: #1e64c8; }
#${n} .cnm-input:disabled { background: #f5f5f5; color: #aaa; }
#${n} .cnm-sort-btn {
  flex: 1; padding: 4px 10px; border: 1px solid #c5d8fb; border-radius: 4px;
  background: #fff; font-size: 12px; font-family: inherit; color: #555; cursor: pointer;
  white-space: nowrap; text-align: center;
}
#${n} .cnm-sort-btn:hover:not(:disabled) { background: #e8f0fe; }
#${n} .cnm-sort-btn.cnm-sort-active { background: #1e64c8; color: #fff; border-color: #1e64c8; }
#${n} .cnm-sort-btn:disabled { opacity: 0.4; cursor: default; }
#${n} .cnm-action-row { justify-content: space-between; align-items: center; padding-top: 4px; }
#${n} .cnm-within-input {
  width: 44px; padding: 3px 5px; border: 1px solid #e0e0e0; border-radius: 4px;
  font-size: 11px; font-family: inherit; color: #aaa; text-align: center;
  background: #fafafa; outline: none;
}
#${n} .cnm-within-input:focus { border-color: #c5d8fb; color: #555; }
#${n} .cnm-open-btn {
  padding: 7px 20px; background: #1e64c8; color: #fff; border: none;
  border-radius: 4px; font-size: 13px; font-family: inherit; font-weight: 600;
  cursor: pointer; transition: background 0.15s; white-space: nowrap; flex-shrink: 0;
}
#${n} .cnm-open-btn:hover:not(:disabled) { background: #1557b0; }
#${n} .cnm-open-btn:disabled { opacity: 0.5; cursor: default; }
  `,document.head.appendChild(e)}Y();})();
