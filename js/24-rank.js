/* ═════════ 랭킹 ═════════
   서버의 saves 는 RLS 로 제 행만 보인다. 남의 기록을 읽으려면 서버 함수를
   거쳐야 하고, 그 함수는 이름과 순위 숫자만 돌려준다 —
   주화도 인벤토리도 나가지 않는다. (sql/04-rank.sql)

   기록은 저장에 실려 올라간다. 그래서 판을 끝내고 저장이 한 번 올라가야
   순위에 반영된다. 새로고침 없이 바로 보이지 않는 것은 그 때문이다. */

const RANK_BOARDS=[
 {k:"wave",   n:"최고 웨이브", unit:"웨이브", d:"솔로·듀얼에서 가장 멀리 간 기록"},
 {k:"rebirth",n:"환생",       unit:"회",    d:"환생을 몇 번 거쳤는가"},
 {k:"codex",  n:"도감",       unit:"종",    d:"서로 다른 검을 몇 자루 모았는가"},
 {k:"pvp",    n:"1 vs 1",     unit:"승",    d:"정산까지 끝난 대전의 승수"},
];
let RK={kind:"wave",rows:null,me:null,busy:false};

function rankOpen(){
 const el=$("rank");
 el.classList.add("on");
 rankRender();
 if(S.cloud&&typeof cloudReady==="function"&&cloudReady())rankLoad(RK.kind);
}
function rankClose(){ $("rank").classList.remove("on"); }

async function rankLoad(kind){
 RK.kind=kind;RK.rows=null;RK.me=null;RK.busy=true;RK.err=null;
 rankRender();
 try{
  const [b,m]=await Promise.all([rankBoard(kind,50),rankMe(kind)]);
  if(b&&b.error){RK.err=cloudErr(b.error);}
  else RK.rows=(b&&b.data)||[];
  RK.me=(m&&m.data&&m.data[0])||null;
 }catch(e){ RK.err="불러오지 못했습니다"; }
 RK.busy=false;rankRender();
}

function rankRender(){
 const el=$("rank"); if(!el.classList.contains("on"))return;
 const cloud=S.cloud&&typeof cloudReady==="function"&&cloudReady();
 const B=RANK_BOARDS.find(b=>b.k===RK.kind)||RANK_BOARDS[0];
 const tabs=RANK_BOARDS.map(b=>
   `<button class="chip ${b.k===RK.kind?"on":""}" data-rk="${b.k}">${b.n}</button>`).join("");

 let body;
 if(!cloud){
  body=`<div class="pv-empty">랭킹은 클라우드 계정에서만 보입니다.<br>
    설정에서 로그인하면 기록이 올라갑니다.</div>`;
 }else if(RK.busy){
  body=`<div class="pv-empty">불러오는 중…</div>`;
 }else if(RK.err){
  body=`<div class="pv-empty">${esc2(RK.err)}</div>`;
 }else if(!RK.rows||!RK.rows.length){
  body=`<div class="pv-empty">아직 기록이 없습니다.</div>`;
 }else{
  body=`<div class="rk-list">`+RK.rows.map(r=>{
   const mine=r.uid===S.uid;
   const n=+r.rn;
   return `<div class="rk-row ${mine?"me":""} ${n<=3?"top top"+n:""}">
     <i class="rk-n">${n}</i>
     <b class="rk-nm">${esc2(r.name)}</b>
     <span class="rk-v">${fmt(+r.val)}<em>${B.unit}</em></span>
   </div>`;}).join("")+`</div>`;
 }

 /* 내 등수는 50위 밖일 수 있으므로 늘 아래에 따로 붙인다 */
 let mine="";
 if(cloud&&!RK.busy&&!RK.err){
  mine=RK.me
   ? `<div class="rk-me"><span>내 순위</span>
        <b>${(+RK.me.rn).toLocaleString()}위</b>
        <i>/ ${(+RK.me.total).toLocaleString()}명 중 · ${fmt(+RK.me.val)}${B.unit}</i></div>`
   : `<div class="rk-me none"><span>내 순위</span><b>기록 없음</b>
        <i>${B.k==="wave"?"배틀을 한 판 끝내면 올라갑니다":"아직 셀 것이 없습니다"}</i></div>`;
 }

 el.innerHTML=`<div class="pv-head"><h2>랭 　킹</h2>
    <button id="rk-x">닫기</button></div>
  <div class="rk-tabs">${tabs}</div>
  <p class="rk-d">${B.d}</p>
  ${body}
  ${mine}
  <div class="card pv-note">순위는 저장이 서버에 올라갈 때 갱신됩니다.
    방금 세운 기록이 안 보이면 잠시 뒤 다시 열어 보세요.</div>`;
 $("rk-x").onclick=rankClose;
}

$("rank").addEventListener("click",e=>{
 const t=e.target.closest("[data-rk]");
 if(t&&t.dataset.rk!==RK.kind)rankLoad(t.dataset.rk);
});
