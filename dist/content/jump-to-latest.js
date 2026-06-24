"use strict";(()=>{function O(e,t,o){requestAnimationFrame(()=>{let n=e.getBoundingClientRect();e.style.left=n.left+"px",e.style.top=n.top+"px",e.style.right="",e.style.transform=""});let r=!1,d=0,u=0,c=n=>{if(!r)return;let f=Math.max(0,Math.min(n.clientX-d,window.innerWidth-e.offsetWidth)),b=Math.max(0,Math.min(n.clientY-u,window.innerHeight-e.offsetHeight));e.style.left=f+"px",e.style.top=b+"px"},a=()=>{r=!1,t.style.cursor="move"};t.addEventListener("mousedown",n=>{o.contains(n.target)||(r=!0,d=n.clientX-e.offsetLeft,u=n.clientY-e.offsetTop,t.style.cursor="grabbing",n.preventDefault())}),document.addEventListener("mousemove",c),document.addEventListener("mouseup",a),new MutationObserver((n,f)=>{document.contains(e)||(document.removeEventListener("mousemove",c),document.removeEventListener("mouseup",a),f.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}var B="crm-tools-toast-container";function h(e,t="info"){let o=document.getElementById(B);o||(o=document.createElement("div"),o.id=B,o.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(o));let r=document.createElement("div");r.style.cssText=["background: "+(t==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),r.textContent=e,o.appendChild(r),setTimeout(()=>{r.style.opacity="0",setTimeout(()=>r.remove(),350)},3500)}function Q(e,t){if(document.getElementById(e))return;let o=document.createElement("style");o.id=e,o.textContent=t,(document.head||document.documentElement).appendChild(o)}function C(e){e.addEventListener("keydown",t=>t.stopPropagation()),e.addEventListener("keyup",t=>t.stopPropagation())}function Z(e,t){return`
#${e} { ${t==="dialog"?`position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 380px;
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
`}function W(e){let t=document.getElementById(e.panelId);if(t)return t.remove(),null;let o=e.variant??"sidebar";Q(e.styleId,Z(e.panelId,o)+(e.extraCss??""));let r=document.createElement("div");r.id=e.panelId;let d=document.createElement("div");d.className="dcat-header";let u=document.createElement("span");u.className="dcat-title",u.textContent=e.title;let c=document.createElement("button");c.className="dcat-close",c.title="Close",c.textContent="\u2715",c.addEventListener("click",()=>r.remove()),d.append(u,c);let a=document.createElement("div");return a.className="dcat-body",r.append(d,a),document.body.appendChild(r),O(r,d,c),{panel:r,header:d,closeBtn:c,body:a}}function j(e){return e.replace(/[{}]/g,"").toLowerCase()}function ee(){try{if(typeof Xrm<"u"&&Xrm.Utility?.getGlobalContext)return Xrm.Utility.getGlobalContext()}catch(e){console.debug("[DynamicsCat] getGlobalContext failed",e)}return null}function te(){try{if(typeof Xrm<"u"&&Xrm.Page?.context)return Xrm.Page.context}catch(e){console.debug("[DynamicsCat] get legacy context failed",e)}return null}function F(){let e=ee(),t=te(),o=e?.getClientUrl?.()??t?.getClientUrl?.()??null;if(!o)return null;let r=e?.userSettings?.userId,d=t?.getUserId?.(),u=r||d?j(String(r??d)):null,c=e?.userSettings?.languageId,a=t?.getUserLcid?.(),n=null;typeof c=="number"&&Number.isInteger(c)?n=c:typeof a=="number"&&Number.isInteger(a)&&(n=a);let f=e?.getVersion?.()??t?.getVersion?.()??null;return{clientUrl:o.replace(/\/$/,""),userId:u,userLanguageId:n,crmVersion:f}}function ne(e){let t=new Set,o=e?parseInt(e.split(".")[0]??"",10):Number.NaN,r=e?parseInt(e.split(".")[1]??"",10):Number.NaN;return Number.isInteger(o)&&(o>=9?(t.add(Number.isInteger(r)?`v${o}.${r}`:"v9.2"),t.add("v9.2"),t.add("v9.1"),t.add("v9.0")):o===8&&(t.add(Number.isInteger(r)?`v8.${r}`:"v8.2"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"))),t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}async function D(e,t,o){let r=[];for(let u of ne(e.crmVersion)){let c=`${e.clientUrl}/api/data/${u}/${t(u)}`,a=await fetch(c,o);if(a.ok)return{json:await a.json(),version:u};if(r.push({version:u,status:a.status,body:await a.text()}),a.status!==404&&a.status!==400)break}let d=r[r.length-1];throw new Error(d?`Web API failed (${d.version}, HTTP ${d.status}): ${d.body.slice(0,160)}`:"Web API failed before receiving a response")}async function G(e){return(await D(e,()=>"EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute")).json.value}function M(e,t,o){return`${e.clientUrl}/main.aspx?pagetype=entityrecord&etn=${encodeURIComponent(t)}&id=%7B${j(o)}%7D`}function E(e){return e.DisplayName?.UserLocalizedLabel?.Label??e.LogicalName}var l="crm-tools-newest-modified-panel",oe="crm-tools-newest-modified-style",V="crm-tools-newest-modified-list",A="__dynamicscat_entity_cache",Y="__dynamicscat_last_entity",J="__dynamicscat_last_sort",K="__dynamicscat_last_within_days",re=7*24*60*60*1e3,q=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,ie=`
#${l} .cnm-row { display: flex; align-items: center; gap: 8px; }
#${l} .cnm-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: #80868b; min-width: 54px; flex-shrink: 0;
}
#${l} .cnm-input {
  flex: 1; min-width: 0; padding: 6px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px;
  font-size: 13px; font-family: inherit; color: #222; outline: none;
}
#${l} .cnm-input:focus { border-color: #1e64c8; }
#${l} .cnm-input:disabled { background: #f5f5f5; color: #aaa; }
#${l} .cnm-refresh-btn {
  background: none; border: 1px solid #c5d8fb; border-radius: 4px;
  cursor: pointer; font-size: 14px; padding: 4px 6px; line-height: 1;
  transition: background 0.15s;
}
#${l} .cnm-refresh-btn:hover { background: #e8f0fe; }
#${l} .cnm-refresh-btn.cnm-spinning { animation: cnm-spin 0.8s linear infinite; }
@keyframes cnm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
#${l} .cnm-sort-btn {
  flex: 1; padding: 4px 10px; border: 1px solid #c5d8fb; border-radius: 4px;
  background: #fff; font-size: 12px; font-family: inherit; color: #555; cursor: pointer;
  white-space: nowrap; text-align: center;
}
#${l} .cnm-sort-btn:hover:not(:disabled) { background: #e8f0fe; }
#${l} .cnm-sort-btn.cnm-sort-active { background: #1e64c8; color: #fff; border-color: #1e64c8; }
#${l} .cnm-sort-btn:disabled { opacity: 0.4; cursor: default; }
#${l} .cnm-action-row { justify-content: space-between; align-items: center; padding-top: 4px; }
#${l} .cnm-within-input {
  width: 44px; padding: 3px 5px; border: 1px solid #e0e0e0; border-radius: 4px;
  font-size: 11px; font-family: inherit; color: #aaa; text-align: center;
  background: #fafafa; outline: none;
}
#${l} .cnm-within-input:focus { border-color: #c5d8fb; color: #555; }
#${l} .cnm-open-btn {
  flex: 1; padding: 7px 20px; background: #1e64c8; color: #fff; border: none;
  border-radius: 4px; font-size: 13px; font-family: inherit; font-weight: 600;
  cursor: pointer; transition: background 0.15s; white-space: nowrap;
}
#${l} .cnm-open-btn:hover:not(:disabled) { background: #1557b0; }
#${l} .cnm-open-btn:disabled { opacity: 0.5; cursor: default; }
`;function ae(e){try{let t=localStorage.getItem(A);if(!t)return null;let o=JSON.parse(t);return o.clientUrl!==e||Date.now()-o.timestamp>=re?null:o.entities}catch{return null}}function se(e,t){try{let o={clientUrl:e,entities:t,timestamp:Date.now()};localStorage.setItem(A,JSON.stringify(o))}catch{}}async function ce(){let e=F();if(!e)return;let t=e,o=W({panelId:l,styleId:oe,title:"\u{1F550} Jump to Latest",variant:"dialog",extraCss:ie});if(!o)return;let{panel:r,body:d}=o,u=t.clientUrl,c=document.createElement("div");c.className="cnm-row";let a=document.createElement("label");a.className="cnm-label",a.textContent="Entity";let n=document.createElement("input");n.type="text",n.className="cnm-input",n.placeholder="Loading\u2026",n.disabled=!0,n.setAttribute("list",V),n.setAttribute("autocomplete","off");let f=document.createElement("datalist");f.id=V,C(n);let b=document.createElement("button");b.className="cnm-refresh-btn",b.textContent="\u{1F504}",b.title="Refresh entity list",c.append(a,n,b,f);let L=document.createElement("div");L.className="cnm-row";let I=document.createElement("label");I.className="cnm-label",I.textContent="Record ID";let y=document.createElement("input");y.type="text",y.className="cnm-input",y.placeholder="Optional GUID\u2026",C(y),y.addEventListener("keydown",s=>{s.key==="Enter"&&k()}),L.append(I,y);let v="modifiedon",$=document.createElement("div");$.className="cnm-row";let N=document.createElement("span");N.className="cnm-label",N.textContent="Sort by";let S=[],U=()=>{S.forEach((s,i)=>{let m=i===0?"modifiedon":"createdon";s.classList.toggle("cnm-sort-active",m===v)})},_=(s,i)=>{let m=document.createElement("button");return m.className="cnm-sort-btn"+(i===v?" cnm-sort-active":""),m.textContent=s,S.push(m),m.addEventListener("click",()=>{m.disabled||(v=i,U())}),m};$.append(N,_("Newest Modified","modifiedon"),_("Newest Created","createdon"));let T=document.createElement("div");T.className="cnm-row cnm-action-row";let g=document.createElement("button");g.className="cnm-open-btn",g.textContent="Open Record",g.disabled=!0;let p=document.createElement("input");p.type="number",p.className="cnm-within-input",p.min="1",p.value="14",p.title="Limit search to last N days (leave empty for all time)",C(p),T.append(p,g),y.addEventListener("input",()=>{let s=q.test(y.value.trim());S.forEach(i=>{i.disabled=s})}),d.append(c,L,$,T);let w=[];async function P(s=!1){if(!s){let i=ae(u);if(i)return w=i,!0}try{return w=(await G(t)).filter(i=>i.EntitySetName).sort((i,m)=>E(i).localeCompare(E(m))),se(u,w),!0}catch{return!1}}function R(){f.innerHTML="";for(let s of w){let i=document.createElement("option");i.value=E(s),i.label=s.LogicalName,f.appendChild(i)}}if(n.placeholder="Loading\u2026",n.disabled=!0,await P()){R(),n.placeholder="Type entity name\u2026",n.disabled=!1,g.disabled=!1;let s=localStorage.getItem(Y);s&&(n.value=s);let i=localStorage.getItem(J);(i==="modifiedon"||i==="createdon")&&(v=i,U());let m=localStorage.getItem(K);m!==null&&(p.value=m),n.focus()}else{n.placeholder="Failed to load entities",h("Could not load entity list.","warn");return}b.addEventListener("click",async()=>{b.classList.add("cnm-spinning"),n.disabled=!0,n.placeholder="Refreshing\u2026",localStorage.removeItem(A),await P(!0)?(R(),n.placeholder="Type entity name\u2026",n.disabled=!1):(n.placeholder="Refresh failed",h("Could not refresh entity list.","warn"),n.disabled=!1),b.classList.remove("cnm-spinning")});let k=async()=>{let s=n.value.trim().toLowerCase();if(!s){h("Enter an entity name.","warn");return}let i=w.find(x=>E(x).toLowerCase()===s||x.LogicalName.toLowerCase()===s);if(!i){h(`Entity "${n.value.trim()}" not found.`,"warn");return}localStorage.setItem(Y,n.value.trim()),localStorage.setItem(J,v),localStorage.setItem(K,p.value);let m=y.value.trim();if(q.test(m)){let x=m.replace(/^\{|\}$/g,"");window.open(M(t,i.LogicalName,x),"_blank"),r.remove();return}let H=p.value?parseInt(p.value,10):null,z="";if(H!==null){let x=new Date(Date.now()-H*864e5).toISOString();z=`&$filter=${v}%20ge%20${x}`}g.disabled=!0,g.textContent="Opening\u2026";try{if(!i.PrimaryIdAttribute){h("Could not determine primary id field.","warn");return}let{json:x}=await D(t,()=>`${i.EntitySetName}?$select=${i.PrimaryIdAttribute}&$orderby=${v}%20desc&$top=1${z}`,{headers:{Accept:"application/json","OData-MaxVersion":"4.0","OData-Version":"4.0"}});if(!x.value?.length){h(`No records found for "${E(i)}".`,"warn");return}let X=(x.value[0][i.PrimaryIdAttribute]??"").replace(/^\{|\}$/g,"");if(!X){h("Could not determine record ID.","warn");return}window.open(M(t,i.LogicalName,X),"_blank"),r.remove()}catch{h("Failed to fetch record.","warn")}finally{g.disabled=!1,g.textContent="Open Record"}};g.addEventListener("click",()=>{k()}),n.addEventListener("keydown",s=>{s.key==="Enter"&&k()})}ce();})();
