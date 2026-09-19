/* ═════════ 상점 ═════════ */
const UPGRADES=[
 {id:"luck",  n:"행운의 부적", max:45, base:40, mul:1.24,
  d:"화로에 거는 부적. 모든 희귀 등급의 등장 확률을 영구히 끌어올립니다.",
  eff:l=>"행운 ×"+(1+l*0.62).toFixed(2)},
 {id:"speed", n:"신속의 룬",   max:14, base:70, mul:1.5,
  d:"주조 대기 시간을 줄입니다. 뽑기의 밀도가 곧 재미입니다.",
  eff:l=>Math.max(0.12,1.0*Math.pow(0.865,l)).toFixed(2)+"초/회"},
 {id:"greed", n:"탐욕의 저울", max:30, base:130, mul:1.32,
  d:"중복으로 나온 검을 녹여 얻는 주화량이 늘어납니다.",
  eff:l=>"주화 +"+(l*10)+"%"},
 {id:"vault", n:"각인의 제단", max:20, base:350, mul:1.42,
  d:"전설 보장 카운터가 더 빨리 찹니다. 운이 나쁜 날을 위한 보험입니다.",
  eff:l=>"보장 "+(PITY_AT-l*45)+"회"},
 {id:"auto",  n:"자동 주조기", max:1,  base:700, mul:1,
  d:"손을 떼도 화로가 계속 돕니다. 해금 후 화로 화면에서 켜고 끕니다.",
  eff:l=>l?"해금됨":"잠김"},
];
const POTIONS=[
 {id:"p1",n:"행운의 물약",  k:"luck", m:3,   sec:120, cost:150,      d:"120초 동안 행운이 세 배가 됩니다. 가장 먼저 손이 가는 소모품입니다."},
 {id:"p2",n:"대행운의 영약",k:"luck", m:9,   sec:90,  cost:1200,     d:"90초. 신화 구간을 노릴 때 씁니다."},
 {id:"p3",n:"별빛 향유",    k:"luck", m:30,  sec:45,  cost:9000,    d:"45초. 짧고 굵게 초월 이상을 노리는 용도입니다."},
 {id:"p4",n:"운명의 정수",  k:"luck", m:120, sec:30,  cost:150000,  d:"30초. 천상 이상이 현실적인 확률로 들어오는 첫 구간입니다."},
 {id:"p7",n:"심연의 성수",  k:"luck", m:45,  sec:300, cost:900000,    d:"배수는 낮지만 5분을 버팁니다. 실제 사냥 효율은 행운 배수와 지속시간의 곱으로 결정되므로, 운명의 정수보다 3.8배 강합니다."},
 {id:"p8",n:"항성의 정수",  k:"luck", m:150, sec:180, cost:6000000,   d:"3분. 태초가 한 번 사용당 45% 확률로 들어옵니다."},
 {id:"p9",n:"태초의 숨결",  k:"luck", m:600, sec:120, cost:45000000, d:"2분. 태초는 거의 확정이고 운명도 18%까지 올라옵니다."},
 {id:"p10",n:"운명의 파편", k:"luck", m:2500,sec:90,  cost:180000000,       d:"90초. 한 번 사용에 운명이 46% 확률로 들어옵니다. 도감 완성을 위한 마지막 수단입니다."},
 {id:"p5",n:"신속의 가루",  k:"speed",m:0.4, sec:120, cost:500,      d:"120초 동안 주조 속도가 2.5배 빨라집니다. 행운 물약과 함께 쓰세요."},
 {id:"p6",n:"황금 향로",    k:"gold", m:2.2, sec:120, cost:650,      d:"120초 동안 주화 획득이 2.2배가 됩니다."},
];
/* 포션별 색 — 상점에서 한눈에 구별하도록 모형 색과 카드 강조색에 쓴다 */
const POTION_COL={p1:"#5fbf7e",p2:"#4aa8e8",p3:"#b44dff",p4:"#ffd45e",
 p7:"#2f8fb8",p8:"#f0e2a8",p9:"#eaf2ff",p10:"#ff6a7a",p5:"#e8944d",p6:"#e0b04a"};
POTIONS.forEach(p=>{p.col=POTION_COL[p.id]||"#8fd0c0";});

/* ═════════ 환생 ═════════ */
const RB_BASE=[
 {gold:250000,    tier:10, need:1, note:"천상 이상 1자루"},
 {gold:2500000,   tier:11, need:1, note:"신성 이상 1자루"},
 {gold:15000000,  tier:11, need:2, note:"신성 이상 2자루"},
 {gold:80000000,  tier:12, need:1, note:"태초 이상 1자루"},
 {gold:400000000, tier:13, need:1, note:"운명 1자루"},
];
/* ═════════ 구 경제 → 신 경제 환산 ═════════
   주화 가치를 낮췄으므로 기존에 모아 둔 주화도 같은 비율로 내린다.
   환생 요구치가 회차마다 다른 비율로 줄었기 때문에,
   그 계정이 향하던 목표를 기준으로 환산해야 진행도가 그대로 보존된다. */
const ECON_VER=2;
const OLD_RB=[5e8,2e10,8e11,3e13,1e15];
const oldRbReq=n=>n<OLD_RB.length?OLD_RB[n]:1e15*Math.pow(45,n-OLD_RB.length+1);
function migrateEcon(o){
 if(!o||o.econ===ECON_VER)return false;
 const n=o.rebirth||0;
 const f=oldRbReq(n)/rbReq(n).gold;                    // 나눌 배수
 if(isFinite(f)&&f>1){
  o.gold=Math.floor((o.gold||0)/f);
  o.goldTot=Math.floor((o.goldTot||0)/f);
 }
 o.econ=ECON_VER;
 return true;}

function rbReq(n){
 if(n<RB_BASE.length)return RB_BASE[n];
 const k=n-RB_BASE.length+1,c=Math.min(SWORDS.length,30+k*3);
 return {gold:Math.round(400000000*Math.pow(2.3,k)),tier:13,need:1,coll:c,
         note:"운명 1자루 · 도감 "+c+"종"};}
const rbGold=()=>Math.pow(1.75,S.rebirth);   // 환생 1회마다 주화 1.75배
const rbLuck=()=>Math.pow(1.45,S.rebirth);   // 환생 1회마다 행운 1.45배
/* 검 보유 판정 — 기본(owned) + 인첸트본(ench) 모두 고려 */
const enchCount=n=>{const e=S.ench&&S.ench[n];return e?Object.values(e).reduce((a,b)=>a+b,0):0;};
const swordTotal=n=>(S.owned[n]||0)+enchCount(n);
const hasSword=n=>swordTotal(n)>0;
const coll=()=>SWORDS.filter(x=>hasSword(x.n)).length;
const tierCount=t=>SWORDS.filter(x=>x.t>=t&&hasSword(x.n)).length;

/* ═════════ 보석 드랍 ═════════
   신성(11) 이상 뽑을 때 확률로 보석 획득. 등급이 높을수록 확률·개수 증가. */
const GEM_FROM=11;
const GEM_DROP={11:{p:.10,min:1,max:3},12:{p:.12,min:3,max:6},13:{p:.15,min:6,max:10}};
function gemDrop(t){
 const d=GEM_DROP[t]; if(!d||Math.random()>=d.p)return 0;
 return d.min+Math.floor(Math.random()*(d.max-d.min+1));}

/* ═════════ 인첸트 비용·성공률 ═════════
   현재 레벨 lv 에서 lv+1 로 올릴 때의 보석 비용과 성공 확률.
   실패하면 레벨이 1 내려간다(최소 0). 환생 3회부터 사용 가능. */
const ENCH_UNLOCK_RB=3;
const ENCH_COST=[20,40,80,160,320];              // 0→I, I→II, II→III, III→IV, IV→V
const ENCH_RATE=[0.95,0.90,0.75,0.55,0.35];      // 같은 순서의 성공 확률
const enchCost=lv=>ENCH_COST[lv];
const enchRate=lv=>ENCH_RATE[lv];
function rbCheck(){
 const q=rbReq(S.rebirth);
 return {q,gold:S.gold>=q.gold,sword:tierCount(q.tier)>=(q.need||1),
         coll:!q.coll||coll()>=q.coll,
         ok:S.gold>=q.gold&&tierCount(q.tier)>=(q.need||1)&&(!q.coll||coll()>=q.coll)};}
function doRebirth(){
 if(!rbCheck().ok)return false;
 S.rebirth++;
 S.gold=0;S.up={luck:0,speed:0,greed:0,vault:0,auto:0};S.inv={};
 S.buff={luck:{m:1,t:0},speed:{m:1,t:0},gold:{m:1,t:0}};
 S.pity=0;S.auto=false;
 save();checkAch();renderHUD();
 return true;}

/* ═════════ 도전 과제 (트리) ═════════
   x=열(0~4), y=행, p=선행 과제. 보상은 영구 누적된다. */
const ACH=[
 {id:"a0", n:"첫 주조",        d:"검을 한 번 뽑는다",      c:()=>S.rolls>=1,        r:{luck:.02},  x:2,y:0,p:[]},
 {id:"a1", n:"백 번의 담금질",  d:"주조 100회",            c:()=>S.rolls>=100,      r:{speed:.02}, x:0,y:1,p:["a0"]},
 {id:"a2", n:"전설을 보다",     d:"전설 등급 획득",         c:()=>S.best>=6,         r:{luck:.04},  x:2,y:1,p:["a0"]},
 {id:"a3", n:"수집의 시작",     d:"도감 10종",             c:()=>coll()>=10,        r:{gold:.04},   x:4,y:1,p:["a0"]},
 {id:"a4", n:"천 번의 불꽃",    d:"주조 1,000회",          c:()=>S.rolls>=1e3,      r:{speed:.03}, x:0,y:2,p:["a1"]},
 {id:"a5", n:"첫 재산",        d:"누적 주화 1억",          c:()=>S.goldTot>=1e8,    r:{gold:.06},  x:1,y:2,p:["a1"]},
 {id:"a6", n:"신화의 목격자",   d:"신화 등급 획득",         c:()=>S.best>=8,         r:{luck:.05},  x:2,y:2,p:["a2"]},
 {id:"a7", n:"금고를 채우다",   d:"누적 주화 1조",          c:()=>S.goldTot>=1e12,   r:{gold:.08},  x:3,y:2,p:["a3"]},
 {id:"a8", n:"스무 자루",       d:"도감 20종",             c:()=>coll()>=20,        r:{pdur:.1},   x:4,y:2,p:["a3"]},
 {id:"a9", n:"만 번의 망치질",  d:"주조 10,000회",         c:()=>S.rolls>=1e4,      r:{speed:.04}, x:0,y:3,p:["a4"]},
 {id:"a10",n:"초월을 딛다",     d:"초월 등급 획득",         c:()=>S.best>=9,         r:{luck:.06},  x:2,y:3,p:["a6"]},
 {id:"a11",n:"서른 자루",       d:"도감 30종",             c:()=>coll()>=30,        r:{pdur:.15},  x:4,y:3,p:["a7","a8"]},
 {id:"a12",n:"십만 번",         d:"주조 100,000회",        c:()=>S.rolls>=1e5,      r:{pity:120},  x:1,y:4,p:["a9"]},
 {id:"a13",n:"천상에 닿다",     d:"천상 등급 획득",         c:()=>S.best>=10,        r:{luck:.08},  x:2,y:4,p:["a10"]},
 {id:"a14",n:"도감 완성",       d:"47종 전부 수집",         c:()=>coll()>=SWORDS.length, r:{luck:.12,gold:.18}, x:3,y:4,p:["a11"]},
 {id:"a15",n:"신성에 닿다",     d:"신성 등급 획득",         c:()=>S.best>=11,        r:{luck:.1},   x:2,y:5,p:["a13"]},
 {id:"a16",n:"다시 태어나다",   d:"환생 1회",              c:()=>S.rebirth>=1,      r:{gold:.10},   x:0,y:5,p:["a12"]},
 {id:"a17",n:"경의 영역",       d:"누적 주화 1경",          c:()=>S.goldTot>=1e16,   r:{gold:.14},   x:4,y:5,p:["a14"]},
 {id:"a18",n:"태초를 보다",     d:"태초 등급 획득",         c:()=>S.best>=12,        r:{luck:.14},  x:1,y:6,p:["a15"]},
 {id:"a19",n:"운명을 쥐다",     d:"운명 등급 획득",         c:()=>S.best>=13,        r:{luck:.2},   x:3,y:6,p:["a15"]},
 {id:"a20",n:"세 번의 윤회",    d:"환생 3회",              c:()=>S.rebirth>=3,      r:{luck:.15,gold:.20}, x:2,y:7,p:["a16","a17"]},
];
const ACHM=Object.fromEntries(ACH.map(a=>[a.id,a]));
const RN={luck:"행운",gold:"주화 획득",speed:"주조 속도",pdur:"포션 지속",pity:"전설 보장"};
function rewText(r){
 return Object.keys(r).map(k=>k==="pity"?"전설 보장 -"+r[k]+"회"
   :RN[k]+(k==="speed"?" -":" +")+Math.round(r[k]*100)+"%").join(" · ");}
let AB={luck:0,gold:0,speed:0,pdur:0,pity:0};
function recalcAB(){
 AB={luck:0,gold:0,speed:0,pdur:0,pity:0};
 ACH.forEach(a=>{if(S.ach[a.id])for(const k in a.r)AB[k]+=a.r[k];});}
const achOpen=a=>a.p.every(id=>S.ach[id]);
function checkAch(){
 let got=null,n=0;
 for(let pass=0;pass<3;pass++)
  ACH.forEach(a=>{if(!S.ach[a.id]&&achOpen(a)&&a.c()){S.ach[a.id]=true;got=a;n++;}});
 if(n){recalcAB();save();
  toast("도전 과제 달성 · "+got.n+(n>1?" 외 "+(n-1)+"건":""));
  const b=$("ach-badge");if(b)b.style.display="block";}
 return n;}
