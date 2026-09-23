/* ═════════ 소리 ═════════ */
let AC=null;
const ac=()=>{if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}return AC;};
function tone(f1,f2,dur,type,vol,dl){
 if(!S.sound)return;const c=ac();if(!c)return;const t=c.currentTime+(dl||0);
 const o=c.createOscillator(),g=c.createGain();o.type=type||"sine";
 o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.1,t+.02);
 g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.05);}
function noise(dur,vol,dl){
 if(!S.sound)return;const c=ac();if(!c)return;const t=c.currentTime+(dl||0),n=Math.floor(c.sampleRate*dur);
 const b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2);
 const src=c.createBufferSource();src.buffer=b;const f=c.createBiquadFilter();f.type="lowpass";f.frequency.value=1500;
 const g=c.createGain();g.gain.value=vol||.16;src.connect(f);f.connect(g);g.connect(c.destination);src.start(t);}
function sfxClink(t){tone(680+t*60,300,.17,"triangle",.055);noise(.08,.045);}
function sfxCut(s,R){
 const tier=s.t,pd=s.pd||R.pd;
 if(s.th==="equinox")return sfxEquinox(pd);
 if(s.th==="fate")return sfxFate(pd);
 if(s.th==="eye")return sfxEye(pd);
 if(s.th==="ink")return sfxInk(pd);
 if(s.th==="hush")return sfxHush(pd);
 if(s.th==="breath")return sfxBreath(pd);
 if(s.th==="grid")return sfxGrid(pd);
 if(s.th==="oppress")return sfxOppress(pd);
 if(s.th==="recur")return sfxRecur(pd);
 if(s.th==="scale")return sfxScale(pd);
 if(s.th==="tdz")return sfxTdz();
 if(s.th==="glx")return sfxGlx();
 if(s.th==="obl")return sfxObl();
 tone(70,780,pd*0.92,"sawtooth",.045);
 if(tier>=8)tone(140,1400,pd*0.8,"triangle",.025,.3);
 noise(.6,.34,pd-.12);
 const base=[247,262,294,330,349,392,440,523][Math.min(7,tier-6)];
 [0,4,7,11,14].forEach((iv,i)=>tone(base*Math.pow(2,iv/12),base*Math.pow(2,iv/12),2.6,"sine",.06,pd+.1+i*.07));
 if(tier>=10)tone(base/2,base/2,3.4,"sine",.05,pd+.15);}

/* ───── EQUINOX 음악 (D단조 · 120BPM) ─────
   맥동 시점 P와 타격 테이블 EQ_HITS를 사운드와 화면 웅웅거림이 함께 사용한다 */
const FT_B=.3125;                                // 천기 — 192BPM (영상 분석값 191.4BPM)
const EQ_FD=+(FT_B*45).toFixed(4);               // 연출 구간 45박 = 14.0625초
function ftTimeCSS(){return `.th-ft .say{}`;}    // (구조 유지용 · 길이는 --fd 로 전달)
const EQ_B=.336;                                 // 박 (178.57BPM · 영상 분석값 178.2BPM)
const EQ_DUR=+(EQ_B*37).toFixed(3);              // 연출 구간 37박
const bt=b=>+(b*EQ_B).toFixed(3);
const EQ_VD=[5,12,19,26].map(bt);                // 구절 등장 (7박 간격)
const EQ_P=[30,31.5,33,34.5].map(bt);            // 한자 — 1.5박 간격 딱·딱·딱·딱
const EQ_INV=[8,12,16,19,22,25,28,30,31.5,33,34.5,36].map(bt);  // 흑백 전환 (간격 축소)
function eqHits(){
 const h=[];
 for(let b=4;b<37;b++)h.push({t:bt(b),a:b%4===0?.03:.013});   // 킥 — 매 박
 EQ_P.forEach((t,i)=>h.push({t,a:.07+i*.016}));
 EQ_VD.forEach(t=>h.push({t,a:.045}));
 EQ_INV.slice(0,7).forEach(t=>h.push({t,a:.034}));
 h.sort((x,y)=>x.t-y.t);
 return h;}
/* 애니메이션 길이를 타임테이블에서 직접 뽑아 주입한다 */
function eqxTimeCSS(){return `
.th-eqx .fld,.th-eqx .rot,.th-eqx .gzc,.th-eqx .bw.alt,.th-eqx .sinv,
.th-eqx .sbeat svg,.th-eqx .flare{
  animation-duration:${EQ_DUR}s}
.th-eqx .sbeat{animation-duration:${EQ_B}s}
.th-eqx .trem{animation-duration:${(EQ_B/2).toFixed(3)}s}`;}
/* 가장자리 막대는 전환 순간에만 올라왔다가 아래로 내려가며 사라진다 */
function eqxBarCSS(){
 const pc=t=>Math.max(0,Math.min(100,t/EQ_DUR*100));
 const ev=EQ_VD.map(t=>[t,.12,.75,.42]).concat(EQ_P.map(t=>[t,.07,.22,.15]))
   .sort((a,b)=>a[0]-b[0]);
 const ks=[],push=(p,v)=>{if(ks.length&&p<=ks[ks.length-1].p)return;ks.push({p,v});};
 push(0,0);
 ev.forEach(([t,en,ho,ex])=>{
  push(pc(t-.03),0);push(pc(t+en),1);push(pc(t+en+ho),1);push(pc(t+en+ho+ex),0);});
 push(100,0);
 const body=off=>ks.map(k=>k.p.toFixed(2)+"%{"+
  (k.v?"opacity:1;transform:translateY(0)":"opacity:0;transform:translateY("+off+")")+"}").join("");
 return "@keyframes ebarLifeT{"+body("-115%")+"}"+     // 위쪽 막대는 위로
        "@keyframes ebarLifeB{"+body("115%")+"}";}     // 아래쪽 막대는 아래로

/* 별의 맥동 키프레임도 한자 시점에서 생성 */
function eqxPulseCSS(){
 const pc=t=>t/EQ_DUR*100,k=[
  "0%{transform:scale(.04);opacity:0}","3%{opacity:1}",
  "9%{transform:scale(1);opacity:1}"],g=["0%,72%{opacity:0;transform:scale(.4)}"];
 EQ_P.forEach((t,i)=>{const a=pc(t);
  k.push(`${(a-.5).toFixed(2)}%{transform:scale(1)}`);
  k.push(`${a.toFixed(2)}%{transform:scale(${(1.3+i*.11).toFixed(2)})}`);
  k.push(`${(a+1.7).toFixed(2)}%{transform:scale(${(1+i*.02).toFixed(2)})}`);
  g.push(`${(a-.5).toFixed(2)}%{opacity:0;transform:scale(.5)}`);
  g.push(`${a.toFixed(2)}%{opacity:${(.55+i*.12).toFixed(2)};transform:scale(${(1+i*.22).toFixed(2)})}`);
  g.push(`${(a+1.7).toFixed(2)}%{opacity:0;transform:scale(${(1.3+i*.25).toFixed(2)})}`);});
 k.push("100%{transform:scale(2.1)}");
 g.push("100%{opacity:1;transform:scale(3.2)}");
 return "@keyframes eqxPulse{"+k.join("")+"}@keyframes eqxFlare{"+g.join("")+"}";}
/* 흑백 전환 키프레임 — 전환 시점 테이블에서 계단식으로 생성 */
function eqxInvCSS(total){
 const ks=[{p:0,s:0}];let st=0;
 EQ_INV.forEach(t=>{const p=t/total*100;ks.push({p:p-.12,s:st});st^=1;ks.push({p,s:st});});
 ks.push({p:100,s:st});
 const body=f=>ks.map(k=>k.p.toFixed(2)+"%{"+f(k.s)+"}").join("");
 return "@keyframes eqxInvOp{"+body(v=>"opacity:"+v)+"}"+
        "@keyframes eqxInv{"+body(v=>"filter:invert("+v+")")+"}";}

function eqxHumCSS(total){
 const ks=[],push=(p,sc)=>{p=Math.max(0,Math.min(100,p));
   if(ks.length&&p<=ks[ks.length-1].p)return;ks.push({p,s:sc});};
 push(0,1);
 let last=-9;
 eqHits().forEach(h=>{if(h.t-last<.08){return;}last=h.t;
   const p=h.t/total*100;push(p-.5,1);push(p,1+h.a);push(p+1.6,1.002);});
 push(93.4,1.006);push(100,1.05);                             // 라이저 구간 스웰
 return "@keyframes eqxHumDyn{"+ks.map(k=>k.p.toFixed(2)+"%{transform:scale("+k.s.toFixed(4)+")}").join("")+"}";}

function eqVoice(type,f,t,dur,vol,detune){
 if(!S.sound)return;const c=ac();if(!c)return;const T=c.currentTime+t;
 const o=c.createOscillator(),g=c.createGain(),flt=c.createBiquadFilter();
 o.type=type;o.frequency.value=f;if(detune)o.detune.value=detune;
 flt.type="lowpass";flt.frequency.setValueAtTime(Math.min(9000,f*7+500),T);
 g.gain.setValueAtTime(0,T);
 g.gain.linearRampToValueAtTime(vol,T+Math.min(.05,dur*.2));
 g.gain.exponentialRampToValueAtTime(.0001,T+dur);
 o.connect(flt);flt.connect(g);g.connect(c.destination);o.start(T);o.stop(T+dur+.05);}
function eqPad(f,t,dur,vol){
 if(!S.sound)return;const c=ac();if(!c)return;const T=c.currentTime+t;
 const g=c.createGain(),flt=c.createBiquadFilter();
 flt.type="lowpass";flt.frequency.setValueAtTime(Math.max(200,f*6),T);
 g.gain.setValueAtTime(0,T);
 g.gain.linearRampToValueAtTime(vol,T+Math.min(1.3,dur*.35));
 g.gain.setValueAtTime(vol,T+dur*.72);
 g.gain.exponentialRampToValueAtTime(.0001,T+dur);
 [0,-8,9].forEach(dt=>{const o=c.createOscillator();o.type="sawtooth";
  o.frequency.value=f;o.detune.value=dt;o.connect(flt);o.start(T);o.stop(T+dur+.1);});
 flt.connect(g);g.connect(c.destination);}

function sfxType(){tone(520+Math.random()*250,300,.026,"square",.022);}
function sfxTypeHead(){tone(165,88,.2,"triangle",.062);noise(.06,.045);}
let csTimers=[];
function clearCsTimers(){csTimers.forEach(clearTimeout);csTimers=[];}
function csType(){
 document.querySelectorAll("#cs [data-t]").forEach(el=>{
  const full=el.getAttribute("data-t")||"",t0=parseFloat(el.getAttribute("data-d")||"0")*1000;
  /* 글자를 미리 배치해 두고 보이기만 바꾼다.
     매 글자 textContent를 갈아끼우면 줄바꿈이 다시 계산되어 프레임이 튄다. */
  el.textContent="";
  const frag=document.createDocumentFragment(),sp=[];
  const mk=(ch,to)=>{const n=document.createElement("span");
   n.textContent=ch;n.style.visibility="hidden";to.appendChild(n);sp.push(n);};
  full.split(/(\s+)/).forEach(tok=>{
   if(!tok)return;
   if(/^\s+$/.test(tok)){mk(tok,frag);return;}
   const w=document.createElement("span");w.className="w";   // 단어는 통째로 줄바꿈
   for(const ch of tok)mk(ch,w);
   frag.appendChild(w);});
  el.appendChild(frag);
  csTimers.push(setTimeout(sfxTypeHead,t0+40));
  const step=QLV>=3?26:QLV===2?20:16;
  for(let k=0;k<sp.length;k++)csTimers.push(setTimeout(()=>{
   sp[k].style.visibility="visible";
   if(k%3===0&&full[k]!==" ")sfxType();
  },t0+210+k*step));});}

/* 라이선스를 보유한 음원이 있다면 아래에 파일 경로 또는 URL을 넣으십시오.
   값이 있으면 합성 음악 대신 그 파일을 재생합니다. 저작권 음원은 코드에 포함하지 않았습니다. */
const EQ_BGM="";
let eqAudio=null;
function eqStopBGM(){if(eqAudio){try{eqAudio.pause();}catch(e){}eqAudio=null;}}

/* 맑은 플럭 — 주 선율용. 탄성 굴곡 없이 또렷하게 튕긴다 */
function eqPluck(f,t,dur,vol){
 if(!S.sound)return;const c=ac();if(!c)return;const T=c.currentTime+t;
 const o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain(),flt=c.createBiquadFilter();
 o.type="triangle";o.frequency.value=f;
 o2.type="sine";o2.frequency.value=f*2;o2.detune.value=7;
 flt.type="lowpass";flt.frequency.setValueAtTime(Math.min(12000,f*9),T);
 flt.frequency.exponentialRampToValueAtTime(Math.max(600,f*2.4),T+dur);
 g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(vol,T+.008);
 g.gain.exponentialRampToValueAtTime(.0001,T+dur);
 o.connect(flt);o2.connect(flt);flt.connect(g);g.connect(c.destination);
 o.start(T);o2.start(T);o.stop(T+dur+.04);o2.stop(T+dur+.04);}

/* 가벼운 탄성 악센트 — 굴곡 폭을 크게 줄였다 (강조 지점에만 사용) */
function eqBoing(f,t,dur,vol){
 if(!S.sound)return;const c=ac();if(!c)return;const T=c.currentTime+t;
 const o=c.createOscillator(),g=c.createGain(),flt=c.createBiquadFilter();
 o.type="triangle";
 o.frequency.setValueAtTime(f*1.32,T);
 o.frequency.exponentialRampToValueAtTime(f*.97,T+dur*.18);
 o.frequency.exponentialRampToValueAtTime(f,T+dur*.4);
 flt.type="lowpass";flt.Q.value=3.5;
 flt.frequency.setValueAtTime(Math.min(12000,f*9),T);
 flt.frequency.exponentialRampToValueAtTime(Math.max(500,f*2.4),T+dur);
 g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(vol,T+.01);
 g.gain.exponentialRampToValueAtTime(.0001,T+dur);
 o.connect(flt);flt.connect(g);g.connect(c.destination);o.start(T);o.stop(T+dur+.05);}

/* ── 적요 : 울림이 번졌다가 도로 삼켜진다 ── */
function sfxHush(pd){
 if(!S.sound)return;
 eqPad(43.65,0,pd+.8,.042);
 [0.9,1.52,2.14,2.76,3.38].forEach((t,i)=>{
  eqVoice("sine",[196,233,262,311,349][i],t,2.4,.034);
  noise(.3,.07,t);});
 tone(1400,140,1.0,"sine",.05,3.6);            // 소리가 빨려 들어간다
 for(let t=4.6;t<6.2;t+=.16)tone(2200-((t-4.6)*1100),600,.09,"triangle",.02,t);
 noise(.5,.2,6.05);
 eqPad(87.31,pd,3.4,.055);
 [174.61,261.63,349.23,523.25].forEach((f,i)=>eqVoice("sine",f,pd+.08+i*.06,3.0,.045));}

/* ── 태동 : 여섯 번의 호흡 ── */
function sfxBreath(pd){
 if(!S.sound)return;
 eqPad(36.71,0,pd+1.0,.05);
 [0.7,1.45,2.2,2.95,3.7,4.5].forEach((t,i)=>{
  const g=.06+i*.022;
  noise(.34,g,t);                               // 들숨
  tone(58+i*5,40,.5,"sine",.1+i*.02,t);
  eqVoice("sine",[130.81,146.83,164.81,196,220,261.63][i],t+.06,1.5,.028+i*.006);});
 tone(120,1800,1.2,"sine",.05,5.2);
 noise(.8,.3,pd-.2);
 eqPad(65.41,pd,3.8,.06);
 [130.81,196,261.63,392].forEach((f,i)=>eqVoice("sine",f,pd+.06+i*.07,3.2,.046));}

/* ── 관측자 : 눈금이 그어지고 세계가 고정된다 ── */
function sfxGrid(pd){
 if(!S.sound)return;
 eqPad(49,0,pd+.6,.036);
 for(let i=0;i<14;i++)tone(2600+((i%7)*180),1500,.06,"square",.022,0.5+i*0.13);
 tone(3200,1700,.1,"square",.035,2.7);tone(3200,1700,.1,"square",.035,2.9);
 eqVoice("triangle",880,3.3,1.0,.03);eqVoice("triangle",1174.66,3.5,.9,.026);
 tone(1600,420,.3,"sine",.06,3.9);              // 점이 찍힌다
 noise(.14,.3,5.5);tone(240,60,.5,"sine",.2,5.5); // 고정
 eqPad(73.42,pd,3.4,.055);
 [146.83,220,293.66,440].forEach((f,i)=>eqVoice("sine",f,pd+.06+i*.06,3.0,.045));}

/* ── O P P R E S S I O N ── 영상에서 가져온 것은 구조 수치뿐이다:
   저역 비중 48%, 0.49초 간격의 쌍타격이 2.2초 주기, 종반 고역 0.2→4.5kHz. */
/* 대역 통과 노이즈 — 유리 조각의 날카로운 마찰 */
function noiseBP(f,dur,vol,dl){
 if(!S.sound)return;const c=ac();if(!c)return;const T=c.currentTime+(dl||0);
 const n=Math.max(8,Math.floor(c.sampleRate*dur));
 const b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.2);
 const src=c.createBufferSource();src.buffer=b;
 const flt=c.createBiquadFilter();flt.type="bandpass";
 flt.frequency.value=f;flt.Q.value=7+Math.random()*12;
 const g=c.createGain();g.gain.value=vol;
 src.connect(flt);flt.connect(g);g.connect(c.destination);src.start(T);}

/* 유리가 깨지는 소리 — 순간의 파열 + 불협 고역 + 잔해가 흩어지는 꼬리 */
function glassBreak(t,k){
 if(!S.sound)return;k=k||1;
 noise(.04,.46*k,t);                                    // 첫 균열
 noiseBP(5200,.05,.34*k,t);
 for(let i=0;i<9;i++)noiseBP(2600+Math.random()*6800,.05+Math.random()*.09,.16*k,
   t+.01+Math.pow(Math.random(),1.5)*.34);              // 조각이 터지는 순간
 for(let i=0;i<26;i++){                                 // 불협 고역 무리
  const f=2800+Math.random()*7200;
  tone(f,f*.58,.05+Math.random()*.1,"triangle",.017*k,
    t+.01+Math.pow(Math.random(),1.7)*.5);}
 for(let i=0;i<18;i++){                                 // 잔해가 떨어져 부딪힌다
  const d=t+.32+Math.pow(Math.random(),.8)*1.35;
  const f=1700+Math.random()*4200;
  tone(f,f*.42,.035,"square",.011*k,d);
  if(i%3===0)noiseBP(f*1.2,.03,.05*k,d);}}

/* 츠르릉 — 사슬이 미끄러져 들어오다 금속을 꿰뚫는 순간 */
function metalTear(startT,impactT,k){
 if(!S.sound)return;k=k||1;
 const slide=Math.max(.1,impactT-startT);
 noiseBP(6400,slide,.2*k,startT);                      // 미끄러지는 마찰 — 츠르
 for(let i=0;i<6;i++)noiseBP(4800+Math.random()*3600,.05,.11*k,
   startT+Math.random()*slide*.82);
 noise(.035,.42*k,impactT);                             // 관통 — 릉
 tone(72,44,.5,"sine",.27*k,impactT);
 [1900,2680,3520,4600].forEach((f,i)=>
   tone(f,f*.8,.5+i*.05,"triangle",.095*k-i*.013,impactT+i*.006));
 tone(2500,2100,.4,"sine",.05*k,impactT+.08);           // 사슬이 팽팽히 우는 잔향
 tone(46,30,.7,"sine",.14*k,impactT+.02);}

function sfxOppress(pd){
 if(!S.sound)return;
 const BEAT=[2.7,3.5],CH=[{t:4.30,imp:4.78},{t:6.40,imp:6.88}],
       CB=[7.55,8.35],SHT=9.05;

 /* 무 — 정적 속 낮은 드론 */
 eqPad(20.6,0,SHT+1.2,.055);            // 바닥을 까는 초저역
 eqPad(27.5,0,SHT+.6,.05);
 eqPad(41.2,1.2,SHT-.6,.028);           // 낮은 배음 한 겹
 tone(58,58,2.4,"sine",.03,.2);

 /* 마법진이 그려진다 — 아주 옅은 금속성 스침 */
 for(let i=0;i<10;i++)tone(300+Math.random()*180,150,.09,"triangle",.022,.35+i*.12);

 /* 심장이 맺힌다 */
 noise(.5,.09,1.5); tone(160,50,1.0,"sine",.08,1.55);
 eqVoice("sine",146.83,1.7,1.9,.036);
 eqVoice("sine",98,1.9,2.2,.026);

 /* 두근 — 두 번, 두 번째가 더 무겁다 */
 BEAT.forEach((t,i)=>{const g=1+i*.3;
  tone(64,40,.5,"sine",.22*g,t); noise(.08,.1*g,t);
  tone(52,34,.42,"sine",.16*g,t+.16); noise(.06,.08*g,t+.16);});

 /* 사슬 — 두 번의 관통, 회차마다 무거워진다 */
 CH.forEach((c,i)=>metalTear(c.t,c.imp,1+i*.35));

 /* 금이 간 채로 두 번 더 — 둔하고 점점 커진다 */
 CB.forEach((t,i)=>{const g=1.35+i*.5;
  tone(48,30,.7,"sine",.2*g,t);                  // 더 낮고 무거운 박동
  tone(38,26,.9,"sine",.14*g,t+.02);
  noise(.12,.1*g,t);
  noiseBP(900+i*260,.16,.09*g,t+.01);            // 갈라진 틈이 삐걱인다
  tone(42,28,.6,"sine",.15*g,t+.19);
  noise(.09,.07*g,t+.19);});

 /* 쪼개진다 */
 noise(.08,.32,SHT-.05);
 glassBreak(SHT,1.05);
 tone(40,26,1.7,"sine",.16,SHT+.05);

 /* 파편이 가라앉는 정적 */
 tone(380,380,1.6,"sine",.018,SHT+.85);
 eqPad(32.7,SHT+.5,2.0,.032);

 /* 검 */
 eqPad(51.91,pd,4.2,.06);
 [103.83,155.56,207.65,311.13,415.3].forEach((f,i)=>eqVoice("sine",f,pd+.06+i*.05,3.4,.046));
 tone(2600,2600,1.6,"sine",.02,pd+.3);}

/* ── 회귀 : 같은 음이 점점 좁은 간격으로 되돌아온다 ── */
function sfxRecur(pd){
 if(!S.sound)return;
 eqPad(41.2,0,pd+.8,.046);
 let t=0.8,g=.62;
 for(let i=0;i<14&&t<7.3;i++,t+=g,g*=.88){
  eqVoice("triangle",[329.63,392,440,523.25][i%4],t,.9,.03+i*.003);
  noise(.1,.05+i*.008,t);}
 [2.0,3.4,4.8,6.2].forEach((tt,i)=>{
  tone(110,44,.7,"sine",.14+i*.03,tt);
  eqVoice("sine",164.81*Math.pow(2,i/4),tt+.04,1.6,.03);});
 noise(.16,.38,7.35); tone(1800,160,.7,"sawtooth",.1,7.35);
 eqPad(82.41,pd,3.6,.055);
 [164.81,246.94,329.63,493.88].forEach((f,i)=>eqVoice("sine",f,pd+.06+i*.06,3.2,.046));}

/* ── 심판 : 저울이 흔들리다 한쪽으로 기운다 ── */
function sfxScale(pd){
 if(!S.sound)return;
 eqPad(49,0,pd+.8,.044);
 tone(70,50,1.2,"sine",.12,.8);                 // 기둥이 선다
 noise(.4,.1,1.6); tone(260,90,.5,"sine",.09,2.1);
 [[2.6,392],[3.5,349.23],[4.4,392],[5.3,329.63],[6.2,392]].forEach(([t,f],i)=>{
  tone(96,60,.4,"sine",.1,t);                   // 삐걱
  eqVoice("triangle",f,t,1.0,.03-i*.003);});
 tone(120,40,1.0,"sine",.22,6.9);               // 결정적으로 기운다
 noise(.5,.26,6.9);
 noise(.16,.42,7.7); tone(1500,180,.6,"sawtooth",.1,7.7);
 for(let i=0;i<10;i++)tone(2800+Math.random()*3000,1100,.12,"triangle",.022,7.74+i*.035);
 eqPad(65.41,pd,3.8,.058);
 [130.81,196,261.63,392,523.25].forEach((f,i)=>eqVoice("sine",f,pd+.06+i*.05,3.2,.046));}

/* 창세의 첫 획 — 폭발이 아니라 '최초의 무언가가 시작되는' 소리. */
function sfxInk(pd){
 if(!S.sound)return;
 const M=INK_M,T=INK_T;
 const fwdEnd=M.stroke+T.firstStrokeDuration*INK_S.fwd;
 const C3=130.81,G3=196,C4=261.63,D4=293.66,E4=329.63,G4=392,B4=493.88,
       C5=523.25,E5=659.25,G5=783.99,C6=1046.5;

 /* ① 무 — 공간의 울림만 */
 eqPad(32.7,0,M.createEnd+.6,.034);
 tone(49,49,M.stroke+.6,"sine",.03,.05);
 tone(1900,1900,.5,"sine",.01,M.seed);              // 점이 맺히는 아주 작은 소리

 /* ② 첫 획 — 공간을 가르는 긴 '슥' */
 noise(fwdEnd-M.stroke+.25,.1,M.stroke);
 tone(320,2900,fwdEnd-M.stroke,"sine",.05,M.stroke);
 tone(180,1400,(M.strokeEnd-M.stroke)*.6,"triangle",.022,M.stroke+.06);
 tone(2600,640,.5,"sine",.028,fwdEnd-.1);           // 획이 멎는 자리

 /* ③ 세계의 생성 — 낮은 울림과 유리 같은 맑은 음들 */
 eqPad(98,M.create,T.creationDuration+.9,.036);
 eqPad(C3,M.create+.2,T.creationDuration+.7,.028);
 for(let i=0;i<9;i++){
  const f=[C5,E5,G5,B4,C6,G4,E5,C6,G5][i];
  eqVoice("triangle",f,M.create+.08+i*(T.creationDuration/10),1.3,.026);}

 /* ④ 창세 — 짧고 장엄한 한 음 */
 [C3,G3,C4,E4,G4].forEach((f,i)=>eqVoice("sine",f,M.genesis+i*.035,1.5,.05));
 noise(.3,.12,M.genesis);
 tone(2200,4600,.34,"sine",.024,M.genesisPeak-.1);

 /* ⑤⑥ 검의 탄생과 완성 — 맑고 긴 금속성 울림 */
 eqPad(65.41,pd,4.0,.05);
 tone(1500,1500,2.6,"sine",.026,pd+.2);             // 윤곽이 그어지는 금속음
 [C4,G4,C5,E5].forEach((f,i)=>eqVoice("sine",f,pd+.24+i*.26,2.8,.04));
 tone(3100,3100,1.4,"triangle",.018,pd+T.swordFormDuration-.35);
 tone(1800,4400,.55,"sine",.03,pd+T.swordFormDuration+.25);   // 표면을 훑는 광채
 eqVoice("triangle",C6,pd+T.swordFormDuration+.3,1.3,.03);}

/* 만상의 눈 — 국면 경계를 EYE_M에서 그대로 읽어 쓴다.
   압도적이기보다 조용하고 높은 음역으로, 상위 두 등급의 여지를 남긴다. */
function sfxEye(pd){
 if(!S.sound)return;
 const M=EYE_M;
 const C4=261.63,E4=329.63,G4=392,B4=493.88,D5=587.33,E5=659.25,G5=783.99,B5=987.77,E6=1318.51;

 /* ① 정적 — 거의 들리지 않는 저역과 아주 높은 배음 */
 eqPad(41.2,0,M.shut+.4,.032);
 tone(2480,2480,M.open+.7,"sine",.012,.15);

 /* ② 눈의 등장 — 공기가 차오른다 */
 noise(M.gaze-M.open,.055,M.open);
 eqPad(164.81,M.open,M.blink-M.open+.5,.03);
 [E4,G4,B4,E5].forEach((f,i)=>eqVoice("sine",f,M.open+.1+i*.26,1.9,.028));
 tone(660,1980,M.gaze-M.open,"sine",.018,M.open);

 /* ③ 관찰 — 배경이 빠지고 한 음만 남아 긴장한다 */
 eqVoice("sine",B4,M.gaze,M.blink-M.gaze+.35,.045);
 eqVoice("sine",B4*1.0595,M.gaze+.06,M.blink-M.gaze+.2,.016);   // 아주 옅은 불협
 tone(3200,3200,.45,"sine",.01,M.gaze+.1);

 /* ④ 깜빡임 — 빛이 중앙으로 빨려든다 */
 tone(1400,110,M.shut-M.blink,"sine",.075,M.blink);
 noise(M.shut-M.blink,.14,M.blink);
 tone(70,44,.55,"sine",.1,M.shut-.06);

 /* ⑤ 정지 — 아무 소리도 넣지 않는다 */

 /* ⑥ 재개안과 만상 — 짧고 밝은 종소리 무리 */
 [E5,G5,B5,E6,B5*1.5].forEach((f,i)=>
   eqVoice("triangle",f,M.reopen+i*.035,1.4-i*.13,.038));
 noise(.22,.12,M.reopen);
 tone(2200,5200,.3,"sine",.026,M.reopen);
 for(let i=0;i<10;i++)tone(2600+Math.random()*3600,1600,.1,"triangle",.014,M.reopen+.05+i*.028);

 /* ⑦ 검의 강림 — 형체가 맺히는 동안 화음이 자란다 */
 eqPad(82.41,pd,3.4,.05);
 [E4,B4,E5,G5].forEach((f,i)=>eqVoice("sine",f,pd+.12+i*.3,2.6,.04));
 tone(520,520,1.6,"sine",.02,pd+.2);
 /* ⑧ 표면을 훑는 광채 */
 tone(1800,4200,.5,"sine",.03,pd+EYE_T.swordRevealDuration-.25);
 eqVoice("triangle",E6,pd+EYE_T.swordRevealDuration-.2,1.2,.03);}

/* 천기 — 192BPM. 영상에서 가져온 것은 템포와 에너지 곡선(2초 저역 진입 → 5초 정점 →
   9초 급락 → 11초 재점화 → 14초 종결, 고역 중심이 종반에 4.7kHz까지 상승)뿐이다. */
function sfxFate(pd){
 if(!S.sound)return;
 const B=FT_B;
 const A1=55,E2=82.41,A2=110,C3=130.81,E3=164.81,A3=220,C4=261.63,E4=329.63,
       A4=440,C5=523.25,E5=659.25,A5=880,B4=493.88,G4=392;

 /* ① 암전 — 낮은 웅림과 시계 초침 */
 eqPad(A1,.1,9.4,.05); eqPad(A1/2,.1,9.4,.045);
 for(let b=2;b<29;b++){                              // 초침
  const t=b*B;
  tone(2100,900,.035,"square",.028,t);
  if(b%4===0)tone(1500,700,.05,"triangle",.03,t);}

 /* ② 두 문장 */
 [[2,A3],[7,C4]].forEach(([b,f])=>{
  const t=b*B; noise(.3,.16,t); tone(62,34,.5,"sine",.14,t);
  eqVoice("sine",f,t,2.2,.04);});

 /* ③ 다이얼 기동 (11박) — 저역이 차오른다 */
 tone(48,40,2.6,"sine",.2,11*B); noise(.9,.22,11*B);
 eqPad(E2,11*B,7.2,.04); eqPad(A2,13*B,5.6,.03);
 for(let b=12;b<29;b++){const t=b*B;
  tone(150,46,.11,"sine",.14,t);                     // 킥
  if(b%2===1)noise(.08,.1,t);
  for(const o of [.5])noise(.014,.02,(b+o)*B);}

 /* ④ 매듭이 엮이는 구간 (18~28박) — 화성이 한 겹씩 쌓인다 */
 const CH=[A3,C4,E4,A4,B4,C5];
 CH.forEach((f,i)=>eqVoice("triangle",f,(18+i*1.6)*B,2.4,.032));
 for(let b=18;b<29;b++)eqPluck([A4,C5,E5,C5][(b-18)%4],b*B,.26,.04);

 /* ⑤ 절단 (29박) — 화면이 둘로 갈린다 */
 noise(.07,.34,8.98);                                // 칼날이 지나가는 마찰
 tone(5200,1400,.16,"sawtooth",.075,8.98);
 tone(3400,700,.26,"triangle",.05,9.0);
 noise(.42,.3,9.06);                                 // 갈라지는 순간
 tone(1400,90,.55,"sawtooth",.12,9.06);
 tone(46,32,2.0,"sine",.17,9.06);                    // 밑으로 가라앉는 저역
 tone(2600,2600,1.4,"sine",.022,9.2);                // 절단면에 남는 잔음
 eqPad(A1,29.6*B,2.4,.03);
 tone(38,30,2.2,"sine",.13,30*B);

 /* ⑥ 재점화 (37박) — 다이얼이 가속한다 */
 tone(60,50,3.2,"sine",.2,37*B); noise(1.0,.3,37*B);
 eqPad(A2,37*B,3.4,.05); eqPad(E3,37.6*B,2.8,.035);
 for(let b=37;b<45;b++){const t=b*B;
  tone(160,42,.12,"sine",.19,t);
  for(const o of [.25,.5,.75])noise(.02,.035,(b+o)*B);
  eqPluck([A4,C5,E5,A5][(b-37)%4],t,.2,.05);}

 /* ⑦ 네 번의 가속 타격 (41~44박) */
 [41,42,43,44].forEach((b,i)=>{const t=b*B,g=1+i*.4;
  noise(.14,.34*g,t); tone(280,70,.08,"square",.14*g,t);
  tone(110,26,.44,"sine",.24*g,t); tone(52,34,.7,"sine",.2*g,t);
  eqPluck([A5,C5*2,E5*2,A5*2][i],t+.01,.26,.075*g);});

 /* ⑧ 결(結) — 파쇄와 백색 폭발 */
 noise(1.3,.55,pd); noise(.35,.5,pd+.02);
 tone(2600,300,.9,"sawtooth",.06,pd);                // 유리 파열의 고역
 for(let i=0;i<14;i++)tone(3000+Math.random()*4000,900,.16,"triangle",.03,pd+.02+i*.035);
 eqPad(A1,pd,4.6,.075);
 [A2,C3,E3,A3,C4,E4,A4].forEach((f,i)=>eqVoice("sine",f,pd+.06+i*.045,3.6,.05));
 eqPluck(A5,pd+.1,1.8,.06);}

function sfxEquinox(pd){
 if(EQ_BGM){eqStopBGM();
  try{eqAudio=new Audio(EQ_BGM);eqAudio.volume=.75;eqAudio.play().catch(()=>{});}catch(e){}
  return;}
 if(!S.sound)return;
 /* 분석에서 가져온 것은 구조 수치뿐이다: 178BPM, 매 박 타격(4-on-the-floor),
    120Hz 이하가 전체 에너지의 37%, 스펙트럼 중심 1.3~1.8kHz, 구간 간 세기 변화 거의 없음.
    선율과 화성은 원곡과 무관한 자작이다. */
 const B=EQ_B,BAR=B*4;
 const D2=73.42,A2=110,B2=123.47,G2=98,
       D5=587.33,Fs5=739.99,A5=880,B5=987.77,D6=1174.66,Fs6=1479.98,A6=1760;

 /* ① 개막 */
 noise(.42,.24,.05); tone(2600,190,.4,"sine",.05,.06);
 tone(64,44,.9,"sine",.15,.28);

 /* ② 서브베이스 지속층 — 저역이 전체를 떠받친다 */
 eqPad(D2,.3,pd+1.0,.055); eqPad(D2/2,.3,pd+1.0,.05);
 eqPad(A2,1.7,pd-1.3,.022);

 /* ③ 매 박 킥 + 오프비트 서브 — 세기를 일정하게 유지 */
 for(let b=4;b<38;b++){const t=b*B;
  tone(170,42,.12,"sine",.17,t);                 // 어택
  tone(58,36,.26,"sine",.15,t);                  // 서브
  if(b%2===1)noise(.09,.1,t);}                   // 2·4박 스네어
 for(let b=4;b<38;b++)for(const o of [.25,.5,.75])noise(.016,.022,(b+o)*B);

 /* ④ 바운시 베이스 — D · A · Bm · G */
 const PROG=[D2,A2,B2,G2];
 for(let b=0;b<9;b++){const t0=4*B+b*BAR,r=PROG[b%4];
  [0,1,1.5,2.5,3.5].forEach(o=>{const t=t0+o*B;if(t<30*B)eqVoice("square",r,t,.15,.05);});}

 /* ⑤ 주 선율 — 8분음표 플럭, 밝은 상단 */
 const LEAD=[D5,Fs5,A5,B5,A5,Fs5,D6,A5];
 for(let b=0;b<9;b++){const t0=4*B+b*BAR;
  LEAD.forEach((f,k)=>{const t=t0+k*(B/2);if(t>30*B)return;
   eqPluck(f*(b>=5?2:1),t,.24,b<1?.04:.053);});}
 for(const b0 of [11,17,23,28]) [0,.25,.5,.75].forEach((o,k)=>
   eqPluck([A5,B5,D6,Fs6][k],(b0+o)*B,.13,.036));
 for(let b=8;b<30;b+=4)eqVoice("sine",[D6,Fs6,A6,D6][(b/4)%4],b*B,.8,.02);

 /* ⑥ 흑백 전환 임팩트 */
 EQ_INV.forEach((t,i)=>{const k=i/EQ_INV.length;
  noise(.17+k*.2,.12+k*.2,t);
  tone(94,28,.26,"sine",.11+k*.1,t);
  eqPluck(D6,t,.18,.028+k*.038);});

 /* ⑦ 구절 등장 */
 EQ_VD.forEach((t,i)=>{
  noise(.28,.26,t);
  tone(70,30,.44,"sine",.2,t);
  eqBoing([D5,Fs5,A5,D6][i],t+.02,.42,.066);
  eqVoice("sine",[D5,Fs5,A5,D6][i]*2,t+.04,.95,.026);});

 /* ⑧ 한자 — 딱·딱·딱·딱. 네 번에 걸쳐 세기가 계단식으로 올라간다 */
 const PF=[D5,Fs5,A5,D6];
 for(let b=28;b<30;b+=.25)noise(.05,.06+(b-28)*.09,b*B);   // 진입 롤
 EQ_P.forEach((t,i)=>{
  const g=1+i*.34;                                          // 회차별 증폭
  noise(.1,.4*g,t);                                         // 마른 타격
  noise(.5,.16*g,t);                                        // 잔향
  tone(300,66,.08,"square",.16*g,t);
  tone(120,26,.46,"sine",.26*g,t);                          // 저역 충격
  tone(60,38,.7,"sine",.2*g,t);                             // 서브
  eqPluck(PF[i]*2,t+.01,.32,.1*g);
  eqPluck(PF[i]*4,t+.02,.2,.045*g);
  eqVoice("triangle",PF[i],t+.01,.7,.062*g);
  eqVoice("sawtooth",PF[i]/2,t+.01,.5,.03*g);
  if(i===3){                                                // 마지막 無 — 화음 총주
   [D5/2,Fs5/2,A5/2,D5,Fs5,A5,D6].forEach((f,k)=>
     eqVoice("sine",f,t+.03+k*.02,1.5,.055));
   tone(44,30,1.3,"sine",.24,t);}});

 /* ⑨ 종결 */
 for(let t=35*B,g=.1,k=0;t<pd&&k<24;k++,t+=g,g=Math.max(.028,g*.78))
  tone(1300,2000,.05,"square",.046,t);
 tone(190,3400,.55,"sawtooth",.05,pd-.55);
 noise(1.0,.5,pd);
 eqPad(D2,pd,4.2,.062);
 [D5/2,Fs5/2,A5/2,D5,Fs5,A5].forEach((f,i)=>eqVoice("sine",f,pd+.05+i*.04,3.2,.05));
 eqPluck(D6,pd+.08,1.5,.06);}


/* ───── 종 ─────
   기계음이 아니라 쇠를 친 소리. 종 특유의 비조화 배음을 함께 울리고,
   전체 음정을 아래로 끌어내려 "멎어 가는" 느낌을 만든다. */
function bellFall(dl,f0,f1,dur,vol){
 if(!S.sound)return;
 const P=[1,2.00,2.76,5.40,8.10],A=[1,.52,.34,.16,.08];
 P.forEach((p,i)=>tone(f0*p,Math.max(24,f1*p),dur*(1-i*.12),"sine",vol*A[i],dl));
 noise(.13,.028,dl);}

/* ───── T I M E  D E S T R O Y E R ─────
   ① 정주행 초침 → ② 느려지며 종이 세 번, 점점 낮게 → ③ 정적
   → ④ 웅 하는 저음과 함께 역주행 → ⑤ FOR·I·AM → ⑥ 이름 → ⑦ 밝아짐.
   타이밍은 TDZ_T 하나만 본다 — 화면과 어긋나지 않게. */
function sfxTdz(){
 if(!S.sound)return;
 const T=TDZ_T,TOT=TDZ_END/1000;
 tone(150,34,T.open+.4,"sine",.17,0);                       // 빨려 들어가는 저음
 noise(1.15,.10,0);
 tone(49,46,T.l2-T.open+.4,"sawtooth",.045,T.open);         // 바닥에 깔리는 지속음

 /* ① 정주행 — 고르게 또각또각 */
 let t=T.open+.3;
 while(t<T.l2){tone(430,250,.045,"square",.017,t);t+=.5;}
 /* ② 감속 — 간격이 벌어지다 멎는다. 종이 세 번, 점점 낮고 길게 */
 let step=.5;
 while(t<T.stop){tone(400,230,.05,"square",.016,t);t+=step;step*=1.42;}
 bellFall(T.l2+.10,560,330,2.6,.075);
 bellFall(T.l2+1.00,380,205,3.0,.070);
 bellFall(T.stop-.15,252,110,3.8,.066);                     // 마지막 한 번 — 가장 낮게 내려앉는다

 /* ③ 정적 → ④ 웅. 저음이 차오르고 시간이 뒤집힌다 */
 tone(30,44,1.1,"sawtooth",.11,T.l3-.16);
 tone(60,88,2.6,"sine",.07,T.l3-.10);
 tone(44,41,TOT-T.l3,"sawtooth",.05,T.l3);                  // 끝까지 깔리는 웅
 bellFall(T.l3,190,300,2.2,.05);                            // 거꾸로 — 음정이 되레 올라간다
 /* 역주행 초침 — 점점 빨라진다 */
 t=T.l3+.22;let rs=.34;
 while(t<T.title-.1){tone(300,470,.04,"square",.015,t);t+=rs;rs=Math.max(.075,rs*.93);}

 /* ⑤ FOR · I · AM — 세 번의 타격. 차원이 하나씩 열린다 */
 [T.f,T.i,T.a].forEach((tt,k)=>{
  tone(146-k*20,40,.46,"triangle",.13,tt);noise(.2,.085,tt);
  bellFall(tt+.05,300+k*130,150+k*70,1.7,.038);});

 /* ⑥ 이름 — 한 방, 그리고 낮게 울린다 */
 tone(92,28,2.8,"sawtooth",.17,T.title);
 noise(.75,.15,T.title);
 [73.4,110,146.8].forEach((f,i)=>tone(f,f,3.4,"sine",.055,T.title+.06+i*.05));
 bellFall(T.title+.04,150,62,4.2,.075);                     // 모든 차원의 종이 한꺼번에 내려앉는다

 /* ⑦ 마감 — 밝아지며 올라간다 */
 tone(190,860,T.fade,"sine",.085,T.close);
 noise(1.0,.075,T.close);}

/* ───── G L I T C H ─────
   ① 키보드 타건이 또각또각 → ② 첫 오류에 경보 → ③ 신호가 찢어진다
   → ④ E`R%RO^R 에 저음 한 방 → ⑤ 밝아지며 끝.
   타이밍은 GLX_T 하나만 본다. */
function sfxGlx(){
 if(!S.sound)return;
 const T=GLX_T;
 tone(150,34,T.open+.4,"sine",.17,0);                        // 빨려 들어가는 저음 (여는 연출 공통)
 noise(1.15,.10,0);
 tone(58,55,T.err-T.code+.6,"sawtooth",.04,T.code);          // 콘솔이 도는 낮은 웅웅거림
 /* 타건 — 코드가 찍히는 동안 고르게 */
 for(let t=T.code+.1;t<T.err-.1;t+=.085)
  tone(1500+Math.random()*900,700,.012,"square",.012,t);
 /* 첫 오류 — 경보가 두 번 */
 [0,.34].forEach(o=>{tone(880,440,.22,"square",.075,T.err+o);noise(.1,.05,T.err+o);});
 tone(220,60,1.2,"sawtooth",.1,T.err);
 /* 무너짐 — 찢어지는 잡음이 불규칙하게 */
 let t=T.crash;
 while(t<T.word){
  noise(.06+Math.random()*.1,.07+Math.random()*.06,t);
  tone(90+Math.random()*1600,60+Math.random()*400,.05,"square",.03,t);
  t+=.07+Math.random()*.2;
 }
 tone(41,39,T.close-T.crash,"sawtooth",.055,T.crash);        // 바닥에 깔리는 고장 난 저음
 /* E`R%RO^R — 저음 한 방과 깨진 배음 */
 tone(86,26,2.6,"sawtooth",.17,T.word);
 noise(.8,.16,T.word);
 [58,97,131,173].forEach((f,i)=>tone(f,f*.97,2.4,"square",.035,T.word+.04+i*.05));
 /* 마감 — 밝아지며 올라간다 (여는 연출과 짝) */
 tone(190,860,T.fade,"sine",.085,T.close);
 noise(1.0,.075,T.close);}

/* ───── O B L I V I O N ─────
   ① 검들이 스쳐 갈 때 잔물결 같은 울림 → ② 상징마다 낮은 종 →
   ③ 부들거림과 함께 고음이 차오르다 → ④ 쩅그랑 → ⑤ 밝아지며 끝. */
function sfxObl(){
 if(!S.sound)return;
 const T=OBL_T;
 tone(150,34,T.open+.4,"sine",.17,0);                        // 여는 연출 공통
 noise(1.15,.10,0);
 tone(47,44,T.quake-T.rush,"sawtooth",.05,T.rush);           // 바닥에 깔리는 보랏빛 저음
 /* 지나가는 검 — 스칠 때마다 짧게 울린다 */
 const n1=Math.round((T.sig-T.rush)/.12);
 for(let i=0;i<n1;i++)
  tone(520+((i*97)%420),300,.05,"triangle",.016,T.rush+i*.12);
 /* 상징 — 하나씩 낮은 종으로 떨어진다 */
 const N=(typeof OBL_ORDER!=="undefined"?OBL_ORDER.length:19);
 const sp=(T.quake-.3-T.sig)/N;
 for(let i=0;i<N;i++)
  bellFall(T.sig+i*sp,330-i*9,168-i*5,Math.min(2.4,sp*3),.045);
 /* 부들거림 — 고음이 차오른다 */
 tone(240,1500,T.crack-T.quake,"sine",.07,T.quake);
 noise(T.crack-T.quake,.05,T.quake);
 /* 쩅그랑 — 이미 있는 유리 깨짐 합성음을 쓴다 */
 if(typeof glassBreak==="function"){glassBreak(T.crack,1.25);glassBreak(T.crack+.11,.7);}
 tone(90,26,2.2,"sawtooth",.15,T.crack);
 /* 마감 */
 tone(190,860,T.fade,"sine",.085,T.close);
 noise(1.0,.075,T.close);}
