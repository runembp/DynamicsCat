"use strict";(()=>{function V(e,t,n){requestAnimationFrame(()=>{let o=e.getBoundingClientRect();e.style.left=o.left+"px",e.style.top=o.top+"px",e.style.right="",e.style.transform=""});let r=!1,d=0,u=0,c=o=>{if(!r)return;let f=Math.max(0,Math.min(o.clientX-d,window.innerWidth-e.offsetWidth)),y=Math.max(0,Math.min(o.clientY-u,window.innerHeight-e.offsetHeight));e.style.left=f+"px",e.style.top=y+"px"},a=()=>{r=!1,t.style.cursor="move"};t.addEventListener("mousedown",o=>{n.contains(o.target)||(r=!0,d=o.clientX-e.offsetLeft,u=o.clientY-e.offsetTop,t.style.cursor="grabbing",o.preventDefault())}),document.addEventListener("mousemove",c),document.addEventListener("mouseup",a),new MutationObserver((o,f)=>{document.contains(e)||(document.removeEventListener("mousemove",c),document.removeEventListener("mouseup",a),f.disconnect())}).observe(document.body,{childList:!0,subtree:!0})}var O="crm-tools-toast-container";function b(e,t="info"){let n=document.getElementById(O);n||(n=document.createElement("div"),n.id=O,n.style.cssText=["position: fixed","bottom: 24px","right: 24px","z-index: 2147483647","display: flex","flex-direction: column","gap: 8px","pointer-events: none"].join("; "),document.body.appendChild(n));let r=document.createElement("div");r.style.cssText=["background: "+(t==="warn"?"#e65100":"#323232"),"color: #fff",'font-family: "Google Sans", Roboto, "Segoe UI", Arial, sans-serif',"font-size: 13px","padding: 10px 16px","border-radius: 6px","box-shadow: 0 2px 8px rgba(0,0,0,0.25)","pointer-events: auto","opacity: 1","transition: opacity 0.3s ease"].join("; "),r.textContent=e,n.appendChild(r),setTimeout(()=>{r.style.opacity="0",setTimeout(()=>r.remove(),350)},3500)}function ie(e,t){if(document.getElementById(e))return;let n=document.createElement("style");n.id=e,n.textContent=t,(document.head||document.documentElement).appendChild(n)}function L(e){e.addEventListener("keydown",t=>t.stopPropagation()),e.addEventListener("keyup",t=>t.stopPropagation())}function ae(e,t){return`
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
`}function j(e){let t=document.getElementById(e.panelId);if(t)return t.remove(),null;let n=e.variant??"sidebar";ie(e.styleId,ae(e.panelId,n)+(e.extraCss??""));let r=document.createElement("div");r.id=e.panelId;let d=document.createElement("div");d.className="dcat-header";let u=document.createElement("span");u.className="dcat-title",u.textContent=e.title;let c=document.createElement("button");c.className="dcat-close",c.title="Close",c.textContent="\u2715",c.addEventListener("click",()=>r.remove()),d.append(u,c);let a=document.createElement("div");return a.className="dcat-body",r.append(d,a),document.body.appendChild(r),V(r,d,c),{panel:r,header:d,closeBtn:c,body:a}}var se="dynamicscat:api-version:";function G(e){return e.replace(/[{}]/g,"").toLowerCase()}function ce(){try{if(typeof Xrm<"u"&&Xrm.Utility?.getGlobalContext)return Xrm.Utility.getGlobalContext()}catch(e){console.debug("[DynamicsCat] getGlobalContext failed",e)}return null}function le(){try{if(typeof Xrm<"u"&&Xrm.Page?.context)return Xrm.Page.context}catch(e){console.debug("[DynamicsCat] get legacy context failed",e)}return null}function Y(){let e=ce(),t=le(),n=e?.getClientUrl?.()??t?.getClientUrl?.()??null;if(!n)return null;let r=e?.userSettings?.userId,d=t?.getUserId?.(),u=r||d?G(String(r??d)):null,c=e?.userSettings?.languageId,a=t?.getUserLcid?.(),o=null;typeof c=="number"&&Number.isInteger(c)?o=c:typeof a=="number"&&Number.isInteger(a)&&(o=a);let f=e?.getVersion?.()??t?.getVersion?.()??null;return{clientUrl:n.replace(/\/$/,""),userId:u,userLanguageId:o,crmVersion:f}}function F(e){let t=new Set,n=e?parseInt(e.split(".")[0]??"",10):Number.NaN,r=e?parseInt(e.split(".")[1]??"",10):Number.NaN;if(Number.isInteger(n)){if(n>=9)return t.add(Number.isInteger(r)?`v${n}.${r}`:"v9.2"),t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),Array.from(t);if(n===8)return t.add(Number.isInteger(r)?`v8.${r}`:"v8.2"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}return t.add("v9.2"),t.add("v9.1"),t.add("v9.0"),t.add("v8.2"),t.add("v8.1"),t.add("v8.0"),Array.from(t)}function q(e){return`${se}${e.clientUrl.toLowerCase()}`}function de(e){try{return localStorage.getItem(q(e))}catch{return null}}function ue(e,t){try{localStorage.setItem(q(e),t)}catch{}}function me(e){let t=de(e);return t?[t,...F(e.crmVersion).filter(n=>n!==t)]:F(e.crmVersion)}function pe(e){return e?.headers?{...e,headers:new Headers(e.headers)}:e}async function M(e,t,n){let r=[];for(let u of me(e)){let c=`${e.clientUrl}/api/data/${u}/${t(u)}`,a=await fetch(c,pe(n));if(a.ok)return ue(e,u),{json:await a.json(),version:u};if(r.push({version:u,status:a.status,body:await a.text()}),a.status!==404&&a.status!==501)break}let d=r[r.length-1];throw new Error(d?`Web API failed (${d.version}, HTTP ${d.status}): ${d.body.slice(0,160)}`:"Web API failed before receiving a response")}async function K(e){return(await M(e,()=>"EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute")).json.value}function _(e,t,n){return`${e.clientUrl}/main.aspx?pagetype=entityrecord&etn=${encodeURIComponent(t)}&id=%7B${G(n)}%7D`}function J(e){if(e===null||Number.isNaN(e))return[null];let t=[e,90,365].filter(n=>n>=e);return[...new Set(t),null]}function Q(e,t){if(t===null)return"";let n=new Date(Date.now()-t*864e5).toISOString();return`&$filter=${e}%20ge%20${n}`}function w(e){return e.DisplayName?.UserLocalizedLabel?.Label??e.LogicalName}var l="crm-tools-newest-modified-panel",fe="crm-tools-newest-modified-style",Z="crm-tools-newest-modified-list",U="__dynamicscat_entity_cache",ee="__dynamicscat_last_entity",te="__dynamicscat_last_sort",ne="__dynamicscat_last_within_days",ge=7*24*60*60*1e3,oe=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,be=`
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
`;function ye(e){try{let t=localStorage.getItem(U);if(!t)return null;let n=JSON.parse(t);return n.clientUrl!==e||Date.now()-n.timestamp>=ge?null:n.entities}catch{return null}}function xe(e,t){try{let n={clientUrl:e,entities:t,timestamp:Date.now()};localStorage.setItem(U,JSON.stringify(n))}catch{}}async function he(){let e=Y();if(!e)return;let t=e,n=j({panelId:l,styleId:fe,title:"\u{1F550} Jump to Latest",variant:"dialog",extraCss:be});if(!n)return;let{panel:r,body:d}=n,u=t.clientUrl,c=document.createElement("div");c.className="cnm-row";let a=document.createElement("label");a.className="cnm-label",a.textContent="Entity";let o=document.createElement("input");o.type="text",o.className="cnm-input",o.placeholder="Loading\u2026",o.disabled=!0,o.setAttribute("list",Z),o.setAttribute("autocomplete","off");let f=document.createElement("datalist");f.id=Z,L(o);let y=document.createElement("button");y.className="cnm-refresh-btn",y.textContent="\u{1F504}",y.title="Refresh entity list",c.append(a,o,y,f);let $=document.createElement("div");$.className="cnm-row";let N=document.createElement("label");N.className="cnm-label",N.textContent="Record ID";let x=document.createElement("input");x.type="text",x.className="cnm-input",x.placeholder="Optional GUID\u2026",L(x),x.addEventListener("keydown",s=>{s.key==="Enter"&&A()}),$.append(N,x);let h="modifiedon",S=document.createElement("div");S.className="cnm-row";let T=document.createElement("span");T.className="cnm-label",T.textContent="Sort by";let k=[],R=()=>{k.forEach((s,i)=>{let m=i===0?"modifiedon":"createdon";s.classList.toggle("cnm-sort-active",m===h)})},P=(s,i)=>{let m=document.createElement("button");return m.className="cnm-sort-btn"+(i===h?" cnm-sort-active":""),m.textContent=s,k.push(m),m.addEventListener("click",()=>{m.disabled||(h=i,R())}),m};S.append(T,P("Newest Modified","modifiedon"),P("Newest Created","createdon"));let D=document.createElement("div");D.className="cnm-row cnm-action-row";let g=document.createElement("button");g.className="cnm-open-btn",g.textContent="Open Record",g.disabled=!0;let p=document.createElement("input");p.type="number",p.className="cnm-within-input",p.min="1",p.value="14",p.title="Limit search to last N days (leave empty for all time)",L(p),D.append(p,g),x.addEventListener("input",()=>{let s=oe.test(x.value.trim());k.forEach(i=>{i.disabled=s})}),d.append(c,$,S,D);let C=[];async function H(s=!1){if(!s){let i=ye(u);if(i)return C=i,!0}try{return C=(await K(t)).filter(i=>i.EntitySetName).sort((i,m)=>w(i).localeCompare(w(m))),xe(u,C),!0}catch{return!1}}function z(){f.innerHTML="";for(let s of C){let i=document.createElement("option");i.value=w(s),i.label=s.LogicalName,f.appendChild(i)}}if(o.placeholder="Loading\u2026",o.disabled=!0,await H()){z(),o.placeholder="Type entity name\u2026",o.disabled=!1,g.disabled=!1;let s=localStorage.getItem(ee);s&&(o.value=s);let i=localStorage.getItem(te);(i==="modifiedon"||i==="createdon")&&(h=i,R());let m=localStorage.getItem(ne);m!==null&&(p.value=m),o.focus()}else{o.placeholder="Failed to load entities",b("Could not load entity list.","warn");return}y.addEventListener("click",async()=>{y.classList.add("cnm-spinning"),o.disabled=!0,o.placeholder="Refreshing\u2026",localStorage.removeItem(U),await H(!0)?(z(),o.placeholder="Type entity name\u2026",o.disabled=!1):(o.placeholder="Refresh failed",b("Could not refresh entity list.","warn"),o.disabled=!1),y.classList.remove("cnm-spinning")});let A=async()=>{let s=o.value.trim().toLowerCase();if(!s){b("Enter an entity name.","warn");return}let i=C.find(v=>w(v).toLowerCase()===s||v.LogicalName.toLowerCase()===s);if(!i){b(`Entity "${o.value.trim()}" not found.`,"warn");return}localStorage.setItem(ee,o.value.trim()),localStorage.setItem(te,h),localStorage.setItem(ne,p.value);let m=x.value.trim();if(oe.test(m)){let v=m.replace(/^\{|\}$/g,"");window.open(_(t,i.LogicalName,v),"_blank"),r.remove();return}let X=p.value?parseInt(p.value,10):null,W=J(X);g.disabled=!0,g.textContent="Opening\u2026";try{if(!i.PrimaryIdAttribute){b("Could not determine primary id field.","warn");return}let v=async E=>{let{json:re}=await M(t,()=>`${i.EntitySetName}?$select=${i.PrimaryIdAttribute}&$orderby=${h}%20desc&$top=1${E}`,{headers:{Accept:"application/json","OData-MaxVersion":"4.0","OData-Version":"4.0"}});return re},I={value:[]};for(let E of W)if(I=await v(Q(h,E)),I.value?.length){E!==W[0]&&b(`No records within last ${X} days \u2014 opening newest ${E===null?"overall":`within ${E} days`}.`,"warn");break}if(!I.value?.length){b(`No records found for "${w(i)}".`,"warn");return}let B=(I.value[0][i.PrimaryIdAttribute]??"").replace(/^\{|\}$/g,"");if(!B){b("Could not determine record ID.","warn");return}window.open(_(t,i.LogicalName,B),"_blank"),r.remove()}catch{b("Failed to fetch record.","warn")}finally{g.disabled=!1,g.textContent="Open Record"}};g.addEventListener("click",()=>{A()}),o.addEventListener("keydown",s=>{s.key==="Enter"&&A()})}he();})();
