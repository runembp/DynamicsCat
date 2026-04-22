"use strict";(()=>{function U(e,a,c){requestAnimationFrame(()=>{let s=e.getBoundingClientRect();e.style.left=s.left+"px",e.style.top=s.top+"px",e.style.right="",e.style.transform=""});let i=!1,f=0,g=0,m=s=>{if(!i)return;let y=Math.max(0,Math.min(s.clientX-f,window.innerWidth-e.offsetWidth)),r=Math.max(0,Math.min(s.clientY-g,window.innerHeight-e.offsetHeight));e.style.left=y+"px",e.style.top=r+"px"},x=()=>{i=!1,a.style.cursor="move"};a.addEventListener("mousedown",s=>{c.contains(s.target)||(i=!0,f=s.clientX-e.offsetLeft,g=s.clientY-e.offsetTop,a.style.cursor="grabbing",s.preventDefault())}),document.addEventListener("mousemove",m),document.addEventListener("mouseup",x),new MutationObserver((s,y)=>{document.contains(e)||(document.removeEventListener("mousemove",m),document.removeEventListener("mouseup",x),y.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}var _="crm-tools-toast-container";function b(e,a="info"){let c=document.getElementById(_);c||(c=document.createElement("div"),c.id=_,c.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(c));let i=document.createElement("div");i.style.cssText=["background: "+(a==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),i.textContent=e,c.appendChild(i),setTimeout(()=>{i.style.opacity="0",setTimeout(()=>i.remove(),350)},3500)}var n="crm-tools-newest-modified-panel",B="crm-tools-newest-modified-style",X="crm-tools-newest-modified-list",V="crm-tools-entity-cache",H=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,F=[{label:"Any time",days:null},{label:"Today",days:1},{label:"Last 7 days",days:7},{label:"Last 14 days",days:14},{label:"Last 30 days",days:30},{label:"Last 90 days",days:90}];function Y(e){return parseInt(e.split(".")[0]??"8",10)>=9?"v9.0":"v8.2"}function w(e){return e.DisplayName?.UserLocalizedLabel?.Label??e.LogicalName}function G(e){try{let a=sessionStorage.getItem(V);if(!a)return null;let c=JSON.parse(a);return c.clientUrl===e?c.entities:null}catch{return null}}function W(e,a){try{sessionStorage.setItem(V,JSON.stringify({clientUrl:e,entities:a}))}catch{}}async function q(){let e=document.getElementById(n);if(e){e.remove();return}if(typeof Xrm>"u"||!Xrm.Page?.context)return;let a=Xrm.Page.context.getClientUrl(),c=Y(Xrm.Page.context.getVersion());J();let i=document.createElement("div");i.id=n;let f=document.createElement("div");f.className="cnm-header";let g=document.createElement("span");g.className="cnm-title",g.textContent="\u{1F550} Jump to Latest";let m=document.createElement("button");m.className="cnm-close",m.textContent="\u2715",m.title="Close",m.addEventListener("click",()=>i.remove()),f.append(g,m);let x=document.createElement("div");x.className="cnm-body";let s=document.createElement("div");s.className="cnm-row";let y=document.createElement("label");y.className="cnm-label",y.textContent="Entity";let r=document.createElement("input");r.type="text",r.className="cnm-input",r.placeholder="Loading\u2026",r.disabled=!0,r.setAttribute("list",X),r.setAttribute("autocomplete","off");let C=document.createElement("datalist");C.id=X,r.addEventListener("keyup",t=>t.stopPropagation()),s.append(y,r,C);let $=document.createElement("div");$.className="cnm-row";let N=document.createElement("label");N.className="cnm-label",N.textContent="Record ID";let p=document.createElement("input");p.type="text",p.className="cnm-input",p.placeholder="Optional GUID\u2026",p.addEventListener("keyup",t=>t.stopPropagation()),p.addEventListener("keydown",t=>{t.key==="Enter"&&R(),t.stopPropagation()}),$.append(N,p);let L="modifiedon",I=document.createElement("div");I.className="cnm-row";let T=document.createElement("span");T.className="cnm-label",T.textContent="Sort by";let k=[],A=(t,o)=>{let d=document.createElement("button");return d.className="cnm-sort-btn"+(o===L?" cnm-sort-active":""),d.textContent=t,k.push(d),d.addEventListener("click",()=>{d.disabled||(L=o,k.forEach(E=>E.classList.remove("cnm-sort-active")),d.classList.add("cnm-sort-active"))}),d};I.append(T,A("Newest Modified","modifiedon"),A("Newest Created","createdon"));let D=document.createElement("div");D.className="cnm-row";let M=document.createElement("span");M.className="cnm-label",M.textContent="Within";let v=document.createElement("select");v.className="cnm-select";for(let t of F){let o=document.createElement("option");o.value=String(t.days??""),o.textContent=t.label,t.days===14&&(o.selected=!0),v.appendChild(o)}D.append(M,v);let S=document.createElement("div");S.className="cnm-row cnm-action-row";let l=document.createElement("button");l.className="cnm-open-btn",l.textContent="Open Record",l.disabled=!0,S.appendChild(l),p.addEventListener("input",()=>{let t=H.test(p.value.trim());k.forEach(o=>{o.disabled=t}),v.disabled=t}),x.append(s,$,I,D,S),i.append(f,x),document.body.appendChild(i),U(i,f,m);let h=[],O=G(a);if(O)h=O;else try{h=(await(await fetch(`${a}/api/data/${c}/EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute`)).json()).value.filter(d=>d.EntitySetName).sort((d,E)=>w(d).localeCompare(w(E))),W(a,h)}catch{r.placeholder="Failed to load entities",b("Could not load entity list.","warn");return}for(let t of h){let o=document.createElement("option");o.value=w(t),o.label=t.LogicalName,C.appendChild(o)}r.placeholder="Type entity name\u2026",r.disabled=!1,l.disabled=!1;let R=async()=>{let t=r.value.trim().toLowerCase();if(!t){b("Enter an entity name.","warn");return}let o=h.find(u=>w(u).toLowerCase()===t||u.LogicalName.toLowerCase()===t);if(!o){b(`Entity "${r.value.trim()}" not found.`,"warn");return}let d=p.value.trim();if(H.test(d)){let u=d.replace(/^\{|\}$/g,"");window.open(`${a}/main.aspx?pagetype=entityrecord&etn=${o.LogicalName}&id=%7B${u}%7D`,"_blank"),i.remove();return}let E=v.value?parseInt(v.value,10):null,P="";if(E!==null){let u=new Date(Date.now()-E*864e5).toISOString();P=`&$filter=${L}%20ge%20${u}`}l.disabled=!0,l.textContent="Opening\u2026";try{let u=`${a}/api/data/${c}/${o.EntitySetName}?$select=${o.PrimaryIdAttribute}&$orderby=${L}%20desc&$top=1${P}`;console.log("[DynamicsCat] OData query:",u);let j=await(await fetch(u,{headers:{Accept:"application/json","OData-MaxVersion":"4.0","OData-Version":"4.0"}})).json();if(!j.value?.length){b(`No records found for "${w(o)}".`,"warn");return}let z=(j.value[0][o.PrimaryIdAttribute]??"").replace(/^\{|\}$/g,"");if(!z){b("Could not determine record ID.","warn");return}window.open(`${a}/main.aspx?pagetype=entityrecord&etn=${o.LogicalName}&id=%7B${z}%7D`,"_blank"),i.remove()}catch{b("Failed to fetch record.","warn")}finally{l.disabled=!1,l.textContent="Open Record"}};l.addEventListener("click",()=>{R()}),r.addEventListener("keydown",t=>{t.key==="Enter"&&R(),t.stopPropagation()})}function J(){if(document.getElementById(B))return;let e=document.createElement("style");e.id=B,e.textContent=`
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
#${n} .cnm-select {
  flex: 1; min-width: 0; padding: 5px 8px;
  border: 1px solid #c5d8fb; border-radius: 4px;
  font-size: 13px; font-family: inherit; color: #222; background: #fff; cursor: pointer;
}
#${n} .cnm-select:disabled { opacity: 0.4; cursor: default; }
#${n} .cnm-action-row { justify-content: flex-end; padding-top: 4px; }
#${n} .cnm-open-btn {
  padding: 7px 20px; background: #1e64c8; color: #fff; border: none;
  border-radius: 4px; font-size: 13px; font-family: inherit; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
}
#${n} .cnm-open-btn:hover:not(:disabled) { background: #1557b0; }
#${n} .cnm-open-btn:disabled { opacity: 0.5; cursor: default; }
  `,document.head.appendChild(e)}q();})();
