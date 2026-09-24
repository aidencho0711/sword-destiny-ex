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
         arch:a, trait:traitOf(s)};}

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
/* 팀 합산 — 편성 화면에서 한눈에 보여 주는 값 */
function teamSummary(team){
 const st=team.map(n=>SWORDS.find(x=>x.n===n)).filter(Boolean).map(battleStat);
 if(!st.length)return {dmg:0,def:0,spd:0};
 return {dmg:Math.max(...st.map(x=>x.dmg)),
         def:Math.round(st.reduce((a,b)=>a+b.def,0)/st.length),
         spd:+(st.reduce((a,b)=>a+b.spd,0)/st.length).toFixed(2)};}
