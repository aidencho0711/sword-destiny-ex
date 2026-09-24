/* ═════════ 듀얼 · 2인 협력 ═════════
   적을 양쪽이 각자 돌리면 절대 같은 화면이 안 나온다. 그래서 방을 연 쪽(호스트)이
   적·탄·위험지대를 전담하고, 상대는 받아서 그리기만 한다.

   반대로 "내가 맞았는가"는 각자 제 화면에서 판정한다(1vs1 과 같은 이유).
   손님의 공격은 호스트에게 보내 호스트가 제 적에게 적용한다 —
   적의 주인이 하나여야 체력이 어긋나지 않는다. */

let DU=null;

function duoOpen(){
 if(!(S.cloud&&typeof cloudReady==="function"&&cloudReady())){toast("클라우드 로그인이 필요합니다");return;}
 if((S.team||[]).length<TEAM_SIZE){toast("출전 검 3자루를 먼저 정하세요");return;}
 const el=$("pvp");
 el.innerHTML=`<div class="pv-head"><h2>듀 　얼</h2><button id="pv-x">닫기</button></div>
  <div class="card">
    <p>둘이 함께 웨이브를 버팁니다. 방을 연 쪽이 적을 맡으므로
       <b>연결이 좋은 쪽이 신청</b>하는 편이 낫습니다.</p>
    <div class="pv-find">
      <input id="pv-name" placeholder="함께할 계정 이름" autocomplete="off">
      <button class="buy" id="pv-go">신청</button>
    </div>
  </div>
  <div class="sec">주고받은 신청</div>
  <div id="pv-list" class="pv-list"></div>
  <div class="card pv-note">보상은 <b>둘 다</b> 도달 웨이브 기준으로 받습니다.
    한 명이 쓰러져도 남은 한 명이 버티는 동안은 계속됩니다.</div>`;
 el.classList.add("on");
 $("pv-x").onclick=()=>{el.classList.remove("on");pvpUnwatch();};
 $("pv-go").onclick=()=>duoSend();
 pvpLoad();pvpWatch();
}
async function duoSend(){
 const nm=($("pv-name").value||"").trim();
 if(!nm)return toast("이름을 적어 주세요");
 if(nm===(S.acctName||""))return toast("자기 자신과는 할 수 없습니다");
 const r=await findUser(nm);
 if(r&&r.error)return toast(cloudErr({message:r.error}));
 if(!r||!r.uid)return toast("그런 이름의 계정이 없습니다");
 const c=await pvpChallenge(r.uid,nm,"duo");
 if(c&&c.error)return toast(cloudErr(c.error));
 toast("신청했습니다 · "+nm);
 $("pv-name").value="";pvpLoad();
}

/* ── 시작 ── */
function duoBegin(mid,mateUid,mateName,host){
 if(DU||PV)return;
 $("pvp").classList.remove("on");
 DU={mid,mateUid,mateName,host,ch:null,sendT:0,snapT:0,done:false,
     mate:{x:0,y:0,dir:0,slot:0,hp:1,hpMax:1,name:mateName,seen:0,alive:true,team:null}};
 try{
  DU.ch=SB.channel("duo-"+mid,{config:{broadcast:{self:false}}})
   .on("broadcast",{event:"st"},p=>duoOnState(p.payload))
   .on("broadcast",{event:"snap"},p=>duoOnSnap(p.payload))
   .on("broadcast",{event:"atk"},p=>duoOnAtk(p.payload))
   .on("broadcast",{event:"end"},p=>duoOnEnd(p.payload))
   .subscribe();
 }catch(e){}
 openArena("duo");
 if(BA){BA.duo=DU;DU.mate.hpMax=DU.mate.hp=BA.p.hpMax;}
}
function duoSend2(ev,payload){
 if(!DU||!DU.ch)return;
 try{DU.ch.send({type:"broadcast",event:ev,payload});}catch(e){}
}
function duoTick(dt){
 if(!DU||!BA||DU.done)return;
 DU.sendT-=dt;
 if(DU.sendT<=0){                                   // 내 캐릭터 — 양쪽 다 보낸다
  DU.sendT=1/15;
  duoSend2("st",{x:Math.round(BA.p.x),y:Math.round(BA.p.y),dir:+BA.p.dir.toFixed(2),
    slot:BA.slot,hp:Math.round(BA.p.hp),hpMax:BA.p.hpMax,al:BA.p.hp>0,
    t:BA.team.map(v=>v.s.n)});
 }
 if(DU.host){                                        // 적은 호스트만 보낸다
  DU.snapT-=dt;
  if(DU.snapT<=0){
   DU.snapT=1/10;
   duoSend2("snap",{
     w:BA.wave,
     m:BA.mobs.map(o=>[Math.round(o.x),Math.round(o.y),Math.round(o.r),
       Math.round(o.hp/o.hpMax*100),o.boss?("B"+o.B.id):o.m.id,o.hit>0?1:0,
       o.boss?Math.round((o.spin||0)*100):0]),
     b:BA.bul.filter(x=>x.foe).map(x=>[Math.round(x.x),Math.round(x.y),x.r,x.c]),
     h:(BA.haz||[]).map(x=>[x.k,Math.round(x.x),Math.round(x.y),Math.round(x.r||0),
       Math.round(x.x1||0),Math.round(x.y1||0),x.w||0,+x.t.toFixed(2),x.warn,x.c||""]),
   });
  }
 }
 if(DU.mate.seen>0)DU.mate.seen-=dt;
}
function duoOnState(p){
 if(!DU||!p)return;
 const m=DU.mate;
 m.x=p.x;m.y=p.y;m.dir=p.dir;m.slot=p.slot;m.hp=p.hp;m.hpMax=p.hpMax||m.hpMax;
 m.alive=p.al!==false;m.seen=1.2;
 if(p.t&&!m.team)m.team=p.t.map(n=>{const s=SWORDS.find(x=>x.n===n);return s?{s,st:battleStat(s)}:null;}).filter(Boolean);
 if(!m.alive&&DU.host)duoCheckWipe();
}
/* 손님이 받는 적 스냅샷 — 그리기 전용이다 */
function duoOnSnap(p){
 if(!DU||DU.host||!BA||!p)return;
 BA.wave=p.w;
 const w=$("ar-wave"); if(w)w.textContent=p.w;
 BA.mobs=p.m.map(a=>{
  const boss=String(a[4])[0]==="B";
  const B=boss?BOSSM[String(a[4]).slice(1)]:null;
  const m=boss?{id:"boss",n:B?B.n:"",c:B?B.c:"#fff",r:a[2]}:(MOBM[a[4]]||MOBS[0]);
  /* 피해량은 보내지 않고 종류+웨이브로 되살린다 — 스냅샷을 가볍게 둔다 */
  const dmg=(boss?(B?B.dmg:20):(MOBM[a[4]]?MOBM[a[4]].dmg:10))*waveDmg(p.w);
  return {m,B,boss,x:a[0],y:a[1],r:a[2],hp:a[3],hpMax:100,
          hit:a[5]?.1:0,t:0,spin:(a[6]||0)/100,dmg,spd:0,st:0,copies:null};
 });
 BA.boss=BA.mobs.find(o=>o.boss)||null;
 const bd=12*waveDmg(p.w);
 BA.bul=BA.bul.filter(x=>!x.foe)                      // 내 탄은 그대로 두고 적 탄만 갈아 끼운다
   .concat(p.b.map(a=>({x:a[0],y:a[1],r:a[2],c:a[3],foe:1,vx:0,vy:0,dmg:bd,t:0})));
 BA.haz=p.h.map(a=>({k:a[0],x:a[1],y:a[2],r:a[3],x1:a[4],y1:a[5],w:a[6],
   t:a[7],warn:a[8],live:.28,dmg:0,fired:true,c:a[9]||undefined}));
}
/* 손님의 공격 — 적의 주인인 호스트가 적용한다 */
function duoOnAtk(a){
 if(!DU||!DU.host||!BA||DU.done)return;
 if(a.mo==="point"){                                // 손님의 탄·장판이 닿은 지점
  for(const o of BA.mobs) if(Math.hypot(o.x-a.x,o.y-a.y)<o.r+14){arHit(o,a.dmg,null);break;}
  return;}
 /* 파편은 손님 쪽 탄이 제 손으로 보고한다 — 여기서 또 쏘면 두 번 맞는다 */
 if(a.mo==="shard")return;
 const P=BA.p, sx=P.x, sy=P.y, sd=P.dir;
 P.x=a.x;P.y=a.y;P.dir=a.dir;                       // 잠깐 손님 자리에 서서 판정한다
 try{ arMotion(a.mo,a.dmg,a.tr||null,a.dir); }catch(e){}
 P.x=sx;P.y=sy;P.dir=sd;
}
function duoOnSwing(mo,dmg,tr,dir){
 if(!DU||DU.done)return;
 if(DU.host)return;                                  // 호스트는 이미 제 손으로 적용했다
 duoSend2("atk",{mo,dmg:Math.round(dmg),tr:tr||"",dir:+dir.toFixed(2),
   x:Math.round(BA.p.x),y:Math.round(BA.p.y)});
}
/* 둘 다 쓰러지면 끝 — 판정은 호스트가 한다 */
function duoCheckWipe(){
 if(!DU||!DU.host||DU.done||!BA)return;
 if(BA.p.hp>0||DU.mate.alive)return;
 duoSend2("end",{w:BA.wave});
 duoFinish(BA.wave);
}
function duoOnEnd(p){
 if(!DU||DU.done)return;
 duoFinish((p&&p.w)||(BA?BA.wave:1));
}
function duoFinish(wave){
 if(!DU||DU.done)return;
 DU.done=true;
 if(BA){BA.wave=wave;arEnd(false);}                  // 보상은 각자 제 계정으로
}
/* 내가 쓰러졌을 때 — 듀얼은 바로 끝나지 않는다 */
function duoOnMyDown(){
 if(!DU||DU.done||!BA)return;
 BA.p.hp=0;
 duoSend2("st",{x:Math.round(BA.p.x),y:Math.round(BA.p.y),dir:+BA.p.dir.toFixed(2),
   slot:BA.slot,hp:0,hpMax:BA.p.hpMax,al:false,t:BA.team.map(v=>v.s.n)});
 if(DU.host)duoCheckWipe();
 else if(!DU.mate.alive)duoFinish(BA.wave);          // 둘 다 누웠는데 호스트가 조용하면
}
function duoEndSession(){
 if(!DU)return;
 try{ if(DU.ch)SB.removeChannel(DU.ch); }catch(e){}
 DU=null; if(BA)BA.duo=null;
}
/* ── 동료 그리기 ── */
function duoDrawMate(g){
 if(!DU||!BA)return;
 const f=DU.mate;
 if(f.seen<=0)return;
 const col=f.team&&f.team[f.slot]?RARITY[f.team[f.slot].s.t].c:"#8fd08a";
 g.save();
 if(!f.alive)g.globalAlpha=.4;
 g.fillStyle="rgba(0,0,0,.34)";
 g.beginPath();g.ellipse(f.x,f.y+13,15,5.5,0,0,6.283);g.fill();
 g.translate(f.x,f.y);g.rotate(f.dir+Math.PI/2);
 g.fillStyle="rgba(20,34,26,.9)";
 g.beginPath();g.moveTo(-12,2);g.quadraticCurveTo(0,20,12,2);
 g.quadraticCurveTo(0,10,-12,2);g.closePath();g.fill();
 const bg=g.createLinearGradient(0,-12,0,12);
 bg.addColorStop(0,"#e6fff0");bg.addColorStop(1,"#8fb49c");
 g.fillStyle=bg;g.strokeStyle="rgba(10,14,24,.8)";g.lineWidth=2;
 g.beginPath();g.ellipse(0,0,11,12.5,0,0,6.283);g.fill();g.stroke();
 g.fillStyle=col;
 g.beginPath();g.ellipse(-10,1,4.2,5.4,-.3,0,6.283);g.fill();
 g.beginPath();g.ellipse(10,1,4.2,5.4,.3,0,6.283);g.fill();
 g.fillStyle="#eef7f0";
 g.beginPath();g.arc(0,-3,6.4,0,6.283);g.fill();g.stroke();
 if(f.alive){
  g.save();g.translate(9,0);g.rotate(-0.42);
  g.shadowColor=col;g.shadowBlur=6;
  const mo=f.team&&f.team[f.slot]?f.team[f.slot].st.arch.mo:"slash";
  const gl=g.createLinearGradient(0,-42,0,0);
  gl.addColorStop(0,"#ffffff");gl.addColorStop(.5,col);gl.addColorStop(1,"#6d7689");
  g.fillStyle=gl;g.strokeStyle="rgba(8,12,20,.85)";g.lineWidth=1.4;
  arBladePath(g,mo,42);g.fill();g.stroke();g.shadowBlur=0;
  g.restore();
 }
 g.restore();g.globalAlpha=1;
 g.textAlign="center";g.font="500 10px system-ui";
 g.fillStyle=f.alive?"#b8f0c8":"#8a94a6";
 g.fillText(f.alive?f.name:f.name+" (쓰러짐)",f.x,f.y-30);
 if(f.alive){
  g.fillStyle="rgba(0,0,0,.6)";g.fillRect(f.x-24,f.y-26,48,4);
  g.fillStyle="#7ce08a";g.fillRect(f.x-24,f.y-26,48*Math.max(0,f.hp/f.hpMax),4);}
}
