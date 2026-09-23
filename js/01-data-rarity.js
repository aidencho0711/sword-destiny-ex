
"use strict";
const $=id=>document.getElementById(id);

/* ═════════ 등급 ═════════ */
// mode: none | bloom | star4 | star8 | theme
const RARITY=[
 {id:"common", n:"평범", one:1,         c:"#8d8579", g:1,        mode:"none"},
 {id:"refined",n:"정련", one:4,         c:"#5fbf7e", g:3,        mode:"none"},
 {id:"rare",   n:"희귀", one:18,        c:"#4aa8e8", g:8,       mode:"none"},
 {id:"elite",  n:"정예", one:55,        c:"#3fd8c4", g:20,       mode:"none"},
 {id:"heroic", n:"영웅", one:160,       c:"#a184e8", g:55,      mode:"none"},
 {id:"saga",   n:"서사", one:450,       c:"#e86a9c", g:140,      mode:"none"},
 {id:"legend", n:"전설", one:1200,      c:"#e8b23a", g:400,     mode:"bloom", pd:3.0, end:7000},
 {id:"immortal",n:"불멸",one:4000,      c:"#ff7a3d", g:1300,     mode:"bloom", pd:3.4, end:7600},
 {id:"myth",   n:"신화", one:15000,     c:"#ff4d5e", g:4500,    mode:"star4", pd:3.6, end:8000},
 {id:"transc", n:"초월", one:75000,     c:"#b44dff", g:17000,   mode:"star8", pd:4.2, end:8800},
 {id:"celest", n:"천상", one:400000,    c:"#5fd8e0", g:70000,  mode:"theme", pd:5.2, end:10400},
 {id:"divine", n:"신성", one:2500000,   c:"#f2e6b0", g:320000,  mode:"theme", pd:5.8, end:11200},
 {id:"origin", n:"태초", one:25000000,  c:"#ffffff", g:1600000, mode:"theme", pd:12.432, end:18700},
 {id:"destiny",n:"운명", one:200000000, c:"#ffd45e", g:8000000,       mode:"theme", pd:14.0625, end:20600},
 /* ── 운명 이상: 색이 계속 변하는 그라데이션 등급 (grad+cg), 공용 승천 컷신 ── */
 {id:"aeon",   n:"무극", one:1500000000,    c:"#8fffe0", g:50000000,   mode:"theme", pd:6.4, end:12800, grad:1, cg:["#8fffe0","#7ea6ff","#c58cff"]},
 {id:"chaos",  n:"혼돈", one:15000000000,   c:"#ff8fe0", g:320000000,  mode:"theme", pd:6.8, end:13600, grad:1, cg:["#ff8fe0","#ff7a6a","#ffd36e"]},
 {id:"aeternum",n:"영겁",one:500000000000,  c:"#ffffff", g:2400000000, mode:"theme", pd:7.6, end:15000, grad:1, cg:["#ffffff","#ffe08a","#8fd0ff","#c58cff"]},
 /* ── 최상위: 푸름과 흼이 번갈아 흐르는 등급. 전용 서체(font)와 글자 떨림(jitter)을 쓴다 ── */
 {id:"absolute",n:"ABSOLUTE",one:25000000000000, c:"#bfe0ff", g:20000000000, mode:"theme", pd:8.0, end:15600,
  grad:1, cg:["#2f7fd8","#ffffff","#7fc4ff","#eaf6ff"], font:1, jitter:1},
];
const CUT_FROM=6, PITY_AT=1200;

/* ═════════ 「만상의 눈」 연출 타이밍 (초) ═════════
   여기 숫자만 고치면 키프레임·사운드·컷신 길이가 모두 따라온다. */
const EYE_T={
 silenceDuration:       1.00,  // ① 정적 — 알아보기 어려운 희미한 빛
 eyeAppearDuration:     1.90,  // ② 눈의 등장 — 어둠 속에서 천천히 열린다
 eyeObserveDuration:    0.60,  // ③ 관찰 — 바라본다. 입자가 멈춘다
 blinkDuration:         0.85,  // ④ 깜빡임 — 빛이 중앙으로 빨려든다
 universeRevealDuration:0.95,  // ⑤ 만상 — 정지 → 재개안 → 별들이 펼쳐진다
 swordRevealDuration:   1.80,  // ⑥ 검의 강림 — 빛 속에서 형체가 맺힌다
 finalHoldDuration:     3.40,  // ⑦ 획득 확정 — 광채가 흐르고 이름이 뜬다
};
const EYE_PD=+(EYE_T.silenceDuration+EYE_T.eyeAppearDuration+EYE_T.eyeObserveDuration
              +EYE_T.blinkDuration+EYE_T.universeRevealDuration).toFixed(3);
const EYE_END=Math.round((EYE_PD+EYE_T.swordRevealDuration+EYE_T.finalHoldDuration)*1000);
/* 국면 경계 (초) */
const EYE_M=(()=>{
 const T=EYE_T,a=T.silenceDuration,b=a+T.eyeAppearDuration,c=b+T.eyeObserveDuration,
       d=c+T.blinkDuration,fr=d+T.universeRevealDuration*0.17,
       op=fr+T.universeRevealDuration*0.32;
 return {open:a,gaze:b,blink:c,shut:d,freeze:fr,reopen:op,end:EYE_PD};})();
const eyeP=t=>+(t/EYE_PD*100).toFixed(2);

/* ═════════ 「창세의 첫 획」 연출 타이밍 (초) ═════════ */
const INK_T={
 voidDuration:        0.90,  // ① 무 — 어둠. 끝에 최초의 점 하나
 firstStrokeDuration: 1.40,  // ② 첫 획 — 점에서 획이 그어진다
 creationDuration:    1.30,  // ③ 생성 — 획이 지나간 자리에서 세계가 생겨난다
 genesisFlashDuration:0.80,  // ④ 창세 — 가능성들이 잠깐 펼쳐진다
 swordFormDuration:   1.30,  // ⑤ 검의 탄생 — 획이 검이 된다
 finalHoldDuration:   4.90,  // ⑥ 완성 — 후광과 광채, 그리고 이름
};
/* 첫 획의 기하 — 위치·길이·각도·굵기·밝기를 여기서 조정한다 (뷰박스 0~100) */
const INK_S={
 x1: 4, y1: 94,   // 획의 한쪽 끝
 x2: 96, y2:  8,  // 획의 반대쪽 끝
 bow: 15,         // 휘어지는 정도 (0이면 직선)
 seedT: 0.5,      // 획 위에서 최초의 점이 놓이는 위치 (0~1)
 width: 3.0,      // 굵기 (화면 픽셀)
 tail: 1.3,       // 되짚는 쪽 굵기
 glow: 18,        // 광량 (픽셀)
 fwd: 0.78,       // 앞으로 긋는 데 쓰는 시간 비율
};
const INK_PD=+(INK_T.voidDuration+INK_T.firstStrokeDuration
              +INK_T.creationDuration+INK_T.genesisFlashDuration).toFixed(3);
const INK_END=Math.round((INK_PD+INK_T.swordFormDuration+INK_T.finalHoldDuration)*1000);
const INK_M=(()=>{const T=INK_T,a=T.voidDuration,b=a+T.firstStrokeDuration,
 c=b+T.creationDuration;return {
  seed:a-0.35, stroke:a, strokeEnd:b, create:b, createEnd:c,
  genesis:c, genesisPeak:c+T.genesisFlashDuration*0.34, end:INK_PD};})();
const inkP=t=>+(t/INK_PD*100).toFixed(2);
/* 이차 베지어 — 획의 경로와 분할 */
const inkQuad=(()=>{
 const S=INK_S,P0=[S.x1,S.y1],P2=[S.x2,S.y2];
 const mx=(S.x1+S.x2)/2,my=(S.y1+S.y2)/2;
 const dx=S.x2-S.x1,dy=S.y2-S.y1,L=Math.hypot(dx,dy)||1;
 const C=[mx-dy/L*S.bow,my+dx/L*S.bow];
 const at=t=>{const u=1-t;return [u*u*P0[0]+2*u*t*C[0]+t*t*P2[0],
                                  u*u*P0[1]+2*u*t*C[1]+t*t*P2[1]];};
 const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 const split=t=>{const A=lerp(P0,C,t),B=lerp(C,P2,t),M=lerp(A,B,t);
   return {back:[M,A,P0],fwd:[M,B,P2]};};
 const d=q=>`M${q[0][0].toFixed(2)} ${q[0][1].toFixed(2)} Q${q[1][0].toFixed(2)} ${q[1][1].toFixed(2)} ${q[2][0].toFixed(2)} ${q[2][1].toFixed(2)}`;
 return {P0,P2,C,at,split,d};})();

/* ═════════ 「T I M E  D E S T R O Y E R」 연출 타이밍 (초) ═════════
   검이 등장하지 않는 유일한 컷신. 대사 순서는 고정이고, 시각만 여기서 조정한다.
   l1~a 는 자막이 뜨는 시각, title 은 이름이 화면을 채우는 시각,
   open/close 는 어두워지고 다시 밝아지는 두 번의 아우라 시점이다. */
const TDZ_T={
 open:  1.25,   // ① 중앙에서 아우라가 퍼지며 화면이 서서히 → 빠르게 어두워진다
 l1:    2.00,   // ② "Why do you think time always goes only one way?"
 l2:    6.20,   // ③ "I don't follow time." — 여기서부터 시계가 느려진다
 l3:    8.60,   // ④ "Time follows me." — 웅 거리며 초록으로, 시간이 거꾸로 흐른다
 stop:  8.10,   // 시계가 완전히 멎는 시각 (회색)
 f:    10.90,   // ⑤ "FOR" — 다른 차원의 시계들이 열리기 시작한다
 i:    11.75,   // ⑥ "I"
 a:    12.50,   // ⑦ "AM"
 title:13.40,   // ⑧ 이름이 떨리며 화면을 채운다 (배경은 그대로)
 close:16.00,   // ⑨ 다시 아우라가 퍼지며 화면이 서서히 → 빠르게 밝아진다
 fade:  1.40,   // 밝아지는 데 걸리는 시간
};
const TDZ_PD=TDZ_T.close;
const TDZ_END=Math.round((TDZ_T.close+TDZ_T.fade)*1000);
