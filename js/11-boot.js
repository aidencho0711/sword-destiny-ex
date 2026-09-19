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
  <div class="lg-note">이 로그인은 이 기기 안에서만 진행을 나눕니다. 서버가 없어 다른 기기로는 옮겨지지 않으며, 비밀번호는 이 기기에 저장되니 중요한 비밀번호는 쓰지 마세요.</div>`;
 el.querySelectorAll("[data-lm]").forEach(b=>b.onclick=()=>{lgMode=b.dataset.lm;renderLogin(inheritable);});
 $("lg-go").onclick=doAuth;
 $("lg-guest").onclick=async()=>{ await enterGame("__local__"); };
 [$("lg-name"),$("lg-pw"),$("lg-pw2")].forEach(i=>{if(i)i.addEventListener("keydown",e=>{if(e.key==="Enter")doAuth();});});
}
function lgErr(m,ok){const e=$("lg-msg");e.textContent=m;e.classList.toggle("ok",!!ok);}
async function doAuth(){
 const name=($("lg-name")?.value||"").trim();
 const pw=$("lg-pw")?.value||"";
 if(name.length<1)return lgErr("이름을 입력하세요");
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
async function enterGame(id){
 await acctSetSession(id==="__local__"?null:id);
 // 현재 상태를 비우고 그 계정의 저장을 불러온다
 Object.assign(S,{gold:0,gems:0,rolls:0,goldTot:0,rebirth:0,ach:{},up:{luck:0,speed:0,greed:0,vault:0,auto:0},
   inv:{},owned:{},ench:{},equipped:null,pity:0,best:-1,buff:{luck:{m:1,t:0},speed:{m:1,t:0},gold:{m:1,t:0}},
   auto:false,acct:id});
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

async function renderDev(){
 if(!hasDev())return;
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
 checkAch();renderHUD();renderWho();
 $("slot").innerHTML=swordSVG(SWORDS[0]);$("slot").classList.add("idle");
 $("r-name").textContent="";$("r-odds").textContent="";
 $("r-rarity").textContent=S.rolls>0?"화로가 데워져 있습니다":"화로가 식어 있습니다";
}

$("btn-logout")&&($("btn-logout").onclick=doLogout);

(async function init(){
 const accts=await acctList(),sess=await acctSession();
 if(sess&&accts[sess]){                                    // 이미 로그인된 세션
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
