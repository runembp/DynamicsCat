"use strict";(()=>{function G(e,t,n){requestAnimationFrame(()=>{let o=e.getBoundingClientRect();e.style.left=o.left+"px",e.style.top=o.top+"px",e.style.right="",e.style.transform=""});let r=!1,a=0,m=0,l=o=>{if(!r)return;let f=Math.max(0,Math.min(o.clientX-a,window.innerWidth-e.offsetWidth)),b=Math.max(0,Math.min(o.clientY-m,window.innerHeight-e.offsetHeight));e.style.left=f+"px",e.style.top=b+"px"},u=()=>{r=!1,t.style.cursor="move"};t.addEventListener("mousedown",o=>{n.contains(o.target)||(r=!0,a=o.clientX-e.offsetLeft,m=o.clientY-e.offsetTop,t.style.cursor="grabbing",o.preventDefault())}),document.addEventListener("mousemove",l),document.addEventListener("mouseup",u),new MutationObserver((o,f)=>{document.contains(e)||(document.removeEventListener("mousemove",l),document.removeEventListener("mouseup",u),f.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}var F="crm-tools-toast-container";function y(e,t="info"){let n=document.getElementById(F);n||(n=document.createElement("div"),n.id=F,n.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(n));let r=document.createElement("div");r.style.cssText=["background: "+(t==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),r.textContent=e,n.appendChild(r),setTimeout(()=>{r.style.opacity="0",setTimeout(()=>r.remove(),350)},3500)}function re(e,t){if(document.getElementById(e))return;let n=document.createElement("style");n.id=e,n.textContent=t,(document.head||document.documentElement).appendChild(n)}function L(e){e.addEventListener("keydown",t=>t.stopPropagation()),e.addEventListener("keyup",t=>t.stopPropagation())}function ie(e,t){return`
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
`}function W(e){let t=document.getElementById(e.panelId);if(t)return t.remove(),null;let n=e.variant??"sidebar";re(e.styleId,ie(e.panelId,n)+(e.extraCss??""));let r=document.createElement("div");r.id=e.panelId;let a=document.createElement("div");a.className="dcat-header";let m=document.createElement("span");m.className="dcat-title",m.textContent=e.title;let l=document.createElement("button");l.className="dcat-close",l.title="Close",l.textContent="\u2715",l.addEventListener("click",()=>r.remove()),a.append(m,l);let u=document.createElement("div");return u.className="dcat-body",r.append(a,u),document.body.appendChild(r),G(r,a,l),{panel:r,header:a,closeBtn:l,body:u}}var ae="dynamicscat:api-version:",A=new Map;function j(e){return e.replace(/[{}]/g,"").toLowerCase()}function se(){try{if(typeof Xrm<"u"&&Xrm.Utility?.getGlobalContext)return Xrm.Utility.getGlobalContext()}catch(e){console.debug("[DynamicsCat] getGlobalContext failed",e)}return null}function ce(){try{if(typeof Xrm<"u"&&Xrm.Page?.context)return Xrm.Page.context}catch(e){console.debug("[DynamicsCat] get legacy context failed",e)}return null}function Y(){let e=se(),t=ce(),n=e?.getClientUrl?.()??t?.getClientUrl?.()??null;if(!n)return null;let r=e?.userSettings?.userId,a=t?.getUserId?.(),m=r||a?j(String(r??a)):null,l=e?.userSettings?.languageId,u=t?.getUserLcid?.(),o=null;typeof l=="number"&&Number.isInteger(l)?o=l:typeof u=="number"&&Number.isInteger(u)&&(o=u);let f=e?.getVersion?.()??t?.getVersion?.()??null;return{clientUrl:n.replace(/\/$/,""),userId:m,userLanguageId:o,crmVersion:f}}function le(e){let t=new Set,n=e?parseInt(e.split(".")[0]??"",10):Number.NaN,r=e?parseInt(e.split(".")[1]??"",10):Number.NaN;if(Number.isInteger(n)){if(n>=9)return t.add(Number.isInteger(r)?`v${n}.${r}`:"v9.2"),t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),Array.from(t);if(n===8)return t.add(Number.isInteger(r)?`v8.${r}`:"v8.2"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}return t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}function q(e){return`${ae}${e.clientUrl.toLowerCase()}`}function de(e){try{return localStorage.getItem(q(e))}catch{return null}}function ue(e,t){try{localStorage.setItem(q(e),t)}catch{}}function me(e){return e?.headers?{...e,headers:new Headers(e.headers)}:e}async function pe(e){for(let t of le(e.crmVersion)){let n=await fetch(`${e.clientUrl}/api/data/${t}/`,{credentials:"same-origin",headers:{Accept:"application/json"}});if(n.ok)return ue(e,t),t;if(n.status!==404&&n.status!==501)throw new Error(`Web API scan failed (${t}, HTTP ${n.status})`)}throw new Error("No supported Dynamics Web API version found")}function fe(e){let t=de(e);if(t)return Promise.resolve(t);let n=e.clientUrl.toLowerCase(),r=A.get(n);if(r)return r;let a=pe(e).finally(()=>A.delete(n));return A.set(n,a),a}async function U(e,t,n){let r=await fe(e),a=await fetch(`${e.clientUrl}/api/data/${r}/${t(r)}`,me(n));if(!a.ok){let m=await a.text();throw new Error(`Web API failed (${r}, HTTP ${a.status}): ${m.slice(0,160)}`)}return await a.json()}async function K(e){return(await U(e,()=>"EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute")).value}function _(e,t,n){return`${e.clientUrl}/main.aspx?pagetype=entityrecord&etn=${encodeURIComponent(t)}&id=%7B${j(n)}%7D`}function J(e){if(e===null||Number.isNaN(e))return[null];let t=[e,90,365].filter(n=>n>=e);return[...new Set(t),null]}function Q(e,t){if(t===null)return"";let n=new Date(Date.now()-t*864e5).toISOString();return`&$filter=${e}%20ge%20${n}`}function E(e){return e.DisplayName?.UserLocalizedLabel?.Label??e.LogicalName}var c="crm-tools-newest-modified-panel",ge="crm-tools-newest-modified-style",Z="crm-tools-newest-modified-list",P="__dynamicscat_entity_cache",ee="__dynamicscat_last_entity",te="__dynamicscat_last_sort",ne="__dynamicscat_last_within_days",ye=7*24*60*60*1e3,oe=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,be=`
#${c} .cnm-row { display: flex; align-items: center; gap: 8px; }
#${c} .cnm-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: #80868b; min-width: 54px; flex-shrink: 0;
}
#${c} .cnm-input {
  flex: 1; min-width: 0; padding: 6px 10px;
  border: 1px solid #c5d8fb; border-radius: 4px;
  font-size: 13px; font-family: inherit; color: #222; outline: none;
}
#${c} .cnm-input:focus { border-color: #1e64c8; }
#${c} .cnm-input:disabled { background: #f5f5f5; color: #aaa; }
#${c} .cnm-refresh-btn {
  background: none; border: 1px solid #c5d8fb; border-radius: 4px;
  cursor: pointer; font-size: 14px; padding: 4px 6px; line-height: 1;
  transition: background 0.15s;
}
#${c} .cnm-refresh-btn:hover { background: #e8f0fe; }
#${c} .cnm-refresh-btn.cnm-spinning { animation: cnm-spin 0.8s linear infinite; }
@keyframes cnm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
#${c} .cnm-sort-btn {
  flex: 1; padding: 4px 10px; border: 1px solid #c5d8fb; border-radius: 4px;
  background: #fff; font-size: 12px; font-family: inherit; color: #555; cursor: pointer;
  white-space: nowrap; text-align: center;
}
#${c} .cnm-sort-btn:hover:not(:disabled) { background: #e8f0fe; }
#${c} .cnm-sort-btn.cnm-sort-active { background: #1e64c8; color: #fff; border-color: #1e64c8; }
#${c} .cnm-sort-btn:disabled { opacity: 0.4; cursor: default; }
#${c} .cnm-action-row { justify-content: space-between; align-items: center; padding-top: 4px; }
#${c} .cnm-within-input {
  width: 44px; padding: 3px 5px; border: 1px solid #e0e0e0; border-radius: 4px;
  font-size: 11px; font-family: inherit; color: #aaa; text-align: center;
  background: #fafafa; outline: none;
}
#${c} .cnm-within-input:focus { border-color: #c5d8fb; color: #555; }
#${c} .cnm-open-btn {
  flex: 1; padding: 7px 20px; background: #1e64c8; color: #fff; border: none;
  border-radius: 4px; font-size: 13px; font-family: inherit; font-weight: 600;
  cursor: pointer; transition: background 0.15s; white-space: nowrap;
}
#${c} .cnm-open-btn:hover:not(:disabled) { background: #1557b0; }
#${c} .cnm-open-btn:disabled { opacity: 0.5; cursor: default; }
`;function xe(e){try{let t=localStorage.getItem(P);if(!t)return null;let n=JSON.parse(t);return n.clientUrl!==e||Date.now()-n.timestamp>=ye?null:n.entities}catch{return null}}function he(e,t){try{let n={clientUrl:e,entities:t,timestamp:Date.now()};localStorage.setItem(P,JSON.stringify(n))}catch{}}async function ve(){let e=Y();if(!e)return;let t=e,n=W({panelId:c,styleId:ge,title:"\u{1F550} Jump to Latest",variant:"dialog",extraCss:be});if(!n)return;let{panel:r,body:a}=n,m=t.clientUrl,l=document.createElement("div");l.className="cnm-row";let u=document.createElement("label");u.className="cnm-label",u.textContent="Entity";let o=document.createElement("input");o.type="text",o.className="cnm-input",o.placeholder="Loading\u2026",o.disabled=!0,o.setAttribute("list",Z),o.setAttribute("autocomplete","off");let f=document.createElement("datalist");f.id=Z,L(o);let b=document.createElement("button");b.className="cnm-refresh-btn",b.textContent="\u{1F504}",b.title="Refresh entity list",l.append(u,o,b,f);let $=document.createElement("div");$.className="cnm-row";let N=document.createElement("label");N.className="cnm-label",N.textContent="Record ID";let x=document.createElement("input");x.type="text",x.className="cnm-input",x.placeholder="Optional GUID\u2026",L(x),x.addEventListener("keydown",s=>{s.key==="Enter"&&M()}),$.append(N,x);let h="modifiedon",S=document.createElement("div");S.className="cnm-row";let T=document.createElement("span");T.className="cnm-label",T.textContent="Sort by";let k=[],R=()=>{k.forEach((s,i)=>{let d=i===0?"modifiedon":"createdon";s.classList.toggle("cnm-sort-active",d===h)})},H=(s,i)=>{let d=document.createElement("button");return d.className="cnm-sort-btn"+(i===h?" cnm-sort-active":""),d.textContent=s,k.push(d),d.addEventListener("click",()=>{d.disabled||(h=i,R())}),d};S.append(T,H("Newest Modified","modifiedon"),H("Newest Created","createdon"));let D=document.createElement("div");D.className="cnm-row cnm-action-row";let g=document.createElement("button");g.className="cnm-open-btn",g.textContent="Open Record",g.disabled=!0;let p=document.createElement("input");p.type="number",p.className="cnm-within-input",p.min="1",p.value="14",p.title="Limit search to last N days (leave empty for all time)",L(p),D.append(p,g),x.addEventListener("input",()=>{let s=oe.test(x.value.trim());k.forEach(i=>{i.disabled=s})}),a.append(l,$,S,D);let C=[];async function z(s=!1){if(!s){let i=xe(m);if(i)return C=i,!0}try{return C=(await K(t)).filter(i=>i.EntitySetName).sort((i,d)=>E(i).localeCompare(E(d))),he(m,C),!0}catch{return!1}}function X(){f.innerHTML="";for(let s of C){let i=document.createElement("option");i.value=E(s),i.label=s.LogicalName,f.appendChild(i)}}if(o.placeholder="Loading\u2026",o.disabled=!0,await z()){X(),o.placeholder="Type entity name\u2026",o.disabled=!1,g.disabled=!1;let s=localStorage.getItem(ee);s&&(o.value=s);let i=localStorage.getItem(te);(i==="modifiedon"||i==="createdon")&&(h=i,R());let d=localStorage.getItem(ne);d!==null&&(p.value=d),o.focus()}else{o.placeholder="Failed to load entities",y("Could not load entity list.","warn");return}b.addEventListener("click",async()=>{b.classList.add("cnm-spinning"),o.disabled=!0,o.placeholder="Refreshing\u2026",localStorage.removeItem(P),await z(!0)?(X(),o.placeholder="Type entity name\u2026",o.disabled=!1):(o.placeholder="Refresh failed",y("Could not refresh entity list.","warn"),o.disabled=!1),b.classList.remove("cnm-spinning")});let M=async()=>{let s=o.value.trim().toLowerCase();if(!s){y("Enter an entity name.","warn");return}let i=C.find(v=>E(v).toLowerCase()===s||v.LogicalName.toLowerCase()===s);if(!i){y(`Entity "${o.value.trim()}" not found.`,"warn");return}localStorage.setItem(ee,o.value.trim()),localStorage.setItem(te,h),localStorage.setItem(ne,p.value);let d=x.value.trim();if(oe.test(d)){let v=d.replace(/^\{|\}$/g,"");window.open(_(t,i.LogicalName,v),"_blank"),r.remove();return}let B=p.value?parseInt(p.value,10):null,O=J(B);g.disabled=!0,g.textContent="Opening\u2026";try{if(!i.PrimaryIdAttribute){y("Could not determine primary id field.","warn");return}let v=async w=>await U(t,()=>`${i.EntitySetName}?$select=${i.PrimaryIdAttribute}&$orderby=${h}%20desc&$top=1${w}`,{headers:{Accept:"application/json","OData-MaxVersion":"4.0","OData-Version":"4.0"}}),I={value:[]};for(let w of O)if(I=await v(Q(h,w)),I.value?.length){w!==O[0]&&y(`No records within last ${B} days \u2014 opening newest ${w===null?"overall":`within ${w} days`}.`,"warn");break}if(!I.value?.length){y(`No records found for "${E(i)}".`,"warn");return}let V=(I.value[0][i.PrimaryIdAttribute]??"").replace(/^\{|\}$/g,"");if(!V){y("Could not determine record ID.","warn");return}window.open(_(t,i.LogicalName,V),"_blank"),r.remove()}catch{y("Failed to fetch record.","warn")}finally{g.disabled=!1,g.textContent="Open Record"}};g.addEventListener("click",()=>{M()}),o.addEventListener("keydown",s=>{s.key==="Enter"&&M()})}ve();})();
