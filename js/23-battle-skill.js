/* ═════════ 배틀 · 검의 스킬 ═════════
   태초(12등급) 이상의 검에는 저마다 하나씩 스킬이 붙는다.

   쿨타임이 아니라 게이지다. 내가 넣은 피해가 쌓여 차고, 검마다 따로 찬다 —
   들고 있던 검으로 넣은 피해는 그 검의 게이지로만 간다. 그래서 검을 바꾸면
   게이지도 같이 바뀐다. 쿨타임이면 가만히 서 있어도 차지만, 이렇게 두면
   싸운 만큼만 돌아온다.

   필요량은 그 검의 공격력에 비례한다. 안 그러면 상위 검일수록 게이지가
   저절로 빨리 차서, 세지는 동시에 자주 쓰기까지 하는 이중 이득이 된다.

   스킬은 P 키, 모바일은 공격 버튼 안쪽 위의 둥근 단추다. */

const SK_FILL=26;                       // 제 공격력의 26배를 누적하면 한 번
const C_TAU=6.283185307;

/* ── 게이지 ── */
function skArm(e){ e.sk=SKILLS[e.s.n]||null; e.gauge=0; e.need=skNeed(e); }
function skNeed(e){ return e.sk?Math.max(1,Math.round(e.st.dmg*SK_FILL*(e.sk.cost||1))):0; }
const skCur=()=>(BA&&BA.team)?BA.team[BA.slot]:null;
function skGain(d){
 /* gainTo 가 있으면 그쪽으로 — AI 동료가 제 게이지를 채울 때 쓴다 */
 const e=BA.gainTo||skCur(); if(!e||!e.sk||e.gauge>=e.need)return;
 e.gauge=Math.min(e.need,e.gauge+d);
 if(e.gauge>=e.need){                                  // 막 찼다
  BA.skfx=BA.skfx||[];
  BA.skfx.push({k:"ready",t:0,d:.9,c:e.look.col});
  skSound("ready");
 }
}
const skRatio=e=>(e&&e.sk&&e.need)?Math.min(1,e.gauge/e.need):0;

/* ── 발동 ── */
function skUse(){
 if(!BA||BA.over||BA.pick||BA.p.hp<=0)return;
 const e=skCur(); if(!e)return;
 if(!e.sk){toast("태초 등급부터 스킬이 있습니다");return;}
 if(e.gauge<e.need){
  toast(e.sk.n+" — 게이지 "+Math.floor(skRatio(e)*100)+"%");return;}
 e.gauge=0;
 BA.skfx=BA.skfx||[];
 BA.skfx.push({k:"call",t:0,d:1.5,c:e.look.col,n:e.sk.n,en:e.sk.en});
 skFire(e,null);
}
/* by 를 주면 그 사람이 시전한다(AI 동료).

   즉발 효과는 시전자 자리에서 나가도록 주인공 자리를 잠깐 빌린다.
   반면 몇 초에 걸쳐 도는 것(방벽·나선·사슬)은 매 프레임 BA.p 를 보므로
   결국 주인공을 따라다닌다. 협력에서는 그게 맞다 —
   동료가 벽을 세우면 내 둘레에 서고, 동료가 나를 감싼다. */
function skFire(e,by){
 const P=BA.p;
 const ox=by?by.x:P.x, oy=by?by.y:P.y, od=by?by.dir:P.dir;
 const C={P,e,look:e.look,col:e.look.col,
          dmg:e.st.dmg*(by?0.85:BA.up.dmg),dir:od,x:ox,y:oy};
 const sx=P.x,sy=P.y,sd=P.dir;
 if(by){P.x=ox;P.y=oy;P.dir=od;}
 skRun(()=>e.sk.run(C));
 if(by){P.x=sx;P.y=sy;P.dir=sd;}
}
/* 스킬이 내는 피해는 게이지를 채우지 않는다.
   안 그러면 큰 스킬일수록 제 피해로 제 게이지를 즉시 되채워
   무한히 다시 쓸 수 있게 된다 — 「처음이자 끝」은 실제로 그랬다.
   한 스킬이 터져도 판이 멈추면 안 되므로 예외도 여기서 받는다. */
function skRun(fn,a,b){
 BA.skFiring=(BA.skFiring||0)+1;
 try{ fn(a,b); }
 catch(err){ if(!BA.skWarn){BA.skWarn=1;console.error("skill:",err);} }
 finally{ BA.skFiring--; }
}

/* ── 살아 있는 효과 ──
   몇 초에 걸쳐 일하는 스킬은 여기에 일감으로 올려 둔다. */
function skJob(k,d,fn,end,extra){
 const j=Object.assign({k,t:0,d,fn,end},extra||{});
 (BA.skJobs=BA.skJobs||[]).push(j);
 return j;
}
function skDelay(t,fn){ skJob("_wait",t,null,fn); }
function skTick(dt){
 if(!BA)return;
 if(BA.freeze>0)BA.freeze=Math.max(0,BA.freeze-dt);
 if(BA.fate>0)BA.fate=Math.max(0,BA.fate-dt);
 if(BA.skHaste>0)BA.skHaste=Math.max(0,BA.skHaste-dt);
 /* 「되돌림」이 쓸 과거 — 0.2초마다 한 장, 8초치를 들고 있는다 */
 BA.histT=(BA.histT||0)-dt;
 if(BA.histT<=0){
  BA.histT=.2;
  BA.hist.push({hp:BA.p.hp,
    m:BA.mobs.map(o=>[o.uid,Math.round(o.x),Math.round(o.y)])});
  if(BA.hist.length>40)BA.hist.shift();
 }
 const J=BA.skJobs;
 if(J)for(let i=J.length-1;i>=0;i--){
  const j=J[i];j.t+=dt;
  if(j.fn)skRun(j.fn,j,dt);
  if(j.t>=j.d){ if(j.end)skRun(j.end,j); J.splice(i,1); }
 }
 const F=BA.skfx;
 if(F)for(let i=F.length-1;i>=0;i--){const f=F[i];f.t+=dt;if(f.t>=f.d)F.splice(i,1);}
}
function skFx(k,o){ (BA.skfx=BA.skfx||[]).push(Object.assign({k,t:0,d:1},o)); }
const skJobOf=k=>{const J=BA.skJobs;if(!J)return null;
 for(const j of J)if(j.k===k)return j; return null;};
/* 반경 안의 적 */
function skMobs(x,y,r){
 const out=[];
 for(const o of BA.mobs) if(Math.hypot(o.x-x,o.y-y)<r+o.r)out.push(o);
 return out;
}
const skAll=()=>BA.mobs.slice();

/* ══════════════ 스킬 ══════════════
   검의 설명에서 곧장 끌어온다. 수치보다 "그 검이 하는 일"이 먼저다. */
const SKILLS={

/* ── 태초 ── */
"EQUINOX":{n:"영 零",en:"ZERO",cost:1.0,
 d:"모든 것을 같게 만든다. 가장 약한 것에 맞춰 전부가 깎인다.",
 run(C){
  const ms=BA.mobs;
  if(ms.length){
   let lo=Infinity;
   for(const o of ms) if(!o.boss) lo=Math.min(lo,o.hp);
   if(!isFinite(lo))lo=0;
   const cap=C.dmg*8;
   for(const o of ms)
    arHit(o,o.boss?C.dmg*5:Math.min(cap,Math.max(C.dmg*1.2,o.hp-lo)),null,1);
  }
  skFx("zero",{x:C.x,y:C.y,d:1.2,c:"#ffffff"});
  skSound("zero");}},

"적요 寂寥":{n:"적막",en:"HUSH",cost:.95,
 d:"소리가 닿지 않는다. 멎은 것들을 조용히 갉는다.",
 run(C){
  for(const o of BA.mobs){
   o.hush=Math.max(o.hush||0,o.boss?1.8:4.2);
   o.slow=Math.max(o.slow||0,5);}
  skJob("hush",4.2,function(j,dt){
   j.tk=(j.tk||0)+dt; if(j.tk<.4)return; j.tk=0;
   for(const o of BA.mobs) if(o.hush>0)arHit(o,C.dmg*.55,null,1);
  },function(){ skDuck(1); });
  skDuck(.1);                                   // 배경음이 잦아든다
  skFx("hushring",{x:C.x,y:C.y,d:1.1,c:"#eef2f8"});
  skSound("hush");}},

"태동 胎動":{n:"첫 박동",en:"FIRST BEAT",cost:.9,
 d:"아직 태어나지 않은 것이 뛴다. 한 번 뛸 때마다 삼킨 만큼 살아난다.",
 run(C){
  [0,.40,.72,1.26,1.58].forEach((t,i)=>{
   const R=118+i*46;
   skDelay(t,()=>{
    if(!BA||BA.over)return;
    const hit=skMobs(BA.p.x,BA.p.y,R);
    for(const o of hit)arHit(o,C.dmg*1.15,null,1);
    if(hit.length)BA.p.hp=Math.min(BA.p.hpMax,
      BA.p.hp+Math.round(BA.p.hpMax*.014*Math.min(6,hit.length)));
    skFx("beat",{x:BA.p.x,y:BA.p.y,d:.62,c:C.col,R});
    skSound("beat",i%2);});
  });}},

"관측자 觀測者":{n:"관측",en:"OBSERVE",cost:.85,
 d:"보아 버린 것은 달아나지 못한다. 관측된 적이 받는 피해가 두 배가 된다.",
 run(C){
  for(const o of BA.mobs)o.mark=Math.max(o.mark||0,5.5);
  BA.p.inv=Math.max(BA.p.inv,1.2);
  skFx("observe",{x:C.x,y:C.y,d:1.5,c:C.col});
  skSound("observe");}},

/* ── 운명 ── */
"O P P R E S S I O N":{n:"사슬 심판",en:"CHAINS",cost:1.15,
 d:"사슬이 여덟을 꿰어 발밑으로 끌어온다. 끌려온 것은 놓아 주지 않는다.",
 run(C){
  const list=BA.mobs.slice().sort((a,b)=>arDist(a,C.P)-arDist(b,C.P)).slice(0,8);
  const anc=list.map((o,i)=>({o,a:i/Math.max(1,list.length)*6.283}));
  skJob("chain",2.8,function(j,dt){
   const P=BA.p;
   for(const a of anc){
    const o=a.o; if(BA.mobs.indexOf(o)<0)continue;
    const tx=P.x+Math.cos(a.a)*74, ty=P.y+Math.sin(a.a)*74;
    o.x+=(tx-o.x)*Math.min(1,dt*3.4); o.y+=(ty-o.y)*Math.min(1,dt*3.4);
    o.hush=Math.max(o.hush||0,.12);}
   j.tk=(j.tk||0)+dt; if(j.tk<.34)return; j.tk=0;
   for(const a of anc) if(BA.mobs.indexOf(a.o)>=0)arHit(a.o,C.dmg*.9,null,1);
  },null,{anc,col:C.col});
  skSound("chain");}},

"회귀 回歸":{n:"되돌림",en:"REGRESSION",cost:1.1,
 d:"넉 초 전으로 돌아간다. 적이 서 있던 자리도, 내가 가졌던 체력도.",
 run(C){
  const h=BA.hist, back=h.length?h[Math.max(0,h.length-21)]:null;
  if(back){
   const map={}; for(const a of back.m)map[a[0]]=a;
   for(const o of BA.mobs){const a=map[o.uid]; if(a){o.x=a[1];o.y=a[2];}}
   if(back.hp>BA.p.hp)BA.p.hp=Math.min(BA.p.hpMax,back.hp);
  }
  for(const o of BA.mobs)arHit(o,C.dmg*2.4,null,1);
  BA.p.inv=Math.max(BA.p.inv,1.1);
  skFx("regress",{x:C.x,y:C.y,d:1.3,c:C.col});
  skSound("regress");}},

"심판 審判":{n:"단죄",en:"VERDICT",cost:1.2,
 d:"절반 아래로 떨어진 것은 그 자리에서 끝난다. 남은 것에도 빛이 떨어진다.",
 run(C){
  BA.mobs.slice().forEach((o,i)=>skDelay(i*.055,()=>{
   if(!BA||BA.over||BA.mobs.indexOf(o)<0)return;
   skFx("verdict",{x:o.x,y:o.y,d:.52,c:"#ffe89a"});
   if(!o.boss&&o.hp<=o.hpMax*.5)arHit(o,o.hp+1,null,1);
   else arHit(o,C.dmg*(o.boss?4.2:2.3),null,1);
   skSound("verdict");}));}},

"천기 天機":{n:"이미 정해져 있었다",en:"FOREORDAINED",cost:1.0,
 d:"고르지 않는다. 이미 골라져 있었다. 세 초 동안 모든 일격이 정해진 대로 든다.",
 run(C){
  BA.fate=3.4; BA.p.inv=Math.max(BA.p.inv,3.4);
  skJob("fate",3.4,null);
  skFx("fate",{x:C.x,y:C.y,d:1.0,c:C.col});
  skSound("fate");}},

/* ── 무극 ── */
"무한의 나선":{n:"나선",en:"SPIRAL",cost:1.05,
 d:"끝을 향해 감기지만 끝이 없다. 세 바퀴를 돌아 바깥까지 훑는다.",
 run(C){
  skJob("spiral",1.9,function(j,dt){
   const P=BA.p,k=j.t/j.d;
   j.ang=C.dir+k*3*6.283;
   j.r=22+k*Math.max(BA.w,BA.h)*.58;
   /* 나선의 팔이 쓸고 지나간 자리 전체를 본다 — 가느다란 띠로만 잡으면
      팔이 워낙 빨리 돌아 대부분이 사이로 빠져나간다. */
   for(const o of BA.mobs){
    if(arDist(o,P)>j.r+o.r)continue;
    let a=Math.atan2(o.y-P.y,o.x-P.x)-j.ang;
    while(a>Math.PI)a-=6.283; while(a<-Math.PI)a+=6.283;
    if(Math.abs(a)>1.1)continue;
    if((o.spT||0)>BA.time-.34)continue;
    o.spT=BA.time;
    arHit(o,C.dmg*1.35,null,1);
    o.x+=Math.cos(j.ang+1.45)*24;o.y+=Math.sin(j.ang+1.45)*24;}
  },null,{col:C.col});
  skSound("spiral");}},

"경계 밖의 관측":{n:"한 점",en:"SINGULARITY",cost:1.1,
 d:"선 밖에서 보면 안에 있던 모든 것이 한 점이었다. 모아 두고 터뜨린다.",
 run(C){
  const cx=Math.max(70,Math.min(BA.w-70,C.x+Math.cos(C.dir)*140));
  const cy=Math.max(70,Math.min(BA.h-70,C.y+Math.sin(C.dir)*140));
  skJob("singular",1.6,function(j,dt){
   for(const o of BA.mobs){
    const dx=cx-o.x,dy=cy-o.y;
    const p=Math.min(1,dt*(o.boss?1.3:4.4));
    o.x+=dx*p;o.y+=dy*p;
    o.hush=Math.max(o.hush||0,.14);}
  },function(){
   skFx("singpop",{x:cx,y:cy,d:.7,c:C.col});
   for(const o of skMobs(cx,cy,200))arHit(o,C.dmg*4.8,null,1);
   skSound("singpop");
  },{cx,cy,col:C.col});
  skSound("singular");}},

"무극 無極":{n:"나눌 수 없음",en:"INDIVISIBLE",cost:1.15,
 d:"더 나눌 수 없는 자리에 선다. 적은 반으로 갈리고, 나는 갈리지 않는다.",
 run(C){
  /* 보스까지 반으로 가르면 한 방에 판이 끝난다 — 보스는 다섯 중 하나만 */
  for(const o of BA.mobs){
   const cut=Math.floor(o.hp*(o.boss?.2:.5));
   if(cut>0)arHit(o,cut,null,1);}
  BA.p.inv=Math.max(BA.p.inv,4.2);
  skJob("indiv",4.2,null,null,{col:C.col});
  skFx("indivpop",{x:C.x,y:C.y,d:1,c:C.col});
  skSound("indiv");}},

/* ── 혼돈 ── */
"혼돈의 이빨":{n:"규칙 삭제",en:"RULE EATER",cost:1.0,
 d:"물릴 때마다 규칙이 하나씩 사라진다. 무엇이 사라질지는 정해지지 않았다.",
 run(C){
  for(const o of BA.mobs){
   const r=Math.floor(Math.random()*4);
   if(r===0){o.armor=6.5;      o.ruleN="방어";}
   else if(r===1){o.hush=Math.max(o.hush||0,4.2); o.ruleN="이동";}
   else if(r===2){o.dmg=0;     o.ruleN="공격";}
   else {o.ruleN="존재"; if(!o.boss&&o.hp<=o.hpMax*.5)arHit(o,o.hp+1,null,1);}
   o.ruleT=2.4;
   if(BA.mobs.indexOf(o)>=0)arHit(o,C.dmg*1.55,null,1);}
  skFx("ruleeat",{x:C.x,y:C.y,d:1.1,c:C.col});
  skSound("ruleeat");}},

"뒤틀린 인과":{n:"결과가 먼저",en:"EFFECT FIRST",cost:1.1,
 d:"벤 뒤에야 왜 베였는지 정해진다. 피해가 먼저 들고, 칼자국은 나중에 그어진다.",
 run(C){
  const spots=BA.mobs.map(o=>({x:o.x,y:o.y}));
  for(const o of BA.mobs)arHit(o,C.dmg*2.7,null,1);
  spots.forEach((p,i)=>skDelay(.34+i*.05,()=>{
   skFx("cause",{x:p.x,y:p.y,d:.36,a:Math.random()*6.283,c:C.col});
   skSound("cause");}));
  skFx("effect",{x:C.x,y:C.y,d:.95,c:C.col});
  skSound("effect");}},

"혼돈 混沌":{n:"무질서",en:"DISORDER",cost:1.05,
 d:"질서가 한눈판 사이. 자리가 뒤섞이고, 날아오던 것이 돌아선다.",
 run(C){
  for(const o of BA.mobs){
   o.x=50+Math.random()*(BA.w-100);
   o.y=50+Math.random()*(BA.h-100);
   arHit(o,C.dmg*1.45,null,1);}
  for(const b of BA.bul) if(b.foe){       // 적의 탄이 돌아선다
   b.foe=0;b.vx*=-1.2;b.vy*=-1.2;b.dmg=C.dmg*.7;b.c="#ffcf6e";}
  /* 불길은 다섯 자리만. 더 깔면 화면이 통째로 갈색 판이 되어
     적도 내 위치도 안 보인다 — 어지러운 것과 안 보이는 것은 다르다. */
  for(let i=0,N=QC(5);i<N;i++)
   BA.fx.push({k:"pool",x:70+Math.random()*(BA.w-140),y:70+Math.random()*(BA.h-140),
     r:42,t:0,d:2.6,dmg:C.dmg*.46,c:"#ffcf6e"});
  skFx("disorder",{x:C.x,y:C.y,d:1.3,c:C.col});
  skSound("disorder");}},

/* ── 영겁 ── */
"영겁의 파수꾼":{n:"잊혀진 맹세",en:"FORGOTTEN OATH",cost:1.1,
 d:"무엇을 지키는지는 잊었어도 서는 법은 잊지 않았다. 아무도 선을 넘지 못한다.",
 run(C){
  const R=122;
  skJob("bulwark",6.2,function(j,dt){
   const P=BA.p;
   for(const o of BA.mobs){
    if(arDist(o,P)>R+o.r)continue;
    const a=Math.atan2(o.y-P.y,o.x-P.x);
    o.x=P.x+Math.cos(a)*(R+o.r);o.y=P.y+Math.sin(a)*(R+o.r);
    if((o.wallT||0)>BA.time-.42)continue;
    o.wallT=BA.time;arHit(o,C.dmg*1.15,null,1);}
  },null,{R,col:C.col});
  skSound("bulwark");}},

"시간의 종착":{n:"종착",en:"TERMINUS",cost:1.25,
 d:"모든 시곗바늘이 여기서 멈춘다. 나만 빼고.",
 run(C){
  BA.freeze=4.4;
  skJob("terminus",4.4,null,null,{col:C.col});
  skSound("terminus");}},

"영겁 永劫":{n:"처음이자 끝",en:"ALPHA·OMEGA",cost:1.35,
 d:"처음과 끝이 한 점이 된다. 지금 서 있는 것들은 처음부터 없던 것이 된다.",
 run(C){
  let n=0;
  for(let i=BA.mobs.length-1;i>=0;i--){
   const o=BA.mobs[i];
   if(o.boss){arHit(o,o.hpMax*.25,null,1);continue;}
   arHit(o,o.hp+1,null,1);n++;}
  skFx("alpha",{x:C.x,y:C.y,d:1.7,c:C.col,n});
  skSound("alpha");}},

/* ── ABSOLUTE ── */
"T I M E  D E S T R O Y E R":{n:"시간 파괴",en:"TIME KILL",cost:1.3,
 d:"오래 버틴 것일수록 크게 무너진다. 그동안 나에게만 시간이 두 배로 흐른다.",
 run(C){
  for(const o of BA.mobs){
   const age=Math.min(30,o.t||0);
   arHit(o,C.dmg*(1.7+age*.24),null,1);
   o.st=Math.max(o.st||0,2.2);
   o.slow=Math.max(o.slow||0,4.5);}
  BA.skHaste=5;BA.p.atkCd=0;
  skJob("tdz",5,null,null,{col:C.col});
  skFx("tdzkill",{x:C.x,y:C.y,d:1.5,c:C.col});
  skSound("tdzkill");}},

"G L I T C H":{n:"E`R%RO^R",en:"DEREFERENCE",cost:1.2,
 d:"몇몇은 참조를 잃고 그대로 사라진다. 남은 것은 깨진 채로 계속 흐른다.",
 run(C){
  for(let i=BA.mobs.length-1;i>=0;i--){
   const o=BA.mobs[i];
   if(!o.boss&&Math.random()<.28){arHit(o,o.hp+1,null,1);continue;}
   arHit(o,C.dmg*1.55,null,1);
   o.glitch=3.6;}
  skJob("glx",3.6,function(j,dt){
   j.tk=(j.tk||0)+dt; if(j.tk<.42)return; j.tk=0;
   for(const o of BA.mobs) if(o.glitch>0){
    arHit(o,C.dmg*.58,null,1);
    o.x+=(Math.random()-.5)*26;o.y+=(Math.random()-.5)*26;}
  },null,{col:C.col});
  skFx("glxerr",{x:C.x,y:C.y,d:1.6,c:C.col});
  skSound("glxerr");}},

"O B L I V I O N":{n:"망각",en:"OBLIVION",cost:1.25,
 d:"무엇을 쫓고 있었는지 잊는다. 잊힌 것은 점점 옅어지다 지워진다.",
 run(C){
  for(const o of BA.mobs){o.noTgt=5.6;o.wa=undefined;}
  skJob("oblv",5.6,function(j,dt){
   j.tk=(j.tk||0)+dt; if(j.tk<.5)return; j.tk=0;
   const k=j.t/j.d;
   for(const o of BA.mobs) if(o.noTgt>0)arHit(o,C.dmg*(.45+k*1.5),null,1);
  },null,{col:C.col});
  skFx("oblv",{x:C.x,y:C.y,d:1.4,c:C.col});
  skSound("oblv");}},
};

/* ── 소리 ── */
function skDuck(v){ try{const b=bBus(1); if(b)b.gain.value=v;}catch(e){} }
function skSound(k,v){
 if(!S.sound)return;
 const t=bNow();
 switch(k){
 case "ready": bNote(t,880,.09,"sine",.05,4000);bNote(t+.07,1320,.14,"sine",.045); break;
 case "zero":  bNote(t,110,.9,"sine",.09,600);bNote(t,164.8,.9,"sine",.05);
               bNoise(t,.10,.5,900);bDrum(t,220,40,.5,.10); break;
 case "hush":  bNoise(t,.09,1.1,700);bNote(t,196,1.3,"sine",.045,500);
               bNote(t+.1,147,1.3,"sine",.035,420); break;
 case "beat":  bDrum(t,110,44,.20,.13);bDrum(t+.11,92,36,.16,.08); break;
 case "observe":bNote(t,1760,.5,"sine",.04,7000);bNote(t+.05,2640,.42,"sine",.028);
               bNoise(t,.03,.4,6000,1); break;
 case "chain": for(let i=0;i<6;i++)bNoise(t+i*.045,.07,.06,4200,1);
               bDrum(t,150,50,.34,.11); break;
 case "regress":bNote(t,660,.5,"triangle",.05,3000);bNote(t+.06,495,.5,"triangle",.045);
               bNote(t+.12,330,.6,"triangle",.04);bNoise(t,.05,.5,1800); break;
 case "verdict":bNote(t,1320,.16,"square",.035,6000);bDrum(t,300,90,.22,.09); break;
 case "fate":  bNote(t,262,1.0,"sine",.05,1600);bNote(t,392,1.0,"sine",.04);
               bNote(t,523,1.0,"sine",.03);bNoise(t,.05,.7,2600); break;
 case "spiral":for(let i=0;i<10;i++)bNote(t+i*.08,330*Math.pow(1.11,i),.10,"triangle",.03,5000); break;
 case "singular":bNote(t,90,1.5,"sawtooth",.05,400);bNoise(t,.07,1.4,500); break;
 case "singpop":bDrum(t,420,30,.55,.16,.12);bNoise(t,.14,.4,3200); break;
 case "indiv": bNote(t,147,.8,"sine",.07,800);bNote(t,220,.8,"sine",.05);
               bNoise(t,.06,.3,1400); break;
 case "ruleeat":for(let i=0;i<5;i++)bNoise(t+i*.05,.08,.07,2600-i*300);
               bNote(t,180,.4,"sawtooth",.05,900); break;
 case "effect":bDrum(t,520,60,.3,.14,.1); break;
 case "cause": bNoise(t,.05,.05,5200,1);bNote(t,1100+Math.random()*500,.06,"sawtooth",.025,6000); break;
 case "disorder":for(let i=0;i<8;i++)bNote(t+i*.035,200+Math.random()*1400,.08,"square",.028,6000);
               bNoise(t,.10,.5,1800); break;
 case "bulwark":bDrum(t,160,60,.5,.13);bNote(t,131,.9,"sine",.05,700);
               bNote(t+.08,196,.8,"sine",.04); break;
 case "terminus":bNote(t,523,.25,"sine",.06,4000);bNote(t+.18,392,.35,"sine",.055);
               bNote(t+.42,262,.7,"sine",.05);bNote(t+.9,131,1.6,"sine",.045,600);
               bNoise(t,.05,.6,1200); break;
 case "alpha": bNote(t,262,1.6,"sine",.055,1800);bNote(t,330,1.6,"sine",.04);
               bNote(t,392,1.6,"sine",.035);bNote(t,523,1.6,"sine",.03);
               bDrum(t,200,40,.9,.12);bNoise(t,.09,1.2,2200); break;
 case "tdzkill":bNoise(t,.12,.5,5000,1);
               for(let i=0;i<7;i++)bNote(t+i*.04,1600-i*170,.12,"triangle",.035,7000);
               bDrum(t,240,50,.5,.12); break;
 case "glxerr":for(let i=0;i<10;i++)bNoise(t+i*.035,.09,.05,1200+Math.random()*5000,i%2);
               bNote(t,73,.6,"square",.05,400); break;
 case "oblv":  bNote(t,196,1.4,"sine",.05,900);bNote(t+.2,165,1.4,"sine",.04,700);
               bNote(t+.4,110,1.6,"sine",.045,500);bNoise(t,.06,1.2,800); break;
 }
}

/* ══ 그리기 ══ */
/* 스킬 단추 — 게이지가 테두리를 따라 찬다 */
function skDrawBtn(g,U){
 const e=skCur(); if(!e)return;
 const x=U.kx,y=U.ky,r=U.kr;
 const has=!!e.sk, k=skRatio(e), full=has&&k>=1;
 const col=e.look.col;
 g.save();
 g.globalAlpha=has?1:.28;
 /* 바탕 */
 g.strokeStyle="rgba(232,236,244,.22)";g.lineWidth=2.5;
 g.beginPath();g.arc(x,y,r,0,6.283);g.stroke();
 if(has){
  const pulse=full?(1+Math.sin((BA.time||0)*7)*.06):1;
  g.globalAlpha=full?.22:.08;g.fillStyle=col;
  g.beginPath();g.arc(x,y,r*pulse,0,6.283);g.fill();
  /* 게이지 */
  g.globalAlpha=1;g.strokeStyle=full?"#ffffff":col;g.lineWidth=full?4:3.2;
  g.lineCap="round";
  g.beginPath();g.arc(x,y,r,-1.571,-1.571+6.283*Math.max(.001,k));g.stroke();
  g.lineCap="butt";
  if(full){                                   // 다 차면 바깥으로 파문
   const w=((BA.time||0)*1.5)%1;
   g.globalAlpha=(1-w)*.55;g.lineWidth=2;
   g.beginPath();g.arc(x,y,r+w*14,0,6.283);g.stroke();}
 }
 g.globalAlpha=has?(full?1:.8):.5;
 g.fillStyle=full?"#ffffff":"#dfe6f2";
 g.textAlign="center";g.textBaseline="middle";
 g.font="700 "+Math.round(r*.62)+"px system-ui,sans-serif";
 g.fillText(has?"P":"—",x,y+1);
 g.textBaseline="alphabetic";
 g.restore();g.globalAlpha=1;
}

/* 살아 있는 효과와 한 번짜리 연출 */
function skDraw(g){
 if(!BA)return;
 const W=BA.w,H=BA.h,P=BA.p,T=BA.time||0;
 const J=BA.skJobs||[], F=BA.skfx||[];

 /* ── 화면 전체를 덮는 것들 먼저 ── */
 for(const j of J){
  const k=j.t/j.d, ik=1-k;
  if(j.k==="terminus"){                        // 종착 — 시간이 멎은 화면
   g.save();
   g.fillStyle="rgba(180,200,235,"+(.12*Math.min(1,ik*3)).toFixed(3)+")";
   g.fillRect(0,0,W,H);
   g.globalCompositeOperation="lighter";
   g.translate(W/2,H*.42);
   const R=Math.min(W,H)*.34;
   g.globalAlpha=.16*Math.min(1,ik*3);
   g.strokeStyle=j.col||"#ffe89a";g.lineWidth=3;
   g.beginPath();g.arc(0,0,R,0,6.283);g.stroke();
   g.lineWidth=2;
   for(let i=0;i<12;i++){const a=i*.5236;
    g.beginPath();g.moveTo(Math.cos(a)*R*.9,Math.sin(a)*R*.9);
    g.lineTo(Math.cos(a)*R,Math.sin(a)*R);g.stroke();}
   g.lineWidth=5;g.globalAlpha=.22*Math.min(1,ik*3);   // 멈춘 바늘
   g.beginPath();g.moveTo(0,0);g.lineTo(0,-R*.5);g.stroke();
   g.beginPath();g.moveTo(0,0);g.lineTo(R*.62,0);g.stroke();
   g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
  }else if(j.k==="oblv"){                      // 망각 — 보랏빛으로 지워진다
   g.save();
   g.fillStyle="rgba(24,10,40,"+(.30*Math.sin(Math.PI*Math.min(1,k*1.2))).toFixed(3)+")";
   g.fillRect(0,0,W,H);g.restore();
  }else if(j.k==="fate"){                      // 천기 — 금빛 괘가 돈다
   g.save();g.globalCompositeOperation="lighter";
   g.translate(P.x,P.y);g.globalAlpha=.5*Math.min(1,ik*4);
   g.strokeStyle=j.col||"#ffe89a";
   for(let s=0;s<3;s++){
    g.lineWidth=2-s*.4;
    g.save();g.rotate(T*(s%2?-.8:1.1)+s);
    g.beginPath();g.arc(0,0,34+s*13,0,6.283);g.stroke();
    for(let i=0,N=QC(6);i<N;i++){const a=i*6.283/N;
     g.beginPath();
     g.moveTo(Math.cos(a)*(30+s*13),Math.sin(a)*(30+s*13));
     g.lineTo(Math.cos(a)*(40+s*13),Math.sin(a)*(40+s*13));g.stroke();}
    g.restore();}
   g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
  }else if(j.k==="indiv"){                     // 무극 — 갈라지지 않는 껍질
   g.save();g.globalCompositeOperation="lighter";
   g.translate(P.x,P.y);g.globalAlpha=.4*Math.min(1,ik*4);
   g.strokeStyle=j.col||"#d8bcff";g.lineWidth=2.4;
   for(let s=0;s<2;s++){
    g.save();g.rotate(T*(s?-1.2:1.2));
    g.beginPath();g.ellipse(0,0,30+s*8,24+s*8,0,0,6.283);g.stroke();g.restore();}
   g.globalAlpha=.22*Math.min(1,ik*4);
   g.beginPath();g.arc(0,0,34,0,6.283);g.fillStyle=j.col||"#d8bcff";g.fill();
   g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
  }else if(j.k==="glx"){                       // 글리치 — 주사선과 색 어긋남
   g.save();g.globalCompositeOperation="lighter";
   g.globalAlpha=.10*ik;
   g.fillStyle="#ff2d4d";g.fillRect(-4+((Math.floor(T*13)%3)-1)*5,0,W,H);
   g.fillStyle="#31e8ff";g.fillRect(4-((Math.floor(T*13)%3)-1)*5,0,W,H);
   g.globalAlpha=.16*ik;g.fillStyle="#cfe8ff";
   for(let y=(T*220)%12;y<H;y+=12)g.fillRect(0,y,W,1.2);
   g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
  }else if(j.k==="tdz"){                       // 시간 파괴 — 부서진 시계 조각
   g.save();g.globalCompositeOperation="lighter";
   g.globalAlpha=.4*ik;g.strokeStyle=j.col||"#bfe0ff";g.lineWidth=1.4;
   for(let i=0,N=QC(10);i<N;i++){
    const a=i*6.283/N+T*.5, d=60+((i*37)%120)+k*90;
    g.save();g.translate(P.x+Math.cos(a)*d,P.y+Math.sin(a)*d);g.rotate(a+T);
    g.beginPath();g.arc(0,0,7,a,a+2.1);g.stroke();
    g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(-T*3)*5,Math.sin(-T*3)*5);g.stroke();
    g.restore();}
   g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
  }
 }

 /* ── 자리를 가진 것들 ── */
 for(const j of J){
  const k=j.t/j.d, ik=1-k;
  if(j.k==="hush"){
   g.save();g.globalAlpha=.5*ik;g.strokeStyle="#eef2f8";g.lineWidth=1.2;
   for(const o of BA.mobs) if(o.hush>0){            // 멎은 것 위의 정적 표시
    g.beginPath();g.arc(o.x,o.y-o.r-9,2,0,6.283);g.stroke();
    g.beginPath();g.arc(o.x-6,o.y-o.r-9,1.4,0,6.283);g.stroke();
    g.beginPath();g.arc(o.x+6,o.y-o.r-9,1.4,0,6.283);g.stroke();}
   g.restore();g.globalAlpha=1;
  }else if(j.k==="chain"){
   g.save();g.strokeStyle=j.col||"#cfd6e0";g.lineWidth=2.6;g.globalAlpha=.9*ik+.1;
   for(const a of j.anc){
    const o=a.o; if(BA.mobs.indexOf(o)<0)continue;
    const dx=o.x-P.x,dy=o.y-P.y,L=Math.hypot(dx,dy)||1,n=Math.max(3,Math.round(L/13));
    g.beginPath();
    for(let i=0;i<=n;i++){
     const t2=i/n,px=P.x+dx*t2,py=P.y+dy*t2;
     const off=(i%2?1:-1)*3.4;
     g.lineTo(px-dy/L*off,py+dx/L*off);}
    g.stroke();
    g.globalAlpha=.9;g.fillStyle="#fff";
    g.beginPath();g.arc(o.x,o.y,3.2,0,6.283);g.fill();g.globalAlpha=.9*ik+.1;}
   g.restore();g.globalAlpha=1;
  }else if(j.k==="spiral"){
   g.save();g.globalCompositeOperation="lighter";
   g.translate(P.x,P.y);
   g.strokeStyle=j.col||"#bfffe6";g.lineWidth=5*ik+2;g.globalAlpha=.85;
   g.beginPath();                                   // 실제 아르키메데스 나선
   const turns=k*3;
   for(let i=0;i<=120;i++){
    const u=i/120, a=C_TAU*turns*u+ (j.ang-C_TAU*turns);
    const r=22+(j.r-22)*u;
    if(i)g.lineTo(Math.cos(a)*r,Math.sin(a)*r); else g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
   g.stroke();
   g.strokeStyle="#fff";g.lineWidth=1.6;g.globalAlpha=.7;g.stroke();
   g.globalAlpha=.9;g.fillStyle="#fff";
   g.beginPath();g.arc(Math.cos(j.ang)*j.r,Math.sin(j.ang)*j.r,6*ik+3,0,6.283);g.fill();
   g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
  }else if(j.k==="singular"){
   g.save();g.globalCompositeOperation="lighter";
   g.translate(j.cx,j.cy);
   g.globalAlpha=.8;
   const R=54*(1-k*.6);
   g.fillStyle="#05060c";g.globalCompositeOperation="source-over";
   g.beginPath();g.arc(0,0,R,0,6.283);g.fill();
   g.globalCompositeOperation="lighter";
   g.strokeStyle=j.col||"#bcd0ff";g.lineWidth=2;g.globalAlpha=.85;
   g.beginPath();g.arc(0,0,R+6,0,6.283);g.stroke();
   for(let i=0,N=QC(16);i<N;i++){                   // 빨려드는 선
    const a=i*6.283/N+T*1.6, d0=R+18+((i*29)%90)*(1-k);
    g.globalAlpha=.5*(1-k);
    g.beginPath();g.moveTo(Math.cos(a)*d0,Math.sin(a)*d0);
    g.lineTo(Math.cos(a)*(R+8),Math.sin(a)*(R+8));g.stroke();}
   g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
  }else if(j.k==="bulwark"){
   g.save();g.globalCompositeOperation="lighter";
   g.translate(P.x,P.y);
   const fade=Math.min(1,ik*5)*Math.min(1,k*8);
   g.globalAlpha=.55*fade;g.strokeStyle=j.col||"#ffffff";g.lineWidth=3;
   g.beginPath();g.arc(0,0,j.R,0,6.283);g.stroke();
   g.globalAlpha=.16*fade;g.lineWidth=14;
   g.beginPath();g.arc(0,0,j.R,0,6.283);g.stroke();
   g.globalAlpha=.6*fade;g.lineWidth=2;                // 닳은 새김
   g.save();g.rotate(T*.22);
   for(let i=0,N=QC(18);i<N;i++){const a=i*6.283/N;
    g.beginPath();g.moveTo(Math.cos(a)*(j.R-9),Math.sin(a)*(j.R-9));
    g.lineTo(Math.cos(a)*(j.R+9),Math.sin(a)*(j.R+9));g.stroke();}
   g.restore();
   g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
  }
 }

 /* 관측 표식 · 지워진 규칙 — 적 위에 붙는 글자와 조준선 */
 g.textAlign="center";
 for(const o of BA.mobs){
  if(o.mark>0){
   g.save();g.globalCompositeOperation="lighter";
   g.strokeStyle="#dff4ff";g.globalAlpha=.75;g.lineWidth=1.4;
   g.translate(o.x,o.y);g.rotate(T*.9);
   const R=o.r+9;
   for(let i=0;i<4;i++){const a=i*1.571;
    g.beginPath();g.arc(0,0,R,a+.22,a+1.35);g.stroke();}
   g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";}
  if(o.ruleT>0){

   g.font="700 10px system-ui";g.globalAlpha=Math.min(1,o.ruleT);
   g.fillStyle="#ff9ce0";g.fillText(o.ruleN+" 삭제",o.x,o.y-o.r-14);g.globalAlpha=1;}
  if(o.glitch>0&&Math.floor(T*16)%2){
   g.globalAlpha=.8;g.fillStyle=["#ff2d4d","#31e8ff","#ffffff"][Math.floor(T*11)%3];
   g.fillRect(o.x-o.r,o.y-3,o.r*2,3);g.globalAlpha=1;}
 }

 /* ── 한 번짜리 연출 ── */
 for(const f of F){
  if(f.t<0)continue;
  const k=f.t/f.d, ik=1-k;
  g.save();
  if(f.k==="call"){                              // 스킬 이름
   const a=k<.16?k/.16:(k>.62?Math.max(0,1-(k-.62)/.38):1);
   g.globalAlpha=a;g.textAlign="center";
   g.fillStyle=f.c;g.font="700 "+Math.round(Math.min(34,BA.w*.075))+"px serif";
   g.fillText(f.n,W/2,H*.205);
   g.globalAlpha=a*.6;g.fillStyle="#cfd8e8";
   g.font="500 "+Math.round(Math.min(12,BA.w*.031))+"px system-ui";
   g.fillText(f.en,W/2,H*.205+18);
  }else if(f.k==="ready"){
   g.globalAlpha=ik*.5;g.strokeStyle=f.c;g.lineWidth=3*ik+1;
   g.beginPath();g.arc(BA.ui.kx,BA.ui.ky,BA.ui.kr+k*26,0,6.283);g.stroke();
  }else if(f.k==="zero"){                        // 영 — 흑백이 갈린 원판
   g.translate(f.x,f.y);
   const R=Math.max(W,H)*.75*Math.min(1,k*1.6);
   g.globalAlpha=ik*.85;
   g.rotate(k*1.1);
   g.fillStyle="#ffffff";g.beginPath();g.arc(0,0,R,-1.571,1.571);g.fill();
   g.fillStyle="#0b0c10";g.beginPath();g.arc(0,0,R,1.571,-1.571);g.fill();
   g.globalAlpha=ik;g.strokeStyle="#ffffff";g.lineWidth=3;
   g.beginPath();g.arc(0,0,R,0,6.283);g.stroke();
   g.rotate(-k*1.1);
   g.globalAlpha=ik*.95;g.fillStyle="#ffffff";g.textAlign="center";
   g.font="700 "+Math.round(60*(1+k*.6))+"px serif";
   g.fillText("零",0,22);
  }else if(f.k==="hushring"){
   g.translate(f.x,f.y);g.globalCompositeOperation="lighter";
   for(let i=0;i<3;i++){
    const kk=Math.max(0,k-i*.12);
    g.globalAlpha=(1-kk)*.5;g.strokeStyle=f.c;g.lineWidth=(3-i)*2;
    g.beginPath();g.arc(0,0,kk*Math.max(W,H)*.7,0,6.283);g.stroke();}
  }else if(f.k==="beat"){
   g.translate(f.x,f.y);g.globalCompositeOperation="lighter";
   g.globalAlpha=ik*.9;g.strokeStyle=f.c;g.lineWidth=7*ik+2;
   g.beginPath();g.arc(0,0,f.R*Math.min(1,k*1.5),0,6.283);g.stroke();
   g.globalAlpha=ik*.4;g.fillStyle=f.c;
   g.beginPath();g.arc(0,0,26*ik+6,0,6.283);g.fill();
  }else if(f.k==="observe"){
   g.translate(f.x,f.y);g.globalCompositeOperation="lighter";
   g.globalAlpha=ik*.9;g.strokeStyle=f.c;g.lineWidth=2;
   const R=Math.max(W,H)*.8*Math.min(1,k*1.4);
   g.beginPath();g.arc(0,0,R,0,6.283);g.stroke();
   g.lineWidth=1;g.globalAlpha=ik*.5;
   for(let i=0,N=QC(10);i<N;i++){const a=i*6.283/N+k*.6;
    g.beginPath();g.moveTo(Math.cos(a)*24,Math.sin(a)*24);
    g.lineTo(Math.cos(a)*R,Math.sin(a)*R);g.stroke();}
  }else if(f.k==="regress"){
   g.translate(f.x,f.y);g.globalCompositeOperation="lighter";
   g.strokeStyle=f.c;g.lineWidth=2.4;
   for(let i=0;i<4;i++){                          // 거꾸로 감기는 고리
    const kk=(k+i*.22)%1;
    g.globalAlpha=(1-kk)*.7;
    g.beginPath();g.arc(0,0,Math.max(W,H)*.55*(1-kk),-1.571,-1.571+6.283*(1-kk),true);
    g.stroke();}
  }else if(f.k==="verdict"){                      // 위에서 떨어지는 빛기둥
   g.globalCompositeOperation="lighter";
   const w=26*ik+4;
   const lg=g.createLinearGradient(f.x,f.y-H,f.x,f.y);
   lg.addColorStop(0,"rgba(255,232,154,0)");lg.addColorStop(1,f.c);
   g.globalAlpha=ik;g.fillStyle=lg;
   g.fillRect(f.x-w/2,Math.max(0,f.y-H),w,H-Math.max(0,f.y-H));
   g.fillStyle=f.c;g.globalAlpha=ik*.8;
   g.beginPath();g.ellipse(f.x,f.y,w*1.3,w*.45,0,0,6.283);g.fill();
  }else if(f.k==="fate"){
   g.translate(f.x,f.y);g.globalCompositeOperation="lighter";
   g.globalAlpha=ik*.8;g.strokeStyle=f.c;g.lineWidth=3*ik+1;
   g.beginPath();g.arc(0,0,Math.max(W,H)*.5*k,0,6.283);g.stroke();
  }else if(f.k==="singpop"){
   g.translate(f.x,f.y);g.globalCompositeOperation="lighter";
   g.globalAlpha=ik;g.fillStyle="#ffffff";
   g.beginPath();g.arc(0,0,30*ik+8,0,6.283);g.fill();
   g.strokeStyle=f.c;g.lineWidth=8*ik+2;
   g.beginPath();g.arc(0,0,k*260,0,6.283);g.stroke();
  }else if(f.k==="indivpop"){
   g.translate(f.x,f.y);g.globalCompositeOperation="lighter";
   g.globalAlpha=ik;g.strokeStyle=f.c;g.lineWidth=4*ik+1;
   g.beginPath();g.arc(0,0,k*Math.max(W,H)*.6,0,6.283);g.stroke();
   g.lineWidth=2;                                  // 반으로 갈리는 선
   g.beginPath();g.moveTo(-W,0);g.lineTo(W,0);g.stroke();
  }else if(f.k==="ruleeat"){
   g.translate(f.x,f.y);g.globalCompositeOperation="lighter";
   g.globalAlpha=ik*.85;g.strokeStyle=f.c;g.lineWidth=3;
   for(let i=0,N=QC(6);i<N;i++){                   // 물어뜯긴 자국
    const a=i*6.283/N+k*1.4, d=60+k*Math.max(W,H)*.45;
    g.save();g.translate(Math.cos(a)*d,Math.sin(a)*d);g.rotate(a);
    g.beginPath();g.moveTo(-10,-7);g.lineTo(4,0);g.lineTo(-10,7);g.stroke();
    g.restore();}
  }else if(f.k==="effect"){
   g.translate(f.x,f.y);g.globalCompositeOperation="lighter";
   g.globalAlpha=ik;g.strokeStyle=f.c;g.lineWidth=6*ik+2;
   g.beginPath();g.arc(0,0,k*Math.max(W,H)*.7,0,6.283);g.stroke();
  }else if(f.k==="cause"){                         // 뒤늦게 그어지는 칼자국
   g.translate(f.x,f.y);g.rotate(f.a);g.globalCompositeOperation="lighter";
   g.globalAlpha=ik;g.strokeStyle="#fff";g.lineWidth=3.4*ik+1;
   const L=34*Math.min(1,k*3);
   g.beginPath();g.moveTo(-L,0);g.lineTo(L,0);g.stroke();
   g.strokeStyle=f.c;g.lineWidth=7*ik+1;g.globalAlpha=ik*.6;
   g.beginPath();g.moveTo(-L,0);g.lineTo(L,0);g.stroke();
  }else if(f.k==="disorder"){
   g.globalCompositeOperation="lighter";g.globalAlpha=ik*.8;
   for(let i=0,N=QC(14);i<N;i++){                  // 마구 튀는 조각
    const a=i*6.283/N+k*3, d=k*Math.max(W,H)*.6;
    g.fillStyle=["#ffcf6e","#ff9ce0","#fff0c4"][i%3];
    g.fillRect(f.x+Math.cos(a)*d,f.y+Math.sin(a)*d,9*ik+2,9*ik+2);}
  }else if(f.k==="alpha"){                         // 처음이자 끝 — 한 점으로
   g.translate(f.x,f.y);g.globalCompositeOperation="lighter";
   const e1=k<.42?k/.42:1;
   g.globalAlpha=(k<.42?e1:Math.max(0,1-(k-.42)/.58))*.9;
   g.strokeStyle=f.c;g.lineWidth=3;
   g.beginPath();g.arc(0,0,Math.max(W,H)*.75*(1-e1)+14,0,6.283);g.stroke();
   g.fillStyle="#fff";g.globalAlpha=k<.42?e1:Math.max(0,1-(k-.42)/.3);
   g.beginPath();g.arc(0,0,10+(1-e1)*6,0,6.283);g.fill();
   if(k>.42){
    g.globalAlpha=Math.max(0,1-(k-.42)/.58)*.85;
    g.strokeStyle="#fff";g.lineWidth=5*(1-k)+1;
    g.beginPath();g.arc(0,0,(k-.42)/.58*Math.max(W,H)*.8,0,6.283);g.stroke();}
  }else if(f.k==="tdzkill"){
   g.translate(f.x,f.y);g.globalCompositeOperation="lighter";
   g.globalAlpha=ik*.9;g.strokeStyle=f.c;g.lineWidth=2;
   for(let i=0,N=QC(14);i<N;i++){                  // 흩어지는 시계 조각
    const a=i*6.283/N, d=k*Math.max(W,H)*.55;
    g.save();g.translate(Math.cos(a)*d,Math.sin(a)*d);g.rotate(a+k*5);
    g.beginPath();g.arc(0,0,9*ik+2,0,2.4);g.stroke();
    g.beginPath();g.moveTo(0,0);g.lineTo(6*ik,0);g.stroke();
    g.restore();}
   g.globalAlpha=ik;g.lineWidth=5*ik+1;
   g.beginPath();g.arc(0,0,k*180,0,6.283);g.stroke();
  }else if(f.k==="glxerr"){
   g.globalCompositeOperation="lighter";
   const GC=["#ff2d4d","#31e8ff","#ff4df0","#5eff7a","#ffffff"];
   g.globalAlpha=ik;
   for(let i=0,N=QC(22);i<N;i++){
    const a=i*6.283/N+Math.floor(k*9), d=k*Math.max(W,H)*.6+((i*23)%70);
    g.fillStyle=GC[i%GC.length];
    g.fillRect(f.x+Math.cos(a)*d,f.y+Math.sin(a)*d,6+(i%4)*5,4+(i%3)*3);}
   g.globalAlpha=ik*.9;g.textAlign="center";
   g.fillStyle="#ff2d4d";g.font="700 22px monospace";
   g.fillText("E`R%RO^R",f.x+((Math.floor(k*17)%3)-1)*4,f.y-44);
  }else if(f.k==="oblv"){
   g.translate(f.x,f.y);g.globalCompositeOperation="lighter";
   g.globalAlpha=ik*.8;g.strokeStyle=f.c;g.lineWidth=3;
   for(let i=0;i<3;i++){
    const kk=Math.max(0,k-i*.14);
    g.globalAlpha=(1-kk)*.6;
    g.beginPath();g.arc(0,0,kk*Math.max(W,H)*.75,0,6.283);g.stroke();}
  }
  g.restore();g.globalAlpha=1;g.globalCompositeOperation="source-over";
 }
 g.textAlign="center";
}

