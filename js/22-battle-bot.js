/* ═════════ 듀얼 · AI 동료 ═════════
   함께할 사람이 없을 때 혼자서도 듀얼을 돌릴 수 있게 한다.
   통신은 전혀 쓰지 않는다 — 전부 내 기기 안에서 돈다.

   공격 판정이 죄다 BA.p 기준으로 짜여 있어서, 동료가 휘두를 때는
   주인공 자리를 잠깐 빌려 판정하고 되돌린다(듀얼 손님 공격을 호스트가
   재생하는 방식과 같다). 규칙을 두 벌로 만들지 않으려는 것이다.

   동료는 위험 지대(보스 장판)에 맞지 않는다. 예고를 읽고 피하는 것은
   사람의 몫이고, 못 피하는 AI 를 한 명 죽으면 끝나는 판에 세워 두면
   판이 통째로 날아간다. */

const BOT_NAME="동  료";

/* 내가 안 쓰는 검 중에서 등급이 겹치지 않게 셋. 모자라면 내 것과 겹쳐도 쓴다. */
function botTeam(){
 const mine=new Set(S.team||[]);
 const sorted=battleOwned().slice().sort((a,b)=>b.t-a.t);
 const pick=[],used=[];
 for(const pass of [0,1])
  for(const s of sorted){
   if(pick.length>=TEAM_SIZE)break;
   if(pass===0&&mine.has(s.n))continue;
   if(pick.includes(s)||used.includes(s.t))continue;
   pick.push(s);used.push(s.t);}
 if(!pick.length)return (S.team||[]).map(n=>SWORDS.find(x=>x.n===n)).filter(Boolean)
   .map(teamEntry);
 return pick.map(teamEntry);
}
function botInit(){
 const team=botTeam(); if(!team.length)return;
 const def=team.reduce((a,b)=>a+b.st.def,0)/team.length;
 BA.bot={team,slot:0,r:15,
   x:Math.max(30,BA.w/2-54),y:Math.min(BA.h-30,BA.h/2+30),
   dir:-Math.PI/2,hp:0,hpMax:0,atkCd:0,inv:0,sw:null,t:0,slotT:5,down:false,
   sx:0,sy:0,strafeT:0};
 BA.bot.hpMax=BA.bot.hp=Math.round(520+def*12);
}
const botCur=()=>BA.bot.team[BA.bot.slot];
/* 검마다 붙어야 하는 거리가 다르다 — 레이피어는 멀리서, 대검은 바짝 */
function botReach(mo){
 return mo==="shard"?250:mo==="thrust"?118:mo==="sweep"?86:mo==="cone"?80:70;
}
function botStep(dt){
 const B=BA.bot,P=BA.p;
 if(!B)return;
 if(B.down)return;
 B.t+=dt;
 if(B.inv>0)B.inv-=dt;
 if(B.atkCd>0)B.atkCd-=dt;
 if(B.sw){B.sw.t+=dt; if(B.sw.t>=B.sw.d)B.sw=null;}
 /* 검을 돌려 쓴다 — 한 자루만 들고 있으면 동료가 아니라 포탑이다 */
 B.slotT-=dt;
 if(B.slotT<=0){B.slotT=5+Math.random()*4;B.slot=(B.slot+1)%B.team.length;}
 const cur=botCur(),mo=cur.st.arch.mo,want=botReach(mo)*0.78;

 let tg=null,td=1e9;
 for(const o of BA.mobs){const d=Math.hypot(o.x-B.x,o.y-B.y); if(d<td){td=d;tg=o;}}
 const pd=Math.hypot(P.x-B.x,P.y-B.y);
 let mx=0,my=0;
 if(pd>240){                                   // 너무 떨어지면 일단 주인공 쪽으로
  const a=Math.atan2(P.y-B.y,P.x-B.x);mx=Math.cos(a);my=Math.sin(a);
  if(tg)B.dir=Math.atan2(tg.y-B.y,tg.x-B.x); else B.dir=a;
 }else if(tg){
  B.dir=Math.atan2(tg.y-B.y,tg.x-B.x);
  const k=td>want+20?1:(td<want-26?-1:0);      // 너무 붙으면 물러선다
  mx=Math.cos(B.dir)*k;my=Math.sin(B.dir)*k;
  /* 가만히 마주 보고 서 있지 않게 옆으로도 조금 흐른다 */
  B.strafeT-=dt; if(B.strafeT<=0){B.strafeT=1.4+Math.random();B.sx=Math.random()<.5?-1:1;}
  mx+=Math.cos(B.dir+1.571)*B.sx*.5;my+=Math.sin(B.dir+1.571)*B.sx*.5;
 }else{
  const a=Math.atan2(P.y-B.y,P.x-B.x);
  if(pd>90){mx=Math.cos(a);my=Math.sin(a);}
  B.dir=a;
 }
 const m=Math.hypot(mx,my); if(m>1){mx/=m;my/=m;}
 const spd=176*(cur.st.trait.id==="rush"?1.15:1);
 B.x=Math.max(B.r,Math.min(BA.w-B.r,B.x+mx*spd*dt));
 B.y=Math.max(B.r,Math.min(BA.h-B.r,B.y+my*spd*dt));

 if(tg&&td<botReach(mo)+tg.r&&B.atkCd<=0)botSwing();

 /* 맞는 쪽 — 접촉과 적 탄만 본다. 장판은 안 맞는다(위 주석). */
 for(const o of BA.mobs)
  if(B.inv<=0&&Math.hypot(o.x-B.x,o.y-B.y)<o.r+B.r)botHurt(o.dmg*.4);
 for(let i=BA.bul.length-1;i>=0;i--){
  const b=BA.bul[i];
  if(!b.foe)continue;
  if(B.inv<=0&&Math.hypot(b.x-B.x,b.y-B.y)<B.r+b.r){botHurt(b.dmg*.7);BA.bul.splice(i,1);}}
}
function botSwing(){
 const B=BA.bot,P=BA.p,cur=botCur();
 const mo=cur.st.arch.mo,tr=cur.st.trait.id,dir=B.dir;
 const dmg=cur.st.dmg*0.85;                    // 동료는 내가 고른 강화를 받지 못한다
 B.sw={t:0,d:.26,mo};
 B.atkCd=1/cur.st.spd;
 sfxSwing(mo);
 /* 주인공 자리를 잠깐 빌려 판정한다 — 같은 규칙이 그대로 동료에게 적용된다 */
 const sx=P.x,sy=P.y,sd=P.dir;
 P.x=B.x;P.y=B.y;P.dir=dir;
 arStandIn(cur.look.col,cur.st.sig);
 try{ arMotion(mo,dmg,tr,dir); }catch(e){}
 arStandOut();
 B.x=P.x;B.y=P.y;                              // 파고드는 모션은 실제로 자리를 옮긴다
 P.x=sx;P.y=sy;P.dir=sd;
}
function botHurt(d){
 const B=BA.bot;
 const v=Math.max(1,Math.round(d));
 B.hp-=v;B.inv=.8;
 BA.num.push({x:B.x,y:B.y-20,v,t:0,c:"#9fe0a8"});
 if(B.hp>0)return;
 B.hp=0;B.down=true;
 for(let i=0;i<6;i++)BA.fx.push({k:"pop",x:B.x,y:B.y,r:10+i*3,t:-i*.04,d:.5,c:"#8fd08a"});
 sfxDeath();
 toast("동료가 쓰러졌습니다");
 setTimeout(()=>{ if(BA&&!BA.over)arEnd(false); },800);
}
function botDraw(g){
 const B=BA.bot; if(!B)return;
 const cur=botCur(),k=cur.look,col=k.col;
 if(!B.down)arAuraAt(g,B.x,B.y,B.dir,k.tr,col,k.sig);
 g.fillStyle="rgba(0,0,0,.34)";
 g.beginPath();g.ellipse(B.x,B.y+13,15,5.5,0,0,6.283);g.fill();
 const fade=B.down?.35:(B.inv>0&&Math.floor(B.inv*14)%2?.5:0);
 arDrawFighter(g,B.x,B.y,B.dir,k,B.sw,"mate",fade);
 g.textAlign="center";g.font="500 10px system-ui";
 g.fillStyle=B.down?"#8a94a6":"#b8f0c8";
 g.fillText(B.down?BOT_NAME+" (쓰러짐)":BOT_NAME,B.x,B.y-48);
 if(B.down)return;
 g.font="500 9px system-ui";
 g.fillStyle=col;g.globalAlpha=.9;
 g.fillText(cur.s.n,B.x,B.y-36);g.globalAlpha=1;
 g.fillStyle="rgba(0,0,0,.6)";g.fillRect(B.x-24,B.y-26,48,4);
 g.fillStyle="#7ce08a";g.fillRect(B.x-24,B.y-26,48*Math.max(0,B.hp/B.hpMax),4);
}
