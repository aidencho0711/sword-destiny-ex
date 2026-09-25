/* ═════════ 배틀 · 능력치와 기술 ═════════
   전투는 뽑기와 완전히 다른 축이다. 여기서만 쓰는 수치를 검 데이터에서 유도한다.

   설계 원칙 — DMG 와 공격속도를 같이 올리면 안 된다.
   DPS = DMG × 속도라 둘 다 오르면 곱해져서 상위 등급이 터무니없어진다.
   그래서 DMG 를 주축으로 삼고 속도는 거의 올리지 않는다. */

const BT_DMG = t => 12 * Math.pow(1.16, t);      // 12 … 150   (12.5배)
const BT_DEF = t =>  6 * Math.pow(1.13, t);      //  6 …  48   (8배)
const BT_SPD = t => 0.85 + t * 0.022;            // 0.85… 1.22 (1.4배)

/* 날 모양이 곧 전투 성격이다 — 검마다 이미 들어 있는 값이라
   59종이 따로 손대지 않아도 전부 다른 수치를 갖는다.
   mo 는 기본 공격 모션(8종). 검별 고유 기술은 이 위에 특징을 얹어 만든다. */
const BLADE_ARCH={
 great:   {n:"대검",     mo:"sweep",  dmg:1.35, spd:0.70, def:1.15, d:"느리게 크게 휘둘러 앞을 넓게 쓸어낸다"},
 fang:    {n:"송곳니",   mo:"lunge",  dmg:1.20, spd:0.85, def:1.00, d:"짧게 파고들어 물어뜯는다"},
 flame:   {n:"화염도",   mo:"cone",   dmg:1.10, spd:0.95, def:0.95, d:"앞쪽으로 부채꼴 화염을 뿜는다"},
 rift:    {n:"균열검",   mo:"blink",  dmg:1.05, spd:1.05, def:0.80, d:"한 걸음 사라졌다 나타나며 벤다"},
 straight:{n:"직검",     mo:"slash",  dmg:1.00, spd:1.00, def:1.05, d:"정직하게 앞을 벤다"},
 crystal: {n:"수정검",   mo:"shard",  dmg:0.95, spd:1.00, def:1.20, d:"날 조각을 쏘아 보낸다"},
 katana:  {n:"도",       mo:"double", dmg:0.90, spd:1.20, def:0.95, d:"한 번에 두 번 벤다"},
 rapier:  {n:"레이피어", mo:"thrust", dmg:0.75, spd:1.45, def:0.85, d:"멀리, 아주 빠르게 찌른다"},
};

/* 검별 고유 특징 — 장착 효과(fx)에서 그대로 끌어온다.
   뽑기에서의 정체성이 전투에서도 이어져야 "그 검답다"가 산다. */
const TRAIT={
 dupe:{id:"drain", n:"흡혈",   d:"처치한 적마다 체력을 조금 되찾는다"},
 gem: {id:"burst", n:"광역",   d:"타격이 주변까지 함께 때린다"},
 pity:{id:"pierce",n:"관통",   d:"적을 꿰뚫고 뒤까지 닿는다"},
 ench:{id:"echo",  n:"분신",   d:"분신이 같은 공격을 뒤따라 낸다"},
 luck:{id:"crit",  n:"치명",   d:"확률로 배로 때린다"},
 speed:{id:"rush", n:"질주",   d:"이동이 빨라지고 재사용이 짧아진다"},
 pdur:{id:"linger",n:"잔존",   d:"공격의 흔적이 바닥에 남아 계속 때린다"},
 gold:{id:"greed", n:"수확",   d:"처치 보상이 늘어난다"},
 twin:{id:"twin",  n:"쌍격",   d:"공격이 두 번 나간다"},
 rer: {id:"recast",n:"재격",   d:"확률로 재사용 대기 없이 한 번 더"},
};
const TRAIT_PRI=["dupe","gem","pity","ench","luck","speed","pdur","gold"];
function traitOf(s){
 const fx=s.fx||{};
 /* twin/rer 은 몇 자루만 가진 간판 효과다. 값이 작다고 큰 수치에 밀리면
    그 검다운 맛이 사라지므로 먼저 본다. */
 if(fx.twin)return TRAIT.twin;
 if(fx.rer)return TRAIT.rer;
 let best=null,bv=-1;
 for(const k of TRAIT_PRI){const v=fx[k]!=null?+fx[k]:-1; if(v>bv){bv=v;best=k;}}
 return TRAIT[best]||TRAIT.luck;}

/* 한 검의 전투 능력치. 인첸트는 전투에서 무시한다 — 같은 이름이면 한 자루로 본다. */
function battleStat(s){
 const a=BLADE_ARCH[s.b]||BLADE_ARCH.straight;
 return {dmg:Math.round(BT_DMG(s.t)*a.dmg),
         def:Math.round(BT_DEF(s.t)*a.def),
         spd:+(BT_SPD(s.t)*a.spd).toFixed(2),
         arch:a, trait:traitOf(s), sig:ABS_SIG[s.n]||null};}

/* ═════════ 출전 규칙 ═════════ */
const BATTLE_RB=1;                                  // 환생 1회부터 열린다
const TEAM_SIZE=3;
const battleOpen=()=>S.rebirth>=BATTLE_RB;
/* 인첸트를 하나로 합친 보유 목록 — 전투에서는 ✦ 구분이 없다 */
const battleOwned=()=>SWORDS.filter(s=>hasSword(s.n));
/* 같은 희귀도는 두 자루 이상 못 든다 */
const teamRarityUsed=team=>team.map(n=>{const s=SWORDS.find(x=>x.n===n);return s?s.t:-1;});
function canAddToTeam(team,name){
 const s=SWORDS.find(x=>x.n===name); if(!s)return {ok:false,why:"없는 검"};
 if(team.includes(name))return {ok:false,why:"이미 넣음"};
 if(team.length>=TEAM_SIZE)return {ok:false,why:"자리가 찼습니다"};
 if(teamRarityUsed(team).includes(s.t))return {ok:false,why:RARITY[s.t].n+" 등급은 이미 한 자루 넣었습니다"};
 return {ok:true};}
/* 아레나에서 검 한 자루가 어떻게 보이는가.

   여태 등급색 하나와 날 모양 8종으로만 그렸더니, 같은 등급색·같은 날을 쓰는
   검들이 화면에서 완전히 똑같아졌다. 실제로 네 무리가 그랬다 —
   태초 셋(EQUINOX·적요·영겁 永劫)은 등급색이 전부 #ffffff 에 rift 라
   서로 구별이 아예 안 됐고, T I M E  D E S T R O Y E R 와 G L I T C H 도 같았다.
   검마다 제 색(acc, c[0], c[1])이 이미 있으니 그걸 쓰면 거의 다 갈라진다. */
function lookOf(s,st){
 const c=s.c||[], rc=RARITY[s.t].c;
 return {col:s.acc||c[0]||rc,                 // 아우라·어깨·가드
         c0:c[0]||rc, c1:c[1]||"#6d7689",     // 칼날 그라디언트
         mo:st.arch.mo, tr:st.trait.id, sig:st.sig,
         nm:s.n, rare:RARITY[s.t].n};
}
const teamEntry=s=>{const st=battleStat(s);return {s,st,look:lookOf(s,st)};};
/* 상대가 보내 온 검 이름 목록 → 전투 정보.
   찾지 못한 이름은 null 로 남긴다. 걸러내 버리면 뒤 칸이 앞으로 당겨져서
   상대가 2번 검을 들었는데 내 화면에는 3번 검이 보인다 —
   한쪽 기기가 옛 캐시를 물고 있어 새 검 이름을 모르면 실제로 이렇게 된다. */
function teamFromNames(names){
 if(!Array.isArray(names))return null;
 return names.map(n=>{const s=SWORDS.find(x=>x.n===n);return s?teamEntry(s):null;});
}
const sameNames=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
  a.length===b.length&&a.every((v,i)=>v===b[i]);
/* 상대·동료를 그릴 때 — 모르는 이름이면 그렇다고 적는다.
   조용히 아무 검이나 그리면 "왜 내 검이랑 똑같지" 가 된다. */
function swordLook(e,fallback){
 return e?e.look
        :{col:fallback||"#8a94a6",c0:fallback||"#8a94a6",c1:"#4a5160",
          mo:"slash",tr:"crit",sig:null,nm:"알 수 없는 검",rare:""};
}
/* 팀 합산 — 편성 화면에서 한눈에 보여 주는 값 */
function teamSummary(team){
 const st=team.map(n=>SWORDS.find(x=>x.n===n)).filter(Boolean).map(battleStat);
 if(!st.length)return {dmg:0,def:0,spd:0};
 return {dmg:Math.max(...st.map(x=>x.dmg)),
         def:Math.round(st.reduce((a,b)=>a+b.def,0)/st.length),
         spd:+(st.reduce((a,b)=>a+b.spd,0)/st.length).toFixed(2)};}

/* ═════════ 보상 ═════════
   웨이브 10 미만은 아무것도 주지 않는다 — 첫 보스는 넘겨야 한다.
   주화 = 웨이브 × 환생배수 × 기본상수. 환생배수(1.75^n)는 환생 요구치보다
   천천히 오르므로, 후반에 보상이 시들해지면 BT_GOLD 만 올리면 된다. */
const BT_MINWAVE=10;
const BT_GOLD=5000;
/* 보상은 지금 가진 것의 몇 % × 도달 웨이브다.
   고정 액수로 두면 반드시 시들해진다 — 주화는 환생마다 자릿수가 바뀌는데
   보상만 제자리에 있으면 몇 회차만 지나도 한 판이 푼돈이 된다.
   자산을 기준으로 삼으면 언제 오든 "한 판에 얼마나 늘었나"가 같게 유지된다.

   웨이브당 1 % — 웨이브 N 까지 가면 가진 주화의 N % 다. 셈이 단순해서
   어디까지 버티면 얼마가 되는지 머릿속에서 바로 그려진다.
   보석은 훨씬 귀하므로 그 절반도 안 되게 둔다.

   다만 가진 게 없으면 몇 %도 0 이다. 그래서 예전의 고정 보상을 바닥에 깐다 —
   막 환생 1회를 넘긴 사람은 이쪽이 잡힌다. */
const BT_PCT_GOLD=0.010;
const BT_PCT_GEM =0.004;
function battleReward(wave){
 if(wave<BT_MINWAVE)return {gold:0,gems:0,wave,pct:0};
 const gold=capNum(Math.max(
   Math.floor(wave*rbGold()*BT_GOLD),                       // 바닥 — 예전 고정 보상
   Math.floor((S.gold||0)*BT_PCT_GOLD*wave)));
 /* 보석 바닥은 잡은 보스 수만큼 — 10웨이브마다 하나씩 */
 let floorGem=0;
 for(let b=1;b*10<=wave;b++)floorGem+=2+b;
 const gems=capNum(Math.max(floorGem,Math.floor((S.gems||0)*BT_PCT_GEM*wave)));
 return {gold,gems,wave,pct:BT_PCT_GOLD*wave};}
/* 보스가 드물게 검을 떨군다. 깊이 갈수록 등급대가 올라가되 상한을 둔다. */
function battleDrop(wave){
 if(wave<BT_MINWAVE||Math.random()>=0.08)return null;
 const top=Math.min(13,4+Math.floor(wave/10));
 const lo=Math.max(2,top-3);
 const t=lo+Math.floor(Math.random()*(top-lo+1));
 const pool=SWORDS.filter(s=>s.t===t);
 return pool.length?pool[Math.floor(Math.random()*pool.length)]:null;}

/* ═════════ 몬스터 8종 ═════════
   hp·dmg 는 기준값이고 웨이브에 따라 배율이 붙는다. */
const MOBS=[
 {id:"chaser", n:"추적자",   c:"#c96a6a", r:15, hp:34, dmg:9,  spd:62,  d:"곧장 걸어온다"},
 {id:"swarm",  n:"군체",     c:"#d8a24a", r:10, hp:16, dmg:6,  spd:104, d:"빠르고 약하다. 여럿이 온다"},
 {id:"charger",n:"돌진체",   c:"#e0724a", r:17, hp:46, dmg:16, spd:52,  d:"멈췄다가 한 번에 달려든다"},
 {id:"shooter",n:"사수",     c:"#7a9fe0", r:14, hp:28, dmg:8,  spd:44,  d:"거리를 두고 쏜다"},
 {id:"shield", n:"방패병",   c:"#8f96a8", r:20, hp:120,dmg:13, spd:34,  d:"단단하다. 뒤를 쳐야 빠르다"},
 {id:"splitter",n:"분열체",  c:"#8fd08a", r:18, hp:52, dmg:10, spd:56,  d:"죽으면 둘로 갈라진다"},
 {id:"bomber", n:"폭발체",   c:"#e05a8a", r:16, hp:30, dmg:26, spd:82,  d:"달려와 터진다"},
 {id:"drifter",n:"부유체",   c:"#b48cff", r:14, hp:40, dmg:11, spd:50,  d:"제멋대로 떠다닌다"},
];
const MOBM=Object.fromEntries(MOBS.map(m=>[m.id,m]));
/* 웨이브 배율 — 체력은 빠르게, 공격력은 천천히 오른다.
   둘 다 빠르면 어느 순간 손쓸 수 없이 죽는다. */
const waveHp =w=>Math.pow(1.105,w-1);
const waveDmg=w=>Math.pow(1.05,w-1);
/* 웨이브마다 나오는 종류 — 뒤로 갈수록 종류가 늘어난다 */
function waveMobs(w){
 const pool=["chaser"];
 if(w>=2)pool.push("swarm");
 if(w>=4)pool.push("charger");
 if(w>=6)pool.push("shooter");
 if(w>=9)pool.push("drifter");
 if(w>=12)pool.push("splitter");
 if(w>=15)pool.push("bomber");
 if(w>=18)pool.push("shield");
 return pool;}
const waveCount=w=>Math.min(22,4+Math.floor(w*0.9));
const isBossWave=w=>w%10===0;

/* ═════════ ABSOLUTE 전용 서명 ═════════
   등급 최상위 세 자루는 고유 특징(trait) 위에 제 테마의 연출을 하나 더 얹는다.
   기존 특징은 그대로 두고, 아우라와 공격에만 붙는다. */
const ABS_SIG={
 "T I M E  D E S T R O Y E R":"tdz",   // 시계 · 되감김 · 잠깐 멎는 시간
 "G L I T C H":"glx",                  // 색 어긋남 · 노이즈 · 튀는 조각
 "O B L I V I O N":"obl",              // 보랏빛 지워짐 · 잊혀 가는 잔상
};
const absSigOf=s=>ABS_SIG[s.n]||null;

/* ═════════ 보스 10종 ═════════
   10웨이브마다 하나. 100웨이브에 한 바퀴 돈다.
   전부 예고(telegraph)가 있는 패턴을 쓴다 — 능력치로 찍어누르는 게 아니라
   읽고 피하는 싸움이 되어야 한다. */
const BOSSES=[
 {id:"crush", n:"파 쇄 자",   c:"#e0724a", r:40, hp:820,  dmg:34, spd:32, d:"내리쳐 충격파를 퍼뜨린다"},
 {id:"watch", n:"감 시 자",   c:"#7a9fe0", r:34, hp:700,  dmg:26, spd:40, d:"긴 빛줄기가 훑고 지나간다"},
 {id:"hive",  n:"군 집 왕",   c:"#8fd08a", r:42, hp:980,  dmg:22, spd:26, d:"쉬지 않고 새끼를 낳는다"},
 {id:"stalk", n:"추 격 자",   c:"#c96a6a", r:32, hp:660,  dmg:30, spd:58, d:"선을 그어 두고 그대로 달려든다"},
 {id:"bomb",  n:"포 격 체",   c:"#d8a24a", r:36, hp:760,  dmg:28, spd:30, d:"바닥에 표식을 찍고 떨어뜨린다"},
 {id:"thorn", n:"가 시 고 리",c:"#b48cff", r:34, hp:880,  dmg:26, spd:36, d:"가시가 돈다. 틈으로 들어가야 한다"},
 {id:"phant", n:"환 영 술 사",c:"#5fe0e8", r:30, hp:620,  dmg:24, spd:52, d:"본체는 하나뿐이다"},
 {id:"devour",n:"포 식 자",   c:"#e05a8a", r:44, hp:1050, dmg:38, spd:24, d:"끌어당겨 삼킨다"},
 /* still — 제자리에 서는 보스. 다른 보스처럼 화면 밖에 세우면
    제 발로 걸어 들어오지 않아 영영 닿을 수 없다. */
 {id:"turret",n:"격 발 탑",   c:"#8f96a8", r:38, hp:900,  dmg:20, spd:0,  still:1, d:"움직이지 않고 나선으로 쏜다"},
 {id:"final", n:"종 말",      c:"#ffffff", r:46, hp:1400, dmg:36, spd:34, d:"앞선 모든 것을 한 몸에 가졌다"},
];
const BOSSM=Object.fromEntries(BOSSES.map(b=>[b.id,b]));
const bossFor=w=>BOSSES[(Math.floor(w/10)-1+BOSSES.length)%BOSSES.length];
