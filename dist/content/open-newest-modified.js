"use strict";(()=>{function M(e,c,a){requestAnimationFrame(()=>{let r=e.getBoundingClientRect();e.style.left=r.left+"px",e.style.top=r.top+"px",e.style.right="",e.style.transform=""});let o=!1,u=0,g=0,m=r=>{if(!o)return;let f=Math.max(0,Math.min(r.clientX-u,window.innerWidth-e.offsetWidth)),i=Math.max(0,Math.min(r.clientY-g,window.innerHeight-e.offsetHeight));e.style.left=f+"px",e.style.top=i+"px"},y=()=>{o=!1,c.style.cursor="move"};c.addEventListener("mousedown",r=>{a.contains(r.target)||(o=!0,u=r.clientX-e.offsetLeft,g=r.clientY-e.offsetTop,c.style.cursor="grabbing",r.preventDefault())}),document.addEventListener("mousemove",m),document.addEventListener("mouseup",y),new MutationObserver((r,f)=>{document.contains(e)||(document.removeEventListener("mousemove",m),document.removeEventListener("mouseup",y),f.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}var I="crm-tools-toast-container";function b(e,c="info"){let a=document.getElementById(I);a||(a=document.createElement("div"),a.id=I,a.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(a));let o=document.createElement("div");o.style.cssText=["background: "+(c==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),o.textContent=e,a.appendChild(o),setTimeout(()=>{o.style.opacity="0",setTimeout(()=>o.remove(),350)},3500)}var t="crm-tools-newest-modified-panel",D="crm-tools-newest-modified-style",S="crm-tools-newest-modified-list";function A(e){return parseInt(e.split(".")[0]??"8",10)>=9?"v9.0":"v8.2"}function x(e){return e.DisplayName?.UserLocalizedLabel?.Label??e.LogicalName}async function R(){let e=document.getElementById(t);if(e){e.remove();return}if(typeof Xrm>"u"||!Xrm.Page?.context)return;let c=Xrm.Page.context.getClientUrl(),a=A(Xrm.Page.context.getVersion());j();let o=document.createElement("div");o.id=t;let u=document.createElement("div");u.className="cnm-header";let g=document.createElement("span");g.className="cnm-title",g.textContent="\u{1F550} Open Newest Modified";let m=document.createElement("button");m.className="cnm-close",m.textContent="\u2715",m.title="Close",m.addEventListener("click",()=>o.remove()),u.append(g,m);let y=document.createElement("div");y.className="cnm-body";let r=document.createElement("div");r.className="cnm-row";let f=document.createElement("label");f.className="cnm-label",f.textContent="Entity";let i=document.createElement("input");i.type="text",i.className="cnm-input",i.placeholder="Loading\u2026",i.disabled=!0,i.setAttribute("list",S),i.setAttribute("autocomplete","off");let w=document.createElement("datalist");w.id=S,i.addEventListener("keyup",s=>s.stopPropagation()),r.append(f,i,w);let E="modifiedon",v=document.createElement("div");v.className="cnm-row";let h=document.createElement("span");h.className="cnm-label",h.textContent="Sort by";let $=(s,l)=>{let n=document.createElement("button");return n.className="cnm-sort-btn"+(l===E?" cnm-sort-active":""),n.textContent=s,n.addEventListener("click",()=>{E=l,v.querySelectorAll(".cnm-sort-btn").forEach(p=>p.classList.remove("cnm-sort-active")),n.classList.add("cnm-sort-active")}),n};v.append(h,$("Last Modified","modifiedon"),$("Last Created","createdon"));let L=document.createElement("div");L.className="cnm-row cnm-action-row";let d=document.createElement("button");d.className="cnm-open-btn",d.textContent="Open Record",d.disabled=!0,L.appendChild(d),y.append(r,v,L),o.append(u,y),document.body.appendChild(o),M(o,u,m);let C=[];try{C=(await(await fetch(`${c}/api/data/${a}/EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute`)).json()).value.filter(n=>n.EntitySetName).sort((n,p)=>x(n).localeCompare(x(p)));for(let n of C){let p=document.createElement("option");p.value=x(n),p.label=n.LogicalName,w.appendChild(p)}i.placeholder="Type entity name\u2026",i.disabled=!1,d.disabled=!1}catch{i.placeholder="Failed to load entities",b("Could not load entity list.","warn");return}let N=async()=>{let s=i.value.trim().toLowerCase();if(!s){b("Enter an entity name.","warn");return}let l=C.find(n=>x(n).toLowerCase()===s||n.LogicalName.toLowerCase()===s);if(!l){b(`Entity "${i.value.trim()}" not found.`,"warn");return}d.disabled=!0,d.textContent="Opening\u2026";try{let n=`${c}/api/data/${a}/${l.EntitySetName}?$select=${l.PrimaryIdAttribute}&$orderby=${E} desc&$top=1`;console.log("[DynamicsCat] OData query:",n);let T=await(await fetch(n)).json();if(!T.value?.length){b(`No records found for "${x(l)}".`,"warn");return}let k=(T.value[0][l.PrimaryIdAttribute]??"").replace(/^\{|\}$/g,"");if(!k){b("Could not determine record ID.","warn");return}window.open(`${c}/main.aspx?pagetype=entityrecord&etn=${l.LogicalName}&id=%7B${k}%7D`,"_blank"),o.remove()}catch{b("Failed to fetch record.","warn")}finally{d.disabled=!1,d.textContent="Open Record"}};d.addEventListener("click",()=>{N()}),i.addEventListener("keydown",s=>{s.key==="Enter"&&N(),s.stopPropagation()})}function j(){if(document.getElementById(D))return;let e=document.createElement("style");e.id=D,e.textContent=`
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
  padding: 4px 10px; border: 1px solid #c5d8fb; border-radius: 4px;
  background: #fff; font-size: 12px; font-family: inherit; color: #555; cursor: pointer;
  white-space: nowrap;
}
#${t} .cnm-sort-btn:hover { background: #e8f0fe; }
#${t} .cnm-sort-btn.cnm-sort-active { background: #1e64c8; color: #fff; border-color: #1e64c8; }
#${t} .cnm-action-row { justify-content: flex-end; padding-top: 4px; }
#${t} .cnm-open-btn {
  padding: 7px 20px; background: #1e64c8; color: #fff; border: none;
  border-radius: 4px; font-size: 13px; font-family: inherit; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
}
#${t} .cnm-open-btn:hover:not(:disabled) { background: #1557b0; }
#${t} .cnm-open-btn:disabled { opacity: 0.5; cursor: default; }
  `,document.head.appendChild(e)}R();})();
