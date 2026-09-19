/* ═════════ 검 SVG ═════════ */
const BLADE={
 straight:"M100 26 L117 106 L115 378 L85 378 L83 106 Z",
 great:"M100 20 L132 118 L129 378 L71 378 L68 118 Z",
 katana:"M103 26 C121 108 128 248 126 378 L99 378 C95 248 93 108 103 26 Z",
 flame:"M100 24 L115 78 L104 118 L118 160 L106 204 L120 248 L108 292 L120 336 L116 378 L84 378 L80 336 L92 292 L80 248 L94 204 L82 160 L96 118 L85 78 Z",
 crystal:"M100 18 L124 122 L111 244 L127 320 L100 380 L73 320 L89 244 L76 122 Z",
 rapier:"M100 22 L107 116 L106 378 L94 378 L93 116 Z",
 rift:"M100 16 L120 110 L100 196 L122 296 L114 378 L86 378 L78 296 L100 196 L80 110 Z",
 fang:"M100 24 C118 92 132 180 124 268 L128 378 L72 378 L76 268 C68 180 82 92 100 24 Z"};
const GUARD={
 bar:'<rect x="52" y="374" width="96" height="13" rx="3"/>',
 cross:'<rect x="36" y="372" width="128" height="15" rx="4"/><rect x="88" y="364" width="24" height="30" rx="4"/>',
 wing:'<path d="M100 374 C74 374 46 364 30 344 C46 384 72 392 100 392 C128 392 154 384 170 344 C154 364 126 374 100 374 Z"/>',
 ring:'<path d="M100 370 m-40 0 a40 22 0 1 0 80 0 a40 22 0 1 0 -80 0 Z" fill="none" stroke-width="9"/><rect x="80" y="372" width="40" height="12" rx="3"/>',
 crown:'<path d="M30 392 L44 356 L58 380 L72 350 L86 378 L100 344 L114 378 L128 350 L142 380 L156 356 L170 392 Z"/>',
 halo:'<path d="M100 378 m-52 0 a52 52 0 1 0 104 0 a52 52 0 1 0 -104 0" fill="none" stroke-width="3" opacity=".5"/><path d="M100 378 m-34 0 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0" fill="none" stroke-width="6"/>',
 none:'<rect x="86" y="374" width="28" height="8" rx="4" opacity=".8"/>'};
let uid=0;
/* ench: 인첸트 레벨(0=기본). 2단계에서 인첸트본 전용 글린트 레이어에 사용. */
function swordSVG(s,ench){
 const R=RARITY[s.t],id="s"+(uid++),glow=s.t>=4,aura=s.t>=6,prism=s.t>=11;
 let defs=`<linearGradient id="b${id}" x1="0" y1="0" x2="1" y2=".3">
   <stop offset="0%" stop-color="${s.c[0]}"/><stop offset="46%" stop-color="${s.e}"/>
   <stop offset="100%" stop-color="${s.c[1]}"/></linearGradient>
   <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="0">
   <stop offset="0%" stop-color="${s.c[1]}"/><stop offset="50%" stop-color="${s.c[0]}"/>
   <stop offset="100%" stop-color="${s.c[1]}"/></linearGradient>`;
 if(glow)defs+=`<filter id="f${id}" x="-70%" y="-40%" width="240%" height="200%">
   <feGaussianBlur stdDeviation="${s.t>=9?10:5}" result="b"/>
   <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
 let ex="";
 if(aura){
  const rr=s.t>=10?96:72,cnt=s.t>=10?12:7;
  ex+=`<circle cx="100" cy="378" r="${rr}" fill="none" stroke="${R.c}" stroke-width="1" opacity=".3">
    <animateTransform attributeName="transform" type="rotate" from="0 100 378" to="360 100 378" dur="${Math.max(5,16-s.t)}s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values=".1;.42;.1" dur="3.2s" repeatCount="indefinite"/></circle>`;
  for(let i=0;i<cnt;i++){const a=i*(360/cnt);
   ex+=`<circle cx="100" cy="${378-rr}" r="2.4" fill="${R.c}" opacity=".7">
     <animateTransform attributeName="transform" type="rotate" from="${a} 100 378" to="${a+360} 100 378" dur="${Math.max(4,12-s.t*.5)}s" repeatCount="indefinite"/></circle>`;}
 }
 if(prism)ex+=`<path d="${BLADE[s.b]}" fill="none" stroke="#fff" stroke-width="2" opacity=".5">
   <animate attributeName="opacity" values=".12;.9;.12" dur="1.8s" repeatCount="indefinite"/></path>`;
 // EQUINOX 전용 — 흑백의 구체가 검을 공전하고, 각 구체 중심에 4갈래 성망이 박힌다
 let orbBack="",orbFront="";
 if(s.th==="equinox"){
  const OX=100,OY=268;
  orbBack=`<circle cx="${OX}" cy="${OY}" r="118" fill="none" stroke="#8a8a8a" stroke-width=".7" opacity=".28"/>
   <circle cx="${OX}" cy="${OY}" r="86" fill="none" stroke="#8a8a8a" stroke-width=".7" opacity=".28"/>`;
  for(let i=0;i<6;i++){
   const w=i%2===0,R=w?118:86,rr=15-(i%3)*2.5,a=i*60,dur=w?11:7.5;
   const st=starPath(4,rr*1.02,rr*.2,0,0);
   const g=`<g><g transform="translate(${OX} ${OY-R})">
     <circle r="${rr}" fill="${w?"#f6f6f6":"#0b0b0b"}" stroke="${w?"#9a9a9a":"#dcdcdc"}" stroke-width="1.1"/>
     <path d="${st}" fill="${w?"#0b0b0b":"#ffffff"}" opacity=".95"/></g>
     <animateTransform attributeName="transform" type="rotate"
       from="${a} ${OX} ${OY}" to="${a+(w?360:-360)} ${OX} ${OY}"
       dur="${dur}s" repeatCount="indefinite"/></g>`;
   if(w)orbBack+=g;else orbFront+=g;}
 }
// ── 이름에 맞춘 검별 고유 장식 ──
 let dcB="",dcF="";
 const AN=(at,fr,to,dur,extra)=>`<animate attributeName="${at}" values="${fr};${to};${fr}"
   dur="${dur}s" repeatCount="indefinite" ${extra||""}/>`;
 switch(s.n){
  case "적요 寂寥":{                       // 울림이 퍼졌다 도로 삼켜진다
   for(let i=0;i<3;i++)dcB+=`<circle cx="100" cy="250" r="30" fill="none" stroke="${s.e}"
     stroke-width="1" opacity="0"><animate attributeName="r" values="18;120;18" dur="5s"
     begin="${(i*1.7).toFixed(1)}s" repeatCount="indefinite"/>
     <animate attributeName="opacity" values="0;.5;0" dur="5s" begin="${(i*1.7).toFixed(1)}s"
     repeatCount="indefinite"/></circle>`;
   dcF=`<rect x="97" y="90" width="6" height="250" rx="3" fill="#05060a" opacity=".85"/>`;
   break;}
  case "태동 胎動":{                        // 아직 깨지 않은 것이 안에서 뒤척인다
   dcB=`<circle cx="100" cy="248" r="46" fill="${s.gem}" opacity=".16">
      ${AN("r","40","62","4.4")}</circle>
     <circle cx="100" cy="248" r="30" fill="none" stroke="${s.e}" stroke-width="1.1" opacity=".5">
      ${AN("r","26","40","4.4")}</circle>
     <ellipse cx="100" cy="248" rx="17" ry="23" fill="${s.e}" opacity=".5">
      ${AN("ry","20","27","4.4")}</ellipse>`;
   break;}
  case "관측자 觀測者":{                      // 눈금과 조준선이 검을 재고 있다
   dcB=`<line x1="-44" y1="250" x2="244" y2="250" stroke="${s.e}" stroke-width=".8" opacity=".4"/>
     <line x1="100" y1="-10" x2="100" y2="540" stroke="${s.e}" stroke-width=".8" opacity=".25"/>
     <circle cx="100" cy="250" r="72" fill="none" stroke="${s.e}" stroke-width=".9" opacity=".45">
       <animateTransform attributeName="transform" type="rotate" from="0 100 250" to="360 100 250"
         dur="18s" repeatCount="indefinite"/></circle>
     ${[0,1,2,3,4,5,6,7,8].map(i=>`<line x1="${-30+i*20}" y1="244" x2="${-30+i*20}" y2="${i%2?250:256}"
       stroke="${s.e}" stroke-width=".8" opacity=".5"/>`).join("")}
     ${[[-44,-44],[244,-44],[-44,44],[244,44]].map(([x,y])=>
       `<path d="M${x<100?x+8:x-8} ${250+y} h${x<100?-8:8} v${y<0?-14:14}" fill="none"
         stroke="${s.e}" stroke-width="1.2" opacity=".6"/>`).join("")}`;
   break;}
  case "O P P R E S S I O N":{               // 사슬에 묶인 심장
   dcB=`<g opacity=".9"><path d="M100 300 C72 278 58 264 58 248 C58 236 67 227 78 227
      C86 227 93 232 100 240 C107 232 114 227 122 227 C133 227 142 236 142 248
      C142 264 128 278 100 300 Z" fill="${s.gem}" stroke="${s.e}" stroke-width="1.4" opacity=".55"/>
      <path d="M100 232 L92 258 L104 262 L96 292" fill="none" stroke="#12151b" stroke-width="2.2" opacity=".8"/></g>`;
   for(let k=0;k<2;k++){const y0=k?300:186;
    for(let i=0;i<9;i++)dcF+=`<ellipse cx="${(36+i*17).toFixed(0)}" cy="${(y0+(k?-1:1)*i*7.2).toFixed(0)}"
      rx="8.5" ry="5" fill="none" stroke="${s.e}" stroke-width="2.4" opacity=".62"
      transform="rotate(${(k?-22:22)} ${(36+i*17).toFixed(0)} ${(y0+(k?-1:1)*i*7.2).toFixed(0)})"/>`;}
   break;}
  case "회귀 回歸":{                         // 지나간 자신이 겹쳐 보인다
   for(let i=1;i<=3;i++)dcB+=`<path d="${BLADE[s.b]}" fill="none" stroke="${s.e}"
     stroke-width="1" opacity="0" transform="translate(${i*11} ${i*7}) scale(${(1-i*.045).toFixed(3)})"
     transform-origin="100 250">
     <animate attributeName="opacity" values="0;${(.42-i*.1).toFixed(2)};0" dur="3.6s"
       begin="${(i*.45).toFixed(2)}s" repeatCount="indefinite"/></path>`;
   break;}
  case "심판 審判":{                         // 자루 위에 저울이 걸려 있다
   dcB=`<g stroke="${s.e}" fill="none" stroke-width="1.6" opacity=".62">
      <line x1="44" y1="206" x2="156" y2="206"/>
      <line x1="44" y1="206" x2="44" y2="236"/><line x1="156" y1="206" x2="156" y2="236"/>
      <circle cx="100" cy="206" r="5" fill="${s.e}" stroke="none" opacity=".8"/>
      <path d="M26 236 h36 l-18 22 Z" fill="${s.e}" opacity=".35"/>
      <path d="M138 236 h36 l-18 22 Z" fill="none"/>
      <animateTransform attributeName="transform" type="rotate" values="-5 100 206;5 100 206;-5 100 206"
        dur="6s" repeatCount="indefinite"/></g>`;
   break;}
 }
 const spark=s.t>=8?`<g>${[0,1,2,3].map(i=>`<circle cx="${62+i*26}" cy="${92+((i*101)%230)}" r="1.7" fill="#fff">
   <animate attributeName="opacity" values="0;1;0" dur="${1.6+i*.4}s" begin="${i*.35}s" repeatCount="indefinite"/></circle>`).join("")}</g>`:"";
 const VB=s.vb||(s.th==="equinox"?"-62 0 324 560":"0 0 200 560");
 return `<svg viewBox="${VB}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
  <defs>${defs}</defs>${ex}${orbBack}${dcB}
  <g ${glow?`filter="url(#f${id})"`:""}>
   <path class="bl" pathLength="1000" d="${BLADE[s.b]}" fill="url(#b${id})" stroke="${s.e}" stroke-width="1.2"/>
   <path class="bl" pathLength="1000" d="${BLADE[s.b]}" fill="none" stroke="#fff" stroke-width=".6" opacity=".33" transform="translate(0,4) scale(.86 .97)" transform-origin="100 200"/>
   <g class="gd" fill="url(#g${id})" stroke="${s.c[1]}" stroke-width="1">${GUARD[s.g]}</g>
   <rect class="gp" x="91" y="386" width="18" height="104" rx="7" fill="${s.gr}"/>
   ${[0,1,2,3,4].map(i=>`<rect class="gp" x="90" y="${394+i*19}" width="20" height="4" rx="2" fill="#000" opacity=".28"/>`).join("")}
   <circle class="gp" cx="100" cy="502" r="15" fill="url(#g${id})" stroke="${s.c[1]}"/>
   <circle class="gp" cx="100" cy="502" r="7" fill="${s.gem}">${s.t>=6?'<animate attributeName="opacity" values=".55;1;.55" dur="2.4s" repeatCount="indefinite"/>':""}</circle>
  </g>${dcF}${orbFront}${spark}</svg>`;
}
