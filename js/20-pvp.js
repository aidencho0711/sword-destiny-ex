/* ═════════ 1 vs 1 실시간 대전 ═════════
   서버는 게임을 돌려 주지 않는다. 그래서 각자 제 캐릭터만 권한을 갖는다.

   맞았는지는 "맞은 쪽"이 판정한다(victim-authoritative).
   공격자가 판정하면 내 화면에서 분명히 피했는데도 맞는 일이 생기고,
   지연이 클수록 심해진다. 맞은 쪽이 판정하면 내가 본 대로 피할 수 있다.
   대신 맞은 쪽이 안 맞았다고 우길 수 있으므로, 정산은 양쪽 보고가
   일치할 때만 서버가 한다. 어긋나면 무효다. */

let PV=null;                                   // 진행 중인 대전

function pvpOpen(){
 if(!(S.cloud&&typeof cloudReady==="function"&&cloudReady())){toast("클라우드 로그인이 필요합니다");return;}
 if((S.team||[]).length<TEAM_SIZE){toast("출전 검 3자루를 먼저 정하세요");return;}
 const el=$("pvp");
 el.innerHTML=`<div class="pv-head"><h2>1 　v s 　1</h2><button id="pv-x">닫기</button></div>
  <div class="card">
    <p>상대 이름을 적어 신청합니다. 상대가 수락하면 바로 시작합니다.
       <b>둘 다 접속해 있어야</b> 합니다.</p>
    <div class="pv-find">
      <input id="pv-name" placeholder="상대 계정 이름" autocomplete="off">
      <button class="buy" id="pv-go">신청</button>
    </div>
  </div>
  <div class="sec">주고받은 신청</div>
  <div id="pv-list" class="pv-list"></div>
  <div class="card pv-note">이긴 쪽이 진 쪽의 주화·보석을 <b>5~20%</b> 가져갑니다.
    양쪽 보고가 일치할 때만 정산됩니다.</div>`;
 el.classList.add("on");
 $("pv-x").onclick=()=>{el.classList.remove("on");pvpUnwatch();};
 $("pv-go").onclick=pvpSend;
 pvpLoad();pvpWatch();
}
async function pvpSend(){
 const nm=($("pv-name").value||"").trim();
 if(!nm)return toast("상대 이름을 적어 주세요");
 if(nm===(S.acctName||""))return toast("자기 자신에게는 신청할 수 없습니다");
 const r=await findUser(nm);
 if(r&&r.error)return toast(cloudErr({message:r.error}));
 if(!r||!r.uid)return toast("그런 이름의 계정이 없습니다");
 const c=await pvpChallenge(r.uid,nm);
 if(c&&c.error)return toast(cloudErr(c.error));
 toast("신청했습니다 · "+nm);
 $("pv-name").value="";pvpLoad();
}
async function pvpLoad(){
 const box=$("pv-list"); if(!box)return;
 const r=await pvpList();
 const rows=(r&&r.data)||[];
 if(!rows.length){box.innerHTML=`<div class="pv-empty">주고받은 신청이 없습니다.</div>`;return;}
 box.innerHTML=rows.map(m=>{
  const mine=m.from_uid===S.uid;
  return `<div class="pv-card">
    <div class="pv-who">${m.kind==="duo"?"[듀얼] ":"[1vs1] "}${mine?"→ "+esc2(m.to_name):"← "+esc2(m.from_name)}</div>
    <div class="pv-act">${mine
      ? `<span>수락 기다리는 중</span><button class="mini" data-pvc="${m.id}">취소</button>`
      : `<button class="buy" data-pva="${m.id}" data-uid="${m.from_uid}" data-nm="${esc2(m.from_name)}"
           data-kind="${esc2(m.kind||"pvp")}">수락하고 시작</button>`}</div>
  </div>`;}).join("");
}
const esc2=v=>String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");

let pvWatch=null;
function pvpWatch(){
 pvpUnwatch();
 try{ pvWatch=SB.channel("pvp-inbox-"+S.uid)
   .on("postgres_changes",{event:"*",schema:"public",table:"pvp",filter:"to_uid=eq."+S.uid},p=>{
     pvpLoad();
     if(p.eventType==="INSERT")toast("대전 신청이 왔습니다");})
   .on("postgres_changes",{event:"*",schema:"public",table:"pvp",filter:"from_uid=eq."+S.uid},p=>{
     pvpLoad();
     /* 내가 건 신청이 수락되면 바로 들어간다 */
     const n=p.new;
     if(n&&n.status==="live"&&!PV&&!DU){
      if(n.kind==="duo")duoBegin(n.id,n.to_uid,n.to_name,true);
      else pvpBegin(n.id,n.to_uid,n.to_name,true);}})
   .subscribe(); }catch(e){}
}
function pvpUnwatch(){ try{ if(pvWatch)SB.removeChannel(pvWatch); }catch(e){} pvWatch=null; }

$("pvp").addEventListener("click",async e=>{
 const a=e.target.closest("[data-pva]");
 if(a){ const r=await pvpAccept(a.dataset.pva);
   if(r&&r.error)return toast(cloudErr(r.error));
   if(a.dataset.kind==="duo")duoBegin(a.dataset.pva,a.dataset.uid,a.dataset.nm,false);
   else pvpBegin(a.dataset.pva,a.dataset.uid,a.dataset.nm,false);
   return; }
 const c=e.target.closest("[data-pvc]");
 if(c){ await pvpCancel(c.dataset.pvc); pvpLoad(); }
});

/* ── 대전 시작 ── */
function pvpBegin(mid,oppUid,oppName,host){
 if(PV)return;
 $("pvp").classList.remove("on");
 PV={mid,oppUid,oppName,host,ch:null,sendT:0,
     foe:{x:0,y:0,dir:0,slot:0,hp:1,hpMax:1,name:oppName,seen:0,alive:true},
     done:false,winner:null};
 try{
  PV.ch=SB.channel("pvp-"+mid,{config:{broadcast:{self:false}}})
   .on("broadcast",{event:"st"},p=>pvpOnState(p.payload))
   .on("broadcast",{event:"atk"},p=>pvpOnAtk(p.payload))
   .on("broadcast",{event:"die"},p=>pvpOnDie(p.payload))
   .subscribe();
 }catch(e){}
 openArena("pvp");
 if(BA){
  PV.foe.hpMax=PV.foe.hp=BA.p.hpMax;          // 정확한 값은 첫 상태 수신 때 갱신된다
  BA.pvp=PV;
 }
}
function pvpSend2(ev,payload){
 if(!PV||!PV.ch)return;
 try{PV.ch.send({type:"broadcast",event:ev,payload});}catch(e){}
}
/* 내 상태를 주기적으로 흘려 보낸다 — 15Hz 면 실선이 매끄럽게 이어진다 */
function pvpTick(dt){
 if(!PV||!BA||PV.done)return;
 PV.sendT-=dt;
 if(PV.sendT<=0){
  PV.sendT=1/15;
  pvpSend2("st",{x:Math.round(BA.p.x),y:Math.round(BA.p.y),
    dir:+BA.p.dir.toFixed(2),slot:BA.slot,hp:Math.round(BA.p.hp),hpMax:BA.p.hpMax,
    t:BA.team.map(v=>v.s.n)});
 }
 if(PV.foe.seen>0)PV.foe.seen-=dt;
 const s=PV.foe.sw; if(s){s.t+=dt; if(s.t>=s.d)PV.foe.sw=null;}   // 상대의 칼도 실제로 휘둘러진다
}
/* 상대가 지금 들고 있는 검 — 색·모션·서명·이름이 전부 여기서 나온다 */
function pvpFoeSword(){
 const f=PV&&PV.foe;
 return swordLook(f&&f.team&&f.team[f.slot],"#ff7a6a");
}
function pvpOnState(p){
 if(!PV||!p)return;
 const f=PV.foe;
 f.x=p.x;f.y=p.y;f.dir=p.dir;f.slot=p.slot;f.hp=p.hp;f.hpMax=p.hpMax||f.hpMax;f.seen=1.2;
 /* 한 번만 세우고 마는 게 아니라 목록이 달라지면 다시 세운다 —
    첫 꾸러미를 놓치거나 어긋난 채로 들어오면 판이 끝날 때까지 고쳐지지 않았다. */
 if(p.t&&!sameNames(p.t,f.names)){f.names=p.t;f.team=teamFromNames(p.t);}
}
/* 내가 휘두른 것을 알린다 — 맞았는지는 상대가 판정한다 */
function pvpOnSwing(mo,dmg,tr,dir,sig){
 if(!PV||PV.done)return;
 pvpSend2("atk",{mo,dmg:Math.round(dmg),tr:tr||"",dir:+dir.toFixed(2),
   x:Math.round(BA.p.x),y:Math.round(BA.p.y),sig:sig||""});
}
/* 상대의 공격이 나에게 닿았는지 내 화면 기준으로 판정한다 */
function pvpOnAtk(a){
 if(!PV||!BA||PV.done)return;
 /* 먼저 보이게 한다 — 판정과 무관하게 상대가 뭘 했는지는 화면에 나와야 한다.
    이게 없어서 상대는 가만히 서 있는데 체력만 깎이는 것처럼 보였다. */
 const sw=pvpFoeSword(), col=sw.col;
 PV.foe.sw={t:0,d:.26,mo:a.mo};
 arFxOnly(a.mo,a.dir,a.x,a.y,col,a.sig);
 /* 조각을 쏘는 검은 탄이 실제로 날아온다 — 닿으면 그때 내가 맞았다고 본다 */
 if(a.mo==="shard")arFoeBullet(a.x,a.y,a.dir,a.dmg*.55,col,0);
 if(a.sig==="glx")for(let i=0;i<3;i++)
  arFoeBullet(a.x,a.y,a.dir+(i-1)*.34,a.dmg*.22,col,1,380);
 if(BA.p.inv>0)return;
 const P=BA.p;
 const REACH={slash:80,sweep:112,thrust:140,cone:92,lunge:74,double:78,blink:86,shard:0};
 const HALF={slash:.62,sweep:1.15,thrust:.2,cone:.85,lunge:.7,double:.5,blink:.8};
 let hit=false;
 if(a.mo==="thrust"||a.mo==="lunge"||a.mo==="blink"){
  /* 앞으로 나아가는 공격은 지나간 선으로 판정 */
  const L=a.mo==="thrust"?140:(a.mo==="blink"?78:42);
  const x1=a.x+Math.cos(a.dir)*L, y1=a.y+Math.sin(a.dir)*L;
  const dx=x1-a.x,dy=y1-a.y,L2=dx*dx+dy*dy;
  let t=L2?((P.x-a.x)*dx+(P.y-a.y)*dy)/L2:0;t=Math.max(0,Math.min(1,t));
  hit=Math.hypot(P.x-(a.x+dx*t),P.y-(a.y+dy*t))<30+P.r;
 }
 if(!hit&&REACH[a.mo]){
  const d=Math.hypot(P.x-a.x,P.y-a.y);
  if(d<REACH[a.mo]+P.r){
   let ang=Math.atan2(P.y-a.y,P.x-a.x)-a.dir;
   while(ang>Math.PI)ang-=6.283; while(ang<-Math.PI)ang+=6.283;
   hit=Math.abs(ang)<=(HALF[a.mo]||.6);}
 }
 if(!hit)return;
 arHurt(a.dmg*0.55);                          // 대인 피해는 몬스터보다 낮게 — 한 방에 끝나면 재미없다
 if(a.sig==="tdz")BA.p.slowed=.6;
}
function pvpOnDie(p){
 if(!PV||PV.done)return;
 PV.foe.alive=false;
 pvpFinish(S.uid);                            // 상대가 죽었다 → 내가 이겼다
}
/* ── 끝맺음 ── */
function pvpFinish(winner){
 if(!PV||PV.done)return;
 PV.done=true;PV.winner=winner;
 const win=winner===S.uid;
 if(BA){BA.over=true;
  pvpResultCard(win,null);
  $("ar-over").classList.add("on");
 }
 if(win)sfxReward(); else sfxDeath();
 pvpSettle(PV.mid,winner,win);
}
/* 정산 — 양쪽 보고가 모일 때까지 기다렸다가 결과를 받아 온다.
   pvp_report 는 (판, 보고자) 가 기본키라 몇 번을 다시 불러도 한 번만 센다.
   그래서 "아직 상대 보고가 없다(waiting)"면 그냥 다시 부르면 된다. */
let pvBusy=false;
async function pvpSettle(mid,winner,win){
 if(pvBusy)return;
 pvBusy=true;
 CLOUD_HOLD++;                                   // 정산 끝나기 전에 옛 저장을 올리면 되돌아간다
 let res=null;
 try{
  for(let i=0;i<12;i++){
   const r=await pvpReport(mid,winner);
   if(r&&r.error){res={ok:false,why:"server",msg:(r.error.message||String(r.error))};break;}
   res=(r&&r.data)||null;
   if(!res){res={ok:false,why:"응답 없음"};break;}
   if(res.ok||res.why!=="waiting")break;
   await new Promise(s=>setTimeout(s,i<4?700:1500));
  }
 }catch(e){ res={ok:false,why:"통신 오류"}; }
 try{ await pullCloud(); }catch(e){}
 CLOUD_HOLD--;
 pvBusy=false;
 renderHUD();
 if(PV&&BA&&BA.over)pvpResultCard(win,res,{mid,winner});
}
const PV_WHY={waiting:"상대의 결과가 오지 않았습니다. 상대가 보내는 대로 서버가 정산하며, 다음에 접속할 때 반영됩니다.",
 mismatch:"양쪽 보고가 어긋나 무효 처리했습니다.",
 void:"무효가 된 판입니다.", "not live":"이미 끝난 판입니다.", "no match":"판을 찾지 못했습니다.",
 server:"서버가 정산을 거절했습니다."};
function pvpResultCard(win,res,again){
 const done=res&&res.ok;
 /* 서버 오류 원문은 접어 둔다 — 화면을 도배하지 않으면서도
    무엇이 틀렸는지는 열어 볼 수 있어야 고칠 수 있다. */
 const detail=(res&&res.msg)?`<details class="ar-why"><summary>자세히</summary>
     <code>${esc2(res.msg).slice(0,300)}</code></details>`:"";
 const amt=done?`<div class="ar-gain">
     <div><b>${win?"+":"−"}${fmt(res.gold||0)}</b><span>주화</span></div>
     <div><b>💎 ${win?"+":"−"}${fmt(res.gems||0)}</b><span>보석</span></div></div>`
   : `<p class="ar-no">${res?(PV_WHY[res.why]||res.why||"정산하지 못했습니다"):"정산 중…"}</p>${detail}`;
 /* 실패했으면 다시 싸우지 않고도 정산만 다시 걸 수 있어야 한다 */
 const retry=(res&&!res.ok&&again)?`<button class="mini" id="ar-retry">정산 다시 시도</button>`:"";
 $("ar-over").innerHTML=`<div class="ar-res">
   <div class="ar-rt">${win?"승 리":"패 배"}</div>
   <div class="ar-rw"><b>${esc2(PV?PV.oppName:"")}</b><span>상대</span></div>
   ${amt}
   <div class="btn-row">${retry}<button class="buy" id="ar-close">돌아가기</button></div></div>`;
 const b=$("ar-close");
 if(b)b.onclick=()=>{pvpEndSession();closeArena();renderBattle();};
 const rb=$("ar-retry");
 if(rb)rb.onclick=()=>{pvpResultCard(win,null,again);pvpSettle(again.mid,again.winner,win);};
}
function pvpEndSession(){
 if(!PV)return;
 try{ if(PV.ch)SB.removeChannel(PV.ch); }catch(e){}
 PV=null; if(BA)BA.pvp=null;
}
/* 아레나가 내 죽음을 알릴 때 */
function pvpOnMyDeath(){
 if(!PV||PV.done)return;
 pvpSend2("die",{});
 pvpFinish(PV.oppUid);
}
/* ── 상대 그리기 ── 주인공과 같은 함수를 쓴다. 아우라도 검도 그대로 따라온다 */
function pvpDrawFoe(g){
 if(!PV||!BA)return;
 const f=PV.foe;
 if(f.seen<=0||!f.alive)return;
 const sw=pvpFoeSword();
 arAuraAt(g,f.x,f.y,f.dir,sw.tr,sw.col,sw.sig);
 g.fillStyle="rgba(0,0,0,.34)";
 g.beginPath();g.ellipse(f.x,f.y+13,15,5.5,0,0,6.283);g.fill();
 arDrawFighter(g,f.x,f.y,f.dir,sw,f.sw,"foe",0);
 /* 머리 위 이름·검·체력 — 상대가 무엇을 들었는지 글자로도 보여야
    "왜 나랑 같은 검처럼 보이지" 를 화면에서 바로 가릴 수 있다 */
 g.textAlign="center";
 g.font="500 10px system-ui";
 g.fillStyle="#ffd0cc";g.fillText(f.name,f.x,f.y-48);
 g.font="500 9px system-ui";
 g.fillStyle=sw.col;g.globalAlpha=.9;
 g.fillText(sw.nm,f.x,f.y-36);g.globalAlpha=1;
 g.fillStyle="rgba(0,0,0,.6)";g.fillRect(f.x-24,f.y-26,48,4);
 g.fillStyle="#ff7a6a";g.fillRect(f.x-24,f.y-26,48*Math.max(0,f.hp/f.hpMax),4);
}
