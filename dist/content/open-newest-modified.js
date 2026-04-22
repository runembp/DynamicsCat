"use strict";(()=>{function I(e,c,a){requestAnimationFrame(()=>{let r=e.getBoundingClientRect();e.style.left=r.left+"px",e.style.top=r.top+"px",e.style.right=""});let n=!1,u=0,g=0,p=r=>{if(!n)return;let f=Math.max(0,Math.min(r.clientX-u,window.innerWidth-e.offsetWidth)),o=Math.max(0,Math.min(r.clientY-g,window.innerHeight-e.offsetHeight));e.style.left=f+"px",e.style.top=o+"px"},x=()=>{n=!1,c.style.cursor="move"};c.addEventListener("mousedown",r=>{a.contains(r.target)||(n=!0,u=r.clientX-e.offsetLeft,g=r.clientY-e.offsetTop,c.style.cursor="grabbing",r.preventDefault())}),document.addEventListener("mousemove",p),document.addEventListener("mouseup",x),new MutationObserver((r,f)=>{document.contains(e)||(document.removeEventListener("mousemove",p),document.removeEventListener("mouseup",x),f.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}var k="crm-tools-toast-container";function b(e,c="info"){let a=document.getElementById(k);a||(a=document.createElement("div"),a.id=k,a.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(a));let n=document.createElement("div");n.style.cssText=["background: "+(c==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),n.textContent=e,a.appendChild(n),setTimeout(()=>{n.style.opacity="0",setTimeout(()=>n.remove(),350)},3500)}var t="crm-tools-newest-modified-panel",M="crm-tools-newest-modified-style",S="crm-tools-newest-modified-list";function D(e){return parseInt(e.split(".")[0]??"8",10)>=9?"v9.0":"v8.2"}function y(e){return e.DisplayName?.UserLocalizedLabel?.Label??e.LogicalName}async function A(){let e=document.getElementById(t);if(e){e.remove();return}if(typeof Xrm>"u"||!Xrm.Page?.context)return;let c=Xrm.Page.context.getClientUrl(),a=D(Xrm.Page.context.getVersion());R();let n=document.createElement("div");n.id=t;let u=document.createElement("div");u.className="cnm-header";let g=document.createElement("span");g.className="cnm-title",g.textContent="\u{1F550} Open Newest Modified";let p=document.createElement("button");p.className="cnm-close",p.textContent="\u2715",p.title="Close",p.addEventListener("click",()=>n.remove()),u.append(g,p);let x=document.createElement("div");x.className="cnm-body";let r=document.createElement("div");r.className="cnm-row";let f=document.createElement("label");f.className="cnm-label",f.textContent="Entity";let o=document.createElement("input");o.type="text",o.className="cnm-input",o.placeholder="Loading\u2026",o.disabled=!0,o.setAttribute("list",S),o.setAttribute("autocomplete","off");let E=document.createElement("datalist");E.id=S,o.addEventListener("keyup",s=>s.stopPropagation()),r.append(f,o,E);let h="modifiedon",v=document.createElement("div");v.className="cnm-row";let w=document.createElement("span");w.className="cnm-label",w.textContent="Sort by";let $=(s,l)=>{let i=document.createElement("button");return i.className="cnm-sort-btn"+(l===h?" cnm-sort-active":""),i.textContent=s,i.addEventListener("click",()=>{h=l,v.querySelectorAll(".cnm-sort-btn").forEach(m=>m.classList.remove("cnm-sort-active")),i.classList.add("cnm-sort-active")}),i};v.append(w,$("Last Modified","modifiedon"),$("Last Created","createdon"));let L=document.createElement("div");L.className="cnm-row cnm-action-row";let d=document.createElement("button");d.className="cnm-open-btn",d.textContent="Open Record",d.disabled=!0,L.appendChild(d),x.append(r,v,L),n.append(u,x),document.body.appendChild(n),I(n,u,p);let C=[];try{C=(await(await fetch(`${c}/api/data/${a}/EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute`)).json()).value.filter(i=>i.EntitySetName).sort((i,m)=>y(i).localeCompare(y(m)));for(let i of C){let m=document.createElement("option");m.value=y(i),m.label=i.LogicalName,E.appendChild(m)}o.placeholder="Type entity name\u2026",o.disabled=!1,d.disabled=!1}catch{o.placeholder="Failed to load entities",b("Could not load entity list.","warn");return}let N=async()=>{let s=o.value.trim().toLowerCase();if(!s){b("Enter an entity name.","warn");return}let l=C.find(i=>y(i).toLowerCase()===s||i.LogicalName.toLowerCase()===s);if(!l){b(`Entity "${o.value.trim()}" not found.`,"warn");return}d.disabled=!0,d.textContent="Opening\u2026";try{let m=await(await fetch(`${c}/api/data/${a}/${l.EntitySetName}?$select=${l.PrimaryIdAttribute}&$orderby=${h} desc&$top=1`)).json();if(!m.value?.length){b(`No records found for "${y(l)}".`,"warn");return}let T=(m.value[0][l.PrimaryIdAttribute]??"").replace(/^\{|\}$/g,"");if(!T){b("Could not determine record ID.","warn");return}window.open(`${c}/main.aspx?pagetype=entityrecord&etn=${l.LogicalName}&id=%7B${T}%7D`,"_blank"),n.remove()}catch{b("Failed to fetch record.","warn")}finally{d.disabled=!1,d.textContent="Open Record"}};d.addEventListener("click",()=>{N()}),o.addEventListener("keydown",s=>{s.key==="Enter"&&N(),s.stopPropagation()})}function R(){if(document.getElementById(M))return;let e=document.createElement("style");e.id=M,e.textContent=`
#${t} {
  position: fixed; top: 80px; right: 24px; width: 340px;
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
  `,document.head.appendChild(e)}A();})();
