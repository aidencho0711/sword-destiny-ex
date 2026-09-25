/* ═════════ 듀얼 · 2인 협력 ═════════
   적을 양쪽이 각자 돌리면 절대 같은 화면이 안 나온다. 그래서 방을 연 쪽(호스트)이
   적·탄·위험지대를 전담하고, 상대는 받아서 그리기만 한다.

   반대로 "내가 맞았는가"는 각자 제 화면에서 판정한다(1vs1 과 같은 이유).
   손님의 공격은 호스트에게 보내 호스트가 제 적에게 적용한다 —
   적의 주인이 하나여야 체력이 어긋나지 않는다.

   휘두르기는 양쪽 다 서로에게 알린다. 피해를 두 번 먹이려는 게 아니라
   (그건 호스트가 한 번만 한다) 동료가 뭘 하고 있는지 화면에 보이게 하려는 것이다. */

let DU=null;

function duoOpen(){
 if((S.team||[]).length<TEAM_SIZE){toast("출전 검 3자루를 먼저 정하세요");return;}
 const el=$("pvp");
 const cloud=S.cloud&&typeof cloudReady==="function"&&cloudReady();
 el.innerHTML=`<div class="pv-head"><h2>듀 　얼</h2><button id="pv-x">닫기</button></div>
  <div class="card">
    <p>둘이 함께 웨이브를 버팁니다. 방을 연 쪽이 적을 맡으므로
       <b>연결이 좋은 쪽이 신청</b>하는 편이 낫습니다.</p>
    ${cloud?`<div class="pv-find">
      <input id="pv-name" placeholder="함께할 계정 이름" autocomplete="off">
      <button class="buy" id="pv-go">신청</button>
    </div>`:`<p class="pv-note">클라우드 로그인을 하면 친구와 함께할 수 있습니다.</p>`}
  </div>
  <div class="card">
    <div class="card-top"><h3>AI 동료</h3><span class="lv">혼자서도</span></div>
    <p>함께할 사람이 없을 때 동료를 하나 붙여 나갑니다.
       내가 안 쓰는 검 중에서 세 자루를 골라 듭니다.</p>
    <button class="buy use" id="pv-bot">A I 　동 료 와 　시 작</button>
  </div>
  ${cloud?`<div class="sec">주고받은 신청</div>
  <div id="pv-list" class="pv-list"></div>`:""}
  <div class="card pv-note">보상은 <b>둘 다</b> 도달 웨이브 기준으로 받습니다.
    <b>한 명이 쓰러지면</b> 그 자리에서 끝나고 정산합니다.</div>`;
 el.classList.add("on");
 $("pv-x").onclick=()=>{el.classList.remove("on");pvpUnwatch();};
 $("pv-bot").onclick=()=>{el.classList.remove("on");pvpUnwatch();duoBotStart();};
 if(cloud){ $("pv-go").onclick=()=>duoSend(); pvpLoad();pvpWatch(); }
}
/* 혼자 하는 듀얼 — 통신을 전혀 쓰지 않는다 */
function duoBotStart(){
 if(DU||PV)return;
 openArena("duo",{bot:1});
 /* 들어가지 못했거나 동료를 못 세웠으면 빈 아레나가 열린 채로 남는다 —
    closeArena 는 BA 가 없으면 아무것도 하지 않으므로 화면은 직접 닫는다. */
 if(!BA||!BA.bot){
  toast(BA?"동료로 세울 검이 없습니다":"출전 편성을 다시 확인하세요");
  closeArena();$("arena").classList.remove("on");$("arena").innerHTML="";renderBattle();}
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
     mate:{x:0,y:0,dir:0,slot:0,hp:1,hpMax:1,name:mateName,seen:0,alive:true,team:null,sw:null}};
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
 const s=DU.mate.sw; if(s){s.t+=dt; if(s.t>=s.d)DU.mate.sw=null;}
}
/* 동료가 지금 들고 있는 검 — 색·모션·특징·서명·이름이 전부 여기서 나온다 */
function duoMateSword(){
 const f=DU&&DU.mate;
 return swordLook(f&&f.team&&f.team[f.slot],"#8fd08a");
}
function duoOnState(p){
 if(!DU||!p||DU.done)return;
 const m=DU.mate;
 m.x=p.x;m.y=p.y;m.dir=p.dir;m.slot=p.slot;m.hp=p.hp;m.hpMax=p.hpMax||m.hpMax;
 m.alive=p.al!==false;m.seen=1.2;
 if(p.t&&!sameNames(p.t,m.names)){m.names=p.t;m.team=teamFromNames(p.t);}
 if(!m.alive)duoFinishBoth();                       // 한 명이 누우면 거기서 끝이다
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
/* 동료의 공격 — 적에게 먹이는 건 호스트만, 그리는 건 양쪽 다 */
function duoOnAtk(a){
 if(!DU||!BA||DU.done||!a)return;
 const sw=duoMateSword();
 /* ① 손님이 보낸 것은 호스트가 제 적에게 실제로 적용한다 */
 if(DU.host&&!a.g){
  if(a.mo==="point"){                                // 손님의 탄·장판이 닿은 지점
   for(const o of BA.mobs) if(Math.hypot(o.x-a.x,o.y-a.y)<o.r+14){arHit(o,a.dmg,null);break;}
   return;}
  /* 파편은 손님 쪽 탄이 제 손으로 보고한다 — 여기서 또 쏘면 두 번 맞는다 */
  if(a.mo!=="shard"){
   const P=BA.p, sx=P.x, sy=P.y, sd=P.dir;
   P.x=a.x;P.y=a.y;P.dir=a.dir;                      // 잠깐 동료 자리에 서서 판정한다
   arStandIn(sw.col,a.sig||null,1);                  // 자국은 동료의 색, 탄은 유령으로
   try{ arMotion(a.mo,a.dmg,a.tr||null,a.dir); }catch(e){}
   arStandOut();
   P.x=sx;P.y=sy;P.dir=sd;
   DU.mate.sw={t:0,d:.26,mo:a.mo};
   return;}                                          // arMotion 이 이미 자국을 남겼다
 }
 if(a.mo==="point")return;                           // 지점 보고는 그릴 게 없다
 /* ② 그리기 — 동료가 뭘 하는지는 양쪽 화면에 다 보여야 한다 */
 DU.mate.sw={t:0,d:.26,mo:a.mo};
 arFxOnly(a.mo,a.dir,a.x,a.y,sw.col,a.sig);
 if(a.mo==="shard")arGhostBullet(a.x,a.y,a.dir,sw.col,a.sig==="glx");
 if(a.sig==="glx")for(let i=0;i<3;i++)
  arGhostBullet(a.x,a.y,a.dir+(i-1)*.34,sw.col,1,380);
}
/* 내가 휘두른 것을 알린다 — 손님 것은 호스트가 먹이고, 호스트 것은 손님이 그린다 */
function duoOnSwing(mo,dmg,tr,dir,sig){
 if(!DU||DU.done)return;
 duoSend2("atk",{mo,dmg:Math.round(dmg),tr:tr||"",dir:+dir.toFixed(2),
   x:Math.round(BA.p.x),y:Math.round(BA.p.y),sig:sig||"",g:DU.host?1:0});
}
/* ── 끝맺음 ── 한 명이라도 쓰러지면 그 자리에서 끝난다 */
function duoFinishBoth(){
 if(!DU||DU.done||!BA)return;
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
function duoOnMyDown(){
 if(!DU||DU.done||!BA)return;
 BA.p.hp=0;
 duoSend2("st",{x:Math.round(BA.p.x),y:Math.round(BA.p.y),dir:+BA.p.dir.toFixed(2),
   slot:BA.slot,hp:0,hpMax:BA.p.hpMax,al:false,t:BA.team.map(v=>v.s.n)});
 duoFinishBoth();
}
function duoEndSession(){
 if(!DU)return;
 try{ if(DU.ch)SB.removeChannel(DU.ch); }catch(e){}
 DU=null; if(BA)BA.duo=null;
}
/* ── 동료 그리기 ── 주인공과 같은 함수를 쓴다. 아우라도 검도 그대로 따라온다 */
function duoDrawMate(g){
 if(!DU||!BA)return;
 const f=DU.mate;
 if(f.seen<=0)return;
 const sw=duoMateSword();
 if(f.alive)arAuraAt(g,f.x,f.y,f.dir,sw.tr,sw.col,sw.sig);
 g.fillStyle="rgba(0,0,0,.34)";
 g.beginPath();g.ellipse(f.x,f.y+13,15,5.5,0,0,6.283);g.fill();
 arDrawFighter(g,f.x,f.y,f.dir,sw,f.sw,"mate",f.alive?0:.4);
 g.textAlign="center";g.font="500 10px system-ui";
 g.fillStyle=f.alive?"#b8f0c8":"#8a94a6";
 g.fillText(f.alive?f.name:f.name+" (쓰러짐)",f.x,f.y-48);
 if(!f.alive)return;
 g.font="500 9px system-ui";
 g.fillStyle=sw.col;g.globalAlpha=.9;
 g.fillText(sw.nm,f.x,f.y-36);g.globalAlpha=1;
 g.fillStyle="rgba(0,0,0,.6)";g.fillRect(f.x-24,f.y-26,48,4);
 g.fillStyle="#7ce08a";g.fillRect(f.x-24,f.y-26,48*Math.max(0,f.hp/f.hpMax),4);
}
