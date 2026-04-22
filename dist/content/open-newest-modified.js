"use strict";(()=>{function S(e,d,l){requestAnimationFrame(()=>{let r=e.getBoundingClientRect();e.style.left=r.left+"px",e.style.top=r.top+"px",e.style.right="",e.style.transform=""});let o=!1,f=0,y=0,p=r=>{if(!o)return;let b=Math.max(0,Math.min(r.clientX-f,window.innerWidth-e.offsetWidth)),a=Math.max(0,Math.min(r.clientY-y,window.innerHeight-e.offsetHeight));e.style.left=b+"px",e.style.top=a+"px"},x=()=>{o=!1,d.style.cursor="move"};d.addEventListener("mousedown",r=>{l.contains(r.target)||(o=!0,f=r.clientX-e.offsetLeft,y=r.clientY-e.offsetTop,d.style.cursor="grabbing",r.preventDefault())}),document.addEventListener("mousemove",p),document.addEventListener("mouseup",x),new MutationObserver((r,b)=>{document.contains(e)||(document.removeEventListener("mousemove",p),document.removeEventListener("mouseup",x),b.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}var P="crm-tools-toast-container";function g(e,d="info"){let l=document.getElementById(P);l||(l=document.createElement("div"),l.id=P,l.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(l));let o=document.createElement("div");o.style.cssText=["background: "+(d==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),o.textContent=e,l.appendChild(o),setTimeout(()=>{o.style.opacity="0",setTimeout(()=>o.remove(),350)},3500)}var t="crm-tools-newest-modified-panel",j="crm-tools-newest-modified-style",z="crm-tools-newest-modified-list",A=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;function B(e){return parseInt(e.split(".")[0]??"8",10)>=9?"v9.0":"v8.2"}function v(e){return e.DisplayName?.UserLocalizedLabel?.Label??e.LogicalName}async function U(){let e=document.getElementById(t);if(e){e.remove();return}if(typeof Xrm>"u"||!Xrm.Page?.context)return;let d=Xrm.Page.context.getClientUrl(),l=B(Xrm.Page.context.getVersion());X();let o=document.createElement("div");o.id=t;let f=document.createElement("div");f.className="cnm-header";let y=document.createElement("span");y.className="cnm-title",y.textContent="\u{1F550} Jump to Latest";let p=document.createElement("button");p.className="cnm-close",p.textContent="\u2715",p.title="Close",p.addEventListener("click",()=>o.remove()),f.append(y,p);let x=document.createElement("div");x.className="cnm-body";let r=document.createElement("div");r.className="cnm-row";let b=document.createElement("label");b.className="cnm-label",b.textContent="Entity";let a=document.createElement("input");a.type="text",a.className="cnm-input",a.placeholder="Loading\u2026",a.disabled=!0,a.setAttribute("list",z),a.setAttribute("autocomplete","off");let E=document.createElement("datalist");E.id=z,a.addEventListener("keyup",n=>n.stopPropagation()),r.append(b,a,E);let w="modifiedon",h=document.createElement("div");h.className="cnm-row";let L=document.createElement("span");L.className="cnm-label",L.textContent="Sort by";let $=[],D=(n,c)=>{let i=document.createElement("button");return i.className="cnm-sort-btn"+(c===w?" cnm-sort-active":""),i.textContent=n,$.push(i),i.addEventListener("click",()=>{i.disabled||(w=c,$.forEach(s=>s.classList.remove("cnm-sort-active")),i.classList.add("cnm-sort-active"))}),i};h.append(L,D("Newest Modified","modifiedon"),D("Newest Created","createdon"));let C=document.createElement("div");C.className="cnm-row";let N=document.createElement("label");N.className="cnm-label",N.textContent="Record ID";let u=document.createElement("input");u.type="text",u.className="cnm-input",u.placeholder="Optional GUID\u2026",u.addEventListener("input",()=>{let n=A.test(u.value.trim());$.forEach(c=>{c.disabled=n})}),u.addEventListener("keyup",n=>n.stopPropagation()),u.addEventListener("keydown",n=>{n.key==="Enter"&&I(),n.stopPropagation()}),C.append(N,u);let T=document.createElement("div");T.className="cnm-row cnm-action-row";let m=document.createElement("button");m.className="cnm-open-btn",m.textContent="Open Record",m.disabled=!0,T.appendChild(m),x.append(r,C,h,T),o.append(f,x),document.body.appendChild(o),S(o,f,p);let k=[];try{k=(await(await fetch(`${d}/api/data/${l}/EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute`)).json()).value.filter(i=>i.EntitySetName).sort((i,s)=>v(i).localeCompare(v(s)));for(let i of k){let s=document.createElement("option");s.value=v(i),s.label=i.LogicalName,E.appendChild(s)}a.placeholder="Type entity name\u2026",a.disabled=!1,m.disabled=!1}catch{a.placeholder="Failed to load entities",g("Could not load entity list.","warn");return}let I=async()=>{let n=a.value.trim().toLowerCase();if(!n){g("Enter an entity name.","warn");return}let c=k.find(s=>v(s).toLowerCase()===n||s.LogicalName.toLowerCase()===n);if(!c){g(`Entity "${a.value.trim()}" not found.`,"warn");return}let i=u.value.trim();if(A.test(i)){let s=i.replace(/^\{|\}$/g,"");window.open(`${d}/main.aspx?pagetype=entityrecord&etn=${c.LogicalName}&id=%7B${s}%7D`,"_blank"),o.remove();return}m.disabled=!0,m.textContent="Opening\u2026";try{let s=`${d}/api/data/${l}/${c.EntitySetName}?$select=${c.PrimaryIdAttribute}&$orderby=${w} desc&$top=1`;console.log("[DynamicsCat] OData query:",s);let M=await(await fetch(s)).json();if(!M.value?.length){g(`No records found for "${v(c)}".`,"warn");return}let R=(M.value[0][c.PrimaryIdAttribute]??"").replace(/^\{|\}$/g,"");if(!R){g("Could not determine record ID.","warn");return}window.open(`${d}/main.aspx?pagetype=entityrecord&etn=${c.LogicalName}&id=%7B${R}%7D`,"_blank"),o.remove()}catch{g("Failed to fetch record.","warn")}finally{m.disabled=!1,m.textContent="Open Record"}};m.addEventListener("click",()=>{I()}),a.addEventListener("keydown",n=>{n.key==="Enter"&&I(),n.stopPropagation()})}function X(){if(document.getElementById(j))return;let e=document.createElement("style");e.id=j,e.textContent=`
#${t} {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 340px;
  background: #fff; border: 2px solid #1e64c8; border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  z-index: 2147483647; overflow: hidden;
  font-family: Segoe UI, Arial, sans-serif; font-size: 13px; color: #222;
}
#${t} .cnm-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #1e64c8; color: #fff; padding: 10px 14px;
  cursor: move; user-select: none;
}
#${t} .cnm-title { font-size: 14px; font-weight: 600; }
#${t} .cnm-close {
  background: none; border: none; color: #fff;
  font-size: 16px; line-height: 1; cursor: pointer; padding: 0 2px; opacity: 0.85;
}
#${t} .cnm-close:hover { opacity: 1; }
#${t} .cnm-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
#${t} .cnm-row { display: flex; align-items: center; gap: 8px; }
#${t} .cnm-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: #80868b; min-width: 54px; flex-shrink: 0;
}
#${t} .cnm-input {
  flex: 1; min-width: 0; padding: 6px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px;
  font-size: 13px; font-family: inherit; color: #222; outline: none;
}
#${t} .cnm-input:focus { border-color: #1e64c8; }
#${t} .cnm-input:disabled { background: #f5f5f5; color: #aaa; }
#${t} .cnm-sort-btn {
  flex: 1; padding: 4px 10px; border: 1px solid #c5d8fb; border-radius: 4px;
  background: #fff; font-size: 12px; font-family: inherit; color: #555; cursor: pointer;
  white-space: nowrap; text-align: center;
}
#${t} .cnm-sort-btn:hover:not(:disabled) { background: #e8f0fe; }
#${t} .cnm-sort-btn.cnm-sort-active { background: #1e64c8; color: #fff; border-color: #1e64c8; }
#${t} .cnm-sort-btn:disabled { opacity: 0.4; cursor: default; }
#${t} .cnm-action-row { justify-content: flex-end; padding-top: 4px; }
#${t} .cnm-open-btn {
  padding: 7px 20px; background: #1e64c8; color: #fff; border: none;
  border-radius: 4px; font-size: 13px; font-family: inherit; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
}
#${t} .cnm-open-btn:hover:not(:disabled) { background: #1557b0; }
#${t} .cnm-open-btn:disabled { opacity: 0.5; cursor: default; }
  `,document.head.appendChild(e)}U();})();
