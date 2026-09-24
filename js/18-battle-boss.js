/* ═════════ 배틀 · 보스 ═════════
   전부 예고가 먼저 뜨고 그 다음에 맞는다. 능력치로 찍어누르는 게 아니라
   읽고 피하는 싸움이 되도록, 패턴마다 경고 시간을 따로 둔다.

   위험 지대(BA.haz)는 예고 → 발동 두 단계로 산다.
   예고 동안은 테두리만, 발동 순간에 한 번 판정한다. */

function arHazAdd(h){ (BA.haz=BA.haz||[]).push(Object.assign({t:0,fired:false},h)); }
function arHazStep(dt){
 const H=BA.haz||[],P=BA.p;
 for(let i=H.length-1;i>=0;i--){
  const h=H[i];h.t+=dt;
  if(!h.fired&&h.t>=h.warn){                       // 발동 — 딱 한 번만 판정한다
   h.fired=true;
   let hit=false;
   if(h.k==="circle")hit=arDist(P,h)<h.r+P.r;
   else if(h.k==="ring"){const d=arDist(P,h);hit=d>h.r-h.w&&d<h.r+h.w;}
   else if(h.k==="line"){
    const dx=h.x1-h.x,dy=h.y1-h.y,L2=dx*dx+dy*dy;
    let t=L2?((P.x-h.x)*dx+(P.y-h.y)*dy)/L2:0;t=Math.max(0,Math.min(1,t));
    hit=Math.hypot(P.x-(h.x+dx*t),P.y-(h.y+dy*t))<h.w+P.r;}
   if(hit&&P.inv<=0)arHurt(h.dmg);
  }
  if(h.t>=h.warn+(h.live||.28))H.splice(i,1);
 }
}
/* 퍼져 나가는 충격파 — 고리가 한 겹씩 바깥으로 */
function arShock(x,y,dmg,n){
 for(let i=0;i<n;i++)
  arHazAdd({k:"ring",x,y,r:70+i*66,w:24,warn:.5+i*.26,live:.2,dmg});
}
function arBossBullet(o,a,sp,dmg,r){
 BA.bul.push({x:o.x,y:o.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
   r:r||7,dmg,foe:1,t:0,c:o.B.c});
}

function arSpawnBoss(w){
 const ord=BA.bossOrder||BOSSES.map((_,i)=>i);
 const B=BOSSES[ord[(Math.floor(w/10)-1+ord.length*99)%ord.length]];
 const hp=Math.round(B.hp*waveHp(w)*0.8);
 const a=Math.random()*6.283,R=Math.max(BA.w,BA.h)*.55;
 const o={m:{id:"boss",n:B.n,c:B.c,r:B.r},B,boss:true,
   x:BA.w/2+Math.cos(a)*R,y:BA.h/2+Math.sin(a)*R,
   r:B.r,hp,hpMax:hp,dmg:B.dmg*waveDmg(w),spd:B.spd,
   st:2,t:0,hit:0,ph:0,tele:null,copies:null,slow:0};
 BA.mobs.push(o);
 BA.boss=o;
 BA.fx.push({k:"bossIn",t:0,d:1.8,n:B.n,c:B.c});
}

function arBossStep(o,dt){
 const P=BA.p,B=o.B;
 o.t+=dt;o.st-=dt;
 const ang=Math.atan2(P.y-o.y,P.x-o.x);
 const step=(mul)=>{o.x+=Math.cos(ang)*o.spd*mul*dt;o.y+=Math.sin(ang)*o.spd*mul*dt;};
 const id=B.id;

 if(id==="crush"){
  step(1);
  if(o.st<=0){o.st=3.2;arShock(o.x,o.y,o.dmg,3);
   BA.fx.push({k:"bossTell",x:o.x,y:o.y,r:o.r,t:0,d:.5,c:B.c});}
 }else if(id==="watch"){
  const d=arDist(o,P);step(d>240?1:d<170?-.7:0);
  if(o.st<=0){o.st=2.6;
   const a=ang+(Math.random()-.5)*.6, L=Math.max(BA.w,BA.h);
   arHazAdd({k:"line",x:o.x,y:o.y,x1:o.x+Math.cos(a)*L,y1:o.y+Math.sin(a)*L,
     w:16,warn:.85,live:.22,dmg:o.dmg,c:B.c});}
 }else if(id==="hive"){
  step(.5);
  if(o.st<=0){o.st=2.4;
   for(let i=0;i<2;i++){arSpawn("swarm",BA.wave);
    const s=BA.mobs[BA.mobs.length-1];
    s.x=o.x+(Math.random()-.5)*60;s.y=o.y+(Math.random()-.5)*60;}
   BA.fx.push({k:"bossTell",x:o.x,y:o.y,r:o.r,t:0,d:.4,c:B.c});}
 }else if(id==="stalk"){
  if(o.ch){                                        // 달리는 중
   o.x+=Math.cos(o.ca)*o.spd*5.4*dt;o.y+=Math.sin(o.ca)*o.spd*5.4*dt;
   o.trail=(o.trail||0)+dt;
   if(o.trail>.06){o.trail=0;
    arHazAdd({k:"circle",x:o.x,y:o.y,r:22,warn:.25,live:.5,dmg:o.dmg*.45,c:B.c});}
   if(o.st<=0)o.ch=false,o.st=1.8;
  }else if(o.st<=0){                               // 선을 긋고 예고
   o.ca=ang;o.ch=true;o.st=.7;
   const L=Math.max(BA.w,BA.h);
   arHazAdd({k:"line",x:o.x,y:o.y,x1:o.x+Math.cos(o.ca)*L,y1:o.y+Math.sin(o.ca)*L,
     w:20,warn:.55,live:.15,dmg:o.dmg*.6,c:B.c});
  }else step(.45);
 }else if(id==="bomb"){
  const d=arDist(o,P);step(d>220?1:d<150?-.6:0);
  if(o.st<=0){o.st=2.8;
   for(let i=0;i<5;i++)
    arHazAdd({k:"circle",x:P.x+(Math.random()-.5)*190,y:P.y+(Math.random()-.5)*190,
      r:42,warn:.95+i*.1,live:.26,dmg:o.dmg*.8,c:B.c});}
 }else if(id==="thorn"){
  step(.8);
  o.spin=(o.spin||0)+dt*1.5;
  for(let i=0;i<6;i++){                            // 도는 가시 — 닿으면 아프다
   const a=o.spin+i*1.047,rr=o.r+52;
   const sx=o.x+Math.cos(a)*rr, sy=o.y+Math.sin(a)*rr;
   if(Math.hypot(P.x-sx,P.y-sy)<12+P.r&&P.inv<=0)arHurt(o.dmg*.5);}
 }else if(id==="phant"){
  step(1.1);
  if(o.st<=0){o.st=4.2;
   o.copies=[];
   for(let i=0;i<2;i++){const a=Math.random()*6.283,rr=90+Math.random()*60;
    o.copies.push({x:o.x+Math.cos(a)*rr,y:o.y+Math.sin(a)*rr,a:Math.random()*6.283});}
   BA.fx.push({k:"bossTell",x:o.x,y:o.y,r:o.r,t:0,d:.5,c:B.c});}
  if(o.copies)for(const cp of o.copies){           // 허상도 같이 다가온다
   const ca=Math.atan2(P.y-cp.y,P.x-cp.x);
   cp.x+=Math.cos(ca)*o.spd*dt;cp.y+=Math.sin(ca)*o.spd*dt;}
 }else if(id==="devour"){
  step(.7);
  const d=arDist(o,P);
  if(d<300){                                       // 끌어당긴다
   const pull=78*(1-d/300);
   P.x-=Math.cos(ang)*pull*dt;P.y-=Math.sin(ang)*pull*dt;}
  if(o.st<=0){o.st=3.6;arShock(o.x,o.y,o.dmg*.7,2);}
 }else if(id==="turret"){
  o.spin=(o.spin||0)+dt*1.1;
  if(o.st<=0){o.st=.16;                            // 나선으로 끊임없이
   for(let i=0;i<3;i++)arBossBullet(o,o.spin+i*2.094,200,o.dmg*.5,8);}
 }else{                                            // 종말 — 앞선 패턴을 돌아가며
  step(.9);
  if(o.st<=0){
   o.ph=(o.ph+1)%3;
   if(o.ph===0){o.st=3.0;arShock(o.x,o.y,o.dmg,4);}
   else if(o.ph===1){o.st=2.6;
    for(let i=0;i<12;i++)arBossBullet(o,i*.5236+o.t,190,o.dmg*.45,8);}
   else{o.st=2.4;
    for(let i=0;i<4;i++)
     arHazAdd({k:"circle",x:P.x+(Math.random()-.5)*170,y:P.y+(Math.random()-.5)*170,
       r:48,warn:.9,live:.26,dmg:o.dmg*.75,c:B.c});}
   BA.fx.push({k:"bossTell",x:o.x,y:o.y,r:o.r,t:0,d:.5,c:B.c});}
 }
 /* 보스는 몸통도 아프다 */
 if(arDist(o,P)<o.r+P.r&&P.inv<=0)arHurt(o.dmg*.5);
}

/* ── 그리기 ── */
function arDrawHaz(g){
 for(const h of (BA.haz||[])){
  const warn=h.t<h.warn, k=warn?h.t/h.warn:1-(h.t-h.warn)/(h.live||.28);
  g.save();g.globalCompositeOperation="lighter";
  const col=h.c||"#ff6a4a";
  if(h.k==="circle"){
   g.globalAlpha=warn?.16+k*.3:.62*k;
   g.fillStyle=col;g.beginPath();g.arc(h.x,h.y,h.r*(warn?1:1.06),0,6.283);g.fill();
   g.globalAlpha=warn?.5+k*.5:.8*k;g.strokeStyle=warn?col:"#fff";g.lineWidth=warn?2:3;
   g.beginPath();g.arc(h.x,h.y,h.r,0,6.283);g.stroke();
   if(warn){g.globalAlpha=.7;g.beginPath();g.arc(h.x,h.y,h.r*k,0,6.283);g.stroke();}
  }else if(h.k==="ring"){
   g.strokeStyle=warn?col:"#fff";g.globalAlpha=warn?.3+k*.4:.9*k;
   g.lineWidth=h.w*(warn?.5:2);
   g.beginPath();g.arc(h.x,h.y,h.r,0,6.283);g.stroke();
  }else{
   g.strokeStyle=warn?col:"#fff";g.globalAlpha=warn?.28+k*.45:.95*k;
   g.lineWidth=warn?h.w*.45:h.w*2;g.lineCap="round";
   g.beginPath();g.moveTo(h.x,h.y);g.lineTo(h.x1,h.y1);g.stroke();
  }
  g.restore();g.globalAlpha=1;}
}
function arDrawBoss(g,o){
 const B=o.B,P=BA.p,r=o.r,flash=o.hit>0,col=flash?"#fff":B.c;
 const face=Math.atan2(P.y-o.y,P.x-o.x);
 /* 허상 먼저 — 본체보다 흐리다 */
 if(o.copies)for(const cp of o.copies){
  g.save();g.translate(cp.x,cp.y);g.globalAlpha=.4+Math.sin(o.t*8+cp.a)*.12;
  g.fillStyle=B.c;g.beginPath();g.arc(0,0,r,0,6.283);g.fill();
  g.restore();g.globalAlpha=1;}
 g.save();g.translate(o.x,o.y);
 g.lineJoin="round";g.strokeStyle=flash?"#fff":"rgba(0,0,0,.5)";g.lineWidth=2.5;
 g.shadowColor=B.c;g.shadowBlur=16;
 const id=B.id;
 if(id==="crush"){                       // 주먹 두 개 달린 덩치
  g.rotate(face);g.fillStyle=col;
  g.beginPath();g.ellipse(0,0,r*.9,r,0,0,6.283);g.fill();g.stroke();
  g.beginPath();g.arc(r*.55,-r*.8,r*.42,0,6.283);g.arc(r*.55,r*.8,r*.42,0,6.283);
  g.fill();g.stroke();
 }else if(id==="watch"){                 // 거대한 눈
  g.fillStyle=col;g.beginPath();g.ellipse(0,0,r,r*.72,0,0,6.283);g.fill();g.stroke();
  g.rotate(face);
  g.fillStyle=flash?"#000":"#0d1a33";g.beginPath();g.arc(r*.28,0,r*.5,0,6.283);g.fill();
  g.fillStyle=flash?"#000":"#dff0ff";g.beginPath();g.arc(r*.4,0,r*.2,0,6.283);g.fill();
 }else if(id==="hive"){                  // 구멍이 뚫린 집
  g.fillStyle=col;g.beginPath();
  for(let i=0;i<8;i++){const a=i*.785,rr=r*(i%2?.84:1.05);
   i?g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):g.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}
  g.closePath();g.fill();g.stroke();
  g.fillStyle=flash?"#000":"#16301a";
  for(let i=0;i<4;i++){const a=i*1.571+o.t*.5;
   g.beginPath();g.arc(Math.cos(a)*r*.5,Math.sin(a)*r*.5,r*.19,0,6.283);g.fill();}
 }else if(id==="stalk"){                 // 날 선 화살촉
  g.rotate(o.ch?o.ca:face);
  if(o.ch)g.shadowBlur=28;
  g.fillStyle=col;g.beginPath();
  g.moveTo(r*1.5,0);g.lineTo(0,-r*.8);g.lineTo(-r*.6,0);g.lineTo(0,r*.8);
  g.closePath();g.fill();g.stroke();
 }else if(id==="bomb"){                  // 포구가 달린 포대
  g.fillStyle=col;g.beginPath();g.arc(0,0,r,0,6.283);g.fill();g.stroke();
  g.rotate(face);
  g.fillStyle=flash?"#000":"#3a2a08";
  for(let i=0;i<3;i++){const a=(i-1)*.5;
   g.save();g.rotate(a);g.fillRect(r*.5,-5,r*.8,10);g.restore();}
 }else if(id==="thorn"){                 // 본체 + 도는 가시
  g.fillStyle=col;g.beginPath();g.arc(0,0,r,0,6.283);g.fill();g.stroke();
  g.restore();
  g.save();g.translate(o.x,o.y);
  g.fillStyle=B.c;g.shadowColor=B.c;g.shadowBlur=12;
  for(let i=0;i<6;i++){const a=(o.spin||0)+i*1.047,rr=r+52;
   g.save();g.translate(Math.cos(a)*rr,Math.sin(a)*rr);g.rotate(a);
   g.beginPath();g.moveTo(12,0);g.lineTo(-6,7);g.lineTo(-6,-7);g.closePath();g.fill();
   g.restore();}
 }else if(id==="phant"){                 // 흐릿한 본체
  g.globalAlpha=.9;
  g.fillStyle=col;g.beginPath();g.arc(0,0,r,0,6.283);g.fill();g.stroke();
  g.fillStyle=flash?"#000":"#08323a";
  g.beginPath();g.arc(-r*.3,-r*.2,r*.16,0,6.283);g.arc(r*.3,-r*.2,r*.16,0,6.283);g.fill();
 }else if(id==="devour"){                // 입이 벌어진 아가리
  g.rotate(face);
  g.fillStyle=col;g.beginPath();g.arc(0,0,r,0,6.283);g.fill();g.stroke();
  const gap=.5+Math.sin(o.t*3)*.22;
  g.fillStyle=flash?"#000":"#2a0716";
  g.beginPath();g.moveTo(0,0);g.arc(0,0,r*.96,-gap,gap);g.closePath();g.fill();
 }else if(id==="turret"){                // 육각 포탑
  g.rotate(o.spin||0);
  g.fillStyle=col;g.beginPath();
  for(let i=0;i<6;i++){const a=i*1.047;
   i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
  g.closePath();g.fill();g.stroke();
  g.fillStyle=flash?"#000":"#2a2f3a";
  for(let i=0;i<3;i++){g.save();g.rotate(i*2.094);g.fillRect(r*.4,-5,r*.85,10);g.restore();}
 }else{                                  // 종말 — 여러 겹의 고리
  g.fillStyle=col;g.beginPath();g.arc(0,0,r*.6,0,6.283);g.fill();g.stroke();
  g.strokeStyle=B.c;g.lineWidth=3;
  for(let i=0;i<3;i++){g.save();g.rotate(o.t*(i%2?-.7:.7)+i);
   g.beginPath();g.ellipse(0,0,r*(.85+i*.16),r*(.4+i*.1),0,0,6.283);g.stroke();g.restore();}
 }
 g.shadowBlur=0;g.restore();g.globalAlpha=1;
}
/* 보스 체력은 화면 위에 따로 — 몸에 붙이면 안 보인다 */
function arDrawBossBar(g){
 const o=BA.boss;
 if(!o||o.hp<=0||BA.mobs.indexOf(o)<0)return;
 const W=BA.w,y=54,w=W-56;
 g.fillStyle="rgba(0,0,0,.55)";g.fillRect(28,y,w,7);
 g.fillStyle=o.B.c;g.fillRect(28,y,w*Math.max(0,o.hp/o.hpMax),7);
 g.strokeStyle="rgba(255,255,255,.22)";g.lineWidth=1;g.strokeRect(28,y,w,7);
 g.textAlign="center";g.font="500 11px serif";g.fillStyle="#e8ecf4";
 g.fillText(o.B.n,W/2,y-6);
}

/* 보스 등장 배너와 패턴 예고 */
function arDrawBossFx(g,f){
 const k=f.t/f.d;
 if(f.k==="bossIn"){
  const W=BA.w,H=BA.h;
  g.save();
  g.globalAlpha=(k<.15?k/.15:1-Math.max(0,(k-.7)/.3))*.9;
  g.fillStyle="rgba(0,0,0,.5)";g.fillRect(0,H*.38,W,64);
  g.strokeStyle=f.c;g.lineWidth=2;
  g.beginPath();g.moveTo(0,H*.38);g.lineTo(W,H*.38);
  g.moveTo(0,H*.38+64);g.lineTo(W,H*.38+64);g.stroke();
  g.textAlign="center";g.fillStyle="#9aa4b4";g.font="500 10px serif";
  g.fillText("B O S S",W/2,H*.38+22);
  g.fillStyle=f.c;g.font="500 24px serif";
  g.fillText(f.n,W/2,H*.38+50);
  g.restore();g.globalAlpha=1;
 }else{                                   // 패턴 직전 몸이 부풀어 오른다
  g.save();g.globalCompositeOperation="lighter";
  g.globalAlpha=(1-k)*.7;g.strokeStyle=f.c;g.lineWidth=4*(1-k)+1;
  g.beginPath();g.arc(f.x,f.y,f.r*(1+k*.7),0,6.283);g.stroke();
  g.restore();g.globalAlpha=1;
 }
}

/* ═════════ 보스 보상 · 강화 ═════════
   보스를 잡을 때마다 셋 중 하나를 고른다. 판이 끝나면 사라진다.
   적은 웨이브마다 지수로 강해지는데 플레이어가 그대로면 판이 금방 끝난다 —
   깊이 들어갈 수 있어야 보스 열 종을 다 본다. */
const BUP_BASE={dmg:1,spd:1,reach:1,move:1,dr:1,inv:1,crit:0,pierce:0,drain:0,shock:0};
const BUPS=[
 {id:"edge",  n:"예 리 함", d:"공격력 +25%",              f:u=>u.dmg*=1.25},
 {id:"haste", n:"속 행",    d:"공격 속도 +20%",           f:u=>u.spd*=1.20},
 {id:"reach", n:"긴 팔",    d:"공격 범위 +22%",           f:u=>u.reach*=1.22},
 {id:"crit",  n:"급 소",    d:"치명타 확률 +14%",         f:u=>u.crit+=.14},
 {id:"pierce",n:"관 통",    d:"한 번에 2명 더 벤다",       f:u=>u.pierce+=2},
 {id:"stout", n:"강 골",    d:"최대 체력 +25% (즉시 회복)", f:u=>u.hpUp=1.25},
 {id:"mend",  n:"회 복",    d:"체력 45% 회복",            f:u=>u.heal=.45},
 {id:"hide",  n:"가 죽",    d:"받는 피해 -16%",           f:u=>u.dr*=.84},
 {id:"ghost", n:"잔 상",    d:"무적 시간 +35%",           f:u=>u.inv*=1.35},
 {id:"swift", n:"질 주",    d:"이동 속도 +16%",           f:u=>u.move*=1.16},
 {id:"leech", n:"흡 취",    d:"처치할 때마다 체력 회복",    f:u=>u.drain+=.015},
 {id:"burst", n:"파 편",    d:"벨 때 주변까지 함께 때린다", f:u=>u.shock+=.3},
];
/* 겹쳐 쌓이는 강화는 여러 번 나와도 되지만, 한 번짜리(회복·강골)는 덜 나오게 */
function arRollUps(){
 const pool=BUPS.slice();
 const out=[];
 while(out.length<3&&pool.length){
  const i=Math.floor(Math.random()*pool.length);
  out.push(pool.splice(i,1)[0]);}
 return out;
}
function arOpenPick(){
 BA.pick=arRollUps();
 const el=$("ar-pick");
 el.innerHTML=`<div class="arp-box">
   <div class="arp-t">강 화 를 고 른 다</div>
   <div class="arp-s">보스를 쓰러뜨렸다</div>
   <div class="arp-row">${BA.pick.map((u,i)=>`
     <button class="arp-c" data-up="${i}">
       <b>${u.n}</b><span>${u.d}</span></button>`).join("")}</div></div>`;
 el.classList.add("on");
 el.querySelectorAll("[data-up]").forEach(b=>b.onclick=()=>arTakeUp(+b.dataset.up));
}
function arTakeUp(i){
 const u=BA.pick&&BA.pick[i]; if(!u)return;
 const U=BA.up;
 U.hpUp=0;U.heal=0;
 u.f(U);
 if(U.hpUp){const add=Math.round(BA.p.hpMax*(U.hpUp-1));
  BA.p.hpMax+=add;BA.p.hp+=add;}
 if(U.heal)BA.p.hp=Math.min(BA.p.hpMax,BA.p.hp+Math.round(BA.p.hpMax*U.heal));
 U.hpUp=0;U.heal=0;
 (BA.taken=BA.taken||[]).push(u.n.replace(/ /g,""));
 BA.pick=null;
 $("ar-pick").classList.remove("on");$("ar-pick").innerHTML="";
 BA.last=performance.now();                 // 멈춰 있던 동안의 시간은 버린다
}
