/* ═════════ 배틀 · 출전 편성 ═════════
   인벤토리에서 세 자루를 고른다. 인첸트는 합쳐서 한 자루로 보고,
   같은 희귀도는 두 자루 이상 못 넣는다. */

function renderBattle(){
 const v=$("v-battle");
 if(!battleOpen()){
  v.innerHTML=`<div class="bt-lock">
    <div class="bt-lock-i">⚔</div>
    <h3>배 틀</h3>
    <p>환생 <b>${BATTLE_RB}회</b>부터 열립니다. (현재 ${S.rebirth}회)</p>
    <p class="sub">출전에는 서로 다른 희귀도의 검 ${TEAM_SIZE}자루가 필요합니다.
       환생을 한 번 거치면 자연히 갖춰집니다.</p></div>`;
  return;}

 S.team=(S.team||[]).filter(n=>hasSword(n));
 const team=S.team;
 const sum=teamSummary(team);

 const slots=Array.from({length:TEAM_SIZE},(_,i)=>{
  const n=team[i];
  if(!n)return `<div class="bt-slot empty"><span>${i+1}</span><i>비어 있음</i></div>`;
  const s=SWORDS.find(x=>x.n===n),R=RARITY[s.t],b=battleStat(s);
  return `<div class="bt-slot" style="--acc:${R.c}" data-drop="${encodeURIComponent(n)}">
    <span>${i+1}</span>
    <div class="bt-art">${swordSVG(s)}</div>
    <div class="bt-nm">${gradText(R,s.n,s)}</div>
    <div class="bt-rr">${gradText(R,R.n)}</div>
    <div class="bt-st"><b>${b.dmg}</b><i>DMG</i><b>${b.def}</b><i>DEF</i><b>${b.spd}</b><i>SPD</i></div>
    <button class="bt-x" data-drop="${encodeURIComponent(n)}">빼기</button></div>`;}).join("");

 const used=teamRarityUsed(team);
 const list=battleOwned().map(s=>{
  const R=RARITY[s.t],b=battleStat(s);
  const inTeam=team.includes(s.n);
  const blocked=!inTeam&&used.includes(s.t);
  const full=!inTeam&&!blocked&&team.length>=TEAM_SIZE;
  return `<div class="bt-row ${inTeam?"on":""} ${blocked||full?"no":""}" style="--acc:${R.c}"
      data-pick="${encodeURIComponent(s.n)}">
    <div class="bt-ic">${swordSVG(s)}</div>
    <div class="bt-info">
      <div class="bt-rn">${gradText(R,s.n,s)}</div>
      <div class="bt-rt">${gradText(R,R.n)} · ${b.arch.n} · ${b.trait.n}</div>
    </div>
    <div class="bt-rs"><b>${b.dmg}</b><b>${b.def}</b><b>${b.spd}</b></div>
    <div class="bt-tag">${inTeam?"출전":blocked?"등급 중복":full?"자리 참":""}</div>
  </div>`;}).join("");

 v.innerHTML=`
  <div class="bt-head">
    <h3>출 전 편 성</h3>
    <span>${team.length} / ${TEAM_SIZE}</span>
  </div>
  <div class="bt-slots">${slots}</div>
  <div class="bt-sum">
    <div><b>${sum.dmg}</b><span>최고 공격력</span></div>
    <div><b>${sum.def}</b><span>평균 방어력</span></div>
    <div><b>${sum.spd}</b><span>평균 속도</span></div>
  </div>
  <div class="bt-modes">
    <button class="buy" data-mode="solo" ${team.length<TEAM_SIZE?"disabled":""}>솔로 · 웨이브 생존</button>
    <button class="buy use" data-mode="duo"  ${team.length<TEAM_SIZE?"disabled":""}>듀얼 · 2인 협력</button>
    <button class="buy use" data-mode="pvp"  ${team.length<TEAM_SIZE?"disabled":""}>1 vs 1</button>
  </div>
  <p class="bt-hint">웨이브 <b>${BT_MINWAVE}</b>부터 보상이 나옵니다.
     도달한 웨이브 수가 곧 비율입니다 — 웨이브 N 까지 가면 <b>보유 주화의 N %</b>.
     보석은 웨이브당 <b>${(BT_PCT_GEM*100).toFixed(1)}%</b> 입니다.</p>
  <div class="sec">보유한 검</div>
  <p class="bt-hint">같은 희귀도는 한 자루만 넣을 수 있습니다. 인첸트는 전투에서 구분하지 않습니다.</p>
  <div class="bt-list">${list}</div>`;
}

$("v-battle").addEventListener("click",e=>{
 const d=e.target.closest("[data-drop]");
 if(d){const n=decodeURIComponent(d.dataset.drop);
  S.team=(S.team||[]).filter(x=>x!==n);save();renderBattle();return;}
 const p=e.target.closest("[data-pick]");
 if(p){const n=decodeURIComponent(p.dataset.pick);
  S.team=S.team||[];
  if(S.team.includes(n)){S.team=S.team.filter(x=>x!==n);save();renderBattle();return;}
  const c=canAddToTeam(S.team,n);
  if(!c.ok){toast(c.why);return;}
  S.team.push(n);save();renderBattle();return;}
 const m=e.target.closest("[data-mode]");
 if(m){const md=m.dataset.mode;
  if(md==="pvp"){pvpOpen();return;}
  if(md==="duo"){duoOpen();return;}
  openArena(md);return;}
});
