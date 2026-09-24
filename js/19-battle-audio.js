/* ═════════ 배틀 · 소리 ═════════
   컷신 사운드는 한 번 예약하고 끝나지만, 전투는 몇 분씩 이어진다.
   그래서 배경음은 미리 스케줄해 두는 방식으로 돌린다 — 16분음표 격자를
   40ms 마다 들여다보며 0.25초 앞까지 채워 넣는다. setInterval 지터가
   음에 실리지 않도록 예약은 전부 AudioContext 의 절대 시각으로 한다.

   배경음은 제 버스를 따로 쓴다. 판을 나갈 때 그것만 내리면
   예약해 둔 음이 남아 울리는 일이 없다. */

let BGM=null, BMG=null, BSG=null, bHitT=0;

/* 배경음과 효과음은 버스를 나눈다 — 하나로 묶으면 배경음을 끌 때
   같이 울려야 할 사망·보상 소리까지 함께 죽는다. */
function bBus(mus){
 const c=ac(); if(!c)return null;
 if(mus){ if(!BMG||BMG.context!==c){BMG=c.createGain();BMG.gain.value=1;BMG.connect(c.destination);} return BMG; }
 if(!BSG||BSG.context!==c){BSG=c.createGain();BSG.gain.value=1;BSG.connect(c.destination);}
 return BSG;
}
/* 절대 시각으로 예약하는 기본 음 — 배경음은 박자가 밀리면 안 된다 */
function bNote(t,f,dur,type,vol,cut,mus){
 const c=ac(); if(!c)return;
 const o=c.createOscillator(),g=c.createGain(),f1=c.createBiquadFilter();
 o.type=type||"sine";o.frequency.setValueAtTime(f,t);
 f1.type="lowpass";f1.frequency.setValueAtTime(cut||Math.min(12000,f*8+600),t);
 g.gain.setValueAtTime(0,t);
 g.gain.linearRampToValueAtTime(vol,t+Math.min(.03,dur*.3));
 g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(f1);f1.connect(g);g.connect(bBus(mus)||c.destination);
 o.start(t);o.stop(t+dur+.05);
}
function bDrum(t,f0,f1,dur,vol,ns,mus){
 const c=ac(); if(!c)return;
 const o=c.createOscillator(),g=c.createGain();
 o.type="sine";o.frequency.setValueAtTime(f0,t);
 o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
 g.gain.setValueAtTime(vol,t);
 g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(g);g.connect(bBus(mus)||c.destination);o.start(t);o.stop(t+dur+.02);
 if(ns)bNoise(t,ns,dur*.5,3000,0,mus);
}
function bNoise(t,vol,dur,cut,hp,mus){
 const c=ac(); if(!c)return;
 const n=Math.max(8,Math.floor(c.sampleRate*dur));
 const b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2);
 const s=c.createBufferSource();s.buffer=b;
 const f=c.createBiquadFilter();f.type=hp?"highpass":"lowpass";f.frequency.value=cut||2200;
 const g=c.createGain();g.gain.value=vol;
 s.connect(f);f.connect(g);g.connect(bBus(mus)||c.destination);s.start(t);
}

/* ── 배경음 ──
   평상시는 가라앉은 단조, 보스는 더 빠르고 불협이 섞인다. */
const BGM_SET={
 wave:{bpm:100, root:55.0,                                  // A1
   bass:[0,0,7,0, 0,0,5,0, 0,0,7,0, 3,0,5,0],
   arp:[12,null,15,19, null,15,12,null, 17,null,19,22, null,19,17,null],
   kick:[1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0],
   hat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,1,1,0], bv:.07, av:.035},
 boss:{bpm:138, root:49.0,                                  // G1 — 반음 낮아 더 무겁다
   bass:[0,0,0,0, 6,0,0,0, 0,0,0,0, 5,0,3,0],
   arp:[12,15,12,18, 12,15,12,19, 13,16,13,18, 13,16,13,20],
   kick:[1,0,0,1, 0,0,1,0, 1,0,0,1, 0,1,0,0],
   hat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], bv:.085, av:.045},
};
const bSemi=(root,n)=>root*Math.pow(2,n/12);

function btBgmStart(kind){
 if(!S.sound)return;
 const c=ac(); if(!c)return;
 if(BGM&&BGM.kind===kind)return;                     // 같은 곡이면 그대로 둔다
 btBgmStop();
 const M=bBus(1); if(M){M.gain.cancelScheduledValues(c.currentTime);M.gain.setValueAtTime(1,c.currentTime);}
 const S2=BGM_SET[kind]||BGM_SET.wave;
 BGM={kind,set:S2,step:0,spb:60/S2.bpm/4,next:c.currentTime+.08,timer:0};
 BGM.timer=setInterval(btBgmTick,40);
 btBgmTick();
}
function btBgmStop(){
 if(!BGM)return;
 clearInterval(BGM.timer);BGM=null;
 const c=ac(),M=bBus(1);
 if(c&&M){                                            // 예약된 음이 남아 울지 않게 눌러 둔다
  M.gain.cancelScheduledValues(c.currentTime);
  M.gain.setValueAtTime(M.gain.value,c.currentTime);
  M.gain.linearRampToValueAtTime(0,c.currentTime+.12);}
}
function btBgmTick(){
 const c=ac(); if(!c||!BGM)return;
 const S2=BGM.set;
 while(BGM.next<c.currentTime+.25){
  const t=BGM.next, i=BGM.step%16, bar=Math.floor(BGM.step/16);
  const b=S2.bass[i];
  if(b!==null&&b!==undefined&&(i%2===0||b!==0))
   bNote(t,bSemi(S2.root,b),BGM.spb*2.1,"sawtooth",S2.bv,420,1);
  const a=S2.arp[i];
  if(a!==null&&a!==undefined&&(bar%2===1||BGM.kind==="boss"))
   bNote(t,bSemi(S2.root,a+12),BGM.spb*1.6,"triangle",S2.av,3200,1);
  if(S2.kick[i])bDrum(t,120,38,.16,.3,.12,1);
  if(S2.hat[i])bNoise(t,BGM.kind==="boss"?.035:.022,.035,6500,1,1);
  if(BGM.kind==="boss"&&(i===4||i===12))bNoise(t,.11,.13,2400,0,1);   // 스네어
  BGM.step++;BGM.next+=BGM.spb;
 }
}

/* ── 효과음 ── */
const bNow=()=>{const c=ac();return c?c.currentTime:0;};
/* 공격 — 날 모양마다 다르게. 매 타마다 울리므로 짧고 가볍게 */
function sfxSwing(mo){
 if(!S.sound)return;const t=bNow();
 if(mo==="sweep"){bNoise(t,.14,.2,1400);bDrum(t,190,70,.16,.1);}
 else if(mo==="thrust"){bNoise(t,.07,.05,5200,1);bNote(t,1500,.07,"sawtooth",.05,6000);}
 else if(mo==="shard"){bNote(t,1150,.09,"square",.05,5000);bNote(t+.02,1750,.07,"sine",.03);}
 else if(mo==="cone"){bNoise(t,.11,.22,900);bNote(t,320,.18,"sawtooth",.04,900);}
 else if(mo==="blink"){bNote(t,900,.09,"sine",.05,4000);bNote(t+.04,1900,.08,"sine",.035);bNoise(t,.05,.06,4000,1);}
 else if(mo==="lunge"){bNoise(t,.1,.12,2000);bDrum(t,240,90,.12,.08);}
 else if(mo==="double"){bNoise(t,.07,.06,4200,1);bNoise(t+.07,.07,.06,4600,1);}
 else {bNoise(t,.08,.09,3200,1);bNote(t,760,.08,"triangle",.04);}
}
/* 타격 — 여럿을 동시에 때리므로 프레임당 한 번으로 묶는다 */
function sfxHit(){
 if(!S.sound)return;const t=bNow();
 if(t-bHitT<.045)return; bHitT=t;
 bNoise(t,.055,.045,3000);
 bNote(t,420+Math.random()*180,.05,"square",.028,2600);
}
let bKillT=0;
function sfxKill(){
 if(!S.sound)return;const t=bNow();
 if(t-bKillT<.04)return; bKillT=t;        // 무리가 한꺼번에 죽으면 소리가 겹쳐 터진다
 bNoise(t,.09,.11,1800);
 bNote(t,300,.12,"triangle",.05,1800);
 bNote(t+.03,180,.14,"sine",.04);
}
function sfxBossKill(){
 if(!S.sound)return;const t=bNow();
 bDrum(t,150,30,.9,.34,.3);
 bNoise(t,.22,.5,1200);
 if(typeof bellFall==="function"){bellFall(0,300,90,2.6,.09);bellFall(.16,210,64,3.0,.07);}
 [0,4,7,12].forEach((s,i)=>bNote(t+.1+i*.08,bSemi(220,s),1.1,"triangle",.05,4000));
}
function sfxHurt(){
 if(!S.sound)return;const t=bNow();
 bDrum(t,160,52,.2,.2,.16);
 bNote(t,140,.22,"sawtooth",.06,700);
}
function sfxDeath(){
 if(!S.sound)return;const t=bNow();
 btBgmStop();
 bNoise(t,.2,.9,900);
 [0,-2,-5,-9,-14].forEach((s,i)=>bNote(t+i*.13,bSemi(196,s),1.4,"sawtooth",.07,900));
 bDrum(t+.05,90,24,1.6,.3);
}
function sfxReward(){
 if(!S.sound)return;const t=bNow();
 [0,4,7,12,16].forEach((s,i)=>{                      // 올라가는 종
  bNote(t+i*.09,bSemi(392,s),.55,"triangle",.06,6000);
  bNote(t+i*.09,bSemi(392,s+12),.4,"sine",.03);});
}
function sfxPickShow(){
 if(!S.sound)return;const t=bNow();
 [0,7,12].forEach((s,i)=>bNote(t+i*.07,bSemi(330,s),.6,"sine",.055,5000));
}
function sfxPickTake(){
 if(!S.sound)return;const t=bNow();
 [0,5,9,14].forEach((s,i)=>bNote(t+i*.05,bSemi(392,s),.35,"triangle",.06,6000));
 bDrum(t,120,44,.2,.16);
}
function sfxWaveStart(n){
 if(!S.sound)return;const t=bNow();
 bDrum(t,130,40,.3,.22,.1);
 bNote(t,bSemi(110,0),.5,"sawtooth",.05,600);
}
function sfxBossIn(){
 if(!S.sound)return;const t=bNow();
 bDrum(t,110,26,1.1,.34,.26);
 bNoise(t,.2,.8,700);
 [0,-5,-12].forEach((s,i)=>bNote(t+i*.1,bSemi(147,s),1.6,"sawtooth",.08,700));
}
