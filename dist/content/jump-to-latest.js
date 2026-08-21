"use strict";(()=>{function F(e,t,n){let o=e.ownerDocument,a=o.defaultView??window;requestAnimationFrame(()=>{let c=e.getBoundingClientRect();e.style.left=c.left+"px",e.style.top=c.top+"px",e.style.right="",e.style.transform=""});let u=!1,p=0,d=0,r=c=>{if(!u)return;let h=Math.max(0,Math.min(c.clientX-p,a.innerWidth-e.offsetWidth)),I=Math.max(0,Math.min(c.clientY-d,a.innerHeight-e.offsetHeight));e.style.left=h+"px",e.style.top=I+"px"},b=()=>{u=!1,t.style.cursor="move"};t.addEventListener("mousedown",c=>{n.contains(c.target)||(u=!0,p=c.clientX-e.offsetLeft,d=c.clientY-e.offsetTop,t.style.cursor="grabbing",c.preventDefault())}),o.addEventListener("mousemove",r),o.addEventListener("mouseup",b),new MutationObserver((c,h)=>{o.contains(e)||(o.removeEventListener("mousemove",r),o.removeEventListener("mouseup",b),h.disconnect())}).observe(o.body,{childList:!0,subtree:!0})}var W="crm-tools-toast-container";function y(e,t="info"){let n=document.getElementById(W);n||(n=document.createElement("div"),n.id=W,n.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(n));let o=document.createElement("div");o.style.cssText=["background: "+(t==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),o.textContent=e,n.appendChild(o),setTimeout(()=>{o.style.opacity="0",setTimeout(()=>o.remove(),350)},3500)}function re(e,t,n=document){if(n.getElementById(e))return;let o=n.createElement("style");o.id=e,o.textContent=t,(n.head||n.documentElement).appendChild(o)}function N(e){e.addEventListener("keydown",t=>t.stopPropagation()),e.addEventListener("keyup",t=>t.stopPropagation())}function ie(e,t){return`
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
`}function G(e){let t=e.targetDocument??document,n=t.getElementById(e.panelId);if(n)return n.remove(),null;let o=e.variant??"sidebar";re(e.styleId,ie(e.panelId,o)+(e.extraCss??""),t);let a=t.createElement("div");a.id=e.panelId;let u=t.createElement("div");u.className="dcat-header";let p=t.createElement("span");p.className="dcat-title",p.textContent=e.title;let d=t.createElement("button");d.className="dcat-close",d.title="Close",d.textContent="\u2715",d.addEventListener("click",()=>a.remove()),u.append(p,d);let r=t.createElement("div");return r.className="dcat-body",a.append(u,r),t.body.appendChild(a),F(a,u,d),{panel:a,header:u,closeBtn:d,body:r}}var ae="dynamicscat:api-version:",A=new Map;function j(e){return e.replace(/[{}]/g,"").toLowerCase()}function se(){try{if(typeof Xrm<"u"&&Xrm.Utility?.getGlobalContext)return Xrm.Utility.getGlobalContext()}catch(e){console.debug("[DynamicsCat] getGlobalContext failed",e)}return null}function ce(){try{if(typeof Xrm<"u"&&Xrm.Page?.context)return Xrm.Page.context}catch(e){console.debug("[DynamicsCat] get legacy context failed",e)}return null}function Y(){let e=se(),t=ce(),n=e?.getClientUrl?.()??t?.getClientUrl?.()??null;if(!n)return null;let o=e?.userSettings?.userId,a=t?.getUserId?.(),u=o||a?j(String(o??a)):null,p=e?.userSettings?.languageId,d=t?.getUserLcid?.(),r=null;typeof p=="number"&&Number.isInteger(p)?r=p:typeof d=="number"&&Number.isInteger(d)&&(r=d);let b=e?.getVersion?.()??t?.getVersion?.()??null;return{clientUrl:n.replace(/\/$/,""),userId:u,userLanguageId:r,crmVersion:b}}function le(e){let t=new Set,n=e?parseInt(e.split(".")[0]??"",10):Number.NaN,o=e?parseInt(e.split(".")[1]??"",10):Number.NaN;if(Number.isInteger(n)){if(n>=9)return t.add(Number.isInteger(o)?`v${n}.${o}`:"v9.2"),t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),Array.from(t);if(n===8)return t.add(Number.isInteger(o)?`v8.${o}`:"v8.2"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}return t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}function q(e){return`${ae}${e.clientUrl.toLowerCase()}`}function de(e){try{return localStorage.getItem(q(e))}catch{return null}}function ue(e,t){try{localStorage.setItem(q(e),t)}catch{}}function me(e){return e?.headers?{...e,headers:new Headers(e.headers)}:e}async function pe(e){for(let t of le(e.crmVersion)){let n=await fetch(`${e.clientUrl}/api/data/${t}/`,{credentials:"same-origin",headers:{Accept:"application/json"}});if(n.ok)return ue(e,t),t;if(n.status!==404&&n.status!==501)throw new Error(`Web API scan failed (${t}, HTTP ${n.status})`)}throw new Error("No supported Dynamics Web API version found")}function fe(e){let t=de(e);if(t)return Promise.resolve(t);let n=e.clientUrl.toLowerCase(),o=A.get(n);if(o)return o;let a=pe(e).finally(()=>A.delete(n));return A.set(n,a),a}async function U(e,t,n){let o=await fe(e),a=await fetch(`${e.clientUrl}/api/data/${o}/${t(o)}`,me(n));if(!a.ok){let u=await a.text();throw new Error(`Web API failed (${o}, HTTP ${a.status}): ${u.slice(0,160)}`)}return await a.json()}async function K(e){return(await U(e,()=>"EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute")).value}function _(e,t,n){return`${e.clientUrl}/main.aspx?pagetype=entityrecord&etn=${encodeURIComponent(t)}&id=%7B${j(n)}%7D`}function J(e){if(e===null||Number.isNaN(e))return[null];let t=[e,90,365].filter(n=>n>=e);return[...new Set(t),null]}function Q(e,t){if(t===null)return"";let n=new Date(Date.now()-t*864e5).toISOString();return`&$filter=${e}%20ge%20${n}`}function C(e){return e.DisplayName?.UserLocalizedLabel?.Label??e.LogicalName}var l="crm-tools-newest-modified-panel",ge="crm-tools-newest-modified-style",Z="crm-tools-newest-modified-list",P="__dynamicscat_entity_cache",ee="__dynamicscat_last_entity",te="__dynamicscat_last_sort",ne="__dynamicscat_last_within_days",ye=7*24*60*60*1e3,oe=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,be=`
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
`;function xe(e){try{let t=localStorage.getItem(P);if(!t)return null;let n=JSON.parse(t);return n.clientUrl!==e||Date.now()-n.timestamp>=ye?null:n.entities}catch{return null}}function he(e,t){try{let n={clientUrl:e,entities:t,timestamp:Date.now()};localStorage.setItem(P,JSON.stringify(n))}catch{}}async function ve(){let e=Y();if(!e)return;let t=e,n=G({panelId:l,styleId:ge,title:"\u{1F550} Jump to Latest",variant:"dialog",extraCss:be});if(!n)return;let{panel:o,body:a}=n,u=t.clientUrl,p=document.createElement("div");p.className="cnm-row";let d=document.createElement("label");d.className="cnm-label",d.textContent="Entity";let r=document.createElement("input");r.type="text",r.className="cnm-input",r.placeholder="Loading\u2026",r.disabled=!0,r.setAttribute("list",Z),r.setAttribute("autocomplete","off");let b=document.createElement("datalist");b.id=Z,N(r);let c=document.createElement("button");c.className="cnm-refresh-btn",c.textContent="\u{1F504}",c.title="Refresh entity list",p.append(d,r,c,b);let h=document.createElement("div");h.className="cnm-row";let I=document.createElement("label");I.className="cnm-label",I.textContent="Record ID";let x=document.createElement("input");x.type="text",x.className="cnm-input",x.placeholder="Optional GUID\u2026",N(x),x.addEventListener("keydown",s=>{s.key==="Enter"&&M()}),h.append(I,x);let v="modifiedon",S=document.createElement("div");S.className="cnm-row";let T=document.createElement("span");T.className="cnm-label",T.textContent="Sort by";let D=[],R=()=>{D.forEach((s,i)=>{let m=i===0?"modifiedon":"createdon";s.classList.toggle("cnm-sort-active",m===v)})},H=(s,i)=>{let m=document.createElement("button");return m.className="cnm-sort-btn"+(i===v?" cnm-sort-active":""),m.textContent=s,D.push(m),m.addEventListener("click",()=>{m.disabled||(v=i,R())}),m};S.append(T,H("Newest Modified","modifiedon"),H("Newest Created","createdon"));let k=document.createElement("div");k.className="cnm-row cnm-action-row";let g=document.createElement("button");g.className="cnm-open-btn",g.textContent="Open Record",g.disabled=!0;let f=document.createElement("input");f.type="number",f.className="cnm-within-input",f.min="1",f.value="14",f.title="Limit search to last N days (leave empty for all time)",N(f),k.append(f,g),x.addEventListener("input",()=>{let s=oe.test(x.value.trim());D.forEach(i=>{i.disabled=s})}),a.append(p,h,S,k);let L=[];async function z(s=!1){if(!s){let i=xe(u);if(i)return L=i,!0}try{return L=(await K(t)).filter(i=>i.EntitySetName).sort((i,m)=>C(i).localeCompare(C(m))),he(u,L),!0}catch{return!1}}function X(){b.innerHTML="";for(let s of L){let i=document.createElement("option");i.value=C(s),i.label=s.LogicalName,b.appendChild(i)}}if(r.placeholder="Loading\u2026",r.disabled=!0,await z()){X(),r.placeholder="Type entity name\u2026",r.disabled=!1,g.disabled=!1;let s=localStorage.getItem(ee);s&&(r.value=s);let i=localStorage.getItem(te);(i==="modifiedon"||i==="createdon")&&(v=i,R());let m=localStorage.getItem(ne);m!==null&&(f.value=m),r.focus()}else{r.placeholder="Failed to load entities",y("Could not load entity list.","warn");return}c.addEventListener("click",async()=>{c.classList.add("cnm-spinning"),r.disabled=!0,r.placeholder="Refreshing\u2026",localStorage.removeItem(P),await z(!0)?(X(),r.placeholder="Type entity name\u2026",r.disabled=!1):(r.placeholder="Refresh failed",y("Could not refresh entity list.","warn"),r.disabled=!1),c.classList.remove("cnm-spinning")});let M=async()=>{let s=r.value.trim().toLowerCase();if(!s){y("Enter an entity name.","warn");return}let i=L.find(w=>C(w).toLowerCase()===s||w.LogicalName.toLowerCase()===s);if(!i){y(`Entity "${r.value.trim()}" not found.`,"warn");return}localStorage.setItem(ee,r.value.trim()),localStorage.setItem(te,v),localStorage.setItem(ne,f.value);let m=x.value.trim();if(oe.test(m)){let w=m.replace(/^\{|\}$/g,"");window.open(_(t,i.LogicalName,w),"_blank"),o.remove();return}let B=f.value?parseInt(f.value,10):null,O=J(B);g.disabled=!0,g.textContent="Opening\u2026";try{if(!i.PrimaryIdAttribute){y("Could not determine primary id field.","warn");return}let w=async E=>await U(t,()=>`${i.EntitySetName}?$select=${i.PrimaryIdAttribute}&$orderby=${v}%20desc&$top=1${E}`,{headers:{Accept:"application/json","OData-MaxVersion":"4.0","OData-Version":"4.0"}}),$={value:[]};for(let E of O)if($=await w(Q(v,E)),$.value?.length){E!==O[0]&&y(`No records within last ${B} days \u2014 opening newest ${E===null?"overall":`within ${E} days`}.`,"warn");break}if(!$.value?.length){y(`No records found for "${C(i)}".`,"warn");return}let V=($.value[0][i.PrimaryIdAttribute]??"").replace(/^\{|\}$/g,"");if(!V){y("Could not determine record ID.","warn");return}window.open(_(t,i.LogicalName,V),"_blank"),o.remove()}catch{y("Failed to fetch record.","warn")}finally{g.disabled=!1,g.textContent="Open Record"}};g.addEventListener("click",()=>{M()}),r.addEventListener("keydown",s=>{s.key==="Enter"&&M()})}ve();})();
