/* ═════════ 상태 ═════════ */
const S={gold:0,gems:0,gemTot:0,rolls:0,goldTot:0,rebirth:0,ach:{},up:{luck:0,speed:0,greed:0,vault:0,auto:0},inv:{},owned:{},ench:{},enchMax:0,
  equipped:null,pity:0,best:-1,sound:false,auto:false,cutMin:6,safe:0,cardMin:6,perf:0,autoQ:0,acct:"__local__",cloud:false,uid:null,devLuck:1,econ:ECON_VER,filter:"all",vfilter:"all",
  buff:{luck:{m:1,t:0},speed:{m:1,t:0},gold:{m:1,t:0}}};

/* ═════════ 연출 품질 ═════════
   0 자동 / 1 높음 / 2 보통 / 3 낮음. 자동은 기기 사양으로 시작해 실제 프레임으로 보정한다. */
let QLV=1;
const QC=n=>QLV<=1?n:Math.max(2,Math.round(n*(QLV===2?.55:.3)));
function autoQ(){
 const c=navigator.hardwareConcurrency||4,m=navigator.deviceMemory||4;
 const mob=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"");
 if(!mob&&c>=8&&m>=8)return 1;
 if(c>=6&&m>=4)return mob?2:1;
 return mob?3:2;}
function resolveQ(){QLV=S.perf?S.perf:(S.autoQ||(S.autoQ=autoQ()));}
const QNAME=["자동","높음","보통","낮음"];
/* 컷신 중 프레임을 재어 자동 모드에서 한 단계씩 낮춘다 */
let fpsRaf=0,fpsWarned=false;
function watchFPS(){
 cancelAnimationFrame(fpsRaf);
 let frames=0,t0=performance.now(),slow=0;
 const step=now=>{
  frames++;
  if(now-t0>=900){
   const fps=frames*1000/(now-t0);
   if(fps<36){
    if(++slow>=2&&!S.perf&&QLV<3){
     S.autoQ=QLV+1;resolveQ();save();slow=-99;
     if(!fpsWarned){fpsWarned=true;
      setTimeout(()=>toast("프레임이 낮아 연출 품질을 '"+QNAME[QLV]+"'으로 낮췄습니다"),600);}}
   }else slow=0;
   frames=0;t0=now;}
  if($("cs").classList.contains("on"))fpsRaf=requestAnimationFrame(step);};
 fpsRaf=requestAnimationFrame(step);}

/* ═════════ 계정 (기기 내 저장 슬롯) ═════════
   서버가 없으므로 진짜 인증이 아니다. 같은 기기 안에서 진행 슬롯을 이름으로 나눌 뿐이다.
   비밀번호는 이 기기를 쓰는 사람이 볼 수 있으니 중요한 비밀번호를 쓰지 말 것. */
const ACCTS_KEY="sworddestiny:accts";
const SESSION_KEY="sworddestiny:session";
async function acctHash(pw){
 try{
  const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("sd:"+pw));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
 }catch(e){ let h=0; for(const c of "sd:"+pw)h=(h*31+c.charCodeAt(0))|0; return "f"+(h>>>0).toString(16); }}
async function acctList(){
 try{const r=await store.get(ACCTS_KEY); return r&&r.value?JSON.parse(r.value):{};}catch(e){return {};}}
async function acctSave(m){ try{await store.set(ACCTS_KEY,JSON.stringify(m));}catch(e){} }
async function acctSession(){ try{const r=await store.get(SESSION_KEY); return r&&r.value?r.value:null;}catch(e){return null;} }
async function acctSetSession(id){ try{ if(id)await store.set(SESSION_KEY,id); else await store.del(SESSION_KEY);}catch(e){} }
function acctId(name){ return "u_"+name.trim().toLowerCase().replace(/[^a-z0-9가-힣]/g,"_"); }
const DEV_NAME="개발자";
/* 이름이 "개발자"인 계정은 항상 개발자 권한을 갖는다 */
function normRole(a){ if(a&&String(a.name||"").trim()===DEV_NAME)a.role="dev"; return a; }
const isDev=()=>S.role==="dev";
const isSub=()=>S.role==="subdev";
const hasDev=()=>isDev()||isSub();
const roleLabel=r=>r==="dev"?"개발자":r==="subdev"?"부개발자":"";
/* 다른 계정의 저장을 읽고 쓴다 (개발자 전용) */
async function acctLoad(id){
 try{const r=await store.get("sworddestiny:acct:"+id); return r&&r.value?JSON.parse(r.value):null;}catch(e){return null;}}
async function acctStore(id,obj){ try{await store.set("sworddestiny:acct:"+id,JSON.stringify(obj));}catch(e){} }
/* 대상 계정에 변경을 적용한다. 현재 로그인 계정이면 메모리에 바로 반영 */
async function applyTo(id,fn){
 if(id===S.acct){ fn(S); save(); recalcAB(); renderHUD(); return true; }
 const o=await acctLoad(id); if(!o)return false;
 fn(o); await acctStore(id,o); return true;}

const now=()=>Date.now();
function bf(k){ return S.buff[k].t>now() ? S.buff[k].m : 1; }
/* 장착 검 찾기 — equipped 는 {n:이름, e:인첸트레벨} 객체 */
function eqSword(){ return S.equipped?SWORDS.find(v=>v.n===S.equipped.n)||null:null; }
function eqf(){ const x=eqSword(); if(!x)return {}; return enchFx(x,(S.equipped&&S.equipped.e)||0); }
function luck(){ return (1+S.up.luck*0.62)*(1+(eqf().luck||0))*(1+AB.luck)*rbLuck()*bf("luck")*(S.devLuck||1); }
function goldMult(){ return (1+S.up.greed*0.10+(eqf().gold||0)+AB.gold)*rbGold()*bf("gold"); }
function rollDelay(){ return Math.max(0.1,1.0*Math.pow(0.865,S.up.speed)*(1-(eqf().speed||0))*(1-AB.speed))*bf("speed"); }
function pityMax(){ return Math.max(120,Math.round((PITY_AT-S.up.vault*45-AB.pity)/(eqf().pity||1))); }
function cost(u){ return Math.floor(u.base*Math.pow(u.mul,S.up[u.id])); }

/* 저장소 — 아티팩트 환경이면 window.storage, 일반 웹이면 localStorage */
const LEGACY_KEY="sworddestiny:ex1";
/* 클라우드 로그인 시엔 로컬 캐시 키를 uid 기준으로 둔다(기기별 계정 슬롯과 분리) */
function saveKey(){ return (S.cloud&&S.uid) ? "sworddestiny:cloud:"+S.uid : "sworddestiny:acct:"+(S.acct||"__local__"); }
const store={
 async get(k){
  if(window.storage&&window.storage.get)return window.storage.get(k);
  const v=localStorage.getItem(k);
  if(v===null)throw new Error("empty");
  return {key:k,value:v};},
 async set(k,v){
  if(window.storage&&window.storage.set)return window.storage.set(k,v);
  localStorage.setItem(k,v);return {key:k,value:v};},
 async del(k){
  if(window.storage&&window.storage.delete)return window.storage.delete(k);
  localStorage.removeItem(k);}};
let saveT=null;
function save(){clearTimeout(saveT);saveT=setTimeout(async()=>{
  try{await store.set(saveKey(),JSON.stringify(S));}catch(e){}                 // 로컬 캐시(오프라인 대비)
  if(S.cloud&&S.uid&&typeof cloudReady==="function"&&cloudReady()){            // 서버 동기화(최선 노력)
   try{await cloudPutSave(S.uid,S.acctName||"",S);}catch(e){}}
 },700);}
async function load(){try{
  let r=null;
  if(S.cloud&&S.uid&&typeof cloudReady==="function"&&cloudReady()){            // 로그인 상태면 서버 먼저
   try{const srv=await cloudGetSave(S.uid); if(srv&&srv.data)r={value:JSON.stringify(srv.data)};}catch(e){}}
  if(!(r&&r.value)){ try{r=await store.get(saveKey());}catch(e){} }            // 없으면 로컬 캐시
  if(!(r&&r.value)&&(S.acct==="__local__"||!S.acct)){
   try{const lr=await store.get(LEGACY_KEY); if(lr&&lr.value)r=lr;}catch(e){}}
  if(r&&r.value){const o=JSON.parse(r.value);
   if(migrateEcon(o))setTimeout(()=>{save();
    toast("주화 가치 개편에 맞춰 보유 주화가 환산되었습니다");},400);
   Object.assign(S,o);
    S.up=Object.assign({luck:0,speed:0,greed:0,vault:0,auto:0},o.up||{});
    S.buff=Object.assign({luck:{m:1,t:0},speed:{m:1,t:0},gold:{m:1,t:0}},o.buff||{});
    S.inv=o.inv||{};S.ach=o.ach||{};S.ench=o.ench||{};
    if(typeof S.gems!=="number")S.gems=0;
    if(typeof S.gemTot!=="number")S.gemTot=0;
    if(typeof S.enchMax!=="number")S.enchMax=0;
    // equipped: 예전엔 검 이름 문자열 → {n,e} 객체로 이전
    if(typeof S.equipped==="string")S.equipped={n:S.equipped,e:0};
    else if(S.equipped&&typeof S.equipped==="object")S.equipped={n:S.equipped.n,e:S.equipped.e||0};
    else S.equipped=null;
    if(typeof S.vfilter!=="string")S.vfilter="all";
    if(typeof S.rebirth!=="number")S.rebirth=0;
    if(typeof S.goldTot!=="number")S.goldTot=0;
    if(typeof S.cutMin!=="number")S.cutMin=(o.cut===false)?99:CUT_FROM;
    if(typeof S.safe!=="number")S.safe=0;
    if(typeof S.cardMin!=="number")S.cardMin=(o.card===false)?99:CUT_FROM;
    if(typeof S.perf!=="number")S.perf=0;
    if(typeof S.autoQ!=="number")S.autoQ=0;
    if(typeof S.acct!=="string")S.acct="__local__";
    if(typeof S.devLuck!=="number"||!(S.devLuck>0))S.devLuck=1;
  }}catch(e){}}
const CUT_STEPS=[6,7,8,9,10,11,12,13,14,15,16,17,99];
function cutLabel(v){return v>=99?"컷신 끄기":RARITY[v].n+" 이상";}
