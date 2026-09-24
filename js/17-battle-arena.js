/* ═════════ 배틀 아레나 ═════════
   탑다운 실시간. 여기만 캔버스 2D 로 그린다 —
   수십 마리가 매 프레임 움직이는 것을 DOM 으로 두면 합성 레이어가 폭발한다.

   조작: 왼쪽 아래 조이스틱으로 이동, 그 아래 1/2/3 으로 검 교체,
        오른쪽 아래 버튼을 누르고 있으면 검의 속도대로 계속 벤다. */
let BA=null;

function openArena(mode){
 if(!battleOpen()||((S.team||[]).length<TEAM_SIZE))return;
 const el=$("arena");
 el.innerHTML=`<canvas id="ar-cv"></canvas>
   <div class="ar-hud">
     <div class="ar-bar"><i id="ar-hp"></i></div>
     <div class="ar-wv"><b id="ar-wave">1</b><span>웨이브</span></div>
     <button class="ar-quit" id="ar-quit">나가기</button>
   </div>
   <div class="ar-over" id="ar-over"></div>`;
 el.classList.add("on");
 const cv=$("ar-cv"),ctx=cv.getContext("2d");
 /* 저장된 팀에 없는 이름이 섞여 있으면 여기서 걸러 낸다 — 검 이름이 바뀌거나
    다른 기기 저장이 들어오면 그대로 터진다. */
 const team=S.team.map(n=>SWORDS.find(x=>x.n===n)).filter(Boolean)
   .map(s=>({s,st:battleStat(s)}));
 if(team.length<TEAM_SIZE){toast("출전 검을 다시 정해 주세요");return;}
 BA={mode,cv,ctx,team,slot:0,over:false,raf:0,last:0,w:0,h:0,dpr:1,
     p:{x:0,y:0,vx:0,vy:0,r:15,dir:-Math.PI/2,hp:100,hpMax:100,inv:0,atkCd:0},
     mobs:[],bul:[],fx:[],num:[],
     wave:1,spawnLeft:0,spawnT:0,restT:1.6,rage:0,
     joy:{id:null,cx:0,cy:0,dx:0,dy:0},atk:{id:null},kills:0};
 /* 체력은 팀 평균 방어력을 타고 오른다 — 단단한 검을 넣으면 오래 버틴다 */
 const sum=teamSummary(S.team);
 BA.p.hpMax=BA.p.hp=Math.round(600+sum.def*14);
 arResize();
 addEventListener("resize",arResize);
 cv.addEventListener("pointerdown",arDown);
 cv.addEventListener("pointermove",arMove);
 cv.addEventListener("pointerup",arUp);
 cv.addEventListener("pointercancel",arUp);
 $("ar-quit").onclick=()=>arEnd(true);
 BA.last=performance.now();
 BA.raf=requestAnimationFrame(arLoop);
}
function closeArena(){
 if(!BA)return;
 cancelAnimationFrame(BA.raf);
 removeEventListener("resize",arResize);
 BA=null;$("arena").classList.remove("on");$("arena").innerHTML="";
}
function arResize(){
 if(!BA)return;
 const r=$("arena").getBoundingClientRect();
 BA.dpr=Math.min(2,devicePixelRatio||1);
 BA.w=r.width;BA.h=r.height;
 BA.cv.width=Math.round(r.width*BA.dpr);BA.cv.height=Math.round(r.height*BA.dpr);
 BA.cv.style.width=r.width+"px";BA.cv.style.height=r.height+"px";
 BA.ctx.setTransform(BA.dpr,0,0,BA.dpr,0,0);
 if(!BA.p.x){BA.p.x=BA.w/2;BA.p.y=BA.h/2;}
 arLayout();
}
/* 조작부 위치 — 화면이 바뀌어도 손가락 자리가 유지되도록 따로 잡는다 */
function arLayout(){
 const b=Math.max(74,Math.min(106,BA.w*0.25));
 BA.ui={jx:b*0.84,jy:BA.h-b*1.62,jr:b*0.60,
        bx:BA.w-b*0.80,by:BA.h-b*1.05,br:b*0.54,
        sx:b*0.44,sy:BA.h-b*0.42,sr:b*0.21};
}
const arDist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function arPt(e){const r=BA.cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function arDown(e){
 if(!BA||BA.over)return;
 const p=arPt(e),u=BA.ui;
 try{BA.cv.setPointerCapture(e.pointerId);}catch(_){}
 for(let i=0;i<3;i++){                                   // 검 교체 버튼
  const cx=u.sx+i*(u.sr*2.6);
  if(Math.hypot(p.x-cx,p.y-u.sy)<u.sr*1.3){arSlot(i);return;}}
 if(Math.hypot(p.x-u.bx,p.y-u.by)<u.br*1.35){BA.atk.id=e.pointerId;return;}
 if(p.x<BA.w*0.55){BA.joy.id=e.pointerId;BA.joy.cx=p.x;BA.joy.cy=p.y;BA.joy.dx=0;BA.joy.dy=0;return;}
 BA.atk.id=e.pointerId;
}
function arMove(e){
 if(!BA||BA.joy.id!==e.pointerId)return;
 const p=arPt(e);let dx=p.x-BA.joy.cx,dy=p.y-BA.joy.cy;
 const d=Math.hypot(dx,dy),m=BA.ui.jr;
 if(d>m){dx=dx/d*m;dy=dy/d*m;}
 BA.joy.dx=dx/m;BA.joy.dy=dy/m;
}
function arUp(e){
 if(!BA)return;
 if(BA.joy.id===e.pointerId){BA.joy.id=null;BA.joy.dx=0;BA.joy.dy=0;}
 if(BA.atk.id===e.pointerId)BA.atk.id=null;
}
function arSlot(i){
 if(!BA||i===BA.slot||!BA.team[i])return;
 BA.slot=i;BA.p.atkCd=Math.max(BA.p.atkCd,0.18);        // 교체 직후 한 박자 쉰다
 BA.fx.push({k:"ring",x:BA.p.x,y:BA.p.y,t:0,d:.3,c:RARITY[BA.team[i].s.t].c});
}
const arCur=()=>BA.team[BA.slot];
const arCol=()=>RARITY[arCur().s.t].c;

/* ── 진행 ── */
function arLoop(now){
 if(!BA)return;
 const dt=Math.min(.05,(now-BA.last)/1000);BA.last=now;
 if(!BA.over)arStep(dt);
 arDraw();
 BA.raf=requestAnimationFrame(arLoop);
}
function arSpawn(id,w){
 const m=MOBM[id],a=Math.random()*6.283;
 const R=Math.max(BA.w,BA.h)*0.62;
 const hp=Math.round(m.hp*waveHp(w));
 BA.mobs.push({m,x:BA.w/2+Math.cos(a)*R,y:BA.h/2+Math.sin(a)*R,
   r:m.r,hp,hpMax:hp,dmg:m.dmg*waveDmg(w),spd:m.spd,st:0,t:Math.random()*2,hit:0});
}
function arStep(dt){
 const P=BA.p;
 /* 웨이브 */
 if(BA.restT>0){
  BA.restT-=dt;
  if(BA.restT<=0){
   BA.spawnLeft=waveCount(BA.wave);BA.spawnT=0;
   if(isBossWave(BA.wave))BA.spawnLeft=Math.max(4,Math.floor(waveCount(BA.wave)*.5));}
 }else{
  BA.spawnT-=dt;
  if(BA.spawnLeft>0&&BA.spawnT<=0){
   const pool=waveMobs(BA.wave);
   arSpawn(pool[Math.floor(Math.random()*pool.length)],BA.wave);
   BA.spawnLeft--;BA.spawnT=Math.max(.16,.7-BA.wave*.012);}
  /* 남은 적이 안 잡히면 웨이브가 영영 안 끝난다 — 사수처럼 거리를 두는 적이 있으면
     가만히 있는 것만으로 교착이 된다. 시간이 끌리면 적이 점점 달아오르게 한다. */
  if(BA.spawnLeft<=0&&BA.mobs.length){
   BA.rage=Math.min(1.6,BA.rage+dt*0.055);
   /* 그래도 안 잡히면 웨이브가 안 끝난다. 달아오름이 최고에 닿은 뒤로는
      남은 적을 시간이 갉아먹어 교착이 반드시 풀리게 한다. */
   if(BA.rage>=1.6)for(const o of BA.mobs)o.hp-=o.hpMax*0.055*dt;
  }
  if(BA.spawnLeft<=0&&!BA.mobs.length){
   BA.wave++;BA.restT=1.5;BA.rage=0;
   const w=$("ar-wave"); if(w)w.textContent=BA.wave;
   BA.fx.push({k:"wave",t:0,d:1.2,n:BA.wave});}
 }
 /* 플레이어 */
 const cur=arCur(),tr=cur.st.trait.id;
 const base=196*(tr==="rush"?1.18:1);
 P.vx=BA.joy.dx*base;P.vy=BA.joy.dy*base;
 P.x=Math.max(P.r,Math.min(BA.w-P.r,P.x+P.vx*dt));
 P.y=Math.max(P.r,Math.min(BA.h-P.r,P.y+P.vy*dt));
 if(BA.joy.dx||BA.joy.dy)P.dir=Math.atan2(BA.joy.dy,BA.joy.dx);
 else{const n=arNearest();if(n)P.dir=Math.atan2(n.y-P.y,n.x-P.x);}
 if(P.inv>0)P.inv-=dt;
 if(P.atkCd>0)P.atkCd-=dt;
 if(BA.atk.id!==null&&P.atkCd<=0){arSwing();P.atkCd=1/cur.st.spd;}
 /* 몬스터 */
 for(let i=BA.mobs.length-1;i>=0;i--){
  const o=BA.mobs[i];
  arMobStep(o,dt);
  if(o.hit>0)o.hit-=dt;
  if(o.hp<=0){arKill(o,i);continue;}
  if(arDist(o,P)<o.r+P.r&&P.inv<=0){
   arHurt(o.dmg*(o.m.id==="bomber"?1:.45));
   if(o.m.id==="bomber"){o.hp=0;arKill(o,i);}}
 }
 /* 탄 */
 for(let i=BA.bul.length-1;i>=0;i--){
  const b=BA.bul[i];
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.t+=dt;
  if(b.t>3||b.x<-40||b.y<-40||b.x>BA.w+40||b.y>BA.h+40){BA.bul.splice(i,1);continue;}
  if(b.foe){ if(arDist(b,P)<P.r+b.r&&P.inv<=0){arHurt(b.dmg);BA.bul.splice(i,1);} }
  else{ let hitOne=false;
        for(const o of BA.mobs) if(arDist(b,o)<o.r+b.r){arHit(o,b.dmg,b.tr);hitOne=true;break;}
        if(hitOne&&b.tr!=="pierce")BA.bul.splice(i,1); }
 }
 /* 잔존 장판 */
 for(const f of BA.fx) if(f.k==="pool"){
  f.tick=(f.tick||0)+dt;
  if(f.tick>=.3){f.tick=0;
   for(const o of BA.mobs) if(arDist(o,f)<f.r+o.r)arHit(o,f.dmg,null);}}
 for(let i=BA.fx.length-1;i>=0;i--){const f=BA.fx[i];f.t+=dt;if(f.t>=f.d)BA.fx.splice(i,1);}
 for(let i=BA.num.length-1;i>=0;i--){const n=BA.num[i];n.t+=dt;n.y-=26*dt;if(n.t>.8)BA.num.splice(i,1);}
 const hb=$("ar-hp"); if(hb)hb.style.width=Math.max(0,P.hp/P.hpMax*100)+"%";
}
function arNearest(){
 let b=null,bd=1e9;
 for(const o of BA.mobs){const d=arDist(o,BA.p);if(d<bd){bd=d;b=o;}}
 return b;}
function arMobStep(o,dt){
 const P=BA.p;o.t+=dt;
 const ang=Math.atan2(P.y-o.y,P.x-o.x);
 const id=o.m.id, rg=1+BA.rage;
 if(id==="charger"){
  o.st-=dt;
  if(o.st<=0){ if(o.ch){o.ch=false;o.st=1.1;} else {o.ch=true;o.st=.45;o.ca=ang;} }
  const s=(o.ch?o.spd*4.2:o.spd*.35)*rg, a=o.ch?o.ca:ang;
  o.x+=Math.cos(a)*s*dt;o.y+=Math.sin(a)*s*dt;
 }else if(id==="shooter"){
  // 달아오를수록 거리를 좁힌다 — 끝까지 멀리 있으면 근접 검으로는 영영 못 잡는다
  const d=arDist(o,P),want=190*Math.max(.18,1-BA.rage*.55);
  const s=(d>want+30?o.spd:d<want-30?-o.spd:0)*rg;
  o.x+=Math.cos(ang)*s*dt;o.y+=Math.sin(ang)*s*dt;
  o.st-=dt;
  if(o.st<=0&&d<440){o.st=1.9;
   BA.bul.push({x:o.x,y:o.y,vx:Math.cos(ang)*230,vy:Math.sin(ang)*230,r:6,dmg:o.dmg,foe:1,t:0,c:o.m.c});}
 }else if(id==="drifter"){
  const wob=Math.sin(o.t*2.1)*1.1;
  o.x+=Math.cos(ang+wob)*o.spd*rg*dt;o.y+=Math.sin(ang+wob)*o.spd*rg*dt;
 }else{
  o.x+=Math.cos(ang)*o.spd*rg*dt;o.y+=Math.sin(ang)*o.spd*rg*dt;
 }
}
function arHurt(d){
 const P=BA.p;
 P.hp-=Math.max(1,Math.round(d));P.inv=.7;
 BA.fx.push({k:"hurt",t:0,d:.32});
 if(P.hp<=0){P.hp=0;arEnd(false);}
}
function arHit(o,dmg,tr){
 let d=dmg;
 if(tr==="crit"&&Math.random()<.16)d*=2;
 d=Math.max(1,Math.round(d));
 o.hp-=d;o.hit=.12;
 BA.num.push({x:o.x,y:o.y-o.r,v:d,t:0,c:d>dmg*1.5?"#ffd45e":"#fff"});
}
function arKill(o,i){
 BA.mobs.splice(i,1);BA.kills++;
 BA.fx.push({k:"pop",x:o.x,y:o.y,r:o.r,t:0,d:.32,c:o.m.c});
 if(arCur().st.trait.id==="drain")
  BA.p.hp=Math.min(BA.p.hpMax,BA.p.hp+Math.round(BA.p.hpMax*.012));
 if(o.m.id==="splitter"&&!o.small){
  for(let k=0;k<2;k++){const hp=Math.round(o.hpMax*.34);
   BA.mobs.push({m:o.m,x:o.x+(k?18:-18),y:o.y,r:o.r*.6,hp,hpMax:hp,
     dmg:o.dmg*.6,spd:o.spd*1.4,st:0,t:0,hit:0,small:1});}}
}
/* ── 공격 ── 날 모양 8종이 기본 모션, 그 위에 특징이 얹힌다 */
function arSwing(){
 const P=BA.p,c=arCur(),mo=c.st.arch.mo,tr=c.st.trait.id,dmg=c.st.dmg,dir=P.dir;
 arMotion(mo,dmg,tr,dir);
 if(tr==="twin")setTimeout(()=>{if(BA&&!BA.over)arMotion(mo,dmg,null,BA.p.dir);},110);
 if(tr==="echo")setTimeout(()=>{if(BA&&!BA.over)arMotion(mo,dmg*.6,null,BA.p.dir);},240);
 if(tr==="recast"&&Math.random()<.2)P.atkCd=0;
}
function arCone(reach,half,mul,dmg,tr,dir){
 const P=BA.p;let n=0;
 for(const o of BA.mobs){
  const d=arDist(o,P); if(d>reach+o.r)continue;
  let a=Math.atan2(o.y-P.y,o.x-P.x)-dir;
  while(a>Math.PI)a-=6.283; while(a<-Math.PI)a+=6.283;
  if(Math.abs(a)>half)continue;
  arHit(o,dmg*mul,tr);n++;
  if(tr==="burst")for(const q of BA.mobs)if(q!==o&&arDist(q,o)<56)arHit(q,dmg*.35,null);
  if(tr!=="pierce"&&n>=4)break;}
 BA.fx.push({k:"arc",x:P.x,y:P.y,a:dir,half,R:reach,t:0,d:.2,c:arCol()});
}
function arMotion(mo,dmg,tr,dir){
 const P=BA.p;
 if(mo==="slash")       arCone(68,.62,1,dmg,tr,dir);
 else if(mo==="sweep")  arCone(96,1.15,1,dmg,tr,dir);
 else if(mo==="thrust") arCone(120,.2,1,dmg,tr,dir);
 else if(mo==="cone")   arCone(78,.85,1,dmg,tr,dir);
 else if(mo==="lunge"){ P.x=Math.max(P.r,Math.min(BA.w-P.r,P.x+Math.cos(dir)*34));
                        P.y=Math.max(P.r,Math.min(BA.h-P.r,P.y+Math.sin(dir)*34));
                        arCone(62,.7,1.1,dmg,tr,dir);}
 else if(mo==="double"){arCone(64,.5,.6,dmg,tr,dir);
                        setTimeout(()=>{if(BA&&!BA.over)arCone(64,.5,.6,dmg,tr,BA.p.dir);},90);}
 else if(mo==="blink"){ P.x=Math.max(P.r,Math.min(BA.w-P.r,P.x+Math.cos(dir)*64));
                        P.y=Math.max(P.r,Math.min(BA.h-P.r,P.y+Math.sin(dir)*64));
                        arCone(72,.8,1.05,dmg,tr,dir);}
 else if(mo==="shard")  BA.bul.push({x:P.x,y:P.y,vx:Math.cos(dir)*430,vy:Math.sin(dir)*430,
                          r:7,dmg,tr,foe:0,t:0,c:arCol()});
 if(tr==="linger")BA.fx.push({k:"pool",x:P.x+Math.cos(dir)*46,y:P.y+Math.sin(dir)*46,
   r:38,t:0,d:1.6,dmg:dmg*.18,c:arCol()});
}
/* ── 종료 ── */
function arEnd(quit){
 if(!BA||BA.over)return;
 BA.over=true;
 const reached=BA.wave;
 const rw=battleReward(reached);
 const drop=quit?null:battleDrop(reached);
 if(rw.gold){S.gold+=rw.gold;S.goldTot+=rw.gold;}
 if(rw.gems){S.gems=(S.gems||0)+rw.gems;S.gemTot=(S.gemTot||0)+rw.gems;}
 if(drop){S.owned[drop.n]=(S.owned[drop.n]||0)+1;if(drop.t>S.best)S.best=drop.t;}
 save();checkAch();renderHUD();
 $("ar-over").innerHTML=`<div class="ar-res">
   <div class="ar-rt">${quit?"중 단":"패 배"}</div>
   <div class="ar-rw"><b>${reached}</b><span>도달 웨이브</span></div>
   <div class="ar-rk">처치 ${BA.kills}</div>
   ${reached<BT_MINWAVE
     ? `<p class="ar-no">웨이브 ${BT_MINWAVE} 부터 보상이 나옵니다</p>`
     : `<div class="ar-gain">
          <div><b>+${fmt(rw.gold)}</b><span>주화</span></div>
          ${rw.gems?`<div><b>💎 +${rw.gems}</b><span>보석</span></div>`:""}
        </div>
        ${drop?`<p class="ar-drop">${gradText(RARITY[drop.t],drop.n,drop)} 획득</p>`:""}`}
   <button class="buy" id="ar-close">돌아가기</button></div>`;
 $("ar-over").classList.add("on");
 $("ar-close").onclick=()=>{closeArena();renderBattle();};
}

/* ── 그리기 ── */
function arDraw(){
 const g=BA.ctx,W=BA.w,H=BA.h,P=BA.p,U=BA.ui;
 g.clearRect(0,0,W,H);
 g.fillStyle="#0a0b10";g.fillRect(0,0,W,H);
 /* 바닥 격자 */
 g.strokeStyle="rgba(120,140,180,.06)";g.lineWidth=1;g.beginPath();
 for(let x=0;x<W;x+=48){g.moveTo(x,0);g.lineTo(x,H);}
 for(let y=0;y<H;y+=48){g.moveTo(0,y);g.lineTo(W,y);}
 g.stroke();
 /* 장판 */
 for(const f of BA.fx) if(f.k==="pool"){
  g.globalAlpha=.22*(1-f.t/f.d);g.fillStyle=f.c;
  g.beginPath();g.arc(f.x,f.y,f.r,0,6.283);g.fill();g.globalAlpha=1;}
 /* 탄 */
 for(const b of BA.bul){
  g.fillStyle=b.c||"#fff";g.beginPath();g.arc(b.x,b.y,b.r,0,6.283);g.fill();}
 /* 몬스터 */
 for(const o of BA.mobs){
  g.save();g.translate(o.x,o.y);
  g.fillStyle=o.hit>0?"#fff":o.m.c;
  g.beginPath();
  if(o.m.id==="shield"){g.rect(-o.r,-o.r,o.r*2,o.r*2);}
  else if(o.m.id==="bomber"){for(let i=0;i<3;i++){const a=i*2.094-1.57;
    i?g.lineTo(Math.cos(a)*o.r,Math.sin(a)*o.r):g.moveTo(Math.cos(a)*o.r,Math.sin(a)*o.r);}g.closePath();}
  else g.arc(0,0,o.r,0,6.283);
  g.fill();
  if(o.hpMax>1&&o.hp<o.hpMax){
   g.fillStyle="rgba(0,0,0,.6)";g.fillRect(-o.r,-o.r-7,o.r*2,3);
   g.fillStyle="#7ce08a";g.fillRect(-o.r,-o.r-7,o.r*2*(o.hp/o.hpMax),3);}
  g.restore();}
 /* 공격 궤적 */
 for(const f of BA.fx) if(f.k==="arc"){
  const k=1-f.t/f.d;
  g.strokeStyle=f.c;g.globalAlpha=k*.85;g.lineWidth=7*k+2;
  g.beginPath();g.arc(f.x,f.y,f.R*.8,f.a-f.half,f.a+f.half);g.stroke();g.globalAlpha=1;}
 for(const f of BA.fx) if(f.k==="pop"){
  const k=f.t/f.d;
  g.strokeStyle=f.c;g.globalAlpha=1-k;g.lineWidth=3;
  g.beginPath();g.arc(f.x,f.y,f.r+k*26,0,6.283);g.stroke();g.globalAlpha=1;}
 for(const f of BA.fx) if(f.k==="ring"){
  const k=f.t/f.d;
  g.strokeStyle=f.c;g.globalAlpha=1-k;g.lineWidth=3;
  g.beginPath();g.arc(P.x,P.y,20+k*44,0,6.283);g.stroke();g.globalAlpha=1;}
 /* 플레이어 */
 g.save();g.translate(P.x,P.y);
 if(P.inv>0&&Math.floor(P.inv*14)%2)g.globalAlpha=.4;
 g.fillStyle="#e8ecf4";g.beginPath();g.arc(0,0,P.r,0,6.283);g.fill();
 g.rotate(P.dir);
 g.strokeStyle=arCol();g.lineWidth=5;g.lineCap="round";
 g.beginPath();g.moveTo(P.r-2,0);g.lineTo(P.r+20,0);g.stroke();
 g.restore();g.globalAlpha=1;
 /* 피해 숫자 */
 g.textAlign="center";g.font="600 13px system-ui,sans-serif";
 for(const n of BA.num){g.globalAlpha=1-n.t/.8;g.fillStyle=n.c;g.fillText(n.v,n.x,n.y);}
 g.globalAlpha=1;
 /* 피격 붉은 테 */
 for(const f of BA.fx) if(f.k==="hurt"){
  g.globalAlpha=(1-f.t/f.d)*.45;g.fillStyle="#ff2d4d";
  g.fillRect(0,0,W,14);g.fillRect(0,H-14,W,14);g.fillRect(0,0,14,H);g.fillRect(W-14,0,14,H);
  g.globalAlpha=1;}
 /* 웨이브 알림 */
 for(const f of BA.fx) if(f.k==="wave"){
  const k=f.t/f.d;
  g.globalAlpha=k<.2?k/.2:(1-(k-.2)/.8);
  g.fillStyle="#eaf2ff";g.font="500 26px serif";g.textAlign="center";
  g.fillText("WAVE "+f.n,W/2,H*.34);g.globalAlpha=1;}
 arDrawUI(g,U);
}
function arDrawUI(g,U){
 const P=BA.p;
 /* 조이스틱 */
 const jx=BA.joy.id!==null?BA.joy.cx:U.jx, jy=BA.joy.id!==null?BA.joy.cy:U.jy;
 g.strokeStyle="rgba(232,236,244,.22)";g.lineWidth=2;
 g.beginPath();g.arc(jx,jy,U.jr,0,6.283);g.stroke();
 g.fillStyle="rgba(232,236,244,.3)";
 g.beginPath();g.arc(jx+BA.joy.dx*U.jr,jy+BA.joy.dy*U.jr,U.jr*.42,0,6.283);g.fill();
 /* 공격 버튼 */
 g.strokeStyle=arCol();g.globalAlpha=BA.atk.id!==null?.9:.5;g.lineWidth=3;
 g.beginPath();g.arc(U.bx,U.by,U.br,0,6.283);g.stroke();
 g.globalAlpha=BA.atk.id!==null?.25:.12;g.fillStyle=arCol();
 g.beginPath();g.arc(U.bx,U.by,U.br,0,6.283);g.fill();g.globalAlpha=1;
 /* 검 1/2/3 */
 g.textAlign="center";g.textBaseline="middle";
 for(let i=0;i<3;i++){
  const cx=U.sx+i*(U.sr*2.6),on=i===BA.slot,c=RARITY[BA.team[i].s.t].c;
  g.strokeStyle=c;g.globalAlpha=on?1:.42;g.lineWidth=on?3:1.5;
  g.beginPath();g.arc(cx,U.sy,U.sr,0,6.283);g.stroke();
  if(on){g.globalAlpha=.2;g.fillStyle=c;g.beginPath();g.arc(cx,U.sy,U.sr,0,6.283);g.fill();}
  g.globalAlpha=on?1:.55;g.fillStyle="#e8ecf4";
  g.font="600 "+Math.round(U.sr*.9)+"px system-ui,sans-serif";
  g.fillText(String(i+1),cx,U.sy+1);g.globalAlpha=1;}
 g.textBaseline="alphabetic";
}
