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
   <div class="ar-over" id="ar-over"></div>
   <div class="ar-pick" id="ar-pick"></div>`;
 el.classList.add("on");
 const cv=$("ar-cv"),ctx=cv.getContext("2d");
 /* 저장된 팀에 없는 이름이 섞여 있으면 여기서 걸러 낸다 — 검 이름이 바뀌거나
    다른 기기 저장이 들어오면 그대로 터진다. */
 const team=S.team.map(n=>SWORDS.find(x=>x.n===n)).filter(Boolean)
   .map(s=>({s,st:battleStat(s)}));
 if(team.length<TEAM_SIZE){toast("출전 검을 다시 정해 주세요");return;}
 BA={mode,cv,ctx,team,slot:0,over:false,raf:0,last:0,w:0,h:0,dpr:1,
     p:{x:0,y:0,vx:0,vy:0,r:15,dir:-Math.PI/2,hp:100,hpMax:100,inv:0,atkCd:0},
     mobs:[],bul:[],fx:[],num:[],haz:[],boss:null,
     wave:1,spawnLeft:0,spawnT:0,restT:1.6,rage:0,
     /* 보스는 판마다 순서를 섞는다 — 10웨이브마다 하나씩이라 순서를 고정하면
        현실적으로 첫 보스만 평생 보게 된다. */
     bossOrder:BOSSES.map((_,i)=>i).sort(()=>Math.random()-.5),
     up:Object.assign({},BUP_BASE),pick:null,taken:[],
     joy:{id:null,cx:0,cy:0,dx:0,dy:0},atk:{id:null},kills:0,
     input:"touch",keys:{},swing:null};
 /* 체력은 팀 평균 방어력을 타고 오른다 — 단단한 검을 넣으면 오래 버틴다 */
 const sum=teamSummary(S.team);
 BA.p.hpMax=BA.p.hp=Math.round(600+sum.def*14);
 arResize();
 addEventListener("resize",arResize);
 cv.addEventListener("pointerdown",arDown);
 cv.addEventListener("pointermove",arMove);
 cv.addEventListener("pointerup",arUp);
 cv.addEventListener("pointercancel",arUp);
 addEventListener("keydown",arKey);
 addEventListener("keyup",arKey);
 $("ar-quit").onclick=()=>arEnd(true);
 btBgmStart("wave");
 BA.last=performance.now();
 BA.raf=requestAnimationFrame(arLoop);
}
function closeArena(){
 if(!BA)return;
 cancelAnimationFrame(BA.raf);
 removeEventListener("resize",arResize);
 removeEventListener("keydown",arKey);
 removeEventListener("keyup",arKey);
 btBgmStop();
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
/* 마지막으로 쓴 입력이 곧 조작 방식이다 — 터치하면 조이스틱이 뜨고,
   키를 누르면 사라진다. 둘 중 하나를 고르게 하지 않는다. */
function arKey(e){
 if(!BA||BA.over)return;
 const k=e.key.toLowerCase(),down=e.type==="keydown";
 const move="wasd".includes(k)||["arrowup","arrowdown","arrowleft","arrowright"].includes(k);
 if(!move&&k!=="l"&&!["1","2","3"].includes(k))return;
 e.preventDefault();
 BA.input="key";BA.keys[k]=down;
 if(down&&["1","2","3"].includes(k))arSlot(+k-1);
}
function arDown(e){
 if(!BA||BA.over)return;
 BA.input="touch";
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
 /* 한 프레임이 터져도 판이 통째로 멈추면 안 된다 —
    예외가 나가면 다음 rAF 가 안 걸려서 화면이 그대로 얼어붙는다. */
 try{
  if(!BA.over&&!BA.pick)arStep(dt);         // 강화를 고르는 동안은 멈춘다
  arDraw();
 }catch(e){ if(!BA.warned){BA.warned=1;console.error("arena frame:",e);} }
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
   if(isBossWave(BA.wave)){                              // 보스 웨이브는 보스 + 소수의 잡병
    BA.spawnLeft=Math.max(3,Math.floor(waveCount(BA.wave)*.35));
    arSpawnBoss(BA.wave);}}
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
   /* 보스는 제외한다 — 보스는 늘 플레이어에게 다가오므로 교착이 날 수 없고,
      여기에 걸어 두면 가만히 있어도 보스가 저절로 죽는다. */
   if(BA.rage>=1.6)for(const o of BA.mobs) if(!o.boss)o.hp-=o.hpMax*0.055*dt;
  }
  if(BA.spawnLeft<=0&&!BA.mobs.length){
   BA.wave++;BA.restT=1.5;BA.rage=0;
   const w=$("ar-wave"); if(w)w.textContent=BA.wave;
   sfxWaveStart(BA.wave);
   BA.fx.push({k:"wave",t:0,d:1.2,n:BA.wave});}
 }
 /* 플레이어 */
 const cur=arCur(),tr=cur.st.trait.id;
 const base=196*(tr==="rush"?1.18:1)*BA.up.move;
 let mx=BA.joy.dx,my=BA.joy.dy;
 if(BA.input==="key"){                                  // WASD / 방향키, L 로 벤다
  const K=BA.keys;
  mx=(K.d||K.arrowright?1:0)-(K.a||K.arrowleft?1:0);
  my=(K.s||K.arrowdown?1:0)-(K.w||K.arrowup?1:0);
  const m=Math.hypot(mx,my); if(m>1){mx/=m;my/=m;}
 }
 P.vx=mx*base;P.vy=my*base;
 P.x=Math.max(P.r,Math.min(BA.w-P.r,P.x+P.vx*dt));
 P.y=Math.max(P.r,Math.min(BA.h-P.r,P.y+P.vy*dt));
 if(mx||my)P.dir=Math.atan2(my,mx);
 else{const n=arNearest();if(n)P.dir=Math.atan2(n.y-P.y,n.x-P.x);}
 if(P.inv>0)P.inv-=dt;
 if(P.atkCd>0)P.atkCd-=dt;
 const firing=BA.input==="key"?!!BA.keys.l:BA.atk.id!==null;
 if(firing&&P.atkCd<=0){arSwing();P.atkCd=1/(cur.st.spd*BA.up.spd);}
 /* 몬스터 */
 for(let i=BA.mobs.length-1;i>=0;i--){
  const o=BA.mobs[i];
  if(o.boss)arBossStep(o,dt); else arMobStep(o,dt);
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
 arHazStep(dt);
 /* 잔존 장판 */
 for(const f of BA.fx) if(f.k==="pool"){
  f.tick=(f.tick||0)+dt;
  if(f.tick>=.3){f.tick=0;
   for(const o of BA.mobs) if(arDist(o,f)<f.r+o.r)arHit(o,f.dmg,null);}}
 for(let i=BA.fx.length-1;i>=0;i--){const f=BA.fx[i];f.t+=dt;if(f.t>=f.d)BA.fx.splice(i,1);}
 for(let i=BA.num.length-1;i>=0;i--){const n=BA.num[i];n.t+=dt;n.y-=26*dt;if(n.t>.8)BA.num.splice(i,1);}
 if(BA.swing){BA.swing.t+=dt;if(BA.swing.t>=BA.swing.d)BA.swing=null;}
 BA.time=(BA.time||0)+dt;
 const hb=$("ar-hp"); if(hb)hb.style.width=Math.max(0,P.hp/P.hpMax*100)+"%";
}
function arNearest(){
 let b=null,bd=1e9;
 for(const o of BA.mobs){const d=arDist(o,BA.p);if(d<bd){bd=d;b=o;}}
 return b;}
function arMobStep(o,dt){
 const P=BA.p;o.t+=dt;
 const ang=Math.atan2(P.y-o.y,P.x-o.x);
 if(o.slow>0)o.slow-=dt;
 const id=o.m.id, rg=(1+BA.rage)*(o.slow>0?.42:1);   // 시간이 멎은 적은 느리다
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
 P.hp-=Math.max(1,Math.round(d*BA.up.dr));P.inv=.7*BA.up.inv;
 BA.fx.push({k:"hurt",t:0,d:.32});sfxHurt();
 if(P.hp<=0){P.hp=0;arEnd(false);}
}
function arHit(o,dmg,tr){
 let d=dmg;
 if((tr==="crit"&&Math.random()<.16)||Math.random()<BA.up.crit)d*=2;
 d=Math.max(1,Math.round(d));
 o.hp-=d;o.hit=.12;sfxHit();
 BA.num.push({x:o.x,y:o.y-o.r,v:d,t:0,c:d>dmg*1.5?"#ffd45e":"#fff"});
}
function arKill(o,i){
 BA.mobs.splice(i,1);BA.kills++;
 if(o.boss)sfxBossKill(); else sfxKill();
 BA.fx.push({k:"pop",x:o.x,y:o.y,r:o.r,t:0,d:.32,c:o.m.c});
 const heal=(arCur().st.trait.id==="drain"?.012:0)+BA.up.drain;
 if(heal)BA.p.hp=Math.min(BA.p.hpMax,BA.p.hp+Math.round(BA.p.hpMax*heal));
 if(o.boss){BA.boss=null;
  btBgmStart("wave");                            // 보스곡에서 평상곡으로
  arOpenPick();                                  // 강화 셋 중 하나
  for(let i=0;i<14;i++)BA.fx.push({k:"pop",x:o.x+(Math.random()-.5)*o.r*2,
    y:o.y+(Math.random()-.5)*o.r*2,r:o.r*.3,t:-i*.03,d:.5,c:o.B.c});
  return;}
 if(o.m.id==="splitter"&&!o.small){
  for(let k=0;k<2;k++){const hp=Math.round(o.hpMax*.34);
   BA.mobs.push({m:o.m,x:o.x+(k?18:-18),y:o.y,r:o.r*.6,hp,hpMax:hp,
     dmg:o.dmg*.6,spd:o.spd*1.4,st:0,t:0,hit:0,small:1});}}
}
/* ── 공격 ── 날 모양 8종이 기본 모션, 그 위에 특징이 얹힌다 */
function arSwing(){
 const P=BA.p,c=arCur(),mo=c.st.arch.mo,tr=c.st.trait.id,dir=P.dir;
 const dmg=c.st.dmg*BA.up.dmg;
 BA.swing={t:0,d:.26,dir,mo};                          // 칼이 실제로 휘둘러지게
 sfxSwing(mo);
 arMotion(mo,dmg,tr,dir);
 if(tr==="twin")setTimeout(()=>{if(BA&&!BA.over)arMotion(mo,dmg,null,BA.p.dir);},110);
 if(tr==="echo")setTimeout(()=>{if(BA&&!BA.over)arMotion(mo,dmg*.6,null,BA.p.dir);},240);
 if(tr==="recast"&&Math.random()<.2)P.atkCd=0;
}
function arCone(reach,half,mul,dmg,tr,dir,cap){
 const P=BA.p;let n=0;
 reach*=BA.up.reach;
 const lim=tr==="pierce"?99:(cap||4)+BA.up.pierce;
 for(const o of BA.mobs){
  const d=arDist(o,P); if(d>reach+o.r)continue;
  let a=Math.atan2(o.y-P.y,o.x-P.x)-dir;
  while(a>Math.PI)a-=6.283; while(a<-Math.PI)a+=6.283;
  if(Math.abs(a)>half)continue;
  arHit(o,dmg*mul,tr);n++;
  if(tr==="burst")for(const q of BA.mobs)if(q!==o&&arDist(q,o)<56)arHit(q,dmg*.35,null);
  if(n>=lim)break;}
 BA.fx.push({k:"arc",x:P.x,y:P.y,a:dir,half,R:reach,t:0,d:.22,c:arCol()});
}
/* 앞으로 나아가며 베는 검은 지나간 자리의 적을 전부 때린다 —
   선분과 적의 거리로 판정하므로 몸을 스치고 지나간 것도 놓치지 않는다. */
function arPath(x0,y0,x1,y1,rad,dmg,tr){
 const dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy;
 for(const o of BA.mobs){
  let t=L2?((o.x-x0)*dx+(o.y-y0)*dy)/L2:0;
  t=Math.max(0,Math.min(1,t));
  if(Math.hypot(o.x-(x0+dx*t),o.y-(y0+dy*t))<rad+o.r)arHit(o,dmg,tr);}
}
const arClampX=x=>Math.max(BA.p.r,Math.min(BA.w-BA.p.r,x));
const arClampY=y=>Math.max(BA.p.r,Math.min(BA.h-BA.p.r,y));
function arMotion(mo,dmg,tr,dir){
 const P=BA.p,c=arCol();
 if(mo==="slash"){
  arCone(80,.62,1,dmg,tr,dir);
  BA.fx.push({k:"slash",x:P.x,y:P.y,a:dir,R:80,t:0,d:.24,c});
 }else if(mo==="sweep"){
  arCone(112,1.15,1,dmg,tr,dir);
  BA.fx.push({k:"crescent",x:P.x,y:P.y,a:dir,R:112,half:1.15,t:0,d:.32,c});
 }else if(mo==="thrust"){
  /* 찌르기는 곧게 나아가므로 꿰뚫은 적을 전부 때린다 */
  arPath(P.x,P.y,P.x+Math.cos(dir)*140,P.y+Math.sin(dir)*140,15,dmg,tr);
  BA.fx.push({k:"lance",x:P.x,y:P.y,a:dir,R:140,t:0,d:.26,c});
 }else if(mo==="cone"){
  arCone(92,.85,1,dmg,tr,dir);
  BA.fx.push({k:"flame",x:P.x,y:P.y,a:dir,R:92,half:.85,t:0,d:.34,c});
 }else if(mo==="lunge"){
  const x0=P.x,y0=P.y;
  P.x=arClampX(P.x+Math.cos(dir)*42);P.y=arClampY(P.y+Math.sin(dir)*42);
  arPath(x0,y0,P.x,P.y,28,dmg*.8,tr);          // 파고들며 스친 적
  arCone(74,.7,1.1,dmg,tr,dir);
  BA.fx.push({k:"dash",x0,y0,x1:P.x,y1:P.y,t:0,d:.28,c});
 }else if(mo==="double"){
  arCone(78,.5,.6,dmg,tr,dir);
  BA.fx.push({k:"cross",x:P.x,y:P.y,a:dir,R:78,t:0,d:.3,c});
  setTimeout(()=>{if(BA&&!BA.over)arCone(78,.5,.6,dmg,tr,BA.p.dir);},90);
 }else if(mo==="blink"){
  const x0=P.x,y0=P.y;
  P.x=arClampX(P.x+Math.cos(dir)*78);P.y=arClampY(P.y+Math.sin(dir)*78);
  arPath(x0,y0,P.x,P.y,30,dmg*.85,tr);         // 갈라진 자리를 지난 적
  arCone(86,.8,1.05,dmg,tr,dir);
  BA.fx.push({k:"rift",x0,y0,x1:P.x,y1:P.y,t:0,d:.34,c});
 }else if(mo==="shard"){
  BA.bul.push({x:P.x,y:P.y,vx:Math.cos(dir)*450,vy:Math.sin(dir)*450,r:8,dmg,tr,foe:0,t:0,c});
  BA.fx.push({k:"muzzle",x:P.x,y:P.y,a:dir,t:0,d:.2,c});
 }
 if(tr==="linger")BA.fx.push({k:"pool",x:P.x+Math.cos(dir)*52,y:P.y+Math.sin(dir)*52,
   r:42,t:0,d:1.6,dmg:dmg*.18,c});
 if(BA.up.shock){                                // 파편 — 벤 자리 주변까지
  for(const o of BA.mobs) if(arDist(o,P)<64+o.r)arHit(o,dmg*BA.up.shock,null);
  BA.fx.push({k:"pop",x:P.x,y:P.y,r:22,t:0,d:.26,c});}
 const sig=arCur().st.sig; if(sig)arAbsAttack(sig,dmg,tr,dir);
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
 btBgmStop();
 if(!quit)sfxDeath();
 if(rw.gold)setTimeout(()=>sfxReward(),quit?120:900);
 $("ar-over").innerHTML=`<div class="ar-res">
   <div class="ar-rt">${quit?"중 단":"패 배"}</div>
   <div class="ar-rw"><b>${reached}</b><span>도달 웨이브</span></div>
   <div class="ar-rk">처치 ${BA.kills}</div>
   ${(BA.taken&&BA.taken.length)?`<div class="ar-ups">강화 ${BA.taken.join(" · ")}</div>`:""}
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


/* ══ 그리기 ══
   원으로만 그리면 밋밋하다. 몬스터는 행동이 실루엣에서 읽히도록 저마다 다른 모양을 주고,
   주인공은 들고 있는 검의 날 모양을 실제로 들고 휘두른다. */
function arDraw(){
 const g=BA.ctx,W=BA.w,H=BA.h,P=BA.p;
 g.clearRect(0,0,W,H);
 /* 바닥 — 가운데가 살짝 밝은 판 */
 const bg=g.createRadialGradient(W/2,H*.44,40,W/2,H*.44,Math.max(W,H)*.78);
 bg.addColorStop(0,"#131726");bg.addColorStop(1,"#080910");
 g.fillStyle=bg;g.fillRect(0,0,W,H);
 g.strokeStyle="rgba(130,150,190,.055)";g.lineWidth=1;g.beginPath();
 for(let x=(W/2)%56;x<W;x+=56){g.moveTo(x,0);g.lineTo(x,H);}
 for(let y=(H/2)%56;y<H;y+=56){g.moveTo(0,y);g.lineTo(W,y);}
 g.stroke();
 /* 장판 */
 for(const f of BA.fx) if(f.k==="pool"){
  const k=1-f.t/f.d;
  g.globalAlpha=.2*k;g.fillStyle=f.c;
  g.beginPath();g.arc(f.x,f.y,f.r,0,6.283);g.fill();
  g.globalAlpha=.5*k;g.strokeStyle=f.c;g.lineWidth=2;
  g.beginPath();g.arc(f.x,f.y,f.r,0,6.283);g.stroke();g.globalAlpha=1;}
 /* 그림자 먼저 — 바닥에 붙어 보이게 */
 g.fillStyle="rgba(0,0,0,.34)";
 for(const o of BA.mobs){g.beginPath();g.ellipse(o.x,o.y+o.r*.72,o.r*.92,o.r*.34,0,0,6.283);g.fill();}
 g.beginPath();g.ellipse(P.x,P.y+13,15,5.5,0,0,6.283);g.fill();
 /* 탄 */
 for(const b of BA.bul){
  if(b.gl){arDrawGlitchBullet(g,b);continue;}
  g.fillStyle=b.c||"#fff";
  g.globalAlpha=.3;g.beginPath();g.arc(b.x,b.y,b.r*2.1,0,6.283);g.fill();
  g.globalAlpha=1;g.beginPath();g.arc(b.x,b.y,b.r,0,6.283);g.fill();
  g.fillStyle="#fff";g.beginPath();g.arc(b.x-b.vx*.006,b.y-b.vy*.006,b.r*.45,0,6.283);g.fill();}
 arDrawHaz(g);
 for(const o of BA.mobs){ if(o.boss)arDrawBoss(g,o); else arDrawMob(g,o); }
 /* 공격 궤적 */
 /* 모션별 공격 이펙트 */
 for(const f of BA.fx)
  if(f.k==="slash"||f.k==="crescent"||f.k==="lance"||f.k==="flame"||
     f.k==="cross"||f.k==="dash"||f.k==="rift"||f.k==="muzzle")arDrawSwingFx(g,f);
  else if(f.k==="tdzEcho"||f.k==="glxTear"||f.k==="oblErase")arDrawAbsFx(g,f);
  else if(f.k==="bossIn"||f.k==="bossTell")arDrawBossFx(g,f);
 for(const f of BA.fx) if(f.k==="pop"&&f.t>=0){
  const k=f.t/f.d;
  g.strokeStyle=f.c;g.globalAlpha=1-k;g.lineWidth=3*(1-k)+1;
  g.beginPath();g.arc(f.x,f.y,Math.max(.5,f.r+k*28),0,6.283);g.stroke();
  for(let i=0;i<5;i++){const a=i*1.257+f.x;
   const d=f.r+k*40;
   g.beginPath();g.arc(f.x+Math.cos(a)*d,f.y+Math.sin(a)*d,2.4*(1-k),0,6.283);
   g.fillStyle=f.c;g.fill();}
  g.globalAlpha=1;}
 for(const f of BA.fx) if(f.k==="ring"){
  const k=f.t/f.d;
  g.strokeStyle=f.c;g.globalAlpha=1-k;g.lineWidth=3;
  g.beginPath();g.arc(P.x,P.y,20+k*46,0,6.283);g.stroke();g.globalAlpha=1;}
 arDrawAura(g);
 arDrawPlayer(g);
 /* 피해 숫자 */
 g.textAlign="center";g.font="700 13px system-ui,sans-serif";
 for(const n of BA.num){
  g.globalAlpha=1-n.t/.8;
  g.lineWidth=3;g.strokeStyle="rgba(0,0,0,.75)";g.strokeText(n.v,n.x,n.y);
  g.fillStyle=n.c;g.fillText(n.v,n.x,n.y);}
 g.globalAlpha=1;
 /* 피격 붉은 테 */
 for(const f of BA.fx) if(f.k==="hurt"){
  const k=1-f.t/f.d;
  const vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.62);
  vg.addColorStop(0,"rgba(255,45,77,0)");vg.addColorStop(1,"rgba(255,45,77,"+(k*.5).toFixed(3)+")");
  g.fillStyle=vg;g.fillRect(0,0,W,H);}
 /* 웨이브 알림 */
 for(const f of BA.fx) if(f.k==="wave"){
  const k=f.t/f.d;
  g.globalAlpha=k<.2?k/.2:(1-(k-.2)/.8);
  g.textAlign="center";
  g.fillStyle="#eaf2ff";g.font="500 30px serif";
  g.fillText("WAVE "+f.n,W/2,H*.33);
  if(isBossWave(f.n)){g.font="500 13px serif";g.fillStyle="#ff8f6a";
   g.fillText("보스", W/2, H*.33+24);}
  g.globalAlpha=1;}
 arDrawBossBar(g);
 if(BA.input==="touch")arDrawUI(g,BA.ui);
 else arDrawKeyHint(g);
}

/* 몬스터 — 행동이 모양에서 읽히게 */
function arDrawMob(g,o){
 const P=BA.p,r=o.r,id=o.m.id;
 const face=Math.atan2(P.y-o.y,P.x-o.x);
 const flash=o.hit>0;
 const col=flash?"#ffffff":o.m.c;
 g.save();g.translate(o.x,o.y);
 g.lineJoin="round";g.lineCap="round";
 g.strokeStyle=flash?"#fff":"rgba(0,0,0,.45)";g.lineWidth=2;
 if(id==="chaser"){                     // 앞이 뾰족한 사냥꾼
  g.rotate(face);
  g.fillStyle=col;g.beginPath();
  g.moveTo(r*1.25,0);g.lineTo(0,-r*.82);g.lineTo(-r*.7,0);g.lineTo(0,r*.82);
  g.closePath();g.fill();g.stroke();
  g.fillStyle=flash?"#000":"#2a0e12";
  g.beginPath();g.arc(r*.34,0,r*.24,0,6.283);g.fill();
 }else if(id==="swarm"){                // 작고 날개 달린 무리
  g.rotate(face);
  g.fillStyle=col;g.beginPath();
  g.moveTo(r*1.3,0);g.lineTo(-r*.5,-r);g.lineTo(-r*.1,0);g.lineTo(-r*.5,r);
  g.closePath();g.fill();g.stroke();
 }else if(id==="charger"){              // 뿔 달린 덩치. 돌진 중엔 빛난다
  g.rotate(face);
  if(o.ch){g.shadowColor=o.m.c;g.shadowBlur=18;}
  g.fillStyle=col;g.beginPath();
  g.moveTo(r*.9,-r*.5);g.lineTo(r*1.45,-r*.16);g.lineTo(r*.95,0);
  g.lineTo(r*1.45,r*.16);g.lineTo(r*.9,r*.5);
  g.lineTo(-r*.85,r*.92);g.lineTo(-r*1.05,0);g.lineTo(-r*.85,-r*.92);
  g.closePath();g.fill();g.stroke();g.shadowBlur=0;
  g.fillStyle=flash?"#000":"#3a1408";
  g.beginPath();g.arc(r*.1,-r*.3,r*.2,0,6.283);g.arc(r*.1,r*.3,r*.2,0,6.283);g.fill();
 }else if(id==="shooter"){              // 떠 있는 눈. 조준선이 보인다
  const bob=Math.sin(o.t*3)*2;
  g.translate(0,bob);
  g.fillStyle=col;g.beginPath();g.ellipse(0,0,r,r*.78,0,0,6.283);g.fill();g.stroke();
  g.rotate(face);
  g.fillStyle=flash?"#000":"#0d1a33";
  g.beginPath();g.arc(r*.3,0,r*.42,0,6.283);g.fill();
  g.fillStyle=flash?"#000":"#cfe4ff";
  g.beginPath();g.arc(r*.42,0,r*.17,0,6.283);g.fill();
  if(o.st<.5){g.strokeStyle="rgba(200,230,255,.3)";g.lineWidth=1;
   g.beginPath();g.moveTo(r,0);g.lineTo(r*5.5,0);g.stroke();}
 }else if(id==="shield"){               // 각진 장갑. 앞에 방패판
  g.rotate(face);
  g.fillStyle=col;g.beginPath();
  for(let i=0;i<6;i++){const a=i*1.047;
   i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
  g.closePath();g.fill();g.stroke();
  g.fillStyle=flash?"#000":"#cfd6e2";
  g.beginPath();g.moveTo(r*.72,-r*.72);g.lineTo(r*1.12,0);g.lineTo(r*.72,r*.72);
  g.closePath();g.fill();g.stroke();
 }else if(id==="splitter"){             // 가운데 갈라진 금이 있는 덩어리
  const w=1+Math.sin(o.t*2.4)*.06;
  g.scale(w,1/w);
  g.fillStyle=col;g.beginPath();
  for(let i=0;i<9;i++){const a=i*.698,rr=r*(i%2?.82:1.06);
   i?g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
  g.closePath();g.fill();g.stroke();
  g.strokeStyle=flash?"#000":"#1b3a1b";g.lineWidth=2.4;
  g.beginPath();g.moveTo(0,-r);g.lineTo(0,r);g.stroke();
 }else if(id==="bomber"){               // 가시 + 뛰는 심지
  const pulse=.7+Math.abs(Math.sin(o.t*7))*.5;
  g.rotate(face);
  g.fillStyle=col;g.beginPath();
  for(let i=0;i<10;i++){const a=i*.628,rr=r*(i%2?.6:1.15);
   i?g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
  g.closePath();g.fill();g.stroke();
  g.shadowColor="#ffd45e";g.shadowBlur=12*pulse;
  g.fillStyle=flash?"#fff":"#ffe08a";
  g.beginPath();g.arc(0,0,r*.34*pulse,0,6.283);g.fill();g.shadowBlur=0;
 }else{                                 // 부유체 — 촉수 달린 해파리
  const bob=Math.sin(o.t*2.2)*3;
  g.translate(0,bob);
  g.globalAlpha=.9;
  g.fillStyle=col;g.beginPath();
  g.arc(0,0,r,Math.PI,0);g.lineTo(r*.8,r*.24);g.lineTo(-r*.8,r*.24);
  g.closePath();g.fill();g.stroke();
  g.strokeStyle=col;g.lineWidth=2;
  for(let i=0;i<4;i++){const x=-r*.6+i*(r*.4);
   g.beginPath();g.moveTo(x,r*.24);
   g.quadraticCurveTo(x+Math.sin(o.t*3+i)*5,r*.9,x+Math.sin(o.t*3+i)*8,r*1.5);
   g.stroke();}
  g.globalAlpha=1;
 }
 g.restore();
 /* 체력줄 */
 if(o.hp<o.hpMax){
  const w=o.r*2;
  g.fillStyle="rgba(0,0,0,.65)";g.fillRect(o.x-w/2,o.y-o.r-10,w,3.5);
  g.fillStyle=o.hp/o.hpMax>.35?"#7ce08a":"#e0724a";
  g.fillRect(o.x-w/2,o.y-o.r-10,w*(o.hp/o.hpMax),3.5);}
}

/* 검 날 모양 — 아래를 자루, 위를 칼끝으로 둔 채 길이 L 로 그린다 */
function arBladePath(g,mo,L){
 g.beginPath();
 if(mo==="sweep"){                       // 대검 — 넓고 묵직
  g.moveTo(0,-L);g.lineTo(L*.16,-L*.72);g.lineTo(L*.13,0);g.lineTo(-L*.13,0);
  g.lineTo(-L*.16,-L*.72);
 }else if(mo==="thrust"){                // 레이피어 — 가늘고 길다
  g.moveTo(0,-L);g.lineTo(L*.05,-L*.6);g.lineTo(L*.04,0);g.lineTo(-L*.04,0);
  g.lineTo(-L*.05,-L*.6);
 }else if(mo==="double"){                // 도 — 한쪽으로 휜다
  g.moveTo(L*.04,-L);g.quadraticCurveTo(L*.2,-L*.5,L*.1,0);
  g.lineTo(-L*.04,0);g.quadraticCurveTo(L*.05,-L*.5,-L*.04,-L*.92);
 }else if(mo==="shard"){                 // 수정검 — 각진 마름모
  g.moveTo(0,-L);g.lineTo(L*.15,-L*.62);g.lineTo(L*.08,-L*.2);g.lineTo(L*.1,0);
  g.lineTo(-L*.1,0);g.lineTo(-L*.08,-L*.2);g.lineTo(-L*.15,-L*.62);
 }else if(mo==="cone"){                  // 화염도 — 물결
  g.moveTo(0,-L);g.quadraticCurveTo(L*.22,-L*.7,L*.06,-L*.45);
  g.quadraticCurveTo(L*.22,-L*.24,L*.1,0);g.lineTo(-L*.1,0);
  g.quadraticCurveTo(-L*.22,-L*.24,-L*.06,-L*.45);
  g.quadraticCurveTo(-L*.22,-L*.7,0,-L);
 }else if(mo==="blink"){                 // 균열검 — 지그재그
  g.moveTo(0,-L);g.lineTo(L*.17,-L*.66);g.lineTo(0,-L*.44);g.lineTo(L*.15,-L*.2);
  g.lineTo(L*.09,0);g.lineTo(-L*.09,0);g.lineTo(-L*.15,-L*.2);g.lineTo(0,-L*.44);
  g.lineTo(-L*.17,-L*.66);
 }else if(mo==="lunge"){                 // 송곳니 — 안쪽으로 굽는다
  g.moveTo(0,-L);g.quadraticCurveTo(L*.24,-L*.42,L*.1,0);
  g.lineTo(-L*.1,0);g.quadraticCurveTo(-L*.05,-L*.5,0,-L);
 }else{                                  // 직검
  g.moveTo(0,-L);g.lineTo(L*.1,-L*.78);g.lineTo(L*.085,0);g.lineTo(-L*.085,0);
  g.lineTo(-L*.1,-L*.78);
 }
 g.closePath();
}
/* 주인공 — 몸통·머리·어깨, 그리고 실제로 휘둘러지는 검 */
function arDrawPlayer(g){
 const P=BA.p,c=arCur(),col=arCol(),mo=c.st.arch.mo;
 g.save();g.translate(P.x,P.y);
 if(P.inv>0&&Math.floor(P.inv*14)%2)g.globalAlpha=.45;
 g.rotate(P.dir+Math.PI/2);            // 위쪽을 정면으로 둔다
 /* 망토 */
 g.fillStyle="rgba(24,30,46,.9)";
 g.beginPath();g.moveTo(-12,2);g.quadraticCurveTo(0,20,12,2);
 g.quadraticCurveTo(0,10,-12,2);g.closePath();g.fill();
 /* 몸통 */
 const bg=g.createLinearGradient(0,-12,0,12);
 bg.addColorStop(0,"#f2f6ff");bg.addColorStop(1,"#9aa6bd");
 g.fillStyle=bg;g.strokeStyle="rgba(10,14,24,.8)";g.lineWidth=2;
 g.beginPath();g.ellipse(0,0,11,12.5,0,0,6.283);g.fill();g.stroke();
 /* 어깨 */
 g.fillStyle=col;g.globalAlpha=(g.globalAlpha)*.85;
 g.beginPath();g.ellipse(-10,1,4.2,5.4,-.3,0,6.283);g.fill();
 g.beginPath();g.ellipse(10,1,4.2,5.4,.3,0,6.283);g.fill();
 g.globalAlpha=P.inv>0&&Math.floor(P.inv*14)%2?.45:1;
 /* 머리 */
 g.fillStyle="#e8edf7";g.strokeStyle="rgba(10,14,24,.8)";
 g.beginPath();g.arc(0,-3,6.4,0,6.283);g.fill();g.stroke();
 /* 검 — 오른손에서 뻗어 나가고, 벨 때 실제로 호를 그린다 */
 const sw=BA.swing;
 let ang=-0.42, L=42;                  // 검을 크게 — 손에 든 게 보여야 한다
 if(sw){
  const k=sw.t/sw.d, e=k<.28?k/.28:1-(k-.28)/.72;
  if(sw.mo==="thrust")      {ang=-0.05; L=42+34*e;}
  else if(sw.mo==="shard")  {ang=-0.05-e*.2;}
  else if(sw.mo==="sweep")  {ang=-1.5+e*2.6; L=50;}
  else                      {ang=-1.15+e*1.9;}
 }
 g.save();
 g.translate(9,0);g.rotate(ang);
 g.shadowColor=col;g.shadowBlur=sw?14:6;
 const gl=g.createLinearGradient(0,-L,0,0);
 gl.addColorStop(0,"#ffffff");gl.addColorStop(.5,col);gl.addColorStop(1,"#6d7689");
 g.fillStyle=gl;g.strokeStyle="rgba(8,12,20,.85)";g.lineWidth=1.4;
 arBladePath(g,mo,L);g.fill();g.stroke();
 g.shadowBlur=0;
 g.fillStyle="#3a3f4d";g.fillRect(-2.8,0,5.6,12);          // 자루
 g.fillStyle=col;g.fillRect(-7.5,-2,15,4);                 // 가드
 g.restore();
 g.restore();g.globalAlpha=1;
}

/* 터치 조작부 */
function arDrawUI(g,U){
 const jx=BA.joy.id!==null?BA.joy.cx:U.jx, jy=BA.joy.id!==null?BA.joy.cy:U.jy;
 g.strokeStyle="rgba(232,236,244,.2)";g.lineWidth=2;
 g.beginPath();g.arc(jx,jy,U.jr,0,6.283);g.stroke();
 g.fillStyle="rgba(232,236,244,.06)";g.fill();
 g.fillStyle="rgba(232,236,244,.32)";
 g.beginPath();g.arc(jx+BA.joy.dx*U.jr,jy+BA.joy.dy*U.jr,U.jr*.4,0,6.283);g.fill();
 const on=BA.atk.id!==null;
 g.strokeStyle=arCol();g.globalAlpha=on?.95:.5;g.lineWidth=3;
 g.beginPath();g.arc(U.bx,U.by,U.br*(on?.94:1),0,6.283);g.stroke();
 g.globalAlpha=on?.26:.1;g.fillStyle=arCol();
 g.beginPath();g.arc(U.bx,U.by,U.br*(on?.94:1),0,6.283);g.fill();g.globalAlpha=1;
 arDrawSlots(g,U.sx,U.sy,U.sr,U.sr*2.6);
}
function arDrawSlots(g,sx,sy,sr,gap){
 g.textAlign="center";g.textBaseline="middle";
 for(let i=0;i<3;i++){
  const cx=sx+i*gap,on=i===BA.slot,c=RARITY[BA.team[i].s.t].c;
  g.strokeStyle=c;g.globalAlpha=on?1:.4;g.lineWidth=on?3:1.5;
  g.beginPath();g.arc(cx,sy,sr,0,6.283);g.stroke();
  if(on){g.globalAlpha=.2;g.fillStyle=c;g.beginPath();g.arc(cx,sy,sr,0,6.283);g.fill();}
  g.globalAlpha=on?1:.55;g.fillStyle="#e8ecf4";
  g.font="700 "+Math.round(sr*.88)+"px system-ui,sans-serif";
  g.fillText(String(i+1),cx,sy+1);g.globalAlpha=1;}
 g.textBaseline="alphabetic";
}
/* 키보드일 땐 조이스틱 대신 안내와 슬롯만 */
function arDrawKeyHint(g){
 const U=BA.ui;
 arDrawSlots(g,U.sx,U.sy,U.sr,U.sr*2.6);
 g.textAlign="right";g.font="500 11px system-ui,sans-serif";
 g.fillStyle="rgba(200,212,232,.5)";
 g.fillText("WASD 이동   ·   L 공격   ·   1 2 3 검 교체",BA.w-16,BA.h-18);
 g.textAlign="center";
}
/* 장착한 검의 아우라 — 검을 바꾸면 같이 바뀐다.
   모양은 그 검의 고유 특징에서 오고, 색은 등급에서 온다. */
function arDrawAura(g){
 const P=BA.p,c=arCol(),tr=arCur().st.trait.id,T=BA.time||0;
 g.save();g.translate(P.x,P.y);
 g.globalCompositeOperation="lighter";
 /* 바닥에 깔리는 기본 후광 — 어느 검이든 공통 */
 const gl=g.createRadialGradient(0,0,4,0,0,46);
 gl.addColorStop(0,c);gl.addColorStop(1,"rgba(0,0,0,0)");
 g.globalAlpha=.16+Math.sin(T*2.4)*.04;
 g.fillStyle=gl;g.beginPath();g.arc(0,0,46,0,6.283);g.fill();
 g.globalAlpha=1;g.strokeStyle=c;g.fillStyle=c;

 if(tr==="crit"){                       // 치명 — 날 선 조각이 돈다
  for(let i=0;i<4;i++){const a=T*1.9+i*1.571,r=30+Math.sin(T*3+i)*4;
   g.save();g.translate(Math.cos(a)*r,Math.sin(a)*r);g.rotate(a);
   g.globalAlpha=.75;g.beginPath();
   g.moveTo(6,0);g.lineTo(0,3.4);g.lineTo(-6,0);g.lineTo(0,-3.4);g.closePath();g.fill();
   g.restore();}
 }else if(tr==="drain"){                // 흡혈 — 고리가 안으로 빨려든다
  for(let i=0;i<3;i++){const k=((T*.55+i/3)%1);
   g.globalAlpha=.5*k;g.lineWidth=2;
   g.beginPath();g.arc(0,0,10+(1-k)*34,0,6.283);g.stroke();}
 }else if(tr==="burst"){                // 광역 — 파문이 퍼진다
  for(let i=0;i<3;i++){const k=((T*.6+i/3)%1);
   g.globalAlpha=.5*(1-k);g.lineWidth=2.4*(1-k)+.6;
   g.beginPath();g.arc(0,0,12+k*38,0,6.283);g.stroke();}
 }else if(tr==="pierce"){               // 관통 — 앞으로 뻗는 선
  g.rotate(P.dir);
  for(let i=0;i<3;i++){const k=((T*1.1+i/3)%1);
   g.globalAlpha=.6*(1-k);g.lineWidth=2;
   g.beginPath();g.moveTo(18+k*30,-5+i*5);g.lineTo(34+k*30,-5+i*5);g.stroke();}
 }else if(tr==="echo"){                 // 분신 — 흐릿한 사본이 따라온다
  for(let i=1;i<=2;i++){
   g.globalAlpha=.2/i;
   g.beginPath();g.arc(-Math.cos(P.dir)*i*13,-Math.sin(P.dir)*i*13,12,0,6.283);g.fill();}
 }else if(tr==="rush"){                 // 질주 — 뒤로 흐르는 줄기
  const back=P.dir+Math.PI;
  for(let i=0;i<5;i++){const o=(i-2)*5,k=((T*2.2+i*.2)%1);
   g.globalAlpha=.45*(1-k);g.lineWidth=2;
   const px=Math.cos(back)*(14+k*30)+Math.cos(back+1.571)*o;
   const py=Math.sin(back)*(14+k*30)+Math.sin(back+1.571)*o;
   g.beginPath();g.moveTo(px,py);
   g.lineTo(px+Math.cos(back)*9,py+Math.sin(back)*9);g.stroke();}
 }else if(tr==="linger"){               // 잔존 — 떨어져 고이는 방울
  for(let i=0;i<5;i++){const a=i*1.257+T*.4,k=((T*.8+i/5)%1);
   g.globalAlpha=.5*(1-k);
   g.beginPath();g.arc(Math.cos(a)*26,Math.sin(a)*26+k*16,2.6*(1-k)+.8,0,6.283);g.fill();}
 }else if(tr==="twin"){                 // 쌍격 — 두 고리가 서로 반대로
  g.globalAlpha=.42;g.lineWidth=1.8;
  for(let s=0;s<2;s++){
   g.save();g.rotate(T*(s?-1.3:1.3));
   g.beginPath();g.ellipse(0,0,30,17,0,0,6.283);g.stroke();g.restore();}
 }else if(tr==="recast"){               // 재격 — 점선 고리가 깜빡인다
  g.globalAlpha=.3+Math.abs(Math.sin(T*6))*.4;g.lineWidth=2;
  g.setLineDash([5,7]);g.lineDashOffset=-T*24;
  g.beginPath();g.arc(0,0,30,0,6.283);g.stroke();g.setLineDash([]);
 }else{                                 // 수확 — 위로 피어오르는 알갱이
  for(let i=0;i<6;i++){const a=i*1.047+T*.3,k=((T*.7+i/6)%1);
   g.globalAlpha=.55*(1-k);
   g.beginPath();g.arc(Math.cos(a)*22,Math.sin(a)*22-k*26,2.2*(1-k)+.7,0,6.283);g.fill();}
 }
 g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
 if(arCur().st.sig)arDrawAbsAura(g,arCur().st.sig,c,T);
}

/* 공격 이펙트 — 모션마다 다르게 */
function arDrawSwingFx(g,f){
 if(f.t<0)return;                         // 음수 t 는 지연이다 — 아직 그릴 때가 아니다
 const k=f.t/f.d, ik=1-k;
 g.save();g.globalCompositeOperation="lighter";
 if(f.k==="slash"){
  g.translate(f.x,f.y);
  g.strokeStyle=f.c;g.globalAlpha=ik*.85;g.lineWidth=9*ik+2;g.lineCap="round";
  g.beginPath();g.arc(0,0,f.R*.74,f.a-.6+k*.5,f.a+.6+k*.5);g.stroke();
  g.strokeStyle="#fff";g.globalAlpha=ik;g.lineWidth=2.5;
  g.beginPath();g.arc(0,0,f.R*.82,f.a-.5+k*.5,f.a+.5+k*.5);g.stroke();
 }else if(f.k==="crescent"){            // 대검 — 두꺼운 초승달 + 잔상
  g.translate(f.x,f.y);
  for(let i=0;i<3;i++){
   g.globalAlpha=ik*(.5-i*.13);g.strokeStyle=i?f.c:"#fff";
   g.lineWidth=(16-i*4)*ik+2;g.lineCap="round";
   g.beginPath();g.arc(0,0,f.R*(.68+i*.07),f.a-f.half+k*1.5,f.a+f.half+k*1.5);g.stroke();}
 }else if(f.k==="lance"){               // 레이피어 — 길게 뻗는 빛의 창
  g.translate(f.x,f.y);g.rotate(f.a);
  const L=f.R*Math.min(1,k*3);
  g.globalAlpha=ik*.9;
  const lg=g.createLinearGradient(0,0,L,0);
  lg.addColorStop(0,"rgba(0,0,0,0)");lg.addColorStop(.6,f.c);lg.addColorStop(1,"#fff");
  g.fillStyle=lg;
  g.beginPath();g.moveTo(10,-7*ik-1);g.lineTo(L,0);g.lineTo(10,7*ik+1);g.closePath();g.fill();
 }else if(f.k==="flame"){               // 화염도 — 부채꼴로 흩어지는 불티
  g.translate(f.x,f.y);
  for(let i=0;i<9;i++){
   const a=f.a-f.half+(i/8)*f.half*2, d=f.R*(.3+k*.9);
   g.globalAlpha=ik*.8;g.fillStyle=i%2?f.c:"#ffd9a8";
   g.beginPath();g.arc(Math.cos(a)*d,Math.sin(a)*d,(5-k*3)*ik+1,0,6.283);g.fill();}
 }else if(f.k==="cross"){               // 도 — 엇갈린 두 줄
  g.translate(f.x,f.y);g.rotate(f.a);
  g.strokeStyle="#fff";g.globalAlpha=ik;g.lineWidth=4*ik+1.5;g.lineCap="round";
  g.beginPath();g.moveTo(14,-26);g.lineTo(f.R*.9,20);g.stroke();
  g.strokeStyle=f.c;g.lineWidth=6*ik+1.5;
  g.beginPath();g.moveTo(14,26);g.lineTo(f.R*.9,-20);g.stroke();
 }else if(f.k==="dash"){                // 송곳니 — 파고든 자국
  g.strokeStyle=f.c;g.globalAlpha=ik*.8;g.lineWidth=22*ik+2;g.lineCap="round";
  g.beginPath();g.moveTo(f.x0,f.y0);g.lineTo(f.x1,f.y1);g.stroke();
  g.strokeStyle="#fff";g.globalAlpha=ik;g.lineWidth=4*ik+1;
  g.beginPath();g.moveTo(f.x0,f.y0);g.lineTo(f.x1,f.y1);g.stroke();
 }else if(f.k==="rift"){                // 균열검 — 갈라진 틈
  g.globalAlpha=ik;
  const dx=f.x1-f.x0,dy=f.y1-f.y0,n=6;
  g.strokeStyle=f.c;g.lineWidth=9*ik+1.5;g.lineJoin="round";
  g.beginPath();g.moveTo(f.x0,f.y0);
  for(let i=1;i<=n;i++){const t=i/n,o=(i%2?1:-1)*11*ik*(1-Math.abs(t-.5)*1.4);
   g.lineTo(f.x0+dx*t-dy/n*o*.14,f.y0+dy*t+dx/n*o*.14);}
  g.stroke();
  g.strokeStyle="#fff";g.lineWidth=2.5;g.stroke();
  for(let i=0;i<2;i++){g.globalAlpha=ik*.5;g.fillStyle=f.c;
   g.beginPath();g.arc(i?f.x1:f.x0,i?f.y1:f.y0,(14-k*10)+2,0,6.283);g.fill();}
 }else if(f.k==="muzzle"){              // 수정검 — 쏘는 순간 파편이 튄다
  g.translate(f.x,f.y);g.rotate(f.a);
  g.globalAlpha=ik;g.fillStyle=f.c;
  for(let i=0;i<5;i++){const a=(i-2)*.32;
   g.save();g.rotate(a);g.beginPath();
   g.moveTo(16+k*22,0);g.lineTo(26+k*26,3.5*ik);g.lineTo(26+k*26,-3.5*ik);
   g.closePath();g.fill();g.restore();}
 }
 g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
}

/* ══ ABSOLUTE 전용 연출 ══
   고유 특징(trait) 아우라 위에 제 테마의 층을 하나 더 얹는다. */
function arDrawAbsAura(g,sig,c,T){
 /* 스스로 자리를 잡는다 — 호출부의 translate 에 기대면 복원 뒤에 불릴 때 원점에 그려진다 */
 g.save();g.translate(BA.p.x,BA.p.y);g.globalCompositeOperation="lighter";
 if(sig==="tdz"){                        // 시계 — 바늘이 도는 작은 시계들이 공전한다
  g.globalAlpha=.3;g.strokeStyle=c;g.lineWidth=1.2;
  g.save();g.rotate(-T*.35);              // 큰 문자판은 거꾸로 돈다
  g.beginPath();g.arc(0,0,58,0,6.283);g.stroke();
  for(let i=0;i<12;i++){const a=i*.5236;
   g.beginPath();g.moveTo(Math.cos(a)*52,Math.sin(a)*52);
   g.lineTo(Math.cos(a)*58,Math.sin(a)*58);g.stroke();}
  g.restore();
  for(let i=0;i<3;i++){                   // 작은 시계 셋
   const a=T*.8+i*2.094,r=40;
   g.save();g.translate(Math.cos(a)*r,Math.sin(a)*r);
   g.globalAlpha=.85;g.strokeStyle=c;g.lineWidth=1.4;
   g.beginPath();g.arc(0,0,9,0,6.283);g.stroke();
   g.lineWidth=1.8;g.beginPath();g.moveTo(0,0);       // 시침
   g.lineTo(Math.cos(T*1.6+i)*5,Math.sin(T*1.6+i)*5);g.stroke();
   g.beginPath();g.moveTo(0,0);                       // 분침 — 거꾸로
   g.lineTo(Math.cos(-T*4.2+i)*7.5,Math.sin(-T*4.2+i)*7.5);g.stroke();
   g.restore();}
 }else if(sig==="glx"){                  // 색 어긋남 — 빨강·청록 사본이 튄다
  const j=Math.floor(T*14)%3;
  const ox=(j-1)*4, oy=((Math.floor(T*11)%3)-1)*3;
  g.globalAlpha=.42;
  g.fillStyle="#ff2d4d";g.beginPath();g.arc(-6-ox,oy,14,0,6.283);g.fill();
  g.fillStyle="#31e8ff";g.beginPath();g.arc(6+ox,-oy,14,0,6.283);g.fill();
  const GC=["#ff2d4d","#31e8ff","#ff4df0","#5eff7a","#ffe14d","#ffffff"];
  for(let i=0;i<7;i++){                   // 튀는 색 사각형
   const s=(Math.floor(T*9)+i*37)%11;
   if(s>4)continue;
   const a=i*.897+Math.floor(T*4)*1.3, r=24+((i*13)%22);
   g.globalAlpha=.85;g.fillStyle=GC[i%GC.length];
   g.fillRect(Math.cos(a)*r,Math.sin(a)*r,4+(i%4)*3,3+(i%3)*2);}
  g.globalAlpha=.3;g.strokeStyle="#cfe8ff";g.lineWidth=1;   // 주사선
  for(let i=-2;i<=2;i++){const y=i*9+((T*40)%9);
   g.beginPath();g.moveTo(-26,y);g.lineTo(26,y);g.stroke();}
 }else{                                  // 망각 — 보랏빛으로 지워지고, 잔상이 잊힌다
  g.globalCompositeOperation="source-over";
  g.globalAlpha=.5;g.fillStyle="#0d0618";   // 발밑이 지워진다
  g.beginPath();g.ellipse(0,4,34,15,0,0,6.283);g.fill();
  g.globalCompositeOperation="lighter";
  g.globalAlpha=.3;g.strokeStyle=c;g.lineWidth=1.4;
  for(let i=0;i<2;i++){const k=((T*.42+i/2)%1);
   g.globalAlpha=.4*(1-k);
   g.beginPath();g.arc(0,0,18+k*34,0,6.283);g.stroke();}
  g.fillStyle=c;
  for(let i=0;i<8;i++){                   // 떠올라 잊히는 알갱이
   const a=i*.785+T*.25,k=((T*.5+i/8)%1);
   g.globalAlpha=.7*(1-k)*(1-k);
   g.beginPath();g.arc(Math.cos(a)*(20+k*16),Math.sin(a)*(20+k*16)-k*34,
     2.6*(1-k)+.6,0,6.283);g.fill();}
 }
 g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
}
/* 서명 공격 — 기본 모션이 끝난 뒤에 얹힌다 */
function arAbsAttack(sig,dmg,tr,dir){
 const P=BA.p,c=arCol();
 if(sig==="tdz"){
  /* 벤 자리의 시간이 잠깐 멎는다 — 맞은 적이 느려지고 되감김 잔상이 남는다 */
  for(const o of BA.mobs) if(arDist(o,P)<110)o.slow=Math.max(o.slow||0,.9);
  BA.fx.push({k:"tdzEcho",x:P.x,y:P.y,a:dir,t:0,d:.5,c});
 }else if(sig==="glx"){
  /* 깨진 조각이 튄다 — 지지직거리며 날아간다 */
  for(let i=0;i<3;i++){const a=dir+(i-1)*.34;
   BA.bul.push({x:P.x,y:P.y,vx:Math.cos(a)*380,vy:Math.sin(a)*380,
     r:7,dmg:dmg*.4,tr,foe:0,t:0,c,gl:1});}
  BA.fx.push({k:"glxTear",x:P.x,y:P.y,a:dir,t:0,d:.3,c});
 }else{
  /* 지워진다 — 베인 자리가 잠깐 없던 것이 된다 */
  BA.fx.push({k:"oblErase",x:P.x+Math.cos(dir)*58,y:P.y+Math.sin(dir)*58,t:0,d:.55,c});
 }
}
function arDrawAbsFx(g,f){
 if(f.t<0)return;
 const k=f.t/f.d, ik=1-k;
 g.save();
 if(f.k==="tdzEcho"){                     // 되감기는 시곗바늘
  g.globalCompositeOperation="lighter";
  g.translate(f.x,f.y);
  g.globalAlpha=ik*.8;g.strokeStyle=f.c;g.lineWidth=2;
  g.beginPath();g.arc(0,0,44*(1-ik*.25),f.a-2.6+k*5.2,f.a-2.4+k*5.2);g.stroke();
  g.lineWidth=1.2;g.globalAlpha=ik*.5;
  g.beginPath();g.arc(0,0,44,0,6.283);g.stroke();
  for(let i=0;i<12;i++){const a=i*.5236-k*1.6;   // 눈금이 거꾸로 흐른다
   g.beginPath();g.moveTo(Math.cos(a)*38,Math.sin(a)*38);
   g.lineTo(Math.cos(a)*44,Math.sin(a)*44);g.stroke();}
 }else if(f.k==="glxTear"){               // 찢어진 자리 + 노이즈 블록
  g.translate(f.x,f.y);g.rotate(f.a);
  const GC=["#ff2d4d","#31e8ff","#ff4df0","#ffffff"];
  g.globalAlpha=ik;
  for(let i=0;i<9;i++){
   const x=14+i*11+((i*17)%9), y=((i*29)%17)-8;
   g.fillStyle=GC[i%4];
   g.fillRect(x,y+(Math.floor(k*9)%3-1)*3,7+(i%3)*4,2.5+(i%2)*2.5);}
  g.globalAlpha=ik*.9;g.strokeStyle="#fff";g.lineWidth=2;
  g.beginPath();g.moveTo(10,0);
  for(let i=1;i<=5;i++)g.lineTo(10+i*18,((i%2?1:-1)*7)*ik);
  g.stroke();
 }else{                                   // 지워지는 자리 — 안으로 오므라든다
  g.translate(f.x,f.y);
  g.globalAlpha=ik*.75;g.fillStyle="#0d0618";
  g.beginPath();g.arc(0,0,34*ik,0,6.283);g.fill();
  g.globalCompositeOperation="lighter";
  g.globalAlpha=ik*.85;g.strokeStyle=f.c;g.lineWidth=2.4*ik+.8;
  g.beginPath();g.arc(0,0,38*ik,0,6.283);g.stroke();
  g.fillStyle=f.c;
  for(let i=0;i<7;i++){const a=i*.897;
   g.globalAlpha=ik*.8;
   g.beginPath();g.arc(Math.cos(a)*40*ik,Math.sin(a)*40*ik,2.2*ik+.5,0,6.283);g.fill();}
 }
 g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
}
/* 지지직거리는 조각 탄 */
function arDrawGlitchBullet(g,b){
 const GC=["#ff2d4d","#31e8ff","#ffffff"];
 const j=Math.floor(b.t*40);
 g.save();g.translate(b.x,b.y);
 g.globalCompositeOperation="lighter";
 for(let i=0;i<3;i++){
  const ox=((j+i*5)%3-1)*3.5, oy=((j+i*7)%3-1)*3;
  g.globalAlpha=.85;g.fillStyle=GC[i];
  g.fillRect(-b.r+ox,-b.r*.7+oy,b.r*2,b.r*1.4);}
 g.globalAlpha=.6;g.strokeStyle="#fff";g.lineWidth=1;
 g.beginPath();g.moveTo(-b.r*2,0);
 for(let i=0;i<4;i++)g.lineTo(-b.r*2+i*b.r,((i%2)?1:-1)*b.r*.8);
 g.stroke();
 g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
}
