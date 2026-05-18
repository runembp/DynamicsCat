"use strict";(()=>{function O(e,n,r){requestAnimationFrame(()=>{let c=e.getBoundingClientRect();e.style.left=c.left+"px",e.style.top=c.top+"px",e.style.right="",e.style.transform=""});let a=!1,m=0,f=0,d=c=>{if(!a)return;let p=Math.max(0,Math.min(c.clientX-m,window.innerWidth-e.offsetWidth)),E=Math.max(0,Math.min(c.clientY-f,window.innerHeight-e.offsetHeight));e.style.left=p+"px",e.style.top=E+"px"},t=()=>{a=!1,n.style.cursor="move"};n.addEventListener("mousedown",c=>{r.contains(c.target)||(a=!0,m=c.clientX-e.offsetLeft,f=c.clientY-e.offsetTop,n.style.cursor="grabbing",c.preventDefault())}),document.addEventListener("mousemove",d),document.addEventListener("mouseup",t),new MutationObserver((c,p)=>{document.contains(e)||(document.removeEventListener("mousemove",d),document.removeEventListener("mouseup",t),p.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}var H="crm-tools-toast-container";function y(e,n="info"){let r=document.getElementById(H);r||(r=document.createElement("div"),r.id=H,r.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(r));let a=document.createElement("div");a.style.cssText=["background: "+(n==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),a.textContent=e,r.appendChild(a),setTimeout(()=>{a.style.opacity="0",setTimeout(()=>a.remove(),350)},3500)}function V(e,n){if(document.getElementById(e))return;let r=document.createElement("style");r.id=e,r.textContent=n,(document.head||document.documentElement).appendChild(r)}function $(e){e.addEventListener("keydown",n=>n.stopPropagation()),e.addEventListener("keyup",n=>n.stopPropagation())}function q(e,n){return`
#${e} { ${n==="dialog"?`position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 380px;
       max-height: 90vh;
       background: #fff; border: 2px solid #1e64c8; border-radius: 8px;
       box-shadow: 0 4px 24px rgba(0,0,0,0.2);
       z-index: 2147483647; overflow: visible;
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
`}function U(e){let n=document.getElementById(e.panelId);if(n)return n.remove(),null;let r=e.variant??"sidebar";V(e.styleId,q(e.panelId,r)+(e.extraCss??""));let a=document.createElement("div");a.id=e.panelId;let m=document.createElement("div");m.className="dcat-header";let f=document.createElement("span");f.className="dcat-title",f.textContent=e.title;let d=document.createElement("button");d.className="dcat-close",d.title="Close",d.textContent="\u2715",d.addEventListener("click",()=>a.remove()),m.append(f,d);let t=document.createElement("div");return t.className="dcat-body",a.append(m,t),document.body.appendChild(a),O(a,m,d),{panel:a,header:m,closeBtn:d,body:t}}var s="crm-tools-newest-modified-panel",G="crm-tools-newest-modified-style",j="crm-tools-newest-modified-list",M="__dynamicscat_entity_cache",F="__dynamicscat_last_entity",X="__dynamicscat_last_sort",Y="__dynamicscat_last_within_days",W=7*24*60*60*1e3,K=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,J=`
#${s} .cnm-row { display: flex; align-items: center; gap: 8px; }
#${s} .cnm-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: #80868b; min-width: 54px; flex-shrink: 0;
}
#${s} .cnm-input {
  flex: 1; min-width: 0; padding: 6px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px;
  font-size: 13px; font-family: inherit; color: #222; outline: none;
}
#${s} .cnm-input:focus { border-color: #1e64c8; }
#${s} .cnm-input:disabled { background: #f5f5f5; color: #aaa; }
#${s} .cnm-refresh-btn {
  background: none; border: 1px solid #c5d8fb; border-radius: 4px;
  cursor: pointer; font-size: 14px; padding: 4px 6px; line-height: 1;
  transition: background 0.15s;
}
#${s} .cnm-refresh-btn:hover { background: #e8f0fe; }
#${s} .cnm-refresh-btn.cnm-spinning { animation: cnm-spin 0.8s linear infinite; }
@keyframes cnm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
#${s} .cnm-sort-btn {
  flex: 1; padding: 4px 10px; border: 1px solid #c5d8fb; border-radius: 4px;
  background: #fff; font-size: 12px; font-family: inherit; color: #555; cursor: pointer;
  white-space: nowrap; text-align: center;
}
#${s} .cnm-sort-btn:hover:not(:disabled) { background: #e8f0fe; }
#${s} .cnm-sort-btn.cnm-sort-active { background: #1e64c8; color: #fff; border-color: #1e64c8; }
#${s} .cnm-sort-btn:disabled { opacity: 0.4; cursor: default; }
#${s} .cnm-action-row { justify-content: space-between; align-items: center; padding-top: 4px; }
#${s} .cnm-within-input {
  width: 44px; padding: 3px 5px; border: 1px solid #e0e0e0; border-radius: 4px;
  font-size: 11px; font-family: inherit; color: #aaa; text-align: center;
  background: #fafafa; outline: none;
}
#${s} .cnm-within-input:focus { border-color: #c5d8fb; color: #555; }
#${s} .cnm-open-btn {
  flex: 1; padding: 7px 20px; background: #1e64c8; color: #fff; border: none;
  border-radius: 4px; font-size: 13px; font-family: inherit; font-weight: 600;
  cursor: pointer; transition: background 0.15s; white-space: nowrap;
}
#${s} .cnm-open-btn:hover:not(:disabled) { background: #1557b0; }
#${s} .cnm-open-btn:disabled { opacity: 0.5; cursor: default; }
`;function Q(e){return parseInt(e.split(".")[0]??"8",10)>=9?"v9.0":"v8.2"}function L(e){return e.DisplayName?.UserLocalizedLabel?.Label??e.LogicalName}function Z(e){try{let n=localStorage.getItem(M);if(!n)return null;let r=JSON.parse(n);return r.clientUrl!==e||Date.now()-r.timestamp>=W?null:r.entities}catch{return null}}function ee(e,n){try{let r={clientUrl:e,entities:n,timestamp:Date.now()};localStorage.setItem(M,JSON.stringify(r))}catch{}}async function te(){if(typeof Xrm>"u"||!Xrm.Page?.context)return;let e=U({panelId:s,styleId:G,title:"\u{1F550} Jump to Latest",variant:"dialog",extraCss:J});if(!e)return;let{panel:n,body:r}=e,a=Xrm.Page.context.getClientUrl(),m=Q(Xrm.Page.context.getVersion()),f=document.createElement("div");f.className="cnm-row";let d=document.createElement("label");d.className="cnm-label",d.textContent="Entity";let t=document.createElement("input");t.type="text",t.className="cnm-input",t.placeholder="Loading\u2026",t.disabled=!0,t.setAttribute("list",j),t.setAttribute("autocomplete","off");let c=document.createElement("datalist");c.id=j,$(t);let p=document.createElement("button");p.className="cnm-refresh-btn",p.textContent="\u{1F504}",p.title="Refresh entity list",f.append(d,t,p,c);let E=document.createElement("div");E.className="cnm-row";let S=document.createElement("label");S.className="cnm-label",S.textContent="Record ID";let b=document.createElement("input");b.type="text",b.className="cnm-input",b.placeholder="Optional GUID\u2026",$(b),b.addEventListener("keydown",i=>{i.key==="Enter"&&_()}),E.append(S,b);let h="modifiedon",T=document.createElement("div");T.className="cnm-row";let I=document.createElement("span");I.className="cnm-label",I.textContent="Sort by";let N=[],D=()=>{N.forEach((i,o)=>{let l=o===0?"modifiedon":"createdon";i.classList.toggle("cnm-sort-active",l===h)})},A=(i,o)=>{let l=document.createElement("button");return l.className="cnm-sort-btn"+(o===h?" cnm-sort-active":""),l.textContent=i,N.push(l),l.addEventListener("click",()=>{l.disabled||(h=o,D())}),l};T.append(I,A("Newest Modified","modifiedon"),A("Newest Created","createdon"));let k=document.createElement("div");k.className="cnm-row cnm-action-row";let g=document.createElement("button");g.className="cnm-open-btn",g.textContent="Open Record",g.disabled=!0;let u=document.createElement("input");u.type="number",u.className="cnm-within-input",u.min="1",u.value="14",u.title="Limit search to last N days (leave empty for all time)",$(u),k.append(u,g),b.addEventListener("input",()=>{let i=K.test(b.value.trim());N.forEach(o=>{o.disabled=i})}),r.append(f,E,T,k);let w=[];async function R(i=!1){if(!i){let o=Z(a);if(o)return w=o,!0}try{return w=(await(await fetch(`${a}/api/data/${m}/EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute`)).json()).value.filter(v=>v.EntitySetName).sort((v,C)=>L(v).localeCompare(L(C))),ee(a,w),!0}catch{return!1}}function z(){c.innerHTML="";for(let i of w){let o=document.createElement("option");o.value=L(i),o.label=i.LogicalName,c.appendChild(o)}}if(t.placeholder="Loading\u2026",t.disabled=!0,await R()){z(),t.placeholder="Type entity name\u2026",t.disabled=!1,g.disabled=!1;let i=localStorage.getItem(F);i&&(t.value=i);let o=localStorage.getItem(X);(o==="modifiedon"||o==="createdon")&&(h=o,D());let l=localStorage.getItem(Y);l!==null&&(u.value=l),t.focus()}else{t.placeholder="Failed to load entities",y("Could not load entity list.","warn");return}p.addEventListener("click",async()=>{p.classList.add("cnm-spinning"),t.disabled=!0,t.placeholder="Refreshing\u2026",localStorage.removeItem(M),await R(!0)?(z(),t.placeholder="Type entity name\u2026",t.disabled=!1):(t.placeholder="Refresh failed",y("Could not refresh entity list.","warn"),t.disabled=!1),p.classList.remove("cnm-spinning")});let _=async()=>{let i=t.value.trim().toLowerCase();if(!i){y("Enter an entity name.","warn");return}let o=w.find(x=>L(x).toLowerCase()===i||x.LogicalName.toLowerCase()===i);if(!o){y(`Entity "${t.value.trim()}" not found.`,"warn");return}localStorage.setItem(F,t.value.trim()),localStorage.setItem(X,h),localStorage.setItem(Y,u.value);let l=b.value.trim();if(K.test(l)){let x=l.replace(/^\{|\}$/g,"");window.open(`${a}/main.aspx?pagetype=entityrecord&etn=${o.LogicalName}&id=%7B${x}%7D`,"_blank"),n.remove();return}let v=u.value?parseInt(u.value,10):null,C="";if(v!==null){let x=new Date(Date.now()-v*864e5).toISOString();C=`&$filter=${h}%20ge%20${x}`}g.disabled=!0,g.textContent="Opening\u2026";try{let x=`${a}/api/data/${m}/${o.EntitySetName}?$select=${o.PrimaryIdAttribute}&$orderby=${h}%20desc&$top=1${C}`;console.log("[DynamicsCat] OData query:",x);let P=await(await fetch(x,{headers:{Accept:"application/json","OData-MaxVersion":"4.0","OData-Version":"4.0"}})).json();if(!P.value?.length){y(`No records found for "${L(o)}".`,"warn");return}let B=(P.value[0][o.PrimaryIdAttribute]??"").replace(/^\{|\}$/g,"");if(!B){y("Could not determine record ID.","warn");return}window.open(`${a}/main.aspx?pagetype=entityrecord&etn=${o.LogicalName}&id=%7B${B}%7D`,"_blank"),n.remove()}catch{y("Failed to fetch record.","warn")}finally{g.disabled=!1,g.textContent="Open Record"}};g.addEventListener("click",()=>{_()}),t.addEventListener("keydown",i=>{i.key==="Enter"&&_()})}te();})();
