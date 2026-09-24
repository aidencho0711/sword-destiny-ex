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
 const u=r&&r.data&&r.data[0];
 if(!u)return toast("그런 이름의 계정이 없습니다");
 const c=await pvpChallenge(u.uid,nm);
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
    <div class="pv-who">${mine?"→ "+esc2(m.to_name):"← "+esc2(m.from_name)}</div>
    <div class="pv-act">${mine
      ? `<span>수락 기다리는 중</span><button class="mini" data-pvc="${m.id}">취소</button>`
      : `<button class="buy" data-pva="${m.id}" data-uid="${m.from_uid}" data-nm="${esc2(m.from_name)}">수락하고 시작</button>`}</div>
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
     if(n&&n.status==="live"&&!PV)pvpBegin(n.id,n.to_uid,n.to_name,true);})
   .subscribe(); }catch(e){}
}
function pvpUnwatch(){ try{ if(pvWatch)SB.removeChannel(pvWatch); }catch(e){} pvWatch=null; }

$("pvp").addEventListener("click",async e=>{
 const a=e.target.closest("[data-pva]");
 if(a){ const r=await pvpAccept(a.dataset.pva);
   if(r&&r.error)return toast(cloudErr(r.error));
   pvpBegin(a.dataset.pva,a.dataset.uid,a.dataset.nm,false); return; }
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
}
function pvpOnState(p){
 if(!PV||!p)return;
 const f=PV.foe;
 f.x=p.x;f.y=p.y;f.dir=p.dir;f.slot=p.slot;f.hp=p.hp;f.hpMax=p.hpMax||f.hpMax;f.seen=1.2;
 if(p.t&&!f.team)f.team=p.t.map(n=>{const s=SWORDS.find(x=>x.n===n);return s?{s,st:battleStat(s)}:null;}).filter(Boolean);
}
/* 내가 휘두른 것을 알린다 — 맞았는지는 상대가 판정한다 */
function pvpOnSwing(mo,dmg,tr,dir,sig){
 if(!PV||PV.done)return;
 pvpSend2("atk",{mo,dmg:Math.round(dmg),tr:tr||"",dir:+dir.toFixed(2),
   x:Math.round(BA.p.x),y:Math.round(BA.p.y),sig:sig||""});
}
/* 상대의 공격이 나에게 닿았는지 내 화면 기준으로 판정한다 */
function pvpOnAtk(a){
 if(!PV||!BA||PV.done||BA.p.inv>0)return;
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
 pvpReport(PV.mid,winner).catch(()=>{});
 const win=winner===S.uid;
 if(BA){BA.over=true;
  $("ar-over").innerHTML=`<div class="ar-res">
    <div class="ar-rt">${win?"승 리":"패 배"}</div>
    <div class="ar-rw"><b>${esc2(PV.oppName)}</b><span>상대</span></div>
    <p class="ar-no">정산은 양쪽 보고가 맞아떨어질 때 처리됩니다.<br>
      주화·보석은 잠시 뒤 반영됩니다.</p>
    <button class="buy" id="ar-close">돌아가기</button></div>`;
  $("ar-over").classList.add("on");
  $("ar-close").onclick=()=>{pvpEndSession();closeArena();renderBattle();};
 }
 if(win)sfxReward(); else sfxDeath();
 /* 잠시 뒤 서버 정산 결과를 받아 온다 */
 setTimeout(async()=>{ try{ await pullCloud(); renderHUD(); }catch(e){} },2500);
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
/* ── 상대 그리기 ── */
function pvpDrawFoe(g){
 if(!PV||!BA)return;
 const f=PV.foe;
 if(f.seen<=0||!f.alive)return;
 const col=f.team&&f.team[f.slot]?RARITY[f.team[f.slot].s.t].c:"#ff7a6a";
 g.save();
 g.fillStyle="rgba(0,0,0,.34)";
 g.beginPath();g.ellipse(f.x,f.y+13,15,5.5,0,0,6.283);g.fill();
 g.translate(f.x,f.y);g.rotate(f.dir+Math.PI/2);
 g.fillStyle="rgba(46,22,26,.9)";
 g.beginPath();g.moveTo(-12,2);g.quadraticCurveTo(0,20,12,2);
 g.quadraticCurveTo(0,10,-12,2);g.closePath();g.fill();
 const bg=g.createLinearGradient(0,-12,0,12);
 bg.addColorStop(0,"#ffd9d4");bg.addColorStop(1,"#b06a68");
 g.fillStyle=bg;g.strokeStyle="rgba(10,14,24,.8)";g.lineWidth=2;
 g.beginPath();g.ellipse(0,0,11,12.5,0,0,6.283);g.fill();g.stroke();
 g.fillStyle=col;
 g.beginPath();g.ellipse(-10,1,4.2,5.4,-.3,0,6.283);g.fill();
 g.beginPath();g.ellipse(10,1,4.2,5.4,.3,0,6.283);g.fill();
 g.fillStyle="#f7e6e4";
 g.beginPath();g.arc(0,-3,6.4,0,6.283);g.fill();g.stroke();
 g.save();g.translate(9,0);g.rotate(-0.42);
 g.shadowColor=col;g.shadowBlur=6;
 const mo=f.team&&f.team[f.slot]?f.team[f.slot].st.arch.mo:"slash";
 const gl=g.createLinearGradient(0,-42,0,0);
 gl.addColorStop(0,"#ffffff");gl.addColorStop(.5,col);gl.addColorStop(1,"#6d7689");
 g.fillStyle=gl;g.strokeStyle="rgba(8,12,20,.85)";g.lineWidth=1.4;
 arBladePath(g,mo,42);g.fill();g.stroke();g.shadowBlur=0;
 g.restore();g.restore();
 /* 머리 위 이름과 체력 */
 g.textAlign="center";g.font="500 10px system-ui";
 g.fillStyle="#ffd0cc";g.fillText(f.name,f.x,f.y-30);
 g.fillStyle="rgba(0,0,0,.6)";g.fillRect(f.x-24,f.y-26,48,4);
 g.fillStyle="#ff7a6a";g.fillRect(f.x-24,f.y-26,48*Math.max(0,f.hp/f.hpMax),4);
}
