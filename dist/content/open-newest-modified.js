"use strict";(()=>{function H(e,n,a){requestAnimationFrame(()=>{let s=e.getBoundingClientRect();e.style.left=s.left+"px",e.style.top=s.top+"px",e.style.right="",e.style.transform=""});let o=!1,l=0,u=0,d=s=>{if(!o)return;let p=Math.max(0,Math.min(s.clientX-l,window.innerWidth-e.offsetWidth)),v=Math.max(0,Math.min(s.clientY-u,window.innerHeight-e.offsetHeight));e.style.left=p+"px",e.style.top=v+"px"},t=()=>{o=!1,n.style.cursor="move"};n.addEventListener("mousedown",s=>{a.contains(s.target)||(o=!0,l=s.clientX-e.offsetLeft,u=s.clientY-e.offsetTop,n.style.cursor="grabbing",s.preventDefault())}),document.addEventListener("mousemove",d),document.addEventListener("mouseup",t),new MutationObserver((s,p)=>{document.contains(e)||(document.removeEventListener("mousemove",d),document.removeEventListener("mouseup",t),p.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}var B="crm-tools-toast-container";function h(e,n="info"){let a=document.getElementById(B);a||(a=document.createElement("div"),a.id=B,a.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(a));let o=document.createElement("div");o.style.cssText=["background: "+(n==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),o.textContent=e,a.appendChild(o),setTimeout(()=>{o.style.opacity="0",setTimeout(()=>o.remove(),350)},3500)}function F(e,n){if(document.getElementById(e))return;let a=document.createElement("style");a.id=e,a.textContent=n,(document.head||document.documentElement).appendChild(a)}function $(e){e.addEventListener("keydown",n=>n.stopPropagation()),e.addEventListener("keyup",n=>n.stopPropagation())}function X(e,n){return`
#${e} { ${n==="dialog"?`position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 380px;
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
#${e} .dcat-body { ${n==="dialog"?"padding: 14px; display: flex; flex-direction: column; gap: 10px;":"overflow-y: auto; overflow-x: auto; flex: 1;"} }
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
`}function U(e){let n=document.getElementById(e.panelId);if(n)return n.remove(),null;let a=e.variant??"sidebar";F(e.styleId,X(e.panelId,a)+(e.extraCss??""));let o=document.createElement("div");o.id=e.panelId;let l=document.createElement("div");l.className="dcat-header";let u=document.createElement("span");u.className="dcat-title",u.textContent=e.title;let d=document.createElement("button");d.className="dcat-close",d.title="Close",d.textContent="\u2715",d.addEventListener("click",()=>o.remove()),l.append(u,d);let t=document.createElement("div");return t.className="dcat-body",o.append(l,t),document.body.appendChild(o),H(o,l,d),{panel:o,header:l,closeBtn:d,body:t}}var i="crm-tools-newest-modified-panel",V="crm-tools-newest-modified-style",O="crm-tools-newest-modified-list",D="__dynamicscat_entity_cache",Y=7*24*60*60*1e3,j=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,q=`
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
#${i} .cnm-refresh-btn {
  background: none; border: 1px solid #c5d8fb; border-radius: 4px;
  cursor: pointer; font-size: 14px; padding: 4px 6px; line-height: 1;
  transition: background 0.15s;
}
#${i} .cnm-refresh-btn:hover { background: #e8f0fe; }
#${i} .cnm-refresh-btn.cnm-spinning { animation: cnm-spin 0.8s linear infinite; }
@keyframes cnm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
`;function G(e){return parseInt(e.split(".")[0]??"8",10)>=9?"v9.0":"v8.2"}function w(e){return e.DisplayName?.UserLocalizedLabel?.Label??e.LogicalName}function J(e){try{let n=localStorage.getItem(D);if(!n)return null;let a=JSON.parse(n);return a.clientUrl!==e||Date.now()-a.timestamp>=Y?null:a.entities}catch{return null}}function K(e,n){try{let a={clientUrl:e,entities:n,timestamp:Date.now()};localStorage.setItem(D,JSON.stringify(a))}catch{}}async function W(){if(typeof Xrm>"u"||!Xrm.Page?.context)return;let e=U({panelId:i,styleId:V,title:"\u{1F550} Jump to Latest",variant:"dialog",extraCss:q});if(!e)return;let{panel:n,body:a}=e,o=Xrm.Page.context.getClientUrl(),l=G(Xrm.Page.context.getVersion()),u=document.createElement("div");u.className="cnm-row";let d=document.createElement("label");d.className="cnm-label",d.textContent="Entity";let t=document.createElement("input");t.type="text",t.className="cnm-input",t.placeholder="Loading\u2026",t.disabled=!0,t.setAttribute("list",O),t.setAttribute("autocomplete","off");let s=document.createElement("datalist");s.id=O,$(t);let p=document.createElement("button");p.className="cnm-refresh-btn",p.textContent="\u{1F504}",p.title="Refresh entity list",u.append(d,t,p,s);let v=document.createElement("div");v.className="cnm-row";let N=document.createElement("label");N.className="cnm-label",N.textContent="Record ID";let b=document.createElement("input");b.type="text",b.className="cnm-input",b.placeholder="Optional GUID\u2026",$(b),b.addEventListener("keydown",c=>{c.key==="Enter"&&M()}),v.append(N,b);let L="modifiedon",k=document.createElement("div");k.className="cnm-row";let T=document.createElement("span");T.className="cnm-label",T.textContent="Sort by";let I=[],R=(c,r)=>{let m=document.createElement("button");return m.className="cnm-sort-btn"+(r===L?" cnm-sort-active":""),m.textContent=c,I.push(m),m.addEventListener("click",()=>{m.disabled||(L=r,I.forEach(y=>y.classList.remove("cnm-sort-active")),m.classList.add("cnm-sort-active"))}),m};k.append(T,R("Newest Modified","modifiedon"),R("Newest Created","createdon"));let S=document.createElement("div");S.className="cnm-row cnm-action-row";let f=document.createElement("button");f.className="cnm-open-btn",f.textContent="Open Record",f.disabled=!0;let g=document.createElement("input");g.type="number",g.className="cnm-within-input",g.min="1",g.value="14",g.title="Limit search to last N days (leave empty for all time)",$(g),S.append(g,f),b.addEventListener("input",()=>{let c=j.test(b.value.trim());I.forEach(r=>{r.disabled=c})}),a.append(u,v,k,S);let E=[];async function z(c=!1){if(!c){let r=J(o);if(r)return E=r,!0}try{return E=(await(await fetch(`${o}/api/data/${l}/EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute`)).json()).value.filter(y=>y.EntitySetName).sort((y,C)=>w(y).localeCompare(w(C))),K(o,E),!0}catch{return!1}}function P(){s.innerHTML="";for(let c of E){let r=document.createElement("option");r.value=w(c),r.label=c.LogicalName,s.appendChild(r)}}if(t.placeholder="Loading\u2026",t.disabled=!0,await z())P(),t.placeholder="Type entity name\u2026",t.disabled=!1,f.disabled=!1;else{t.placeholder="Failed to load entities",h("Could not load entity list.","warn");return}p.addEventListener("click",async()=>{p.classList.add("cnm-spinning"),t.disabled=!0,t.placeholder="Refreshing\u2026",localStorage.removeItem(D),await z(!0)?(P(),t.placeholder="Type entity name\u2026",t.disabled=!1):(t.placeholder="Refresh failed",h("Could not refresh entity list.","warn"),t.disabled=!1),p.classList.remove("cnm-spinning")});let M=async()=>{let c=t.value.trim().toLowerCase();if(!c){h("Enter an entity name.","warn");return}let r=E.find(x=>w(x).toLowerCase()===c||x.LogicalName.toLowerCase()===c);if(!r){h(`Entity "${t.value.trim()}" not found.`,"warn");return}let m=b.value.trim();if(j.test(m)){let x=m.replace(/^\{|\}$/g,"");window.open(`${o}/main.aspx?pagetype=entityrecord&etn=${r.LogicalName}&id=%7B${x}%7D`,"_blank"),n.remove();return}let y=g.value?parseInt(g.value,10):null,C="";if(y!==null){let x=new Date(Date.now()-y*864e5).toISOString();C=`&$filter=${L}%20ge%20${x}`}f.disabled=!0,f.textContent="Opening\u2026";try{let x=`${o}/api/data/${l}/${r.EntitySetName}?$select=${r.PrimaryIdAttribute}&$orderby=${L}%20desc&$top=1${C}`;console.log("[DynamicsCat] OData query:",x);let _=await(await fetch(x,{headers:{Accept:"application/json","OData-MaxVersion":"4.0","OData-Version":"4.0"}})).json();if(!_.value?.length){h(`No records found for "${w(r)}".`,"warn");return}let A=(_.value[0][r.PrimaryIdAttribute]??"").replace(/^\{|\}$/g,"");if(!A){h("Could not determine record ID.","warn");return}window.open(`${o}/main.aspx?pagetype=entityrecord&etn=${r.LogicalName}&id=%7B${A}%7D`,"_blank"),n.remove()}catch{h("Failed to fetch record.","warn")}finally{f.disabled=!1,f.textContent="Open Record"}};f.addEventListener("click",()=>{M()}),t.addEventListener("keydown",c=>{c.key==="Enter"&&M()})}W();})();
