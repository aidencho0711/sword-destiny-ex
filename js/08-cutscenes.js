/* ═════════ 컷신 ═════════ */
/* 8개의 뾰족한 꼭짓점 사이가 둥글게 부푼 폭발형 성망.
   꼭짓점에서는 반지름 방향으로 빠져나가 끝이 날카롭고, 골은 접선 방향으로 둥글게 말린다. */
function eqxBurst(cx,cy,oR,iR,rot){
 const n=8,step=Math.PI*2/n,R=(rot||0)*Math.PI/180,SP=.20,CT=.62,KF=.30;
 const f=v=>v.map(x=>x.toFixed(1)).join(" ");
 const pt=(a,r)=>[cx+Math.cos(a)*r,cy+Math.sin(a)*r];
 let d="";
 for(let i=0;i<n;i++){
  const a1=-Math.PI/2+R+step*i,a2=a1+step,am=a1+step/2;
  const p1=pt(a1,oR),p2=pt(a2,oR),v=pt(am,iR);
  const tx=-Math.sin(am),ty=Math.cos(am),k=iR*KF;
  const c1=pt(a1+step*SP,oR*CT),c4=pt(a2-step*SP,oR*CT);
  const c2=[v[0]-tx*k,v[1]-ty*k],c3=[v[0]+tx*k,v[1]+ty*k];
  if(!i)d+=`M${f(p1)} `;
  d+=`C${f(c1)} ${f(c2)} ${f(v)} C${f(c3)} ${f(c4)} ${f(p2)} `;}
 return d+"Z";}

/* 상하축이 길고 좌우축이 짧은 십자형 성망.
   꼭짓점 사이를 중심 가까이까지 오목하게 파서 바늘처럼 가늘게 만든다. */
function eqxCross(cx,cy,v,h,iR){
 const P=[[cx,cy-v],[cx+h,cy],[cx,cy+v],[cx-h,cy]];
 const k=iR*.72;
 const C=[[cx+k,cy-k],[cx+k,cy+k],[cx-k,cy+k],[cx-k,cy-k]];
 let d=`M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)} `;
 for(let i=0;i<4;i++){const c=C[i],n=P[(i+1)%4];
  d+=`Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${n[0].toFixed(1)} ${n[1].toFixed(1)} `;}
 return d+"Z";}

/* 천간·지지·팔괘를 두른 천문 다이얼 한 겹 */
function ftDial(sz,glyphs,rr,fs,ticks){
 const c=sz/2;let g="";
 glyphs.forEach((ch,i)=>{const a=(i/glyphs.length)*360;
  g+=`<text x="${c}" y="${(c-rr).toFixed(1)}" font-size="${fs}" text-anchor="middle"
     dominant-baseline="central" transform="rotate(${a.toFixed(1)} ${c} ${c})"
     fill="currentColor" opacity=".9">${ch}</text>`;});
 for(let i=0;i<ticks;i++){const a=(i/ticks)*360,lg=i%5===0;
  g+=`<rect x="${(c-.6).toFixed(1)}" y="${(c-rr+fs*.85).toFixed(1)}" width="1.2"
     height="${lg?11:5}" fill="currentColor" opacity="${lg?.75:.4}"
     transform="rotate(${a.toFixed(1)} ${c} ${c})"/>`;}
 return `<svg viewBox="0 0 ${sz} ${sz}" xmlns="http://www.w3.org/2000/svg">
   <circle cx="${c}" cy="${c}" r="${(rr+fs*.75).toFixed(1)}" fill="none" stroke="currentColor"
     stroke-width="1" opacity=".55"/>
   <circle cx="${c}" cy="${c}" r="${(rr-fs*.85).toFixed(1)}" fill="none" stroke="currentColor"
     stroke-width=".8" opacity=".38"/>${g}</svg>`;}

/* 중심에서 뻗는 얇은 직선 광선 */
function eqxRay(cx,cy,ang,len,wid){
 const a=ang*Math.PI/180,p=a+Math.PI/2;
 const tx=cx+Math.cos(a)*len,ty=cy+Math.sin(a)*len;
 const b1x=cx+Math.cos(p)*wid,b1y=cy+Math.sin(p)*wid;
 const b2x=cx-Math.cos(p)*wid,b2y=cy-Math.sin(p)*wid;
 return `M${b1x.toFixed(1)} ${b1y.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)} `+
        `L${b2x.toFixed(1)} ${b2y.toFixed(1)} Z`;}

function starPath(pts,oR,iR,cx,cy){
 let d="";for(let i=0;i<pts*2;i++){const r=i%2?iR:oR,a=(Math.PI/pts)*i-Math.PI/2;
  d+=(i?"L":"M")+(cx+Math.cos(a)*r).toFixed(1)+" "+(cy+Math.sin(a)*r).toFixed(1)+" ";}
 return d+"Z";}

/* ═════════ 검의 기호 (sigil) ═════════
   컷신 마지막에 심장박동처럼 두 번 쿵쿵 떠오른 뒤, 세 번째 박동에 검이 강림한다.
   각 검의 이름·특징을 한 글자(주로 한자/기하 기호)로 압축했다. */
const SIG={
 "여명의 서약":"曙","심연의 포식자":"淵","뇌신 무라쿠모":"雷","파멸의 왕관검":"王",
 "재의 불사자":"灰","천년의 맹세":"誓","시간을 거스르는 날":"逆",
 "세계수의 가지":"樹","종언의 나팔검":"終","별을 가르는 자":"星",
 "공허의 이빨":"空","법칙의 조각":"律","무형의 칼":"虛",
 "천구의 축":"樞","뇌정의 심판":"霆",
 "만상의 눈":"眼","창세의 첫 획":"一",
 "EQUINOX":"◐","적요 寂寥":"寂","태동 胎動":"胎","관측자 觀測者":"觀",
 "O P P R E S S I O N":"壓","회귀 回歸":"回","심판 審判":"審","천기 天機":"機",
 "무한의 나선":"螺","경계 밖의 관측":"界","무극 無極":"極",
 "혼돈의 이빨":"牙","뒤틀린 인과":"因","혼돈 混沌":"混",
 "영겁의 파수꾼":"守","시간의 종착":"時","영겁 永劫":"永",
 "T I M E  D E S T R O Y E R":"滅"};
/* 지정 기호가 없으면 대표 효과로 대체 */
const SIG_FX={luck:"運",gold:"富",speed:"迅",pity:"保",dupe:"重",pdur:"藥",gem:"寶",ench:"錬",twin:"雙",rer:"再"};
function sigFor(s){
 if(SIG[s.n])return SIG[s.n];
 const fx=s.fx||{};for(const k of ["luck","gem","ench","dupe","gold","speed","pity","pdur","twin","rer"])if(fx[k])return SIG_FX[k];
 return "◈";}

function preludeHTML(s,R){
 const pd=s.pd||R.pd;
 if(R.mode==="bloom"){
  const bd=(pd-2.3).toFixed(2)+"s";
  let beams="";for(let i=0;i<7;i++)beams+=`<i class="beam" style="--ba:${i*25.7}deg"></i>`;
  return `<div class="pl pl-bloom" style="--bd:${bd}">
    <div class="dim"></div><i class="halo"></i>${R.id==="immortal"?'<i class="halo" style="animation-delay:calc(var(--bd) + .95s)"></i>':""}
    ${beams}<i class="seed"></i><i class="bloom"></i></div>`;}
 if(R.mode==="star4"||R.mode==="star8"){
  const pts=R.mode==="star4"?4:8;
  const sdur=(pd-.35).toFixed(2)+"s";
  const p1=starPath(pts,300,pts===4?16:26,300,300);
  const p2=starPath(pts,300,pts===4?10:18,300,300);
  let grains="";
  for(let i=0;i<26;i++){const a=Math.random()*6.283,d=180+Math.random()*300;
   grains+=`<i class="grain" style="--gx:${(Math.cos(a)*d).toFixed(0)}px;--gy:${(Math.sin(a)*d).toFixed(0)}px;
     --gd:${(1.2+Math.random()*1.4).toFixed(2)}s;--gl:${(Math.random()*2).toFixed(2)}s"></i>`;}
  return `<div class="pl pl-star" style="--sdur:${sdur}"><div class="pool"></div>${grains}
    ${pts===8?`<svg class="back" viewBox="0 0 600 600"><path d="${p2}" fill="var(--acc)" opacity=".5"/></svg>`:""}
    <svg viewBox="0 0 600 600">
      <defs><radialGradient id="sg"><stop offset="0%" stop-color="#fff"/><stop offset="55%" stop-color="var(--acc)"/>
      <stop offset="100%" stop-color="var(--acc)" stop-opacity=".35"/></radialGradient></defs>
      <path d="${p1}" fill="url(#sg)"/></svg></div>`;}
 return themeHTML(s,R);}

function themeHTML(s,R){
 const pd=s.pd||R.pd;
 switch(s.th){
 case "orrery":{
  let sky="";for(let i=0;i<90;i++)sky+=`<i style="left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*100).toFixed(1)}%;--td:${(Math.random()*1.4).toFixed(2)}s"></i>`;
  let rings="";const sizes=[210,320,430,540,650];
  sizes.forEach((w,i)=>{rings+=`<i class="ring" style="width:${w}px;height:${w}px;--ox:${58+i*6}deg;--os:${9+i*4}s;--od:${(.4+i*.22).toFixed(2)}s;transform:rotateX(${58+i*6}deg)"></i>`;});
  return `<div class="pl"><div class="th th-orrery"><div class="sky">${sky}</div>${rings}<i class="core"></i></div></div>`;}
 case "storm":{
  let bolts="";
  for(let b=0;b<7;b++){
   let d="M"+(20+Math.random()*60)+" 0";let x=20+Math.random()*60,y=0;
   while(y<48){y+=6+Math.random()*7;x+=(Math.random()-.5)*16;d+=" L"+x.toFixed(1)+" "+y.toFixed(1);}
   bolts+=`<path d="${d}" style="--bl:${(.6+b*.42).toFixed(2)}s"/>`;}
  let zaps="";for(let i=0;i<5;i++)zaps+=`<i class="zap" style="--zl:${(.75+i*.6).toFixed(2)}s"></i>`;
  let big="M50 0";let y=0,x=50;while(y<50){y+=4+Math.random()*4;x+=(Math.random()-.5)*9;big+=" L"+x.toFixed(1)+" "+y.toFixed(1);}
  return `<div class="pl"><div class="th th-storm"><div class="cloud"></div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">${bolts}
    <path d="${big}" style="--bl:${(pd-1.2).toFixed(2)}s;stroke-width:5"/></svg>${zaps}
    <i class="zap" style="--zl:${(pd-1.1).toFixed(2)}s;animation-duration:.7s"></i></div></div>`;}
 case "eye":{
  const M=EYE_M,P=eyeP;
  // ── 단계별 키프레임을 타이밍 상수에서 생성한다 ──
  const css=`
  @keyframes eyeGlim{0%{opacity:0;transform:scale(.35)}
    9%{opacity:.28}${P(M.open)}%{opacity:.62;transform:scale(1)}
    ${P(M.open+.55)}%{opacity:0;transform:scale(1.4)}100%{opacity:0}}
  @keyframes eyeMote{0%{opacity:0;transform:translate(var(--mx),var(--my)) scale(.55)}
    7%{opacity:.45}
    ${P(M.gaze)}%{opacity:.72;transform:translate(var(--mx2),var(--my2)) scale(1)}
    ${P(M.blink)}%{opacity:.72;transform:translate(var(--mx2),var(--my2)) scale(1)}
    ${P(M.shut)}%{opacity:1;transform:translate(0,0) scale(.12)}
    ${P(M.freeze)}%{opacity:0;transform:translate(0,0) scale(0)}100%{opacity:0}}
  @keyframes eyeTense{0%,${P(M.gaze)}%{opacity:0}
    ${P(M.gaze+.18)}%{opacity:.5}${P(M.blink)}%{opacity:.5}
    ${P(M.shut)}%{opacity:0}100%{opacity:0}}
  @keyframes eyeLid{
    0%,${P(M.open)}%{clip-path:ellipse(50% .5% at 50% 50%);
      animation-timing-function:cubic-bezier(.22,.6,.2,1)}
    ${P(M.gaze)}%{clip-path:ellipse(50% 31% at 50% 50%)}
    ${P(M.blink)}%{clip-path:ellipse(50% 31% at 50% 50%);
      animation-timing-function:cubic-bezier(.62,0,.24,1)}
    ${P(M.shut)}%,${P(M.freeze)}%{clip-path:ellipse(50% 0% at 50% 50%);
      animation-timing-function:cubic-bezier(.1,.8,.25,1)}
    ${P(M.reopen)}%,100%{clip-path:ellipse(50% 34% at 50% 50%)}}
  @keyframes eyeSac{0%,${P(M.gaze)}%{transform:translate(0,0)}
    ${P(M.gaze+.16)}%,${P(M.gaze+.30)}%{transform:translate(-.85%,.28%)}
    ${P(M.gaze+.44)}%,${P(M.blink)}%{transform:translate(.62%,-.2%)}
    100%{transform:translate(0,0)}}
  @keyframes eyeIris{0%,${P(M.open)}%{opacity:0;filter:brightness(.5)}
    ${P(M.open+(M.gaze-M.open)*.45)}%{opacity:.55}
    ${P(M.gaze)}%{opacity:1;filter:brightness(1)}
    ${P(M.reopen-.06)}%{filter:brightness(1)}
    ${P(M.reopen)}%{filter:brightness(2.6)}
    ${P(M.reopen+.22)}%{filter:brightness(1.15)}100%{opacity:1;filter:brightness(1)}}
  @keyframes eyePupil{0%,${P(M.open)}%{transform:scale(1)}
    ${P(M.gaze)}%{transform:scale(.84)}
    ${P(M.blink)}%{transform:scale(.74)}
    ${P(M.shut)}%,${P(M.freeze)}%{transform:scale(.1)}
    ${P(M.reopen)}%{transform:scale(1.18)}100%{transform:scale(.96)}}
  @keyframes eyePoint{0%,${P(M.shut-.06)}%{opacity:0;transform:scale(0)}
    ${P(M.shut)}%{opacity:1;transform:scale(1)}
    ${P(M.freeze)}%{opacity:1;transform:scale(.82)}
    ${P(M.reopen)}%{opacity:.9;transform:scale(7)}
    ${P(M.reopen+.2)}%,100%{opacity:0;transform:scale(11)}}
  @keyframes eyeCosmos{0%,${P(M.freeze)}%{opacity:0;transform:scale(.05)}
    ${P(M.reopen)}%{opacity:1;transform:scale(1)}
    ${P(M.reopen+.22)}%{opacity:.5;transform:scale(1.55)}
    100%{opacity:0;transform:scale(2.5)}}
  @keyframes eyeRim{0%{opacity:0}
    ${P(M.open+.12)}%{opacity:.3}
    ${P(M.gaze)}%{opacity:.92}${P(M.blink)}%{opacity:.92}
    ${P(M.shut)}%{opacity:.5}${P(M.freeze)}%{opacity:.38}
    ${P(M.reopen)}%{opacity:1}100%{opacity:.9}}
  @keyframes eyeLash{0%,${P(M.open+.2)}%{opacity:0}
    ${P(M.gaze)}%{opacity:.5}${P(M.blink)}%{opacity:.5}
    ${P(M.shut)}%{opacity:0}100%{opacity:0}}`;

  // 속눈썹 — 기존 디자인 유지
  let lash="";
  for(let i=0;i<14;i++)lash+=`<i class="lash" style="transform:rotate(${(i*25.7).toFixed(1)}deg) translateY(-2vmin)"></i>`;
  // 아주 적은 수의 느린 입자
  let mo="";
  for(let i=0;i<16;i++){
   const a=Math.random()*6.283,r=110+Math.random()*230,r2=r*(1.1+Math.random()*.18);
   mo+=`<i class="mo" style="--mx:${(Math.cos(a)*r).toFixed(0)}px;--my:${(Math.sin(a)*r).toFixed(0)}px;
     --mx2:${(Math.cos(a+.16)*r2).toFixed(0)}px;--my2:${(Math.sin(a+.16)*r2).toFixed(0)}px"></i>`;}
  // 홍채 속 은하 — 별점과 옅은 소용돌이를 배경 한 장으로
  const gs=[];
  for(let i=0;i<70;i++)gs.push(`radial-gradient(circle ${(.6+Math.random()*1.5).toFixed(1)}px at `+
   `${(Math.random()*100).toFixed(1)}% ${(Math.random()*100).toFixed(1)}%,`+
   `rgba(255,252,235,${(.35+Math.random()*.55).toFixed(2)}) 0 60%,transparent 61%)`);
  gs.push("radial-gradient(60% 42% at 38% 44%,rgba(255,240,200,.16),transparent 70%)");
  gs.push("radial-gradient(52% 38% at 66% 60%,rgba(200,220,255,.13),transparent 72%)");
  // 기하 문양 — 실루엣을 해치지 않을 만큼만
  let geo="";
  for(let k=0;k<3;k++){
   const n=6+k*2,rr=46-k*13;let d="";
   for(let i=0;i<n;i++){const a=(i/n)*6.283-1.5708;
    d+=(i?"L":"M")+(50+Math.cos(a)*rr).toFixed(1)+" "+(50+Math.sin(a)*rr).toFixed(1)+" ";}
   geo+=`<path d="${d}Z" fill="none" stroke="currentColor" stroke-width=".5"/>`;}
  // 만상 — 펼쳐지는 세계들 (별점 + 성좌선)
  const cs2=[];
  for(let i=0;i<90;i++)cs2.push(`radial-gradient(circle ${(.5+Math.random()*1.7).toFixed(1)}px at `+
   `${(Math.random()*100).toFixed(1)}% ${(Math.random()*100).toFixed(1)}%,`+
   `rgba(255,255,255,${(.5+Math.random()*.5).toFixed(2)}) 0 60%,transparent 61%)`);
  let lines="";
  for(let k=0;k<7;k++){
   let d="",x=18+Math.random()*64,y=18+Math.random()*64;
   d="M"+x.toFixed(1)+" "+y.toFixed(1);
   for(let i=0;i<3;i++){x+=(Math.random()-.5)*30;y+=(Math.random()-.5)*30;
    d+=" L"+x.toFixed(1)+" "+y.toFixed(1);}
   lines+=`<path d="${d}" fill="none" stroke="#fff" stroke-width=".45" opacity=".5"/>`;}

  return `<div class="pl"><style>${css}</style>
   <div class="th th-eye" style="--epd:${EYE_PD}s;--esw:${EYE_T.swordRevealDuration}s">
    <i class="glim"></i>${mo}${lash}
    <i class="rim"></i>
    <div class="lid"><div class="ball">
      <div class="iris">
        <div class="spin"><div class="gal" style="background:${gs.join(",")}"></div></div>
        <div class="geo"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${geo}</svg></div>
        <div class="cosmos" style="background:${cs2.join(",")}">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:100%"
            xmlns="http://www.w3.org/2000/svg">${lines}</svg></div>
        <div class="pupil"></div>
      </div></div></div>
    <i class="pt"></i><div class="tense"></div><i class="halo2"></i>
   </div></div>`;}
 case "ink":{
  const M=INK_M,P=inkP,S=INK_S,Q=inkQuad,sp=Q.split(S.seedT);
  const seedPt=sp.fwd[0];
  const fwdEnd=M.stroke+INK_T.firstStrokeDuration*S.fwd;      // 앞으로 긋기가 끝나는 시각
  const bwdEnd=M.strokeEnd;                                   // 되짚기가 끝나는 시각
  // 붓끝이 획을 따라 달린다 — 경로를 표본화해 키프레임으로 만든다
  const N=18,bk=[];
  for(let i=0;i<=N;i++){const t=S.seedT+(1-S.seedT)*(i/N),pt=Q.at(t);
   bk.push({p:P(M.stroke+(fwdEnd-M.stroke)*(i/N)),x:pt[0],y:pt[1]});}
  // 획 위에서 태어나는 것들 — 지나간 자리에서 순서대로 생겨난다
  let born="";
  for(let i=0;i<46;i++){
   const t=Math.random(),pt=Q.at(t);
   const nx=(Math.random()-.5)*11,ny=(Math.random()-.5)*11;   // 획 주변으로 살짝 흩어진다
   const kind=["dot","dot","dot","bar","ring","poly"][i%6];
   const sz=kind==="dot"?(1.4+Math.random()*2.6):kind==="bar"?(14+Math.random()*36):
            kind==="ring"?(10+Math.random()*30):(9+Math.random()*16);
   // 획이 지나간 시각에 맞춰 태어난다
   const passT=t>=S.seedT? M.stroke+(fwdEnd-M.stroke)*((t-S.seedT)/(1-S.seedT))
                         : M.stroke+(bwdEnd-M.stroke)*((S.seedT-t)/S.seedT);
   const delay=(passT+0.1+Math.random()*(INK_T.creationDuration*0.8)).toFixed(2);
   let inner="";
   if(kind==="poly"){const n=3+(i%4);let d="";
    for(let k=0;k<n;k++){const a=(k/n)*6.283-1.5708;
     d+=(k?"L":"M")+(50+Math.cos(a)*42).toFixed(1)+" "+(50+Math.sin(a)*42).toFixed(1)+" ";}
    inner=`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="${d}Z"
      fill="none" stroke="currentColor" stroke-width="4" opacity=".8"/></svg>`;}
   born+=`<i class="born ${kind}" style="left:${(pt[0]+nx).toFixed(1)}%;top:${(pt[1]+ny).toFixed(1)}%;
     --bs:${sz.toFixed(1)}${kind==="bar"||kind==="ring"||kind==="poly"?"px":"px"};
     --br:${(Math.random()*360).toFixed(0)}deg;--bl:${delay}s">${inner}</i>`;}
  // 창세의 순간 — 성좌선·궤도·천체
  let gs="";
  for(let k=0;k<9;k++){let x=14+Math.random()*72,y=14+Math.random()*72,d=`M${x.toFixed(1)} ${y.toFixed(1)}`;
   for(let i=0;i<3;i++){x+=(Math.random()-.5)*26;y+=(Math.random()-.5)*26;
    d+=` L${x.toFixed(1)} ${y.toFixed(1)}`;}
   gs+=`<path d="${d}" stroke-width=".7" opacity=".55"/>`;}
  for(let k=0;k<5;k++)gs+=`<ellipse cx="50" cy="50" rx="${(16+k*11)}" ry="${(6+k*7)}"
    stroke-width=".55" opacity=".4" transform="rotate(${(k*37).toFixed(0)} 50 50)"/>`;
  let gd="";
  for(let k=0;k<34;k++)gd+=`<circle cx="${(Math.random()*100).toFixed(1)}" cy="${(Math.random()*100).toFixed(1)}"
    r="${(.25+Math.random()*.7).toFixed(2)}" fill="var(--acc)" opacity="${(.4+Math.random()*.5).toFixed(2)}"/>`;

  const css=`
  @keyframes inkSeed{0%,${P(M.seed)}%{opacity:0;transform:translate(-50%,-50%) scale(.2)}
    ${P(M.seed+.22)}%{opacity:.85;transform:translate(-50%,-50%) scale(1)}
    ${P(M.stroke)}%{opacity:1;transform:translate(-50%,-50%) scale(1.25)}
    ${P(M.stroke+.3)}%{opacity:0;transform:translate(-50%,-50%) scale(.6)}100%{opacity:0}}
  @keyframes inkFwd{0%,${P(M.stroke)}%{stroke-dashoffset:1000}
    ${P(fwdEnd)}%,100%{stroke-dashoffset:0}}
  @keyframes inkBwd{0%,${P(M.stroke+.08)}%{stroke-dashoffset:1000}
    ${P(bwdEnd)}%,100%{stroke-dashoffset:0}}
  @keyframes inkFade{0%,${P(M.genesis)}%{opacity:1}
    ${P(M.genesisPeak)}%{opacity:1}
    ${P(INK_PD)}%,100%{opacity:0}}
  @keyframes inkBrush{0%,${P(M.stroke)}%{opacity:0;left:${seedPt[0].toFixed(1)}%;top:${seedPt[1].toFixed(1)}%}
    ${P(M.stroke+.06)}%{opacity:1}
    ${bk.map(k=>`${k.p}%{left:${k.x.toFixed(1)}%;top:${k.y.toFixed(1)}%}`).join("")}
    ${P(fwdEnd+.18)}%{opacity:0}100%{opacity:0}}
  @keyframes inkGen{0%,${P(M.genesis)}%{opacity:0;transform:scale(.86)}
    ${P(M.genesisPeak)}%{opacity:1;transform:scale(1)}
    ${P(M.genesisPeak+.26)}%{opacity:.45;transform:scale(1.12)}
    ${P(INK_PD)}%,100%{opacity:0;transform:scale(1.22)}}
  @keyframes inkGlow{0%,${P(M.genesis)}%{opacity:0}
    ${P(M.genesisPeak)}%{opacity:.7}
    ${P(INK_PD)}%,100%{opacity:0}}`;

  return `<div class="pl"><style>${css}</style>
   <div class="th th-ink" style="--ipd:${INK_PD}s;--ipdv:${INK_PD}s;--isw:${INK_T.swordFormDuration}s;--iglow:${S.glow}px">
    <i class="seed" style="left:${seedPt[0].toFixed(1)}%;top:${seedPt[1].toFixed(1)}%"></i>
    <div class="stk" style="animation:inkFade ${INK_PD}s linear forwards">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path class="aura" pathLength="1000" d="${Q.d(sp.fwd)}" stroke-width="${(S.width*3.4).toFixed(1)}"
          style="animation:inkFwd ${INK_PD}s cubic-bezier(.3,.1,.2,1) forwards"/>
        <path class="aura" pathLength="1000" d="${Q.d(sp.back)}" stroke-width="${(S.tail*3.4).toFixed(1)}"
          style="animation:inkBwd ${INK_PD}s cubic-bezier(.25,.2,.2,1) forwards"/>
        <path class="core" pathLength="1000" d="${Q.d(sp.fwd)}" stroke-width="${S.width}"
          style="animation:inkFwd ${INK_PD}s cubic-bezier(.3,.1,.2,1) forwards"/>
        <path class="core" pathLength="1000" d="${Q.d(sp.back)}" stroke-width="${S.tail}"
          style="animation:inkBwd ${INK_PD}s cubic-bezier(.25,.2,.2,1) forwards"/>
      </svg>
      <i class="brush"></i>
    </div>
    ${born}
    <div class="genglow"></div>
    <div class="gen"><svg viewBox="0 0 100 100" preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg">${gs}${gd}</svg></div>
    <i class="ctr"></i><i class="trace"></i><i class="halo3"></i>
   </div></div>`;}
 case "hush":{                                   // 적요 — 소리가 삼켜지는 세계
  const D=6.4,K=t=>+(t/D*100).toFixed(2);
  let rp="";for(let i=0,N=QC(5);i<N;i++)rp+=`<i class="rp" style="--rl:${(0.9+i*0.62).toFixed(2)}s"></i>`;
  let fz="";for(let i=0,N=QC(34);i<N;i++){const a=Math.random()*6.283,r=90+Math.random()*300;
   fz+=`<i class="fz" style="--mx:${(Math.cos(a)*r).toFixed(0)}px;--my:${(Math.sin(a)*r).toFixed(0)}px;
     --mx2:${(Math.cos(a+.1)*r*1.14).toFixed(0)}px;--my2:${(Math.sin(a+.1)*r*1.14).toFixed(0)}px"></i>`;}
  const css=`
  @keyframes hushFz{0%{opacity:0;transform:translate(var(--mx),var(--my)) scale(.5)}
    9%{opacity:.7}${K(3.6)}%{opacity:.7;transform:translate(var(--mx2),var(--my2)) scale(1)}
    ${K(4.6)}%{opacity:.7;transform:translate(var(--mx2),var(--my2)) scale(1)}
    ${K(6.05)}%{opacity:1;transform:translate(0,0) scale(.14)}
    100%{opacity:0;transform:translate(0,0) scale(0)}}
  @keyframes hushCore{0%,${K(4.4)}%{opacity:0;transform:scale(0)}
    ${K(4.9)}%{opacity:.8;transform:scale(1)}
    ${K(6.05)}%{opacity:1;transform:scale(1.7)}100%{opacity:1;transform:scale(.7)}}
  @keyframes hushVg{0%,${K(2.6)}%{opacity:0}${K(4.0)}%{opacity:.5}
    ${K(5.4)}%{opacity:.8}100%{opacity:.15}}`;
  return `<div class="pl"><style>${css}</style>
   <div class="th th-hush" style="--hpd:${D}s">${rp}${fz}<i class="core"></i><div class="vg"></div></div><div class="csay" data-t="너는 아무 소리도 내지 않았다" data-d="0.7" style="top:30%;--sd:0.7s;--sl:2.5s"></div><div class="csay" data-t="그런데도 세계가 너를 들었다" data-d="3.0" style="top:64%;--sd:3.0s;--sl:2.6s"></div></div>`;}

 case "breath":{                                 // 태동 — 세계가 여섯 번 숨을 쉰다
  const D=6.4,K=t=>+(t/D*100).toFixed(2),BR=[0.7,1.45,2.2,2.95,3.7,4.5];
  let wv="";BR.forEach((t,i)=>{if(i<QC(6))wv+=`<i class="wv" style="--wl:${t}s"></i>`;});
  let ds="";for(let i=0,N=QC(30);i<N;i++){const a=Math.random()*6.283,r=60+Math.random()*80;
   ds+=`<i class="ds" style="left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*100).toFixed(1)}%;
     --dx:${(Math.cos(a)*r*.2).toFixed(0)}px;--dy:${(Math.sin(a)*r*.2).toFixed(0)}px;
     --dd:${(1.4+Math.random()*1.2).toFixed(2)}s;--dl:${(Math.random()*1.4).toFixed(2)}s"></i>`;}
  let lk="0%{opacity:0;transform:scale(.5)}";
  BR.forEach((t,i)=>{const g=.18+i*.12;
   lk+=`${K(t-.16)}%{opacity:${(g*.3).toFixed(2)};transform:scale(${(.72+i*.05).toFixed(2)})}`;
   lk+=`${K(t)}%{opacity:${g.toFixed(2)};transform:scale(${(1+i*.09).toFixed(2)})}`;});
  lk+=`${K(5.5)}%{opacity:.5;transform:scale(1.6)}${K(6.4)}%{opacity:1;transform:scale(3.4)}`;
  return `<div class="pl"><style>@keyframes brLung{${lk}}</style>
   <div class="th th-breath" style="--bpd:${D}s"><i class="lung"></i>${wv}${ds}</div><div class="csay" data-t="아직 아무것도 태어나지 않았다" data-d="0.8" style="top:28%;--sd:0.8s;--sl:2.4s"></div><div class="csay" data-t="네가 여기 있다는 것만 빼고" data-d="3.2" style="top:66%;--sd:3.2s;--sl:2.6s"></div></div>`;}

 case "grid":{                                   // 관측자 — 눈금이 그어지자 세계가 확정된다
  const D=6.4,K=t=>+(t/D*100).toFixed(2);
  let g="";const NL=QC(7);
  for(let i=0;i<NL;i++){const y=(100/(NL+1))*(i+1);
   g+=`<line class="g1" x1="0" y1="${y.toFixed(1)}" x2="100" y2="${y.toFixed(1)}"
     style="--gl:${(0.5+i*0.13).toFixed(2)}s" stroke-width=".55" opacity=".5"/>`;}
  for(let i=0;i<NL;i++){const x=(100/(NL+1))*(i+1);
   g+=`<line class="g1" x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="100"
     style="--gl:${(1.4+i*0.13).toFixed(2)}s" stroke-width=".55" opacity=".5"/>`;}
  g+=`<line class="g1" x1="0" y1="50" x2="100" y2="50" style="--gl:2.7s" stroke-width="1.5"/>
      <line class="g1" x1="50" y1="0" x2="50" y2="100" style="--gl:2.9s" stroke-width="1.5"/>
      <circle class="g1" cx="50" cy="50" r="22" style="--gl:3.3s" stroke-width=".9" opacity=".7"/>
      <circle class="g1" cx="50" cy="50" r="36" style="--gl:3.5s" stroke-width=".6" opacity=".45"/>`;
  const css=`
  @keyframes gdPlot{0%,${K(3.9)}%{opacity:0;transform:rotate(45deg) scale(0)}
    ${K(4.25)}%{opacity:1;transform:rotate(45deg) scale(1.6)}
    ${K(4.6)}%{opacity:1;transform:rotate(45deg) scale(1)}
    ${K(5.5)}%{opacity:1;transform:rotate(225deg) scale(1)}
    100%{opacity:1;transform:rotate(225deg) scale(2.2)}}
  @keyframes gdSnap{0%,${K(5.42)}%{opacity:0}${K(5.5)}%{opacity:.5}
    ${K(5.9)}%{opacity:0}${K(6.4)}%{opacity:0}}`;
  return `<div class="pl"><style>${css}</style>
   <div class="th th-grid" style="--gpd:${D}s">
     <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${g}</svg>
     <i class="plot"></i><div class="snap"></div><div class="csay" data-t="재기 전까지 너는 어디에도 없었다" data-d="0.9" style="top:26%;--sd:0.9s;--sl:2.4s"></div><div class="csay" data-t="이제 눈금 위에 올라섰다" data-d="3.4" style="top:68%;--sd:3.4s;--sl:2.4s"></div></div></div>`;}

 case "oppress":{                                // 억압 — 마법진, 두 번의 고동, 두 번의 관통
  const D=10.2,K=t=>+(t/D*100).toFixed(2);
  const BEAT=[2.7,3.5];                          // 온전할 때 두 번 두근거린다
  const CH=[{t:4.30,a:32,imp:4.78},              // 왼쪽 위 → 오른쪽 아래
            {t:6.40,a:146,imp:6.88}];            // 오른쪽 위 → 왼쪽 아래 (진행방향 반전 보정: -34+180)
  const CB=[7.55,8.35];                          // 관통된 뒤, 금이 간 채로 두 번 더 — 점점 커진다
  const GROW=[1.10,1.38];                        // 두근거린 뒤 남는 크기
  const PEAK=[1.22,1.54];                        // 두근거릴 때의 정점
  const SHT=9.05;                                // 산산조각
  /* 마법진 — 눈금 고리, 룬 고리, 팔각성, 안쪽 고리, 방사살 */
  /* 문양 12개 — 폰트에 없으면 두부로 깨지는 문자 대신 직접 그린 도형을 쓴다.
     12x12 로컬 좌표계에 그리고 반지름 38 자리에 배치한다 (팔각성 31과 분리) */
  const RUNE_D=[
   "M2 2 L10 10 M10 2 L2 10 M6 1 L6 11",
   "M6 1 L6 11 M2 4 L10 4 M3 8 L9 8",
   "M2 3 L10 3 L6 11 Z",
   "M2 6 A4 4 0 0 1 10 6 M6 6 L6 11 M3 11 L9 11",
   "M2 2 L10 2 L10 10 L2 10 Z M6 2 L6 10",
   "M6 1 L11 6 L6 11 L1 6 Z M6 4 L6 8",
   "M2 2 L10 6 L2 10 M10 6 L5 6",
   "M1 6 L11 6 M4 3 L4 9 M8 3 L8 9",
   "M2 10 L6 2 L10 10 M3.6 7 L8.4 7",
   "M2 2 L10 10 M2 10 L10 2 M1 6 L11 6",
   "M3 2 L9 2 M6 2 L6 10 M3 10 L9 10",
   "M6 2 A4 4 0 1 0 6 10 A4 4 0 1 0 6 2 M6 4.4 L6 7.6"];
  let ticks="";for(let i=0;i<48;i++){const a=(i/48)*360,lg=i%4===0;
   ticks+=`<line x1="50" y1="${lg?3.5:5}" x2="50" y2="8" stroke-width="${lg?1.1:.6}"
     opacity="${lg?.8:.45}" transform="rotate(${a.toFixed(1)} 50 50)" style="--dl2:${(0.58+i*.0045).toFixed(3)}s"/>`;}
  let runes="";RUNE_D.forEach((d,i)=>{
   const an=(i/12)*2*Math.PI-Math.PI/2, R=38;
   const x=50+Math.cos(an)*R, y=50+Math.sin(an)*R;
   runes+=`<g class="rn" transform="translate(${(x-6).toFixed(2)} ${(y-6).toFixed(2)})"
     style="--dl2:${(1.15+i*.03).toFixed(2)}s"><path d="${d}" stroke-width=".85"
     stroke-linecap="round" stroke-linejoin="round" opacity=".8"/></g>`;});
  const oct=(r,rot)=>{let d="";for(let i=0;i<8;i++){const an=(i*3/8)*6.283+rot;
    d+=(i?"L":"M")+(50+Math.cos(an)*r).toFixed(2)+" "+(50+Math.sin(an)*r).toFixed(2)+" ";}return d+"Z";};
  let spokes="";for(let i=0;i<16;i++){const a=(i/16)*360;
   spokes+=`<line x1="50" y1="26" x2="50" y2="31" stroke-width=".7" opacity=".5"
     transform="rotate(${a.toFixed(1)} 50 50)" style="--dl2:${(1.15+i*.012).toFixed(3)}s"/>`;}
  // 외곽 잔눈금 (한 겹 더 — 더 촘촘하고 얕은 링)
  let outer="";for(let i=0;i<32;i++){const a=(i/32)*360;
   outer+=`<line x1="50" y1="1.4" x2="50" y2="3.4" stroke-width=".45" opacity=".3"
     transform="rotate(${a.toFixed(1)} 50 50)" style="--dl2:${(0.30+i*.006).toFixed(3)}s"/>`;}
  // 회로 레이어 — 12개 지점을 다섯 칸씩 건너 이어 별모양 회로를 그리고, 마디마다 점멸하는 매듭을 심는다
  let web="",nodes="";
  for(let i=0;i<12;i++){
   const a1=(i/12)*2*Math.PI,a2=((i+5)%12/12)*2*Math.PI;
   const x1=50+Math.cos(a1)*25.5,y1=50+Math.sin(a1)*25.5;
   const x2=50+Math.cos(a2)*25.5,y2=50+Math.sin(a2)*25.5;
   web+=`<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"
     stroke-width=".38" opacity=".3" style="--dl2:${(1.35+i*.022).toFixed(3)}s"/>`;
   nodes+=`<circle cx="${x1.toFixed(2)}" cy="${y1.toFixed(2)}" r="1.1" fill="currentColor" opacity="0">
     <animate attributeName="opacity" values="0;.85;.35;.85;.35" dur="2.6s"
       begin="${(1.70+i*.022).toFixed(2)}s" fill="freeze"/></circle>`;}
  // 배경 — 2번째 성운, 별밭, 방사형 균열
  const sd3=(Math.random()*9000|0);
  const os=[];for(let i=0,N=QC(52);i<N;i++)os.push(`radial-gradient(circle ${(.5+Math.random()*1.3).toFixed(1)}px at
    ${(Math.random()*100).toFixed(1)}% ${(Math.random()*100).toFixed(1)}%,rgba(255,255,255,${(.32+Math.random()*.48).toFixed(2)}) 0 60%,transparent 61%)`.replace(/\s+/g," "));
  let vcrk="";for(let i=0,N=QC(10);i<N;i++)vcrk+=`<i class="vcrk" style="transform:rotate(${(Math.random()*360).toFixed(0)}deg);
    height:${(18+Math.random()*28).toFixed(0)}vmin"></i>`;
  /* 사슬 — 세로·가로 고리가 맞물린 타일을 가로로 반복한다 */
  const acc=s.acc||RARITY[s.t].c;
  const link=(c)=>"data:image/svg+xml,"+encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">`+
    `<g fill="none" stroke="${c}" stroke-width="3.4" stroke-linejoin="round">`+
    `<ellipse cx="7.5" cy="15" rx="6.4" ry="11.2"/><ellipse cx="22.5" cy="15" rx="11.2" ry="6.4"/>`+
    `</g><g fill="none" stroke="%23ffffff" stroke-width="1.1" opacity="0.55">`+
    `<ellipse cx="7.5" cy="15" rx="6.4" ry="11.2"/><ellipse cx="22.5" cy="15" rx="11.2" ry="6.4"/></g></svg>`);
  let chn="",spk="",prc="",cmt="";
  CH.forEach((c,ci)=>{
   chn+=`<i class="chn" style="--ca:${c.a}deg;--cl:${c.t}s;--cdur:.62s;
     background-image:url('${link(acc)}')"></i>`;
   prc+=`<i class="pierce" style="--pl:${c.imp}s"></i>`;
   // 어느 방향에서 날아드는지 분명히 보여주는 관통 혜성 — 사슬 도착보다 살짝 앞서 시작한다
   cmt+=`<i class="comet" style="--ca:${c.a}deg;--cr:92vmax;
     --ccl:${(c.t-.06).toFixed(2)}s;--ccd:${(c.imp-c.t+.18).toFixed(2)}s"></i>`;
   for(let i=0,N=QC(14);i<N;i++){const ang=c.a+90+(Math.random()*160-80);
    spk+=`<i class="spk" style="--sa2:${ang.toFixed(0)}deg;--kl2:${(14+Math.random()*30).toFixed(0)}px;
      --sd2:${(60+Math.random()*130).toFixed(0)}px;--sl2:${(c.imp+Math.random()*.1).toFixed(2)}s"></i>`;}});
  let shd="";for(let i=0,N=QC(20);i<N;i++){const an=Math.random()*6.283,r=40+Math.random()*65;
   shd+=`<i class="shd" style="--sw:${(9+Math.random()*24).toFixed(0)}px;--sh:${(13+Math.random()*30).toFixed(0)}px;
     --sa:${(Math.random()*360).toFixed(0)}deg;--sx:${(Math.cos(an)*r).toFixed(0)}vmin;
     --sy:${(Math.sin(an)*r).toFixed(0)}vmin;--shl:${(SHT+Math.random()*.14).toFixed(2)}s"></i>`;}
  let dust="";for(let i=0,N=QC(20);i<N;i++)dust+=`<i class="dust" style="left:${(Math.random()*100).toFixed(1)}%;
    --md:${(8+Math.random()*6).toFixed(1)}s;--mdl:${(Math.random()*7).toFixed(1)}s"></i>`;
  const sd2=(Math.random()*9000|0);
  const css=`
  @keyframes oppCirc{0%,${K(0.9)}%{opacity:0;transform:scale(1.35)}
    ${K(2.4)}%{opacity:.85;transform:scale(1)}
    ${K(CH[0].imp)}%{opacity:.95;transform:scale(.99)}
    ${K(CH[1].imp)}%{opacity:1;transform:scale(.95)}
    ${K(SHT)}%{opacity:1;transform:scale(.9)}
    ${K(SHT+.5)}%{opacity:.4;transform:scale(1.5)}
    ${K(9.35)}%{opacity:0;transform:scale(2.4)}100%{opacity:0}}
  @keyframes oppCor{0%,${K(1.3)}%{opacity:0;transform:scale(.25)}
    ${K(1.9)}%{opacity:1;transform:scale(1)}
    ${K(SHT)}%{opacity:1;transform:scale(1)}
    ${K(SHT+.1)}%{opacity:1;transform:scale(1.22)}
    ${K(SHT+.28)}%{opacity:0;transform:scale(.18)}100%{opacity:0}}
  @keyframes oppCkA{0%,${K(CH[0].imp)}%{opacity:0}
    ${K(CH[0].imp+.08)}%{opacity:1}${K(SHT)}%{opacity:1}100%{opacity:0}}
  @keyframes oppCkB{0%,${K(CH[1].imp)}%{opacity:0}
    ${K(CH[1].imp+.08)}%{opacity:1}${K(SHT)}%{opacity:1}100%{opacity:0}}
  @keyframes oppPulse{0%,${K(BEAT[0]-.16)}%{transform:scale(1)}
    ${K(BEAT[0])}%{transform:scale(1.22)}${K(BEAT[0]+.14)}%{transform:scale(1.02)}
    ${K(BEAT[0]+.26)}%{transform:scale(1.13)}${K(BEAT[0]+.42)}%{transform:scale(1)}
    ${K(BEAT[1]-.02)}%{transform:scale(1)}
    ${K(BEAT[1])}%{transform:scale(1.26)}${K(BEAT[1]+.14)}%{transform:scale(1.03)}
    ${K(BEAT[1]+.26)}%{transform:scale(1.16)}${K(BEAT[1]+.44)}%{transform:scale(1)}
    ${K(CH[0].imp)}%{transform:scale(1)}${K(CH[0].imp+.1)}%{transform:scale(.88)}
    ${K(CH[0].imp+.4)}%{transform:scale(.98)}
    ${K(CH[1].imp)}%{transform:scale(.98)}${K(CH[1].imp+.1)}%{transform:scale(.8)}
    ${K(CH[1].imp+.4)}%{transform:scale(.94)}
    ${K(CB[0]-.02)}%{transform:scale(.94)}
    ${K(CB[0])}%{transform:scale(${PEAK[0]})}${K(CB[0]+.16)}%{transform:scale(${(GROW[0]-.06).toFixed(2)})}
    ${K(CB[0]+.3)}%{transform:scale(${(PEAK[0]-.06).toFixed(2)})}${K(CB[0]+.52)}%{transform:scale(${GROW[0]})}
    ${K(CB[1]-.02)}%{transform:scale(${GROW[0]})}
    ${K(CB[1])}%{transform:scale(${PEAK[1]})}${K(CB[1]+.18)}%{transform:scale(${(GROW[1]-.08).toFixed(2)})}
    ${K(CB[1]+.34)}%{transform:scale(${(PEAK[1]-.08).toFixed(2)})}${K(CB[1]+.58)}%{transform:scale(${GROW[1]})}
    ${K(SHT)}%{transform:scale(${GROW[1]})}100%{transform:scale(${GROW[1]})}}
  @keyframes oppHalo{0%,${K(BEAT[0]-.04)}%{opacity:0;transform:scale(.9)}
    ${K(BEAT[0]+.02)}%{opacity:.8;transform:scale(1)}
    ${K(BEAT[0]+.5)}%{opacity:0;transform:scale(2.4)}
    ${K(BEAT[1]-.02)}%{opacity:0;transform:scale(.9)}
    ${K(BEAT[1]+.02)}%{opacity:.85;transform:scale(1)}
    ${K(BEAT[1]+.52)}%{opacity:0;transform:scale(2.6)}
    ${K(CB[0]-.02)}%{opacity:0;transform:scale(.95)}
    ${K(CB[0]+.02)}%{opacity:.9;transform:scale(1.1)}
    ${K(CB[0]+.56)}%{opacity:0;transform:scale(3)}
    ${K(CB[1]-.02)}%{opacity:0;transform:scale(1)}
    ${K(CB[1]+.02)}%{opacity:1;transform:scale(1.3)}
    ${K(CB[1]+.62)}%{opacity:0;transform:scale(3.6)}100%{opacity:0}}
  @keyframes oppPress{0%,${K(2.4)}%{opacity:0}${K(CH[0].imp)}%{opacity:.34}
    ${K(CH[1].imp)}%{opacity:.56}${K(CB[0])}%{opacity:.68}${K(CB[1])}%{opacity:.82}
    ${K(SHT)}%{opacity:.88}${K(SHT+.25)}%{opacity:0}100%{opacity:0}}
  @keyframes oppInv{0%,${K(SHT-.02)}%{opacity:0}${K(SHT+.06)}%{opacity:.9}
    ${K(SHT+.34)}%{opacity:0}${K(9.3)}%{opacity:0}${K(9.4)}%{opacity:.55}
    ${K(9.75)}%{opacity:0}100%{opacity:0}}`;
  const SAY=[[1.55,3.2,"22%",'"The one who stood before God."'],
             [4.85,3.0,"22%",'"It stood proudly against the God."'],
             [9.15,3.6,"78%",'"Before the God\'s absolute power, It shattered into pieces."'],
             [12.9,3.8,"85%",'"...But is this truly the end?"']];
  /* HTML 속성 이스케이프. JSON.stringify 는 따옴표를 \" 로 바꿔 속성을 깨뜨린다 */
  const esc=v=>String(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;")
                        .replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const say=SAY.map(([t,du,top,tx])=>`<div class="csay" data-t="${esc(tx)}" data-d="${t}"
    style="top:${top};--sd:${t}s;--sl:${du}s"></div>`).join("");
  return `<div class="pl"><style>${css}</style>
   <div class="th th-opp" style="--opd:${D}s">
     <div class="smk"><svg viewBox="0 0 420 270" preserveAspectRatio="none"
       xmlns="http://www.w3.org/2000/svg"><filter id="os${sd2}">
       <feTurbulence type="fractalNoise" baseFrequency="0.009 0.014" numOctaves="5" seed="${sd2}"/>
       <feColorMatrix type="matrix" values="0 0 0 0 .52  0 0 0 0 .58  0 0 0 0 .66  0 0 0 .34 0"/>
       </filter><rect width="420" height="270" filter="url(#os${sd2})"/></svg></div>
     <div class="smk2"><svg viewBox="0 0 420 270" preserveAspectRatio="none"
       xmlns="http://www.w3.org/2000/svg"><filter id="os2${sd3}">
       <feTurbulence type="fractalNoise" baseFrequency="0.006 0.01" numOctaves="4" seed="${sd3}"/>
       <feColorMatrix type="matrix" values="0 0 0 0 .3  0 0 0 0 .22  0 0 0 0 .36  0 0 0 .3 0"/>
       </filter><rect width="420" height="270" filter="url(#os2${sd3})"/></svg></div>
     <div class="ostar" style="background:${os.join(",")}"></div>
     ${vcrk}
     <div class="rays"></div>${dust}
     <div class="circ">
       <div class="lay r1"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
         <circle cx="50" cy="50" r="47" stroke-width=".9" opacity=".7" style="--dl2:0.48s"/>
         <circle cx="50" cy="50" r="42" stroke-width=".5" opacity=".45" style="--dl2:0.56s"/>
         ${ticks}${outer}</svg></div>
       <div class="lay r2"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
         <circle cx="50" cy="50" r="34" stroke-width=".7" opacity=".55" style="--dl2:0.88s"/>
         <circle cx="50" cy="50" r="25" stroke-width=".5" opacity=".4" style="--dl2:0.96s"/>
         ${runes}</svg></div>
       <div class="lay r3"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
         <path d="${oct(31,-1.5708)}" stroke-width="1" opacity=".75" style="--dl2:1.02s"/>
         <path d="${oct(22,-1.1781)}" stroke-width=".7" opacity=".5" style="--dl2:1.12s"/>
         <circle cx="50" cy="50" r="15" stroke-width=".8" opacity=".6" style="--dl2:1.22s"/>
         ${spokes}</svg></div>
       <div class="lay r4"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
         <g opacity=".85">${web}${nodes}</g></svg></div>
     </div>
     <i class="halo4"></i>
     ${cmt}${chn}
     <div class="cor"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
       <g class="hb" transform-origin="50 50">
         <path d="M50 90 C21 67 5 51 5 33 C5 18 16 7 30 7 C39 7 46 12 50 19
                  C54 12 61 7 70 7 C84 7 95 18 95 33 C95 51 79 67 50 90 Z"
               fill="#fff" stroke="var(--acc)" stroke-width="1.6"/>
         <path d="M50 19 C46 12 39 7 30 7 C16 7 5 18 5 33 C5 51 21 67 50 90 Z"
               fill="var(--acc)" opacity=".18"/>
         <g class="ck a"><path d="M20 26 L36 40 L28 51 L44 63 L38 76"/>
           <path d="M36 40 L48 34"/></g>
         <g class="ck b"><path d="M80 28 L64 43 L73 55 L57 66 L62 79"/>
           <path d="M64 43 L52 38"/></g>
       </g></svg></div>
     ${prc}${spk}${shd}
     <div class="press"></div><div class="inv"></div>${say}
   </div></div>`;}

 case "recur":{                                  // 회귀 — 같은 순간이 되풀이된다
  const D=8.4,K=t=>+(t/D*100).toFixed(2);
  let fr="";for(let i=0,N=QC(9);i<N;i++)
   fr+=`<i class="fr" style="--fdur:${(3.4).toFixed(1)}s;--fl:${(i*0.38).toFixed(2)}s;--fr:${(i%2?2:-2)}deg"></i>`;
  let ec="";[2.0,3.4,4.8,6.2].forEach(t=>ec+=`<span class="echo" style="--el3:${t}s">回</span>`);
  const css=`@keyframes rcLock{0%,${K(7.3)}%{opacity:0}${K(7.45)}%{opacity:.85}
    ${K(7.9)}%{opacity:0}${K(8.1)}%{opacity:.4}100%{opacity:0}}`;
  return `<div class="pl"><style>${css}</style>
   <div class="th th-recur" style="--rpd:${D}s">${fr}${ec}<div class="lock"></div><div class="csay" data-t="너는 이 순간을 처음 보는 것이 아니다" data-d="0.9" style="top:22%;--sd:0.9s;--sl:2.6s"></div><div class="csay" data-t="몇 번째인지 세어 본 적 있는가" data-d="4.6" style="top:74%;--sd:4.6s;--sl:2.6s"></div></div></div>`;}

 case "scale":{                                 // 심판 — 빛과 어둠을 같은 저울에 올린다
  const D=8.4,K=t=>+(t/D*100).toFixed(2);
  /* [시각, 저울대 각도]. 진폭이 줄다가 마지막에 한쪽으로 확정된다 */
  const A=[[2.6,9],[3.5,-7],[4.4,5],[5.3,-3.5],[6.2,2],[6.9,-14],[7.4,-17]];
  const sin=d=>Math.sin(d*Math.PI/180).toFixed(4);
  let bm=`0%,${K(1.6)}%{opacity:0;transform:rotate(0)}${K(2.1)}%{opacity:1;transform:rotate(0)}`;
  A.forEach(([t,d])=>{bm+=`${K(t)}%{opacity:1;transform:rotate(${d}deg)}`;});
  bm+=`${K(7.9)}%{opacity:1;transform:rotate(-17deg)}100%{opacity:0;transform:rotate(-17deg)}`;
  /* 팔은 저울대 끝을 따라 내려가고 올라간다. 시계방향(양수)이면 왼팔이 올라간다 */
  const arm=side=>{
   const k=side==="l"?-1:1;
   let z=`0%,${K(1.8)}%{opacity:0;transform:translateY(calc(var(--L) * -0.34))}`;
   z+=`${K(2.3)}%{opacity:1;transform:translateY(0)}`;
   A.forEach(([t,d])=>{z+=`${K(t)}%{opacity:1;transform:translateY(calc(var(--L) * ${(k*sin(d))}))}`;});
   z+=`${K(7.9)}%{opacity:1;transform:translateY(calc(var(--L) * ${(k*sin(-17))}))}`;
   z+=`100%{opacity:0;transform:translateY(calc(var(--L) * ${(k*sin(-17))}))}`;
   return z;};
  const css=`
  @keyframes scBeam{${bm}}
  @keyframes scArmL{${arm("l")}}
  @keyframes scArmR{${arm("r")}}
  @keyframes scPivot{0%,${K(1.9)}%{opacity:0;transform:scale(0)}
    ${K(2.2)}%{opacity:1;transform:scale(1)}${K(7.4)}%{opacity:1;transform:scale(1)}
    ${K(7.9)}%{opacity:1;transform:scale(1.9)}100%{opacity:0;transform:scale(2.6)}}
  @keyframes scFul{0%,${K(0.8)}%{opacity:0;transform:scaleY(0)}
    ${K(1.6)}%{opacity:.7;transform:scaleY(1)}
    ${K(7.4)}%{opacity:.7;transform:scaleY(1)}
    ${K(7.9)}%{opacity:1;transform:scaleY(1.45)}
    100%{opacity:1;transform:scaleY(2.3)}}
  @keyframes scVerdict{0%,${K(7.66)}%{opacity:0}${K(7.78)}%{opacity:.9}
    ${K(8.1)}%{opacity:0}${K(8.25)}%{opacity:.45}100%{opacity:0}}`;
  return `<div class="pl"><style>${css}</style>
   <div class="th th-scale" style="--spd:${D}s">
     <i class="ful"></i><i class="beam"></i><i class="pivot"></i>
     <div class="arm l"><i class="cord"></i><i class="pan l"></i></div>
     <div class="arm r"><i class="cord"></i><i class="pan d"></i></div>
     <div class="verdict"></div>
     <div class="csay" data-t="저울은 너를 달고 있다" data-d="1" style="top:18%;--sd:1s;--sl:2.6s"></div>
     <div class="csay" data-t="기우는 쪽이 곧 너의 몫이다" data-d="4.8" style="top:80%;--sd:4.8s;--sl:2.4s"></div>
   </div></div>`;}

 case "equinox":{
  const VERSES=[
   ["陰","The Negative, that you've granted"],
   ["陽","The Positive, that you've taken"],
   ["衡","The Equinox, Everything from everywhere, even from nothing"],
   ["無","And you, now having it all, bring yourself close to The ZERO."]];
  const vs=VERSES.map((v,i)=>`<div class="vs" style="--vd:${EQ_VD[i]}s">
    <b>${v[0]}</b><span data-t="${v[1]}" data-d="${EQ_VD[i]}"></span></div>`).join("");
  // 주변에서 서서히 명멸하는 흑/백 잔별
  let ms="";
  for(let i=0,N=QC(20);i<N;i++){const w=(7+Math.random()*19).toFixed(0);
   ms+=`<i class="mstar" style="left:${(Math.random()*96).toFixed(1)}%;top:${(Math.random()*92).toFixed(1)}%;
     background:${Math.random()<.5?"#000":"#fff"};--ms:${w}px;--mo:${(.45+Math.random()*.5).toFixed(2)};
     --md:${(2.6+Math.random()*3.4).toFixed(2)}s;--ml:${(Math.random()*5).toFixed(2)}s"></i>`;}
  // 가끔 터지는 도넛형 충격파
  let dn="";
  for(let i=0,N=QC(5);i<N;i++)dn+=`<i class="dnt" style="left:${(18+Math.random()*64).toFixed(1)}%;
    top:${(20+Math.random()*56).toFixed(1)}%;--rs:${(26+Math.random()*30).toFixed(0)}px;
    --rw:${(2+Math.random()*2).toFixed(1)}px;--rd:${(2.2+Math.random()*1.2).toFixed(2)}s;
    --rl:${(9.2+Math.random()*3).toFixed(2)}s"></i>`;
  for(let i=0,N=QC(6);i<N;i++)dn+=`<i class="dnt" style="left:${(12+Math.random()*72).toFixed(1)}%;
    top:${(14+Math.random()*66).toFixed(1)}%;--rs:${(34+Math.random()*46).toFixed(0)}px;
    --rw:${(2+Math.random()*3).toFixed(1)}px;--rd:${(5+Math.random()*3.5).toFixed(2)}s;
    --rl:${(Math.random()*6).toFixed(2)}s"></i>`;
  // 원형으로 흩어지는 링 파티클
  let rb="";
  for(let i=0,N=QC(3);i<N;i++){
   const n=QLV>=3?6:10,dist=60+Math.random()*70;let dots="";
   for(let k=0;k<n;k++){const a=(k/n)*6.283;
    dots+=`<i style="--dx:${(Math.cos(a)*dist).toFixed(0)}px;--dy:${(Math.sin(a)*dist).toFixed(0)}px;
      --rbd:${(5.5+i*1.3).toFixed(2)}s;--rbl:${(1.2+i*2.1).toFixed(2)}s"></i>`;}
   rb+=`<div class="rb" style="left:${(20+Math.random()*60).toFixed(1)}%;top:${(20+Math.random()*56).toFixed(1)}%">${dots}</div>`;}
  // 회전하는 장 위에 배치 — 별을 중심으로 궤도를 따라 자리가 옮겨간다
  const ORB=[["50%","50%"],["50%","50%"],["50%","50%"],["50%","50%"]];
  const GD=EQ_P;
  const gz=VERSES.map((v,i)=>`<i class="gzo" style="--gx:${ORB[i][0]};--gy:${ORB[i][1]}">
    <i class="gzc"><span class="gz" style="--gd:${GD[i]}s">${v[0]}</span></i></i>`).join("");
  let vl="";
  for(let i=0,N=QC(9);i<N;i++)vl+=`<i class="vl" style="left:${(Math.random()*100).toFixed(1)}%;
    --vs:${[.5,.5,1,1.5][i%4]}s;--vd2:${(Math.random()*1.5).toFixed(2)}s"></i>`;
  let sp="";
  for(let i=0,N=QC(22);i<N;i++)sp+=`<i class="sp" style="left:${(Math.random()*100).toFixed(1)}%;
    top:${(Math.random()*100).toFixed(1)}%;--sd:${[.5,1,1.5][i%3]}s;
    --sl:${(1.2+Math.random()*2.4).toFixed(2)}s"></i>`;
  for(let i=0,N=QC(20);i<N;i++)sp+=`<i class="sp" style="left:${(Math.random()*100).toFixed(1)}%;
    top:${(Math.random()*100).toFixed(1)}%;--sd:${[.25,.5][i%2]}s;
    --sl:${(8.4+Math.random()*3.4).toFixed(2)}s"></i>`;
  const S1=eqxBurst(200,200,192,96,0);         // 주성 — 8갈래 폭발형
  const S2=eqxBurst(200,200,116,58,22.5);      // 보조성 (반 칸 어긋나게 겹침)
  const RAY=[[-34,62,2],[28,50,1.6],[146,56,1.8],[212,46,1.4]]
    .map(([a,l,w])=>eqxRay(200,200,a,l,w)).join(" ");
  // 먹물처럼 번지는 성운 — 큰 방사 그라디언트 묶음 하나로 그린다 (레이어 1장)
  const nebLayer=(n,lo,hi,al)=>{const g=[];
   for(let i=0;i<n;i++){const w=(lo+Math.random()*(hi-lo)).toFixed(0),
     h=(lo*.7+Math.random()*(hi-lo)*.8).toFixed(0),
     x=(Math.random()*100).toFixed(1),y=(Math.random()*100).toFixed(1),
     a=(al*(.55+Math.random()*.65)).toFixed(3);
    g.push(`radial-gradient(${w}% ${h}% at ${x}% ${y}%,rgba(150,150,150,${a}) 0%,rgba(120,120,120,${(a*.4).toFixed(3)}) 38%,transparent 72%)`);}
   return g.join(",");};
  const neb=`<div class="neb" style="background:${nebLayer(7,26,62,.34)}"></div>`+
            `<div class="neb2" style="background:${nebLayer(5,44,95,.2)}"></div>`;
  // 미세한 별먼지 — 점 전체를 배경 그라디언트 한 장으로
  const fs=[];
  for(let i=0,N=QC(80);i<N;i++)fs.push(`radial-gradient(circle ${(.6+Math.random()*1.5).toFixed(1)}px at `+
   `${(Math.random()*100).toFixed(2)}% ${(Math.random()*100).toFixed(2)}%,`+
   `rgba(190,190,190,${(.45+Math.random()*.5).toFixed(2)}) 0 60%,transparent 61%)`);
  const fstars=`<div class="fstars" style="background:${fs.join(",")}"></div>`;
  // 프랙탈 노이즈 성운 — 작은 좌표계에서 계산해 화면 크기로 늘린다 (1회 래스터)
  const seed=(Math.random()*9000|0);
  const nz=`<div class="nz"><svg viewBox="0 0 420 270" preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"><filter id="nzf${seed}">
    <feTurbulence type="fractalNoise" baseFrequency="0.011 0.016" numOctaves="5" seed="${seed}"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.55" intercept="-0.08"/></feComponentTransfer>
    </filter><rect width="420" height="270" filter="url(#nzf${seed})"/></svg></div>`;
  // 화면 위·아래 가장자리에서 박자에 맞춰 뛰는 막대
  let eb=`<div class="ebz tz" style="--ez:${EQ_DUR}s">`;
  for(let i=0,N=QC(11);i<N;i++)eb+=`<i class="ebar t" style="--ex:${(i*9+Math.random()*5).toFixed(1)}%;
    --ew:${(10+Math.random()*40).toFixed(0)}px;--eh:${(11+Math.random()*24).toFixed(0)}%;
    --ed:${(EQ_B*12).toFixed(3)}s;--el:-${(Math.random()*EQ_B*12).toFixed(3)}s"></i>`;
  eb+=`</div><div class="ebz bz" style="--ez:${EQ_DUR}s">`;
  for(let i=0,N=QC(11);i<N;i++)eb+=`<i class="ebar b" style="--ex:${(i*9+Math.random()*5).toFixed(1)}%;
    --ew:${(10+Math.random()*40).toFixed(0)}px;--eh:${(11+Math.random()*24).toFixed(0)}%;
    --ed:${(EQ_B*8).toFixed(3)}s;--el:-${(Math.random()*EQ_B*8).toFixed(3)}s"></i>`;
  eb+="</div>";
  // 화면보다 큰 고리 윤곽 — 경계선을 넘으며 흑백이 갈린다
  let orb="";
  for(let i=0,N=QC(5);i<N;i++){const sz=(180+Math.random()*460).toFixed(0);
   orb+=`<i class="orb" style="left:${(-16+Math.random()*96).toFixed(1)}%;
     top:${(-22+Math.random()*92).toFixed(1)}%;--os:${sz}px;
     --ow:${(2+Math.random()*8).toFixed(1)}px;--od:${(3.8+Math.random()*3).toFixed(2)}s;
     --ol:${(Math.random()*5).toFixed(2)}s"></i>`;}
  // 직선으로 떨어지는 광주
  let beams="";
  for(let i=0,N=QC(5);i<N;i++)beams+=`<i class="beam" style="left:${(8+Math.random()*82).toFixed(1)}%;
    --bw:${(9+Math.random()*38).toFixed(0)}px;--bd:${(2.4+Math.random()*1.8).toFixed(2)}s;
    --bl:${(1.4+i*1.9+Math.random()).toFixed(2)}s"></i>`;
  const vimp=EQ_VD.map(t=>`<i class="vimp" style="--vi:${t}s"></i>`).join("")+
             EQ_VD.map(t=>`<i class="vflash" style="--vi:${t}s"></i>`).join("");
  return `<div class="pl"><style>${eqxHumCSS(EQ_DUR)}${eqxInvCSS(EQ_DUR)}${eqxPulseCSS()}${eqxBarCSS()}${eqxTimeCSS()}</style>
    <div class="th th-eqx"><div class="fld"><i class="hline"></i>
    <i class="sh t"></i><i class="sh b"></i><div class="trem">
    <div class="rot">
      <i class="bw"></i><i class="bw alt"></i>${gz}
      <div class="sbeat"><i class="flare"></i><div class="sinv">
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="eqg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#fff"/><stop offset="46%" stop-color="#fff"/>
              <stop offset="50%" stop-color="#808080"/>
              <stop offset="54%" stop-color="#000"/><stop offset="100%" stop-color="#000"/></linearGradient>
            <radialGradient id="eqfall">
              <stop offset="0%" stop-color="#fff"/><stop offset="8%" stop-color="#fff"/>
              <stop offset="22%" stop-color="#fff" stop-opacity=".82"/>
              <stop offset="45%" stop-color="#fff" stop-opacity=".36"/>
              <stop offset="72%" stop-color="#fff" stop-opacity=".1"/>
              <stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
            <radialGradient id="eqbloomg">
              <stop offset="0%" stop-color="#fff" stop-opacity=".8"/>
              <stop offset="26%" stop-color="#fff" stop-opacity=".46"/>
              <stop offset="58%" stop-color="#fff" stop-opacity=".15"/>
              <stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
            <radialGradient id="eqhalog">
              <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
              <stop offset="46%" stop-color="#fff" stop-opacity=".26"/>
              <stop offset="66%" stop-color="#fff" stop-opacity=".4"/>
              <stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
            <mask id="eqm"><rect width="400" height="400" fill="url(#eqfall)"/></mask>
            <mask id="eqmb"><rect width="400" height="400" fill="url(#eqbloomg)"/></mask>
            <mask id="eqmh"><rect width="400" height="400" fill="url(#eqhalog)"/></mask>
            <filter id="eqs" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="1.5"/></filter>
            <filter id="eqb" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="8"/></filter>
          </defs>

          <!-- 중심에서 멀어질수록 급격히 희미해지는 광선 다발 -->
          <g mask="url(#eqm)">
            <g filter="url(#eqb)" opacity=".6"><path d="${S1}" fill="url(#eqg)"/></g>
            <g filter="url(#eqs)">
              <path d="${RAY}" fill="url(#eqg)" opacity=".26"/>
              <path d="${S1}" fill="url(#eqg)"/>
              <path d="${S2}" fill="url(#eqg)" opacity=".55"/>
            </g>
          </g>

          <!-- 희미한 후광 -->
          <circle cx="200" cy="200" r="196" fill="url(#eqg)" opacity=".4" mask="url(#eqmh)"/>
          <!-- 과노출된 중심부: 윤곽 없이 빛이 번진다 -->
          <circle cx="200" cy="200" r="48" fill="url(#eqg)" mask="url(#eqmb)" opacity=".7"/>
          <circle cx="200" cy="200" r="3.6" fill="url(#eqg)" opacity=".85"/>
        </svg></div></div>
    </div>
    <div class="dfx">${nz}${neb}${fstars}${vl}<div class="smoke"></div>${beams}${eb}${orb}${sp}${dn}${rb}${vimp}${vs}</div>${ms}
  </div></div></div></div>`;}
 case "fate":{
  const FD=EQ_FD;                                   // 연출 구간 14.0625초 (192BPM · 45박)
  // 먹빛 안개
  const sd=(Math.random()*9000|0);
  const fogDef=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"><filter id="fg${sd}">
    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.013" numOctaves="5" seed="${sd}"/>
    <feColorMatrix type="matrix" values="0 0 0 0 .58  0 0 0 0 .49  0 0 0 0 .24  0 0 0 .42 0"/>
    </filter></svg>`;
  const fogRect=`<svg viewBox="0 0 420 270" preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"><rect width="420" height="270" filter="url(#fg${sd})"/></svg>`;
  // 안개를 절단선 기준 두 조각으로 나눠 둔다 — 갈라지는 순간 어긋난다
  const fog=fogDef+`<div class="cutrot"><div class="cutdrift">
    <div class="ch a">${fogRect}</div><div class="ch b">${fogRect}</div></div></div>`;
  // 절단면을 따라 튀는 불티
  let ember="";
  for(let i=0,N=QC(14);i<N;i++)ember+=`<i class="ember" style="left:50%;
    --ex2:${(-46+Math.random()*92).toFixed(0)}vw;--ex3:${(-46+Math.random()*92).toFixed(0)}vw;
    --ed2:${(1.1+Math.random()*1.4).toFixed(2)}s;--el2:${(Math.random()*2.4).toFixed(2)}s"></i>`;
  // 천문 다이얼 — 지지 12 / 팔괘 8 / 천간 10
  const 지지="子丑寅卯辰巳午未申酉戌亥".split("");
  const 팔괘="乾兌離震巽坎艮坤".split("");
  const 천간="甲乙丙丁戊己庚辛壬癸".split("");
  const dials=
   `<div class="dial" style="--ds:min(88vmin,620px);--dl:3.5s;--r1:64deg;--r2:150deg;--r3:900deg">
      ${ftDial(620,지지,268,30,60)}</div>`+
   `<div class="dial" style="--ds:min(62vmin,440px);--dl:3.9s;--r1:-52deg;--r2:-130deg;--r3:-780deg">
      ${ftDial(440,팔괘,186,26,40)}</div>`+
   `<div class="dial" style="--ds:min(40vmin,284px);--dl:4.3s;--r1:80deg;--r2:190deg;--r3:1180deg">
      ${ftDial(284,천간,118,20,30)}</div>`;
  // 화면 밖으로 걸친 거대 다이얼
  const far=
   `<div class="far" style="left:-34%;top:-42%;--ds:min(120vmin,860px);--dl:3.7s;
      --r1:26deg;--r2:70deg;--r3:400deg">${ftDial(860,지지,372,52,60)}</div>`+
   `<div class="far" style="right:-40%;bottom:-48%;--ds:min(130vmin,940px);--dl:4.1s;
      --r1:-20deg;--r2:-58deg;--r3:-340deg">${ftDial(940,천간,408,58,50)}</div>`;
  // 열두 가닥의 실이 중심으로 감겨 매듭이 된다
  let th="";
  for(let i=0;i<12;i++){
   const a=(i/12)*Math.PI*2,r=340;
   const x1=(340+Math.cos(a)*r).toFixed(1),y1=(340+Math.sin(a)*r).toFixed(1);
   const cx=(340+Math.cos(a+1.15)*180).toFixed(1),cy=(340+Math.sin(a+1.15)*180).toFixed(1);
   th+=`<path d="M${x1} ${y1} Q${cx} ${cy} 340 340" stroke-width="1.6"
     style="--wl:${(5.6+i*.11).toFixed(2)}s"/>`;}
  const weave=`<div class="weave" style="--ws:min(96vmin,680px)">
    <svg viewBox="0 0 680 680" xmlns="http://www.w3.org/2000/svg">${th}</svg></div>`;
  // 매듭 문장 — 두 겹의 정사각과 팔방 살
  let spoke="";
  for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;
   spoke+=`<path d="M135 135 L${(135+Math.cos(a)*118).toFixed(1)} ${(135+Math.sin(a)*118).toFixed(1)}"
     stroke="currentColor" stroke-width="1.4" opacity=".7"/>`;}
  const sigil=`<div class="sigil"><svg viewBox="0 0 270 270" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="currentColor" stroke-linejoin="round">
      <rect x="46" y="46" width="178" height="178" stroke-width="2.2" opacity=".85"/>
      <rect x="46" y="46" width="178" height="178" stroke-width="2.2" opacity=".85"
        transform="rotate(45 135 135)"/>
      <circle cx="135" cy="135" r="104" stroke-width="1.6" opacity=".6"/>
      <circle cx="135" cy="135" r="62" stroke-width="3" opacity=".95"/>
      <circle cx="135" cy="135" r="26" stroke-width="1.4" opacity=".7"/>
      ${spoke}
    </g></svg></div>`;
  // 파쇄 조각
  let shard="";
  for(let i=0,N=QC(18);i<N;i++)shard+=`<i class="shard" style="transform:rotate(${(i*20+Math.random()*12).toFixed(0)}deg);
    --kh:${(26+Math.random()*44).toFixed(0)}vh;--kd:${(Math.random()*.22).toFixed(2)}s"></i>`;
  let mote="";
  for(let i=0,N=QC(22);i<N;i++)mote+=`<i class="mote2" style="left:${(Math.random()*100).toFixed(1)}%;
    --md:${(7+Math.random()*5).toFixed(1)}s;--mdl:${(3+Math.random()*6).toFixed(1)}s"></i>`;
  return `<div class="pl"><style>${ftTimeCSS()}</style><div class="th th-ft" style="--fd:${FD}s;--ct:-14deg">
    ${fog}
    <div class="zoom">${far}${dials}${weave}<i class="seed"></i><i class="sigglow"></i>${sigil}</div>
    <div class="say" data-t="실은 이미 묶여 있었다" data-d="0.62"
      style="top:41%;--sd:.5s;--sl:4.6s"></div>
    <div class="say" data-t="그대의 손이 닿기 전에" data-d="2.19"
      style="top:53%;--sd:2.05s;--sl:3.1s"></div>
    <div class="cap">「結 — 天機를 엮는 자」</div>
    <div class="dim"></div>
    <i class="blade"></i><div class="bflash"></div><i class="seam"></i>${ember}
    <span class="glyph">結</span>${shard}${mote}
  </div></div>`;}
 case "tdz":{                                    // 시간 파괴자 — 검이 끝내 등장하지 않는 유일한 컷신
  const E=v=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
  const T=TDZ_T;
  /* 대사 — 순서는 고정. [뜨는 시각, 머무는 시간, 세로 위치, 문장, 추가 class] */
  const say=[
   [T.l1,4.10,"25%","Why do you think time always goes only one way?",""],
   [T.l2,2.30,"29%","I don't follow time.",""],
   [T.l3,2.20,"62%","Time follows me.",""],
   [T.f ,0.86,"44%","FOR","big"],
   [T.i ,0.74,"44%","I","big"],
   [T.a ,0.94,"44%","AM","big"],
  ].map(([d,l,top,tx,cl])=>`<div class="csay ${cl}" data-t="${E(tx)}" data-d="${d}"
    style="top:${top};--sd:${d}s;--sl:${l}s"></div>`).join("");
  /* 거꾸로 도는 시계 — 초침이 시침보다 먼저 미친다 */
  let tick="";
  for(let i=0,N=QC(60);i<N;i++){const a=i*(360/N),big=(i%5===0);
   tick+=`<line x1="200" y1="${big?32:39}" x2="200" y2="${big?54:49}" stroke="#d6ecff"
     stroke-width="${big?2.4:1}" opacity="${big?.5:.22}" transform="rotate(${a.toFixed(1)} 200 200)"/>`;}
  const hand=(len,w,dur,op)=>`<g><line x1="200" y1="200" x2="200" y2="${200-len}" stroke="var(--acc)"
    stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>
    <animateTransform attributeName="transform" type="rotate" from="360 200 200" to="0 200 200"
      dur="${dur}s" repeatCount="indefinite"/></g>`;
  const dial=`<svg viewBox="0 0 400 400">
    <circle cx="200" cy="200" r="178" fill="none" stroke="#9cc8f0" stroke-width="1.4" opacity=".26"/>
    <circle cx="200" cy="200" r="152" fill="none" stroke="#9cc8f0" stroke-width=".7" opacity=".15"/>
    ${tick}${hand(94,5,3.4,.85)}${hand(138,2.6,1.05,.6)}${hand(160,1.1,.3,.38)}
    <circle cx="200" cy="200" r="6" fill="#eaf6ff" opacity=".9"/></svg>`;
  /* 바깥 궤도 — 서로 반대로 돈다 */
  let orb="";
  for(let i=0,N=QC(3);i<N;i++)
   orb+=`<i class="orb" style="--os:${118+i*34}%;--od:${26-i*7}s;--osg:${i%2?-1:1}"></i>`;
  /* 부서진 시간 조각 */
  let shard="";
  for(let i=0,N=QC(18);i<N;i++)
   shard+=`<i class="sh" style="left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*100).toFixed(1)}%;
     --sr:${(Math.random()*360).toFixed(0)}deg;--sd2:${(2.6+Math.random()*3).toFixed(1)}s;--sl2:${(Math.random()*4.5).toFixed(1)}s"></i>`;
  return `<div class="pl"><div class="th th-tdz"
    style="--tdo:${T.open}s;--tdt:${T.title}s;--tdc:${T.close}s;--tdf:${T.fade}s">
    <div class="tz-veil"></div>
    <div class="tz-scene">
      <div class="tz-dial">${dial}</div>${orb}
      <div class="tz-shards">${shard}</div>
      <div class="tz-vig"></div>
    </div>
    <i class="tz-pop op"></i><i class="tz-pop op b"></i>
    <div class="tz-title">
      <div class="tl">${gradText(R,"T I M E")}</div>
      <div class="tl">${gradText(R,"D E S T R O Y E R")}</div>
    </div>
    <i class="tz-pop cl"></i><i class="tz-pop cl b"></i>
    <div class="tz-white"></div>
  </div>${say}</div>`;}
 case "ascend":{                                 // 운명 이상 공용 — 색이 흐르는 승천
  const cg=(R.cg&&R.cg.length?R.cg:[R.c,"#ffffff"]);
  const grad=cg.concat(cg[0]).join(",");
  let rings="";for(let i=0,N=QC(5);i<N;i++)rings+=`<i class="ring" style="--rd:${(1.1+i*.45).toFixed(2)}s;--rl:${(i*.45).toFixed(2)}s"></i>`;
  let cols="";for(let i=0,N=QC(11);i<N;i++)cols+=`<i class="col" style="left:${(4+i*(92/N)).toFixed(1)}%;--cd:${(1.3+Math.random()*1.3).toFixed(2)}s;--cl:${(Math.random()*1.8).toFixed(2)}s;--ch:${(28+Math.random()*52).toFixed(0)}vh"></i>`;
  let motes="";for(let i=0,N=QC(30);i<N;i++)motes+=`<i class="am" style="left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*100).toFixed(1)}%;--ad:${(2+Math.random()*3).toFixed(1)}s;--al:${(Math.random()*2.6).toFixed(1)}s"></i>`;
  return `<div class="pl"><div class="th th-ascend" style="--grad:linear-gradient(120deg,${grad});--pd:${pd}s">
    <div class="asc-bg"></div><div class="asc-veil"></div>
    <div class="asc-cols">${cols}</div><div class="asc-rings">${rings}</div>
    <div class="asc-motes">${motes}</div>
    <i class="asc-core"></i><div class="asc-flash"></div>
  </div></div>`;}
 }
 return "";}

let csT=null;
function playCutscene(s,R){
 const cs=$("cs"),pd=s.pd||R.pd;
 /* 검이 등장하지 않는 컷신 — 무대·검·이름표·섬광·입자를 전부 붙이지 않는다.
    이런 컷신은 스스로 끝맺음까지 연출하므로 공용 마감 연출이 끼어들면 안 된다. */
 const bare=s.th==="tdz";
 const pc=bare?0:(R.mode==="theme"?70:34+(s.t-6)*10);
 const motes=bare?0:(s.t>=8?26+(s.t-8)*10:0);
 let parts="";
 for(let i=0;i<pc;i++){const a=Math.random()*6.283,d=90+Math.random()*300;
  parts+=`<i class="p" style="--tx:${(Math.cos(a)*d).toFixed(0)}px;--ty:${(Math.sin(a)*d).toFixed(0)}px;
   --pdu:${(.9+Math.random()*1.2).toFixed(2)}s;--pdl:${(Math.random()*.5-.35).toFixed(2)}s"></i>`;}
 let mh="";
 for(let i=0;i<motes;i++)mh+=`<i class="mote" style="left:${(Math.random()*100).toFixed(1)}%;
   --md:${(5+Math.random()*5).toFixed(1)}s;--mdl:${(Math.random()*4).toFixed(1)}s"></i>`;
 cs.style.setProperty("--acc",s.acc||R.c);
 cs.style.setProperty("--pd",pd+"s");
 cs.style.setProperty("--esw",EYE_T.swordRevealDuration+"s");
 cs.style.setProperty("--isw",INK_T.swordFormDuration+"s");
 cs.innerHTML=preludeHTML(s,R)+`<div class="cs-dim"></div>`+(bare?"":`
  <div class="cs-after"></div>${parts}${mh}
  <div class="cs-stage">
    ${s.t>=14?`<div class="cs-sig"><b>${sigFor(s)}</b></div>`:""}
    <div class="cs-sword ${s.t>=8?"float":""}">${swordSVG(s)}</div>
    <div class="cs-cap"><div class="cs-rarity">${gradText(R,R.n)}</div><div class="cs-name">${gradText(R,s.n)}</div>
      <div class="cs-odds">1 / ${R.one.toLocaleString()}</div></div>
  </div><div class="cs-flash"></div>`);
 resolveQ();
 cs.classList.remove("q1","q2","q3");cs.classList.add("q"+QLV);
 cs.classList.toggle("eyec",s.th==="eye");
 cs.classList.toggle("inkc",s.th==="ink");
 cs.classList.toggle("tdzc",bare);      // 배경을 투명하게 — 게임 화면이 비쳐야 어두워지는 게 보인다
 cs.classList.toggle("safe1",S.safe===1);
 cs.classList.toggle("safe2",S.safe===2);
 cs.classList.add("on");
 clearCsTimers();
 sfxCut(s,R);
 // 심장박동 두 번 (쿵 쿵) — 무극 이상 등급에서만, 세 번째 박동에 검이 강림한다
 if(!bare&&s.t>=14&&S.sound&&typeof AC!=="undefined"&&AC){
  const beat=d=>{try{tone(66,40,.26,"sine",.11,d);noise(.16,.05,d);}catch(e){}};
  beat(Math.max(0,pd-1.6));beat(Math.max(0,pd-0.85));
 }
 csType();
 if(R.mode==="theme")watchFPS();
 clearTimeout(csT);csT=setTimeout(endCut,s.end||R.end);}
function endCut(){
 clearTimeout(csT);clearCsTimers();eqStopBGM();const cs=$("cs");
 if(!cs.classList.contains("on"))return;
 cs.classList.remove("on");cs.innerHTML="";cancelAnimationFrame(fpsRaf);
 afterResult();}
