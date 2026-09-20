/* ═════════ 모바일 웹 실행 환경 ═════════ */
/* iOS는 오디오 컨텍스트가 정지 상태로 생성되므로 첫 조작에서 깨운다 */
(function(){
 const wake=()=>{const c=ac&&AC;if(AC&&AC.state==="suspended")AC.resume().catch(()=>{});};
 ["pointerdown","touchstart","keydown"].forEach(e=>
   document.addEventListener(e,wake,{passive:true}));
})();

/* 자동 주조 중에는 화면이 꺼지지 않게 한다 */
let wakeLock=null;
async function keepAwake(on){
 try{
  if(on&&!wakeLock&&"wakeLock" in navigator){
   wakeLock=await navigator.wakeLock.request("screen");
   wakeLock.addEventListener("release",()=>{wakeLock=null;});
  }else if(!on&&wakeLock){await wakeLock.release();wakeLock=null;}
 }catch(e){}}
document.addEventListener("visibilitychange",()=>{
 if(document.visibilityState==="visible"&&S.auto&&S.up.auto)keepAwake(true);});

/* 더블탭 확대 차단 (iOS Safari) */
let lastTouch=0;
document.addEventListener("touchend",e=>{
 const t=Date.now();
 if(t-lastTouch<320)e.preventDefault();
 lastTouch=t;},{passive:false});

/* 서비스 워커 — 한 번 열면 오프라인에서도 동작 */
if("serviceWorker" in navigator&&location.protocol.startsWith("http")){
 window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));}

let lgMode="login";
function renderLogin(inheritable){
 const el=$("login");
 el.innerHTML=`
  <div class="lg-crest"><b>SWORD DESTINY</b><i>- ex</i></div>
  <div class="lg-box">
   <div class="lg-tab">
     <button data-lm="login" class="${lgMode==="login"?"on":""}">로그인</button>
     <button data-lm="signup" class="${lgMode==="signup"?"on":""}">새 계정</button>
   </div>
   ${lgMode==="signup"&&inheritable?`<div class="lg-inherit">지금 이 기기의 진행 상황(주화·검·도감)이 이 계정에 그대로 옮겨집니다.</div>`:""}
   <label>이름</label><input id="lg-name" autocomplete="off" maxlength="20" placeholder="계정 이름">
   <label>비밀번호</label><input id="lg-pw" type="password" autocomplete="off" placeholder="비밀번호">
   ${lgMode==="signup"?`<label>비밀번호 확인</label><input id="lg-pw2" type="password" autocomplete="off" placeholder="비밀번호 다시 입력">`:""}
   <button class="lg-go" id="lg-go">${lgMode==="login"?"들어가기":"계정 만들기"}</button>
   <div class="lg-msg" id="lg-msg"></div>
   <div class="lg-guest"><button id="lg-guest">계정 없이 이 기기에서 계속하기</button></div>
  </div>
  <div class="lg-note">${CLOUD_ON
    ? "클라우드 계정입니다. 로그인하면 다른 기기에서도 같은 진행이 이어집니다. 비밀번호는 서버에 안전하게 저장됩니다. ‘계정 없이 계속하기’는 이 기기에만 저장됩니다."
    : "이 로그인은 이 기기 안에서만 진행을 나눕니다. 서버가 없어 다른 기기로는 옮겨지지 않으며, 비밀번호는 이 기기에 저장되니 중요한 비밀번호는 쓰지 마세요."}</div>`;
 el.querySelectorAll("[data-lm]").forEach(b=>b.onclick=()=>{lgMode=b.dataset.lm;renderLogin(inheritable);});
 $("lg-go").onclick=doAuth;
 $("lg-guest").onclick=async()=>{ await enterGame("__local__"); };
 [$("lg-name"),$("lg-pw"),$("lg-pw2")].forEach(i=>{if(i)i.addEventListener("keydown",e=>{if(e.key==="Enter")doAuth();});});
}
function lgErr(m,ok){const e=$("lg-msg");e.textContent=m;e.classList.toggle("ok",!!ok);}
async function localGuestBlob(){
 try{let r=null; try{r=await store.get("sworddestiny:acct:__local__");}catch(e){}
  if(!(r&&r.value)){try{r=await store.get(LEGACY_KEY);}catch(e){}}
  return (r&&r.value)?JSON.parse(r.value):null;}catch(e){return null;}}
async function doAuth(){
 const name=($("lg-name")?.value||"").trim();
 const pw=$("lg-pw")?.value||"";
 if(name.length<1)return lgErr("이름을 입력하세요");
 /* ── 클라우드 모드: Supabase 인증 ── */
 if(CLOUD_ON&&typeof cloudReady==="function"&&cloudReady()){
  if(pw.length<6)return lgErr("비밀번호는 6자 이상이어야 합니다");
  lgErr("연결 중…",true);
  if(lgMode==="signup"){
   const pw2=$("lg-pw2")?.value||"";
   if(pw!==pw2)return lgErr("비밀번호가 일치하지 않습니다");
   const {data,error}=await cloudSignUp(name,pw);
   if(error)return lgErr(cloudErr(error));
   const user=(data&&data.user)||(data&&data.session&&data.session.user);
   if(!user)return lgErr("가입되었습니다. 로그인해 주세요");
   const seed=await localGuestBlob();
   await enterCloudGame(user,seed);
  }else{
   const {data,error}=await cloudSignIn(name,pw);
   if(error)return lgErr(cloudErr(error));
   await enterCloudGame(data.user,null);
  }
  return;
 }
 /* ── 로컬 모드(오프라인/서버 미설정): 기기 내 계정 ── */
 if(pw.length<4)return lgErr("비밀번호는 4자 이상이어야 합니다");
 const id=acctId(name),accts=await acctList(),h=await acctHash(pw);
 if(lgMode==="signup"){
  const pw2=$("lg-pw2")?.value||"";
  if(pw!==pw2)return lgErr("비밀번호가 일치하지 않습니다");
  if(accts[id])return lgErr("이미 있는 이름입니다. 로그인하거나 다른 이름을 쓰세요");
  const inherit=Object.keys(accts).length===0;              // 첫 계정만 기기 진행을 물려받는다
  accts[id]={name,hash:h,created:Date.now()};
  normRole(accts[id]);
  await acctSave(accts);
  if(inherit){                                              // 기존 로컬 저장을 이 계정 키로 복사
   try{let r=null; try{r=await store.get("sworddestiny:acct:__local__");}catch(e){}
    if(!(r&&r.value)){try{r=await store.get(LEGACY_KEY);}catch(e){}}
    if(r&&r.value)await store.set("sworddestiny:acct:"+id,r.value);}catch(e){}}
  await enterGame(id);
 }else{
  if(!accts[id])return lgErr("없는 계정입니다. 새 계정을 만드세요");
  if(accts[id].hash!==h)return lgErr("비밀번호가 틀렸습니다");
  await enterGame(id);
 }}
/* 클라우드 계정 입장 — 정체성은 Supabase 세션 기준, 저장은 서버 우선 */
async function enterCloudGame(user,seed){
 const uid=user.id, nm=((user.user_metadata&&user.user_metadata.name)||"").trim();
 Object.assign(S,{gold:0,gems:0,rolls:0,goldTot:0,rebirth:0,ach:{},up:{luck:0,speed:0,greed:0,vault:0,auto:0},
   inv:{},owned:{},ench:{},enchMax:0,equipped:null,pity:0,best:-1,gemTot:0,devLuck:1,buff:{luck:{m:1,t:0},speed:{m:1,t:0},gold:{m:1,t:0}},
   auto:false,cloud:true,uid:uid,acct:"cloud:"+uid});
 let srv=null; try{srv=await cloudGetSave(uid);}catch(e){}
 if(!(srv&&srv.data)&&seed){                                  // 신규 계정 + 기기 진행 물려받기
  try{await store.set("sworddestiny:cloud:"+uid,JSON.stringify(seed));}catch(e){}}
 await load();                                                // 서버 우선, 없으면 로컬 캐시(방금 심은 seed)
 S.cloud=true;S.uid=uid;S.acct="cloud:"+uid;                  // load() 뒤 정체성 재확정
 S.acctName=((srv&&srv.name)||nm||"").trim();                 // 표시 이름은 서버 saves.name 기준(관리자 변경 반영)
 S.role=(srv&&srv.role)||"";                                  // 권한은 서버 role 컬럼이 기준(안전)
 resolveQ();recalcAB();
 if(!(srv&&srv.data))save();                                  // 서버에 없던 계정은 첫 저장 업로드
 $("login").classList.remove("on");
 startGame();
}
async function enterGame(id){
 await acctSetSession(id==="__local__"?null:id);
 // 현재 상태를 비우고 그 계정의 저장을 불러온다
 Object.assign(S,{gold:0,gems:0,rolls:0,goldTot:0,rebirth:0,ach:{},up:{luck:0,speed:0,greed:0,vault:0,auto:0},
   inv:{},owned:{},ench:{},enchMax:0,equipped:null,pity:0,best:-1,gemTot:0,devLuck:1,buff:{luck:{m:1,t:0},speed:{m:1,t:0},gold:{m:1,t:0}},
   auto:false,cloud:false,uid:null,acct:id});
 await load();
 /* 권한과 이름은 계정 레지스트리가 기준이다.
    load() 가 저장 데이터로 S 를 덮어쓰므로 반드시 그 뒤에 확정해야 한다 */
 await applyIdentity(id);
 resolveQ();recalcAB();
 $("login").classList.remove("on");
 startGame();
}
async function doLogout(){
 clearTimeout(saveT);
 try{await store.set(saveKey(),JSON.stringify(S));}catch(e){}   // 즉시 저장 후 나간다
 if(S.cloud&&typeof cloudReady==="function"&&cloudReady()){     // 클라우드면 서버에도 저장 후 로그아웃
  try{await cloudPutSave(S.uid,S.acctName||"",S);}catch(e){}
  await cloudSignOut();}
 S.cloud=false;S.uid=null;
 await acctSetSession(null);
 lgMode="login";
 renderLogin((await acctList())&&Object.keys(await acctList()).length===0);
 $("login").classList.add("on");
}
let dvTarget="",dvDel="";
/* 계정 이름과 권한을 레지스트리에서 읽어 S 에 확정한다 */
async function applyIdentity(id){
 S.acct=id;
 if(id==="__local__"){ S.acctName=""; S.role=""; return; }
 const a=await acctList();
 if(a[id]){ normRole(a[id]); await acctSave(a);
  S.acctName=a[id].name; S.role=a[id].role||""; }
 else { S.acctName=""; S.role=""; }}

/* ── 클라우드 개발자 메뉴 (대상 선택형, 서버 RPC 기반) ── */
let caAccts=[], caTarget="";
const caFind=uid=>caAccts.find(a=>a.user_id===uid)||null;
/* devLuck 을 제외한 전체 행운 배수 (임의 계정 데이터 블롭 기준) */
function baseLuck(d){
 d=d||{}; const up=d.up||{}, ach=d.ach||{};
 let ab=0; ACH.forEach(a=>{if(ach[a.id]&&a.r&&a.r.luck)ab+=a.r.luck;});
 const eq=d.equipped, sw=(eq&&eq.n)?SWORDS.find(v=>v.n===eq.n):null;
 const eqL=sw?(enchFx(sw,(eq.e||0)).luck||0):0;
 return (1+(up.luck||0)*0.62)*(1+eqL)*(1+ab)*Math.pow(1.45,d.rebirth||0);}
function devPreviewCard(){
 return `<div class="sec">컷신 미리보기</div><div class="card"><div class="dv-chips">
   ${RARITY.filter(r=>r.mode!=="none").map(r=>`<button class="mini" data-prev="${r.id}" style="flex:0 0 auto;padding:8px 11px;color:${r.c};border-color:${r.c}55">${r.n}</button>`).join("")}
   ${SWORDS.filter(x=>x.th).map(x=>`<button class="mini" data-prevs="${encodeURIComponent(x.n)}" style="flex:0 0 auto;padding:8px 11px;color:${RARITY[x.t].c};border-color:${RARITY[x.t].c}55">${x.n}</button>`).join("")}
   </div></div>`;}
async function renderDevCloud(){
 const el=$("devm");
 if(!isDev()){                                                 // 부개발자: 본인 지급만
  el.innerHTML=`
   <div class="dv-head"><h2>개 발 자 메 뉴</h2><em>${roleLabel(S.role)} · 클라우드</em><button id="dv-close">닫기</button></div>
   <div class="sec">내 계정 지급</div>
   <div class="card"><p>본인 계정에만 적용됩니다.</p>
    <div class="dv-row"><input id="dv-gold" type="text" inputmode="numeric" placeholder="주화 (음수는 회수)"><button data-dv="gold">주화</button></div>
    <div class="dv-row" style="margin-top:8px"><input id="dv-gems" type="text" inputmode="numeric" placeholder="보석"><button data-dv="gems">보석</button></div>
    <div class="dv-row" style="margin-top:8px"><select id="dv-sword">${SWORDS.map(x=>`<option value="${encodeURIComponent(x.n)}">[${RARITY[x.t].n}] ${x.n}</option>`).join("")}</select><button data-dv="sword">검</button></div></div>
   ${devPreviewCard()}
   <div class="dv-note">부개발자는 본인 계정 지급만 가능합니다.</div>`;
  $("dv-close").onclick=()=>el.classList.remove("on"); return;
 }
 const {data,error}=await adminList();                          // 개발자: 대상 선택 + 관리
 caAccts = error? [] : (data||[]);
 if(!caFind(caTarget)) caTarget = S.uid || (caAccts[0]&&caAccts[0].user_id) || "";
 el.innerHTML=`
  <div class="dv-head"><h2>개 발 자 메 뉴</h2><em>${roleLabel(S.role)} · 클라우드</em><button id="dv-close">닫기</button></div>
  <div class="sec">대상 계정</div>
  <div class="card">
   ${error?`<p style="color:#e8776a">계정 목록 오류: ${error.message||error}</p>`:""}
   <div class="dv-row"><select id="ca-target">${caAccts.map(a=>`<option value="${a.user_id}" ${a.user_id===caTarget?"selected":""}>${a.name||"(이름없음)"}${a.role?" · "+roleLabel(a.role):""}${a.user_id===S.uid?" (나)":""}</option>`).join("")||`<option value="">계정 없음</option>`}</select></div>
   <div class="eff" id="ca-info"></div>
   <div class="dv-row" style="margin-top:10px"><input id="ca-gold" type="text" inputmode="numeric" placeholder="주화 (음수는 회수)"><button data-cax="gold">주화</button></div>
   <div class="dv-row" style="margin-top:8px"><input id="ca-gems" type="text" inputmode="numeric" placeholder="보석 (음수는 회수)"><button data-cax="gems">보석</button></div>
   <div class="dv-row" style="margin-top:8px"><input id="ca-luck" type="text" inputmode="decimal" placeholder="행운 배수 X">
     <button data-cax="luckset">×X 설정</button><button data-cax="luckinv">1/X 설정</button></div>
   <div class="qhint">개발자 행운 배수(devLuck)를 X 또는 1/X 로 설정합니다. 대상의 전체 행운이 1 미만이 되면 실행되지 않습니다.</div>
   <div class="dv-row" style="margin-top:8px"><input id="ca-rename" type="text" maxlength="20" placeholder="새 표시 이름"><button data-cax="rename">이름 변경</button></div>
  </div>
  ${devPreviewCard()}
  <div class="sec">전체 계정 (읽기 전용)</div><div class="dv-list" id="ca-list"></div>
  <div class="dv-note">대상 계정을 골라 지급·이름 변경·권한 조정을 합니다. 권한 변경은 서버에 즉시 반영(다른 기기 포함). 자원·행운 지급은 대상이 접속 중이면 그 기기 저장에 덮어써질 수 있어, 오프라인일 때가 확실합니다.</div>`;
 $("dv-close").onclick=()=>el.classList.remove("on");
 const sel=$("ca-target"); if(sel)sel.onchange=()=>{caTarget=sel.value;caRefresh();};
 caRefresh(); caRenderList();
}
function caRefresh(){
 const a=caFind(caTarget), info=$("ca-info"), nm=$("ca-rename");
 if(!a){ if(info)info.textContent="대상 없음"; return; }
 const best=(typeof a.best==="number"&&a.best>=0)?RARITY[a.best].n:"없음";
 if(info)info.innerHTML=`${a.name||"(이름없음)"}${a.role?" · "+roleLabel(a.role):""}${a.user_id===S.uid?" (나)":""}<br>주화 ${fmt(a.gold||0)} · 보석 ${(a.gems||0).toLocaleString()} · 환생 ${a.rebirth||0} · 최고 ${best}`;
 if(nm)nm.value=a.name||"";}
function caRenderList(){
 const box=$("ca-list"); if(!box)return;
 box.innerHTML=caAccts.map(a=>{
  const best=(typeof a.best==="number"&&a.best>=0)?RARITY[a.best].n:"없음";
  const act=(a.user_id===S.uid||a.role==="dev")?"":`<div class="dv-row" style="margin-top:8px;flex-wrap:wrap;gap:5px">
      <button data-carow="${a.user_id}|role">${a.role==="subdev"?"부개발자 해제":"부개발자 부여"}</button>
      <button class="danger" data-carow="${a.user_id}|reset">초기화</button>
      <button class="danger" data-carow="${a.user_id}|del">삭제</button></div>`;
  return `<div class="dv-acc"><b>${a.name||"(이름없음)"}</b>${a.role?`<i class="${a.role==="dev"?"dev":"sub"}">${roleLabel(a.role)}</i>`:""}${a.user_id===S.uid?' <i>(나)</i>':""}
    <span>주화 ${fmt(a.gold||0)} · 보석 ${(a.gems||0).toLocaleString()}<br>환생 ${a.rebirth||0} · 최고 ${best}</span>${act}</div>`;
 }).join("")||`<div class="dv-acc">계정이 없습니다</div>`;}
/* 대상 계정에 지급·이름·권한 적용. 본인이면 로컬 S 즉시 반영, 남이면 서버 RPC */
async function caAction(btn,op){
 const target=caTarget, a=caFind(target);
 if(!target||!a){toast("대상 계정을 고르세요");return;}
 const self=target===S.uid;
 if(op==="gold"||op==="gems"){
  const n=Number($("ca-"+op).value);
  if(!isFinite(n)||n===0){toast("숫자를 확인하세요");return;}
  if(self){ if(op==="gold"){S.gold=Math.max(0,S.gold+n);if(n>0)S.goldTot=(S.goldTot||0)+n;} else S.gems=Math.max(0,(S.gems||0)+n); save();renderHUD(); }
  else{ btn.disabled=true; const {error}=await adminGrant(target,op==="gold"?n:0,op==="gems"?n:0); if(error){toast("오류: "+(error.message||error));return;} }
  toast((op==="gold"?"주화":"보석")+" "+Math.abs(n).toLocaleString()+" "+(n>0?"지급":"회수")); await renderDev();return;}
 if(op==="luckset"||op==="luckinv"){
  const x=Number($("ca-luck").value);
  if(!isFinite(x)||x<=0){toast("0보다 큰 숫자를 넣으세요");return;}
  const nd=op==="luckinv"?1/x:x;
  let base;
  if(self)base=baseLuck(S);
  else{ const d=await adminGet(target); if(d&&d.error){toast("오류: "+d.error);return;} base=baseLuck(d); }
  if(base*nd<1){toast("실행 불가: 전체 행운 배수가 1 미만이 됩니다");return;}
  if(self){ S.devLuck=nd; save();renderHUD(); }
  else{ btn.disabled=true; const {error}=await adminSetLuck(target,nd); if(error){toast("오류: "+(error.message||error));return;} }
  toast("행운 배수 ×"+ (+nd.toFixed(4)) +" 설정"); await renderDev();return;}
 if(op==="rename"){
  const name=($("ca-rename").value||"").trim();
  if(name.length<1){toast("이름을 입력하세요");return;} if(name.length>20){toast("이름이 너무 깁니다");return;}
  if(self){ btn.disabled=true; try{await cloudRename(name);}catch(e){} S.acctName=name; save(); renderWho();renderHUD(); }
  else{ btn.disabled=true; const {error}=await adminRename(target,name); if(error){toast("오류: "+(error.message||error));return;} }
  toast("표시 이름을 '"+name+"'(으)로 변경"); await renderDev();return;}
 if(op==="roletoggle"){
  const nr=a.role==="subdev"?"":"subdev"; btn.disabled=true;
  const {error}=await adminSetRole(target,nr);
  toast(error?("오류: "+(error.message||error)):(nr?"부개발자 부여":"권한 해제")); await renderDev();return;}
 if(op==="reset"){
  if(!confirm("이 계정의 저장 데이터를 초기화합니다. 되돌릴 수 없습니다. 진행할까요?"))return;
  btn.disabled=true; const {error}=await adminReset(target);
  toast(error?("오류: "+(error.message||error)):"초기화 완료"); await renderDev();return;}
}
/* 계정 목록 행의 권한/초기화/삭제 (per-row) */
async function caRowAction(btn,uid,op){
 const a=caFind(uid); if(!a)return;
 if(op==="role"){
  const nr=a.role==="subdev"?"":"subdev"; btn.disabled=true;
  const {error}=await adminSetRole(uid,nr);
  toast(error?("오류: "+(error.message||error)):(nr?"부개발자 부여":"권한 해제")); await renderDev();return;}
 if(op==="reset"){
  if(!confirm("["+(a.name||"")+"] 저장 데이터를 초기화합니다. 되돌릴 수 없습니다."))return;
  btn.disabled=true; const {error}=await adminReset(uid);
  toast(error?("오류: "+(error.message||error)):"초기화 완료"); await renderDev();return;}
 if(op==="del"){
  if(!confirm("["+(a.name||"")+"] 계정을 완전히 삭제합니다. 로그인·저장 모두 사라지며 되돌릴 수 없습니다."))return;
  btn.disabled=true; const {error}=await adminDelete(uid);
  toast(error?("오류: "+(error.message||error)):"계정 삭제됨"); await renderDev();return;}
}
async function renderDev(){
 if(!hasDev())return;
 if(S.cloud&&typeof cloudReady==="function"&&cloudReady())return renderDevCloud();
 const el=$("devm"),admin=isDev();
 if(!admin)dvDel="";
 const accts=await acctList();
 const ids=Object.keys(accts);
 if(!dvTarget||!accts[dvTarget])dvTarget=S.acct!=="__local__"?S.acct:(ids[0]||"");
 const tgtSel=admin
  ? `<select id="dv-target">${ids.map(i=>`<option value="${i}" ${i===dvTarget?"selected":""}>${accts[i].name}${i===S.acct?" (나)":""}</option>`).join("")}</select>`
  : `<select id="dv-target" disabled><option>${S.acctName||"나"}</option></select>`;

 let list="";
 if(admin){
  for(const i of ids){
   const a=accts[i];
   const o=(i===S.acct)?S:(await acctLoad(i));
   const g=o?fmt(o.gold||0):"-", rl=o?(o.rolls||0).toLocaleString():"-";
   const cl=o?SWORDS.filter(x=>o.owned&&o.owned[x.n]).length:0;
   const bs=(o&&typeof o.best==="number"&&o.best>=0)?RARITY[o.best].n:"없음";
   const rb=o?(o.rebirth||0):0;
   list+=`<div class="dv-acc">
     <b>${a.name}</b>${a.role?`<i class="${a.role==="dev"?"dev":"sub"}">${roleLabel(a.role)}</i>`:""}
     <span>주화 ${g} · 주조 ${rl}<br>도감 ${cl}/${SWORDS.length} · 최고 ${bs} · 환생 ${rb}</span>
     ${a.role==="dev"?"":`<button data-dvrole="${i}">${a.role==="subdev"?"권한 해제":"부개발자"}</button>`}
     ${a.role==="dev"?"":(dvDel===i
       ? `<button class="danger" data-dvdel="${i}">정말 삭제</button><button data-dvcancel="1">취소</button>`
       : `<button class="danger" data-dvask="${i}">삭제</button>`)}
   </div>`;}}

 el.innerHTML=`
  <div class="dv-head"><h2>개 발 자 메 뉴</h2><em>${roleLabel(S.role)}</em>
    <button id="dv-close">닫기</button></div>

  ${admin?`<div class="sec">대상 계정</div>
  <div class="card"><p>아래 지급 기능이 적용될 계정입니다.</p>
   <div class="dv-row">${tgtSel}</div></div>`:
  `<div class="card"><p>부개발자는 본인 계정에만 적용할 수 있습니다.</p>
   <div class="dv-row">${tgtSel}</div></div>`}

  <div class="sec">주화 지급</div>
  <div class="card"><p>대상 계정의 주화를 더합니다. 음수를 넣으면 회수됩니다.</p>
   <div class="dv-row"><input id="dv-gold" type="text" inputmode="numeric" placeholder="예: 1000000 또는 1e12">
     <button data-dv="gold">지급</button></div>
   <div class="dv-chips">
     ${["1e4","1e6","1e8","1e10"].map(v=>`<button class="chip" data-dvg="${v}">+${fmt(Number(v))}</button>`).join("")}
   </div></div>

  <div class="sec">보석 지급</div>
  <div class="card"><p>대상 계정의 보석을 더합니다. 음수를 넣으면 회수됩니다.</p>
   <div class="dv-row"><input id="dv-gems" type="text" inputmode="numeric" placeholder="예: 100 또는 5000">
     <button data-dv="gems">지급</button></div>
   <div class="dv-chips">
     ${["10","100","1000","10000"].map(v=>`<button class="chip" data-dvgem="${v}">+${Number(v).toLocaleString()}</button>`).join("")}
   </div></div>

  <div class="sec">행운 배수</div>
  <div class="card"><p>대상 계정의 행운에 곱해지는 개발자 배수입니다. 1이면 효과 없음.</p>
   <div class="dv-row"><input id="dv-luck" type="text" inputmode="decimal" placeholder="예: 100">
     <button data-dv="luck">적용</button></div>
   <div class="dv-chips">
     ${[1,10,100,1000,100000].map(v=>`<button class="chip" data-dvl="${v}">×${v.toLocaleString()}</button>`).join("")}
   </div>
   <div class="eff">현재(내 계정) · ×${(S.devLuck||1).toLocaleString()}</div></div>

  <div class="sec">이름 변경</div>
  <div class="card"><p>${admin?"대상 계정의 이름을 바꿉니다.":"본인 계정의 이름을 바꿉니다."} 저장된 진행도 함께 옮겨지며, 다음 로그인부터 새 이름을 씁니다.</p>
   <div class="dv-row"><input id="dv-name" type="text" maxlength="20" placeholder="새 이름"
     value="${(accts[dvTarget]&&accts[dvTarget].name)||""}">
     <button data-dv="rename">변경</button></div></div>

  <div class="sec">검 지급</div>
  <div class="card"><p>대상 계정의 도감에 검을 추가합니다.</p>
   <div class="dv-row">
     <select id="dv-sword">${SWORDS.map(x=>`<option value="${encodeURIComponent(x.n)}">[${RARITY[x.t].n}] ${x.n}</option>`).join("")}</select>
     <button data-dv="sword">지급</button></div>
   <div class="dv-chips"><button class="chip" data-dv="allsword">도감 전체 지급</button></div></div>

  <div class="sec">컷신 미리보기</div>
  <div class="card"><p>연출만 확인합니다. 검은 지급되지 않고 기록에도 남지 않습니다.</p>
   <div class="dv-chips">
   ${RARITY.filter(r=>r.mode!=="none").map(r=>`<button class="mini" data-prev="${r.id}"
     style="flex:0 0 auto;padding:8px 11px;color:${r.c};border-color:${r.c}55">${r.n}</button>`).join("")}
   ${SWORDS.filter(x=>x.th).map(x=>`<button class="mini" data-prevs="${encodeURIComponent(x.n)}"
     style="flex:0 0 auto;padding:8px 11px;color:${RARITY[x.t].c};border-color:${RARITY[x.t].c}55">${x.n}</button>`).join("")}
   </div></div>

  ${admin?`<div class="sec">계정 목록</div><div class="dv-list">${list||'<div class="dv-acc">계정이 없습니다</div>'}</div>`:""}

  <div class="dv-note">서버가 없으므로 이 권한은 이 기기 안에서만 유효합니다. 브라우저 저장소를 직접 고치면 누구나 같은 일을 할 수 있으니 보안 장치가 아니라 편의 도구로만 쓰세요.</div>`;

 $("dv-close").onclick=()=>el.classList.remove("on");
 const sel=$("dv-target");
 if(sel&&admin)sel.onchange=()=>{dvTarget=sel.value;};
}

async function devAction(kind,val){
 const admin=isDev();
 const id=admin?(dvTarget||S.acct):S.acct;
 if(!id||id==="__local__"&&!admin){toast("대상 계정이 없습니다");return;}
 if(kind==="gold"){
  const n=Number(val);
  if(!isFinite(n)||n===0){toast("숫자를 확인하세요");return;}
  await applyTo(id,o=>{o.gold=Math.max(0,(o.gold||0)+n); if(n>0)o.goldTot=(o.goldTot||0)+n;});
  toast(fmt(Math.abs(n))+" 주화 "+(n>0?"지급":"회수"));
 }else if(kind==="gems"){
  const n=Number(val);
  if(!isFinite(n)||n===0){toast("숫자를 확인하세요");return;}
  await applyTo(id,o=>{o.gems=Math.max(0,(o.gems||0)+n);});
  toast(Math.abs(n).toLocaleString()+" 보석 "+(n>0?"지급":"회수"));
 }else if(kind==="luck"){
  const n=Number(val);
  if(!isFinite(n)||n<=0){toast("1 이상의 숫자를 넣으세요");return;}
  await applyTo(id,o=>{o.devLuck=n;});
  toast("행운 배수 ×"+n.toLocaleString());
 }else if(kind==="sword"){
  const nm=decodeURIComponent(val);
  const sw=SWORDS.find(x=>x.n===nm); if(!sw)return;
  await applyTo(id,o=>{o.owned=o.owned||{};o.owned[nm]=(o.owned[nm]||0)+1;
   if((o.best??-1)<sw.t)o.best=sw.t;});
  toast(nm+" 지급");
 }else if(kind==="allsword"){
  await applyTo(id,o=>{o.owned=o.owned||{};
   SWORDS.forEach(x=>{o.owned[x.n]=(o.owned[x.n]||0)+1;});
   o.best=Math.max(o.best??-1,...SWORDS.map(x=>x.t));});
  toast("도감 전체 지급");
 }
 if(id===S.acct){checkAch();renderHUD();}
 await renderDev();
}

/* 계정 이름 변경. 저장 키가 이름에서 나오므로 진행 데이터까지 함께 옮긴다 */
async function devRename(id,newName){
 if(!hasDev())return;
 if(!isDev()&&id!==S.acct){toast("본인 계정만 바꿀 수 있습니다");return;}
 const nm=String(newName||"").trim();
 if(nm.length<1){toast("이름을 입력하세요");return;}
 if(nm.length>20){toast("이름이 너무 깁니다");return;}
 const a=await acctList();
 if(!a[id]){toast("없는 계정입니다");return;}
 if(a[id].role==="dev"&&nm!==DEV_NAME){toast("개발자 계정의 이름은 바꿀 수 없습니다");return;}
 const nid=acctId(nm);
 if(nid!==id&&a[nid]){toast("이미 있는 이름입니다");return;}
 const old=a[id].name;
 if(nid===id){ a[id].name=nm; await acctSave(a); }
 else{
  a[nid]={...a[id],name:nm};
  delete a[id];
  normRole(a[nid]);
  await acctSave(a);
  const blob=await acctLoad(id);                 // 진행 데이터 이전
  if(blob)await acctStore(nid,blob);
  try{await store.del("sworddestiny:acct:"+id);}catch(e){}
  if(dvTarget===id)dvTarget=nid;
  if(S.acct===id){ S.acct=nid; await acctSetSession(nid); }
 }
 if(S.acct===nid||S.acct===id)await applyIdentity(S.acct);
 toast(old+" → "+nm);
 renderWho(); await renderDev();}

async function devDelete(id){
 if(!isDev())return;
 const a=await acctList();
 if(!a[id]||a[id].role==="dev"){toast("개발자 계정은 삭제할 수 없습니다");return;}
 const nm=a[id].name;
 delete a[id];
 await acctSave(a);
 try{await store.del("sworddestiny:acct:"+id);}catch(e){}   // 진행 데이터까지 삭제
 dvDel="";
 if(dvTarget===id)dvTarget=S.acct;
 if(id===S.acct){                                            // 자기 계정을 지웠다면 로그아웃
  await acctSetSession(null);
  toast(nm+" 계정을 삭제했습니다");
  $("devm").classList.remove("on");
  lgMode="login";renderLogin(false);$("login").classList.add("on");
  return;}
 toast(nm+" 계정을 삭제했습니다");
 await renderDev();}

async function devToggleRole(id){
 if(!isDev())return;
 const a=await acctList(); if(!a[id]||a[id].role==="dev")return;
 a[id].role = a[id].role==="subdev" ? "" : "subdev";
 await acctSave(a);
 if(id===S.acct)S.role=a[id].role||"";
 toast(a[id].name+" · "+(a[id].role?"부개발자 부여":"권한 해제"));
 renderWho(); await renderDev();
}

$("devm").addEventListener("click",async e=>{
 const t=e.target.closest("button"); if(!t)return;
 /* ── 클라우드 관리자: 대상 계정 지급/이름/권한 (서버 RPC 또는 본인 로컬) ── */
 if(t.dataset.cax){await caAction(t,t.dataset.cax);return;}
 if(t.dataset.carow){const i=t.dataset.carow.indexOf("|");await caRowAction(t,t.dataset.carow.slice(0,i),t.dataset.carow.slice(i+1));return;}
 if(t.dataset.dvask){dvDel=t.dataset.dvask;await renderDev();return;}
 if(t.dataset.dvcancel){dvDel="";await renderDev();return;}
 if(t.dataset.dvdel){await devDelete(t.dataset.dvdel);return;}
 if(t.dataset.dvrole){await devToggleRole(t.dataset.dvrole);return;}
 if(t.dataset.dvg){await devAction("gold",t.dataset.dvg);return;}
 if(t.dataset.dvgem){await devAction("gems",t.dataset.dvgem);return;}
 if(t.dataset.dv==="gems"){await devAction("gems",$("dv-gems").value);return;}
 if(t.dataset.dvl){await devAction("luck",t.dataset.dvl);return;}
 if(t.dataset.dv==="gold"){await devAction("gold",$("dv-gold").value);return;}
 if(t.dataset.dv==="luck"){await devAction("luck",$("dv-luck").value);return;}
 if(t.dataset.dv==="rename"){
  const id=isDev()?(dvTarget||S.acct):S.acct;
  await devRename(id,$("dv-name").value);return;}
 if(t.dataset.dv==="sword"){await devAction("sword",$("dv-sword").value);return;}
 if(t.dataset.dv==="allsword"){await devAction("allsword");return;}
 if(t.dataset.prev){const R=RARITY.find(r=>r.id===t.dataset.prev);
  ac();playCutscene(pickSword(RARITY.indexOf(R)),R);return;}
 if(t.dataset.prevs){const x=SWORDS.find(v=>v.n===decodeURIComponent(t.dataset.prevs));
  ac();playCutscene(x,RARITY[x.t]);return;}
});

function renderWho(){
 const w=$("who");
 if(S.acct&&S.acct!=="__local__"){
  const nm=(S.acctName||S.acct.replace(/^u_/,""));
  $("who-name").textContent=nm;
  const r=$("who-role"),lb=roleLabel(S.role);
  r.textContent=lb; r.className=S.role==="dev"?"dev":S.role==="subdev"?"sub":"";
  r.style.display=lb?"":"none";
  w.style.display="flex";
 }else w.style.display="none";
}

function startGame(){
 ["devm","settings","tree","sheet","rcard","cs","trade"].forEach(id=>{const e=$(id);if(e)e.classList.remove("on");});  // 진입 시 열린 오버레이 정리
 checkAch();renderHUD();renderWho();
 $("slot").innerHTML=swordSVG(SWORDS[0]);$("slot").classList.add("idle");
 $("r-name").textContent="";$("r-odds").textContent="";
 $("r-rarity").textContent=S.rolls>0?"화로가 데워져 있습니다":"화로가 식어 있습니다";
}

$("btn-logout")&&($("btn-logout").onclick=doLogout);

(async function init(){
 if(CLOUD_ON&&typeof cloudReady==="function"&&cloudReady()){   // 클라우드 세션이 살아 있으면 자동 입장
  try{const sess=await cloudSession(); if(sess&&sess.user){ await enterCloudGame(sess.user,null); return; }}catch(e){}
 }
 const accts=await acctList(),sess=await acctSession();
 if(sess&&accts[sess]){                                    // 이미 로그인된 로컬 세션
  S.acct=sess;
  await load();
  await applyIdentity(sess);
  resolveQ();recalcAB();startGame();return;
 }
 // 세션 없음 → 로그인 화면. 단, 이전에 계정 없이 하던 로컬 진행이 있으면 물려받기 안내
 let hasLocal=false;
 try{let r=null; try{r=await store.get("sworddestiny:acct:__local__");}catch(e){}
   if(!(r&&r.value)){try{r=await store.get(LEGACY_KEY);}catch(e){}}
   hasLocal=!!(r&&r.value);}catch(e){}
 lgMode = Object.keys(accts).length===0 ? "signup" : "login";
 renderLogin(Object.keys(accts).length===0 && hasLocal);
 $("login").classList.add("on");
})();
