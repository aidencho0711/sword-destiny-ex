/* ═════════ 거래 (플레이어 간 검·보석 교환) ═════════
   실용형: 수락 시 서버 함수(trade_accept)가 양쪽 저장을 원자적으로 검증·스왑한다. */
const ROMAN2=["","I","II","III","IV","V"];
let trOffer={gems:0,swords:[]}, trReq={gems:0,swords:[]}, trToName="", trChan=null;
const varLabel=(n,e)=>n+(e>0?" ✦"+(ROMAN2[e]||e):"");
function addItem(arr,n,e,c){ const x=arr.find(v=>v.n===n&&v.e===e); if(x)x.c+=c; else arr.push({n,e,c}); }
function myVariants(){ const out=[]; SWORDS.forEach(s=>armVariants(s.n).forEach(v=>out.push({n:s.n,e:v.e,c:v.c}))); return out; }

async function openTrade(){
 if(!(S.cloud&&typeof cloudReady==="function"&&cloudReady())){toast("클라우드 계정으로 로그인하면 거래할 수 있습니다");return;}
 trOffer={gems:0,swords:[]}; trReq={gems:0,swords:[]};
 $("trade").classList.add("on");
 await pullCloud();                 // 최신 인벤토리 반영
 renderTrade(); loadTrades(); trSubscribe();
}
function renderTrade(){
 const el=$("trade"), mv=myVariants();
 el.innerHTML=`
  <div class="trade-head"><h2>거 래</h2><span class="sum">💎 ${fmt(S.gems||0)}</span>
    <button id="tr-refresh">새로고침</button><button id="trade-close">닫기</button></div>
  <div id="tr-incoming"></div><div id="tr-outgoing"></div>
  <div class="sec">새 제안</div>
  <div class="card">
   <label>상대 계정 이름</label>
   <div class="dv-row"><input id="tr-to" type="text" maxlength="20" placeholder="상대 이름" value="${(trToName||"").replace(/"/g,"&quot;")}"></div>
   <div class="sec2">내가 줄 것</div>
   <div class="dv-row"><input id="tr-og" type="text" inputmode="numeric" placeholder="보석" value="${trOffer.gems||""}"></div>
   <div class="dv-row" style="margin-top:6px">
     <select id="tr-osel">${mv.map((v,i)=>`<option value="${i}">${varLabel(v.n,v.e)} (보유 ${v.c})</option>`).join("")||`<option value="-1">보유 검 없음</option>`}</select>
     <input id="tr-oc" type="text" inputmode="numeric" value="1" style="flex:0 0 54px">
     <button data-tr="oadd">추가</button></div>
   <div class="tr-list" id="tr-olist"></div>
   <div class="sec2">받을 것</div>
   <div class="dv-row"><input id="tr-rg" type="text" inputmode="numeric" placeholder="보석" value="${trReq.gems||""}"></div>
   <div class="dv-row" style="margin-top:6px">
     <select id="tr-rsel">${SWORDS.map((s,i)=>`<option value="${i}">[${RARITY[s.t].n}] ${s.n}</option>`).join("")}</select>
     <select id="tr-re" style="flex:0 0 74px">${[0,1,2,3,4,5].map(e=>`<option value="${e}">${e?"✦"+ROMAN2[e]:"기본"}</option>`).join("")}</select>
     <input id="tr-rc" type="text" inputmode="numeric" value="1" style="flex:0 0 54px">
     <button data-tr="radd">추가</button></div>
   <div class="tr-list" id="tr-rlist"></div>
   <div class="btn-row" style="margin-top:12px"><button class="buy" data-tr="send">제안 보내기</button></div>
  </div>
  <div class="dv-note">수락 시 서버가 양쪽 보유를 확인해 원자적으로 교환합니다. 상대가 항목을 갖고 있지 않으면 거래가 실패합니다.</div>`;
 $("trade-close").onclick=()=>$("trade").classList.remove("on");
 $("tr-refresh").onclick=async()=>{await pullCloud();renderTrade();loadTrades();};
 renderItemLists();
}
function renderItemLists(){
 const ol=$("tr-olist"), rl=$("tr-rlist");
 if(ol)ol.innerHTML=trOffer.swords.map((v,i)=>`<span class="tr-item">${varLabel(v.n,v.e)} ×${v.c}<button data-tr="odel:${i}">✕</button></span>`).join("")||`<span class="tr-empty">없음</span>`;
 if(rl)rl.innerHTML=trReq.swords.map((v,i)=>`<span class="tr-item">${varLabel(v.n,v.e)} ×${v.c}<button data-tr="rdel:${i}">✕</button></span>`).join("")||`<span class="tr-empty">없음</span>`;
}
function itemsText(side){ const p=[]; if(side&&side.gems>0)p.push("💎"+side.gems);
 ((side&&side.swords)||[]).forEach(v=>p.push(varLabel(v.n,v.e)+"×"+v.c)); return p.join(", ")||"없음"; }
function tradeCard(r,incoming){
 return `<div class="card tr-card">
   <div class="tr-who">${incoming?(r.from_name||"?")+" 님의 제안":"→ "+(r.to_name||"?")+" 에게"}</div>
   <div class="tr-line"><b>${incoming?"받는 것":"주는 것"}</b>${itemsText(r.offer)}</div>
   <div class="tr-line"><b>${incoming?"주는 것":"받는 것"}</b>${itemsText(r.request)}</div>
   <div class="btn-row">${incoming
     ?`<button class="buy" data-tr="accept:${r.id}">수락</button><button class="buy use" data-tr="decline:${r.id}">거절</button>`
     :`<button class="buy use" data-tr="cancel:${r.id}">취소</button>`}</div></div>`;
}
async function loadTrades(){
 const inc=$("tr-incoming"), outg=$("tr-outgoing"); if(!inc)return;
 const {data,error}=await tradeList();
 if(error){inc.innerHTML=`<div class="sec">받은 제안</div><div class="card tr-empty">불러오기 오류: ${error.message||error}</div>`;if(outg)outg.innerHTML="";return;}
 const rows=data||[], income=rows.filter(r=>r.to_uid===S.uid), out=rows.filter(r=>r.from_uid===S.uid);
 inc.innerHTML=`<div class="sec">받은 제안 (${income.length})</div>`+(income.map(r=>tradeCard(r,true)).join("")||`<div class="card tr-empty">없음</div>`);
 if(outg)outg.innerHTML=`<div class="sec">보낸 제안 (${out.length})</div>`+(out.map(r=>tradeCard(r,false)).join("")||`<div class="card tr-empty">없음</div>`);
}
async function sendTrade(){
 const name=($("tr-to").value||"").trim(); trToName=name;
 trOffer.gems=Math.max(0,parseInt($("tr-og").value)||0);
 trReq.gems=Math.max(0,parseInt($("tr-rg").value)||0);
 if(!name){toast("상대 이름을 입력하세요");return;}
 if(!trOffer.gems&&!trOffer.swords.length&&!trReq.gems&&!trReq.swords.length){toast("교환할 항목을 넣으세요");return;}
 for(const v of trOffer.swords){ if(variantCount(v.n,v.e)<v.c){toast("보유 부족: "+varLabel(v.n,v.e));return;} }
 if((S.gems||0)<trOffer.gems){toast("보석이 부족합니다");return;}
 const r=await findUser(name); if(r.error){toast("오류: "+r.error);return;}
 if(!r.uid){toast("그런 이름의 계정이 없습니다");return;}
 if(r.uid===S.uid){toast("자기 자신과는 거래할 수 없습니다");return;}
 const {error}=await tradeCreate({from_uid:S.uid,to_uid:r.uid,from_name:S.acctName||"",to_name:name,offer:trOffer,request:trReq});
 if(error){toast("제안 실패: "+(error.message||error));return;}
 toast("거래 제안을 보냈습니다");
 trOffer={gems:0,swords:[]}; trReq={gems:0,swords:[]};
 renderTrade(); loadTrades();
}
/* 서버에서 내 저장 다시 당겨오기 (거래 후 인벤토리 반영) */
async function pullCloud(){
 if(!(S.cloud&&S.uid&&typeof cloudReady==="function"&&cloudReady()))return;
 const srv=await cloudGetSave(S.uid);
 if(srv&&srv.data){ const uid=S.uid,acct=S.acct,role=S.role,nm=(srv.name||S.acctName);
   Object.assign(S,srv.data); S.uid=uid;S.acct=acct;S.role=role;S.acctName=nm;S.cloud=true;
   renderHUD(); if($("v-armory")&&$("v-armory").classList.contains("on"))renderArmory(); }
}
function trSubscribe(){
 if(!SB||trChan)return;
 try{ trChan=SB.channel("trades-"+S.uid)
   .on("postgres_changes",{event:"*",schema:"public",table:"trades",filter:"to_uid=eq."+S.uid},()=>{ if($("trade").classList.contains("on"))loadTrades(); })
   .on("postgres_changes",{event:"*",schema:"public",table:"trades",filter:"from_uid=eq."+S.uid},()=>{ if($("trade").classList.contains("on")){loadTrades();pullCloud();} })
   .subscribe(); }catch(e){}
}
$("trade").addEventListener("click",async e=>{
 const t=e.target.closest("button"); if(!t||!t.dataset.tr)return;
 const i=t.dataset.tr.indexOf(":"), op=i<0?t.dataset.tr:t.dataset.tr.slice(0,i), arg=i<0?"":t.dataset.tr.slice(i+1);
 if(op==="oadd"){ const mv=myVariants(), k=+$("tr-osel").value; if(k<0)return; const v=mv[k]; const c=Math.max(1,parseInt($("tr-oc").value)||1);
   if(!v)return; addItem(trOffer.swords,v.n,v.e,c); renderItemLists(); return; }
 if(op==="radd"){ const s=SWORDS[+$("tr-rsel").value], e=+$("tr-re").value, c=Math.max(1,parseInt($("tr-rc").value)||1);
   if(!s)return; addItem(trReq.swords,s.n,e,c); renderItemLists(); return; }
 if(op==="odel"){ trOffer.swords.splice(+arg,1); renderItemLists(); return; }
 if(op==="rdel"){ trReq.swords.splice(+arg,1); renderItemLists(); return; }
 if(op==="send"){ await sendTrade(); return; }
 if(op==="accept"){ t.disabled=true; const {error}=await tradeAccept(arg);
   if(error){toast("수락 실패: "+(error.message||error));}else{toast("거래 완료!");await pullCloud();} await loadTrades(); return; }
 if(op==="decline"||op==="cancel"){ t.disabled=true; const {error}=await tradeCancel(arg);
   toast(error?("오류: "+(error.message||error)):(op==="cancel"?"제안 취소됨":"제안 거절됨")); await loadTrades(); return; }
});
