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
/* 포션 모형 — 종류별 병 모양 + 고유 색 액체. 상점에서 한눈에 구별하기 위한 것. */
function potionSVG(p){
 const c=p.col||"#8fd0c0", id="p"+(uid++), hi=p.cost>=1e6;   // 고급 물약엔 광채
 const defs=`<linearGradient id="pl${id}" x1="0" y1="0" x2="0" y2="1">
   <stop offset="0%" stop-color="${c}" stop-opacity=".95"/>
   <stop offset="100%" stop-color="${c}" stop-opacity=".6"/></linearGradient>`;
 let glass,liquid;
 if(p.k==="speed"){                       // 키 큰 병 (가루/신속)
  glass=`<rect x="17" y="12" width="14" height="42" rx="6"/>`;
  liquid=`<rect x="19" y="28" width="10" height="24" rx="5" fill="url(#pl${id})"/>`;
 }else if(p.k==="gold"){                   // 넓은 단지 (향로/황금)
  glass=`<path d="M12 27 Q12 19 24 19 Q36 19 36 27 L36 47 Q36 54 24 54 Q12 54 12 47 Z"/>`;
  liquid=`<path d="M14 35 Q24 31 34 35 L34 46 Q34 52 24 52 Q14 52 14 46 Z" fill="url(#pl${id})"/>`;
 }else{                                    // 둥근 플라스크 (행운)
  glass=`<path d="M20 13 L20 25 Q10 33 10 44 Q10 54 24 54 Q38 54 38 44 Q38 33 28 25 L28 13 Z"/>`;
  liquid=`<path d="M15 35 Q24 31 33 35 Q36 41 33 47 Q24 52 15 47 Q12 41 15 35 Z" fill="url(#pl${id})"/>`;
 }
 return `<svg viewBox="0 0 48 62" xmlns="http://www.w3.org/2000/svg">
   <defs>${defs}</defs>
   ${hi?`<circle cx="24" cy="40" r="21" fill="${c}" opacity=".13"/>`:""}
   <g fill="rgba(255,255,255,.05)" stroke="${c}" stroke-width="1.5" stroke-linejoin="round">${glass}</g>
   ${liquid}
   <rect x="19" y="6" width="10" height="9" rx="2" fill="#6a563b"/>
   <rect x="17.5" y="11" width="13" height="3" rx="1.5" fill="#54432e"/>
   <rect x="15" y="18" width="2.6" height="18" rx="1.3" fill="#fff" opacity=".22"/>
   ${hi?`<circle cx="24" cy="40" r="1.6" fill="#fff" opacity=".8"><animate attributeName="cy" values="46;30" dur="2.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.8;0" dur="2.6s" repeatCount="indefinite"/></circle>`:""}
 </svg>`;
}

/* 인첸트 글린트 — 날 모양으로 클립한 대각선 광택이 쓸고 지나간다.
   filter 애니메이션 없이 transform/opacity 만 움직인다. 블렌드는 컨테이너 한 장에만. */
function enchGlint(s,lv,id){
 if(!lv||lv<=0)return "";
 const col=(typeof ENCH_COLOR!=="undefined"&&ENCH_COLOR[enchKey(s)])||"#ffffff";
 const tint=Math.min(.52,.15+lv*.075);          // 지속 착색 (정적 상태에서도 색이 보이게)
 const shine=Math.min(.62,.22+lv*.06);          // 쓸고 지나가는 광택
 const bands=`<rect x="0" y="0" width="150" height="560" fill="url(#eg${id})">
     <animateTransform attributeName="transform" type="translate" from="-170 0" to="360 0"
       dur="2.6s" repeatCount="indefinite"/></rect>
   ${QC(1)?`<rect x="0" y="0" width="95" height="560" fill="url(#eg${id})" opacity=".55">
     <animateTransform attributeName="transform" type="translate" from="-260 0" to="420 0"
       dur="4.1s" repeatCount="indefinite"/></rect>`:""}`;
 return `<clipPath id="ec${id}"><path d="${BLADE[s.b]}"/></clipPath>
  <linearGradient id="eg${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${col}" stop-opacity="0"/>
    <stop offset="42%" stop-color="${col}" stop-opacity="${shine.toFixed(3)}"/>
    <stop offset="50%" stop-color="#ffffff" stop-opacity="${(shine*.95).toFixed(3)}"/>
    <stop offset="58%" stop-color="${col}" stop-opacity="${shine.toFixed(3)}"/>
    <stop offset="100%" stop-color="${col}" stop-opacity="0"/>
  </linearGradient>
  <g clip-path="url(#ec${id})" style="mix-blend-mode:screen">
    <rect x="0" y="0" width="200" height="560" fill="${col}" opacity="${tint.toFixed(3)}">
      <animate attributeName="opacity" values="${(tint*.62).toFixed(3)};${tint.toFixed(3)};${(tint*.62).toFixed(3)}" dur="2.6s" repeatCount="indefinite"/></rect>
    ${bands}
  </g>
  <path d="${BLADE[s.b]}" fill="none" stroke="${col}" stroke-width="${(1.4+lv*.7).toFixed(1)}"
    opacity="${Math.min(.62,.18+lv*.07).toFixed(3)}"/>`;
}
/* ench: 인첸트 레벨(0=기본). 인첸트본이면 전용 글린트 레이어를 덧입힌다. */
function swordSVG(s,ench){
 const elv=(typeof ench==="number"?ench:(ench&&ench.e)||0);
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
  case "무한의 나선":{                        // 끝없이 감기는 나선
   let sp="M100 250";for(let i=0;i<80;i++){const a=i*.5,r=4+i*1.55;sp+=` L${(100+Math.cos(a)*r).toFixed(1)} ${(250+Math.sin(a)*r).toFixed(1)}`;}
   dcB=`<path d="${sp}" fill="none" stroke="${s.e}" stroke-width="1.2" opacity=".5">
     <animateTransform attributeName="transform" type="rotate" from="0 100 250" to="360 100 250" dur="14s" repeatCount="indefinite"/></path>`;
   break;}
  case "경계 밖의 관측":{                      // 경계 밖에서 도는 겹틀
   for(let i=0;i<3;i++)dcB+=`<rect x="${40+i*8}" y="${190+i*8}" width="${120-i*16}" height="${120-i*16}" fill="none" stroke="${s.e}" stroke-width="1" opacity="${(.5-i*.12).toFixed(2)}">
     <animateTransform attributeName="transform" type="rotate" from="${i*15} 100 250" to="${i*15+360} 100 250" dur="${20-i*4}s" repeatCount="indefinite"/></rect>`;
   break;}
  case "무극 無極":{                          // 텅 빈 중심에서 뻗는 살
   dcB=`<circle cx="100" cy="250" r="60" fill="none" stroke="${s.gem}" stroke-width="1" opacity=".4"/>`+
     [0,1,2,3,4,5].map(i=>`<line x1="100" y1="250" x2="${(100+Math.cos(i*1.047)*90).toFixed(1)}" y2="${(250+Math.sin(i*1.047)*90).toFixed(1)}" stroke="${s.e}" stroke-width=".8" opacity=".3"/>`).join("")+
     `<circle cx="100" cy="250" r="14" fill="#04040a" opacity=".7">${AN("r","10","18","3.5")}</circle>`;
   break;}
  case "혼돈의 이빨":{                        // 흩어진 이빨 조각
   for(let i=0;i<7;i++){const a=Math.random()*6.28,r=40+Math.random()*70,x=(100+Math.cos(a)*r).toFixed(0),y=(250+Math.sin(a)*r).toFixed(0);
    dcB+=`<path d="M${x} ${y} l6 14 l-12 0 Z" fill="${s.gem}" opacity=".5"><animate attributeName="opacity" values="0;.6;0" dur="${(2+Math.random()*2).toFixed(1)}s" begin="${(Math.random()*2).toFixed(1)}s" repeatCount="indefinite"/></path>`;}
   break;}
  case "뒤틀린 인과":{                        // 뒤엉켜 지나가는 인과선
   for(let i=0;i<4;i++)dcB+=`<path d="M${30+i*15} 150 Q100 250 ${170-i*15} 350" fill="none" stroke="${s.e}" stroke-width="1" opacity=".35">
     <animate attributeName="opacity" values=".1;.5;.1" dur="${(3+i*.5).toFixed(1)}s" repeatCount="indefinite"/></path>`;
   break;}
  case "혼돈 混沌":{                          // 불규칙하게 도는 소용돌이
   let sw="M100 250";for(let i=0;i<60;i++){const a=i*.6,r=6+i*1.4*(i%2?1:.7);sw+=` L${(100+Math.cos(a)*r).toFixed(1)} ${(250+Math.sin(a)*r).toFixed(1)}`;}
   dcB=`<path d="${sw}" fill="none" stroke="${s.gem}" stroke-width="1.1" opacity=".45">
     <animateTransform attributeName="transform" type="rotate" from="360 100 250" to="0 100 250" dur="12s" repeatCount="indefinite"/></path>`;
   break;}
  case "영겁의 파수꾼":{                       // 영원히 도는 겹고리
   for(let i=0;i<4;i++)dcB+=`<circle cx="100" cy="250" r="${40+i*22}" fill="none" stroke="${s.e}" stroke-width="1" opacity="${(.5-i*.1).toFixed(2)}">
     <animateTransform attributeName="transform" type="rotate" from="0 100 250" to="${i%2?360:-360} 100 250" dur="${16+i*4}s" repeatCount="indefinite"/></circle>`;
   break;}
  case "시간의 종착":{                        // 멈춘 시계
   let ticks="";for(let i=0;i<12;i++){const a=i*.5236;ticks+=`<line x1="${(100+Math.cos(a)*72).toFixed(1)}" y1="${(250+Math.sin(a)*72).toFixed(1)}" x2="${(100+Math.cos(a)*80).toFixed(1)}" y2="${(250+Math.sin(a)*80).toFixed(1)}" stroke="${s.e}" stroke-width="1.4" opacity=".5"/>`;}
   dcB=`<circle cx="100" cy="250" r="80" fill="none" stroke="${s.e}" stroke-width="1" opacity=".4"/>${ticks}
     <line x1="100" y1="250" x2="100" y2="196" stroke="${s.gem}" stroke-width="2" opacity=".7"/>
     <line x1="100" y1="250" x2="140" y2="250" stroke="${s.gem}" stroke-width="2" opacity=".7"/>`;
   break;}
  case "O B L I V I O N":{                    // 보랏빛 망각 — 날이 조금씩 지워지고 흩어진다
   defs+=`<radialGradient id="ob${id}" cx="50%" cy="46%" r="52%">
     <stop offset="0%" stop-color="${s.gem}" stop-opacity=".34"/>
     <stop offset="58%" stop-color="${s.c[1]}" stop-opacity=".16"/>
     <stop offset="100%" stop-color="${s.c[1]}" stop-opacity="0"/></radialGradient>
    <linearGradient id="of${id}" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0%" stop-color="${s.e}" stop-opacity="1"/>
     <stop offset="46%" stop-color="${s.c[0]}" stop-opacity=".82"/>
     <stop offset="100%" stop-color="${s.c[1]}" stop-opacity=".22"/></linearGradient>`;
   /* 뒤에 깔리는 보랏빛 성운과 천천히 도는 고리 */
   dcB=`<ellipse cx="100" cy="240" rx="150" ry="210" fill="url(#ob${id})"/>`;
   for(let i=0,N=QC(3);i<N;i++)
    dcB+=`<circle cx="100" cy="250" r="${74+i*38}" fill="none" stroke="${s.gem}" stroke-width=".9" opacity="${(.3-i*.07).toFixed(2)}">
      <animateTransform attributeName="transform" type="rotate" from="${i*40} 100 250" to="${i*40+(i%2?-360:360)} 100 250"
        dur="${28+i*11}s" repeatCount="indefinite"/></circle>`;
   /* 날이 지워지는 자리 — 어둠이 번졌다 옅어지며 형체를 갉아먹는다 */
   let erase="";
   for(let i=0,N=QC(6);i<N;i++){const y=70+i*(300/N);
    erase+=`<ellipse cx="${88+((i*29)%26)}" cy="${y.toFixed(0)}" rx="${13+((i*17)%12)}" ry="${5+((i*11)%7)}"
      fill="#0b0518" opacity="0">
      <animate attributeName="opacity" values="0;.82;0" dur="${(3.4+i*.7).toFixed(1)}s"
        begin="${(i*.9).toFixed(1)}s" repeatCount="indefinite"/></ellipse>`;}
   /* 흩어져 사라지는 조각 — 위로 떠오르며 옅어진다 */
   let ash="";
   for(let i=0,N=QC(20);i<N;i++){
    const x=(58+((i*37)%86)).toFixed(0),y=(110+((i*53)%250)).toFixed(0);
    ash+=`<rect x="${x}" y="${y}" width="${2+(i%3)}" height="${2+(i%2)}" fill="${i%3?s.c[0]:s.gem}" opacity="0"
      transform="rotate(${(i*47)%90} ${x} ${y})">
      <animate attributeName="opacity" values="0;.85;0" dur="${(2.8+(i%5)*.6).toFixed(1)}s"
        begin="${(i*.27).toFixed(2)}s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="translate" additive="sum"
        values="0 0;${-14+(i%7)*4} -46" dur="${(2.8+(i%5)*.6).toFixed(1)}s"
        begin="${(i*.27).toFixed(2)}s" repeatCount="indefinite"/></rect>`;}
   /* 날 위를 덮는 옅은 장막 — 기억이 바래듯 */
   dcF=`<clipPath id="oc${id}"><path d="${BLADE[s.b]}"/></clipPath>
     <g clip-path="url(#oc${id})">${erase}
       <rect x="0" y="0" width="200" height="560" fill="url(#of${id})" opacity=".3">
         <animate attributeName="opacity" values=".16;.42;.16" dur="5.2s" repeatCount="indefinite"/></rect>
     </g>${ash}`;
   break;}
  case "G L I T C H":{                        // 흑백 + 노이즈. 주변엔 색색의 사각형이 튄다
   const D=`calcMode="discrete"`;             // 부드럽게 말고 뚝뚝 끊기게
   /* 색이 어긋난 잔상 — 날 모양을 빨강·청록으로 좌우로 밀어 겹친다 */
   const ghost=(col,dx,dur,bg)=>`<path d="${BLADE[s.b]}" fill="${col}" opacity=".55">
     <animateTransform attributeName="transform" type="translate" ${D}
       values="${dx} 0;${(dx*3.2).toFixed(0)} -4;${(-dx*.7).toFixed(0)} 3;${dx} 0;${(dx*2.2).toFixed(0)} 5"
       dur="${dur}s" begin="${bg}s" repeatCount="indefinite"/>
     <animate attributeName="opacity" ${D} values=".55;.2;.72;.34;.55" dur="${dur}s" begin="${bg}s" repeatCount="indefinite"/></path>`;
   dcB=ghost("#ff2d4d",-11,.86,0)+ghost("#31e8ff",11,.74,.13);
   /* 날 위를 지나가는 주사선 — 날 모양으로 잘라 낸다 */
   let scan="";
   for(let i=0,N=QC(7);i<N;i++){const y=30+i*(340/N);
    scan+=`<rect x="40" y="${y.toFixed(0)}" width="120" height="${2+(i%2)*2}" fill="#ffffff" opacity=".22">
      <animate attributeName="opacity" ${D} values="0;.3;0;.16;0" dur="${(.5+i*.11).toFixed(2)}s" repeatCount="indefinite"/>
      <animate attributeName="x" ${D} values="40;28;52;36;40" dur="${(.42+i*.09).toFixed(2)}s" repeatCount="indefinite"/></rect>`;}
   /* 가로로 어긋나 잘려 나간 조각 — 날의 일부가 옆으로 밀린다 */
   let slice="";
   for(let i=0,N=QC(3);i<N;i++){const y=90+i*105;
    slice+=`<clipPath id="gc${id}${i}"><rect x="0" y="${y}" width="200" height="26"/></clipPath>
      <g clip-path="url(#gc${id}${i})"><path d="${BLADE[s.b]}" fill="${s.c[0]}" opacity=".9">
      <animateTransform attributeName="transform" type="translate" ${D}
        values="0 0;${18-i*7} 0;0 0;${-14+i*5} 0;0 0" dur="${(1.1+i*.3).toFixed(2)}s" repeatCount="indefinite"/></path></g>`;}
   /* 색색의 사각형 노이즈 — 검 주변에 파티클처럼 떴다 사라진다 */
   const GC=["#ff2d4d","#31e8ff","#ff4df0","#5eff7a","#ffe14d","#ffffff"];
   let sq="";
   for(let i=0,N=QC(26);i<N;i++){
    const a=i*(6.283/N)+(i%3),rr=88+((i*41)%110);
    const w=4+((i*17)%13);
    sq+=`<rect x="${(100+Math.cos(a)*rr).toFixed(0)}" y="${(250+Math.sin(a)*rr*1.5).toFixed(0)}"
      width="${w}" height="${(3+((i*29)%11))}" fill="${GC[i%GC.length]}" opacity="0">
      <animate attributeName="opacity" ${D} values="0;.85;0;.5;0" dur="${(.6+(i%5)*.28).toFixed(2)}s"
        begin="${(i*.13).toFixed(2)}s" repeatCount="indefinite"/></rect>`;}
   dcF=scan+slice+sq;
   break;}
  case "T I M E  D E S T R O Y E R":{        // 부서진 시계들이 검을 둘러싸고 제멋대로 돈다
   defs+=`<radialGradient id="ta${id}" cx="50%" cy="50%" r="50%">
     <stop offset="0%" stop-color="${s.e}" stop-opacity=".26"/>
     <stop offset="55%" stop-color="${s.gem}" stop-opacity=".10"/>
     <stop offset="100%" stop-color="${s.gem}" stop-opacity="0"/></radialGradient>`;
   const rot=(cx,cy,dir,dur,inner)=>`<g>${inner}<animateTransform attributeName="transform" type="rotate"
      from="0 ${cx} ${cy}" to="${dir*360} ${cx} ${cy}" dur="${dur}s" repeatCount="indefinite"/></g>`;
   /* 아우라 — 번져 나가는 고리와 반대로 도는 눈금 테 */
   dcB=`<circle cx="100" cy="258" r="196" fill="url(#ta${id})"/>`;
   for(let i=0;i<3;i++)dcB+=`<circle cx="100" cy="258" r="52" fill="none" stroke="${s.e}" stroke-width="1" opacity="0">
     <animate attributeName="r" values="52;186" dur="5.4s" begin="${(i*1.8).toFixed(1)}s" repeatCount="indefinite"/>
     <animate attributeName="opacity" values="0;.4;0" dur="5.4s" begin="${(i*1.8).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
   dcB+=rot(100,258,-1,46,`<circle cx="100" cy="258" r="168" fill="none" stroke="${s.c[0]}" stroke-width=".8" opacity=".3" stroke-dasharray="3 13"/>`)
      +rot(100,258,1,30,`<circle cx="100" cy="258" r="132" fill="none" stroke="${s.gem}" stroke-width=".7" opacity=".26" stroke-dasharray="20 9"/>`);
   /* 시계 — 시침은 느리게, 분침은 빠르게. 절반은 거꾸로 돈다 */
   [[-20,130,42,1],[226,176,44,-1],[-26,300,34,-1],[234,330,36,1],[10,452,28,1],[198,470,30,-1]]
   .forEach(([cx,cy,r,dir],k)=>{
    let tk="";
    for(let i=0;i<12;i++){const a=i*Math.PI/6,big=i%3===0;
     tk+=`<line x1="${(cx+Math.cos(a)*r*(big?.76:.85)).toFixed(1)}" y1="${(cy+Math.sin(a)*r*(big?.76:.85)).toFixed(1)}"
       x2="${(cx+Math.cos(a)*r*.94).toFixed(1)}" y2="${(cy+Math.sin(a)*r*.94).toFixed(1)}"
       stroke="${s.e}" stroke-width="${big?1.5:.8}" opacity="${big?.7:.4}"/>`;}
    const hand=(len,w,dur,op)=>rot(cx,cy,dir,dur,
     `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${(cy-r*len).toFixed(1)}" stroke="${s.gem}"
       stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`);
    dcB+=`<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#081a34" fill-opacity=".42" stroke="${s.e}" stroke-width="1.2" opacity=".62"/>
      <circle cx="${cx}" cy="${cy}" r="${(r*.86).toFixed(1)}" fill="none" stroke="${s.c[0]}" stroke-width=".6" opacity=".3"/>
      ${tk}${hand(.5,2.4,14+k*3,.9)}${hand(.76,1.4,(4+k*.8).toFixed(1),.72)}
      <circle cx="${cx}" cy="${cy}" r="2.3" fill="${s.e}" opacity=".95"/></g>`;});
   /* 부서진 시간 조각이 검 바깥을 흩날린다 */
   const nsh=QC(7);
   for(let i=0;i<nsh;i++){const a=i*(6.283/nsh),rr=124+((i*37)%68);
    dcF+=`<path d="M${(100+Math.cos(a)*rr).toFixed(1)} ${(258+Math.sin(a)*rr*.82).toFixed(1)} l7 3 l-3 7 l-7 -3 Z"
      fill="${s.gem}" opacity="0"><animate attributeName="opacity" values="0;.72;0"
      dur="${(2.4+(i%4)*.6).toFixed(1)}s" begin="${(i*.41).toFixed(2)}s" repeatCount="indefinite"/></path>`;}
   break;}
  case "영겁 永劫":{                          // 무한대 기호와 큰 고리
   dcB=`<path d="M60 250 C60 226 100 226 100 250 C100 274 140 274 140 250 C140 226 100 226 100 250 C100 274 60 274 60 250 Z" fill="none" stroke="${s.e}" stroke-width="1.6" opacity=".5">
     <animate attributeName="opacity" values=".25;.7;.25" dur="4s" repeatCount="indefinite"/></path>
     <circle cx="100" cy="250" r="96" fill="none" stroke="${s.gem}" stroke-width=".8" opacity=".3">
     <animateTransform attributeName="transform" type="rotate" from="0 100 250" to="360 100 250" dur="24s" repeatCount="indefinite"/></circle>`;
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
  </g>${enchGlint(s,elv,id)}${dcF}${orbFront}${spark}</svg>`;
}
