"use strict";(()=>{function R(e,t,a){requestAnimationFrame(()=>{let s=e.getBoundingClientRect();e.style.left=s.left+"px",e.style.top=s.top+"px",e.style.right="",e.style.transform=""});let n=!1,p=0,m=0,d=s=>{if(!n)return;let g=Math.max(0,Math.min(s.clientX-p,window.innerWidth-e.offsetWidth)),v=Math.max(0,Math.min(s.clientY-m,window.innerHeight-e.offsetHeight));e.style.left=g+"px",e.style.top=v+"px"},o=()=>{n=!1,t.style.cursor="move"};t.addEventListener("mousedown",s=>{a.contains(s.target)||(n=!0,p=s.clientX-e.offsetLeft,m=s.clientY-e.offsetTop,t.style.cursor="grabbing",s.preventDefault())}),document.addEventListener("mousemove",d),document.addEventListener("mouseup",o),new MutationObserver((s,g)=>{document.contains(e)||(document.removeEventListener("mousemove",d),document.removeEventListener("mouseup",o),g.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}var A="crm-tools-toast-container";function y(e,t="info"){let a=document.getElementById(A);a||(a=document.createElement("div"),a.id=A,a.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(a));let n=document.createElement("div");n.style.cssText=["background: "+(t==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),n.textContent=e,a.appendChild(n),setTimeout(()=>{n.style.opacity="0",setTimeout(()=>n.remove(),350)},3500)}function _(e,t){if(document.getElementById(e))return;let a=document.createElement("style");a.id=e,a.textContent=t,(document.head||document.documentElement).appendChild(a)}function L(e){e.addEventListener("keydown",t=>t.stopPropagation()),e.addEventListener("keyup",t=>t.stopPropagation())}function j(e,t){return`
#${e} { ${t==="dialog"?`position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 380px;
       background: #fff; border: 2px solid #1e64c8; border-radius: 8px;
       box-shadow: 0 4px 24px rgba(0,0,0,0.2);
       z-index: 2147483647; overflow: hidden;
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
`}function B(e){let t=document.getElementById(e.panelId);if(t)return t.remove(),null;let a=e.variant??"sidebar";_(e.styleId,j(e.panelId,a)+(e.extraCss??""));let n=document.createElement("div");n.id=e.panelId;let p=document.createElement("div");p.className="dcat-header";let m=document.createElement("span");m.className="dcat-title",m.textContent=e.title;let d=document.createElement("button");d.className="dcat-close",d.title="Close",d.textContent="\u2715",d.addEventListener("click",()=>n.remove()),p.append(m,d);let o=document.createElement("div");return o.className="dcat-body",n.append(p,o),document.body.appendChild(n),R(n,p,d),{panel:n,header:p,closeBtn:d,body:o}}var i="crm-tools-newest-modified-panel",F="crm-tools-newest-modified-style",H="crm-tools-newest-modified-list",O="crm-tools-entity-cache",U=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,X=`
#${i} .cnm-row { display: flex; align-items: center; gap: 8px; }
#${i} .cnm-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: #80868b; min-width: 54px; flex-shrink: 0;
}
#${i} .cnm-input {
  flex: 1; min-width: 0; padding: 6px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px;
  font-size: 13px; font-family: inherit; color: #222; outline: none;
}
#${i} .cnm-input:focus { border-color: #1e64c8; }
#${i} .cnm-input:disabled { background: #f5f5f5; color: #aaa; }
#${i} .cnm-sort-btn {
  flex: 1; padding: 4px 10px; border: 1px solid #c5d8fb; border-radius: 4px;
  background: #fff; font-size: 12px; font-family: inherit; color: #555; cursor: pointer;
  white-space: nowrap; text-align: center;
}
#${i} .cnm-sort-btn:hover:not(:disabled) { background: #e8f0fe; }
#${i} .cnm-sort-btn.cnm-sort-active { background: #1e64c8; color: #fff; border-color: #1e64c8; }
#${i} .cnm-sort-btn:disabled { opacity: 0.4; cursor: default; }
#${i} .cnm-action-row { justify-content: space-between; align-items: center; padding-top: 4px; }
#${i} .cnm-within-input {
  width: 44px; padding: 3px 5px; border: 1px solid #e0e0e0; border-radius: 4px;
  font-size: 11px; font-family: inherit; color: #aaa; text-align: center;
  background: #fafafa; outline: none;
}
#${i} .cnm-within-input:focus { border-color: #c5d8fb; color: #555; }
#${i} .cnm-open-btn {
  flex: 1; padding: 7px 20px; background: #1e64c8; color: #fff; border: none;
  border-radius: 4px; font-size: 13px; font-family: inherit; font-weight: 600;
  cursor: pointer; transition: background 0.15s; white-space: nowrap;
}
#${i} .cnm-open-btn:hover:not(:disabled) { background: #1557b0; }
#${i} .cnm-open-btn:disabled { opacity: 0.5; cursor: default; }
`;function V(e){return parseInt(e.split(".")[0]??"8",10)>=9?"v9.0":"v8.2"}function w(e){return e.DisplayName?.UserLocalizedLabel?.Label??e.LogicalName}function Y(e){try{let t=sessionStorage.getItem(O);if(!t)return null;let a=JSON.parse(t);return a.clientUrl===e?a.entities:null}catch{return null}}function q(e,t){try{sessionStorage.setItem(O,JSON.stringify({clientUrl:e,entities:t}))}catch{}}async function G(){if(typeof Xrm>"u"||!Xrm.Page?.context)return;let e=B({panelId:i,styleId:F,title:"\u{1F550} Jump to Latest",variant:"dialog",extraCss:X});if(!e)return;let{panel:t,body:a}=e,n=Xrm.Page.context.getClientUrl(),p=V(Xrm.Page.context.getVersion()),m=document.createElement("div");m.className="cnm-row";let d=document.createElement("label");d.className="cnm-label",d.textContent="Entity";let o=document.createElement("input");o.type="text",o.className="cnm-input",o.placeholder="Loading\u2026",o.disabled=!0,o.setAttribute("list",H),o.setAttribute("autocomplete","off");let s=document.createElement("datalist");s.id=H,L(o),m.append(d,o,s);let g=document.createElement("div");g.className="cnm-row";let v=document.createElement("label");v.className="cnm-label",v.textContent="Record ID";let f=document.createElement("input");f.type="text",f.className="cnm-input",f.placeholder="Optional GUID\u2026",L(f),f.addEventListener("keydown",c=>{c.key==="Enter"&&k()}),g.append(v,f);let C="modifiedon",$=document.createElement("div");$.className="cnm-row";let N=document.createElement("span");N.className="cnm-label",N.textContent="Sort by";let I=[],S=(c,r)=>{let l=document.createElement("button");return l.className="cnm-sort-btn"+(r===C?" cnm-sort-active":""),l.textContent=c,I.push(l),l.addEventListener("click",()=>{l.disabled||(C=r,I.forEach(h=>h.classList.remove("cnm-sort-active")),l.classList.add("cnm-sort-active"))}),l};$.append(N,S("Newest Modified","modifiedon"),S("Newest Created","createdon"));let T=document.createElement("div");T.className="cnm-row cnm-action-row";let u=document.createElement("button");u.className="cnm-open-btn",u.textContent="Open Record",u.disabled=!0;let b=document.createElement("input");b.type="number",b.className="cnm-within-input",b.min="1",b.value="14",b.title="Limit search to last N days (leave empty for all time)",L(b),T.append(b,u),f.addEventListener("input",()=>{let c=U.test(f.value.trim());I.forEach(r=>{r.disabled=c})}),a.append(m,g,$,T);let E=[],M=Y(n);if(M)E=M;else try{E=(await(await fetch(`${n}/api/data/${p}/EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute`)).json()).value.filter(l=>l.EntitySetName).sort((l,h)=>w(l).localeCompare(w(h))),q(n,E)}catch{o.placeholder="Failed to load entities",y("Could not load entity list.","warn");return}for(let c of E){let r=document.createElement("option");r.value=w(c),r.label=c.LogicalName,s.appendChild(r)}o.placeholder="Type entity name\u2026",o.disabled=!1,u.disabled=!1;let k=async()=>{let c=o.value.trim().toLowerCase();if(!c){y("Enter an entity name.","warn");return}let r=E.find(x=>w(x).toLowerCase()===c||x.LogicalName.toLowerCase()===c);if(!r){y(`Entity "${o.value.trim()}" not found.`,"warn");return}let l=f.value.trim();if(U.test(l)){let x=l.replace(/^\{|\}$/g,"");window.open(`${n}/main.aspx?pagetype=entityrecord&etn=${r.LogicalName}&id=%7B${x}%7D`,"_blank"),t.remove();return}let h=b.value?parseInt(b.value,10):null,D="";if(h!==null){let x=new Date(Date.now()-h*864e5).toISOString();D=`&$filter=${C}%20ge%20${x}`}u.disabled=!0,u.textContent="Opening\u2026";try{let x=`${n}/api/data/${p}/${r.EntitySetName}?$select=${r.PrimaryIdAttribute}&$orderby=${C}%20desc&$top=1${D}`;console.log("[DynamicsCat] OData query:",x);let z=await(await fetch(x,{headers:{Accept:"application/json","OData-MaxVersion":"4.0","OData-Version":"4.0"}})).json();if(!z.value?.length){y(`No records found for "${w(r)}".`,"warn");return}let P=(z.value[0][r.PrimaryIdAttribute]??"").replace(/^\{|\}$/g,"");if(!P){y("Could not determine record ID.","warn");return}window.open(`${n}/main.aspx?pagetype=entityrecord&etn=${r.LogicalName}&id=%7B${P}%7D`,"_blank"),t.remove()}catch{y("Failed to fetch record.","warn")}finally{u.disabled=!1,u.textContent="Open Record"}};u.addEventListener("click",()=>{k()}),o.addEventListener("keydown",c=>{c.key==="Enter"&&k()})}G();})();
