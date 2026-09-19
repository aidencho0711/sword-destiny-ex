/* ═════════ 렌더 ═════════ */
function fmt(n){
 if(n>=1e12)return (n/1e12).toFixed(2)+"조";
 if(n>=1e8)return (n/1e8).toFixed(2)+"억";
 if(n>=1e4)return (n/1e4).toFixed(1)+"만";
 return Math.floor(n).toLocaleString();}
function renderHUD(){
 const armOn=$("v-armory")&&$("v-armory").classList.contains("on");
 $("s-gold").textContent=fmt(armOn?(S.gems||0):S.gold);
 const gl=$("s-cur-lbl");if(gl)gl.textContent=armOn?"보석":"주화";
 $("s-luck").textContent="×"+(luck()>=1000?fmt(luck()):luck().toFixed(2));
 $("s-rolls").textContent=S.rolls.toLocaleString();
 $("pity-bar").style.width=Math.min(100,S.pity/pityMax()*100)+"%";
 $("pity-txt").textContent="전설 보장까지 "+Math.max(0,pityMax()-S.pity).toLocaleString()+"회";
 $("speed-txt").textContent=rollDelay().toFixed(2)+"초/회";
 const a=$("btn-auto");a.disabled=!S.up.auto;
 a.textContent=!S.up.auto?"자동 주조 · 잠김":(S.auto?"자동 주조 · 켜짐":"자동 주조 · 꺼짐");
 a.classList.toggle("on",S.auto&&!!S.up.auto);
 renderBuffs();}

const SAFE_LV=[{v:0,n:"기본"},{v:1,n:"완화"},{v:2,n:"최소"}];
const SAFE_DESC=["연출을 원래 강도로 재생합니다.",
 "화면 밝기를 30% 낮추고, 섬광 세기를 절반 이하로 줄이며, 화면 진동을 끕니다.",
 "밝기를 54% 낮추고 섬광을 최소화하며, 흑백 반전·진동·호흡 효과와 별 폭발 연출을 모두 정지합니다."];
function renderSettings(){
 $("settings").innerHTML=`
  <div class="set-head"><h2>설 정</h2><button class="mini" id="set-close">닫기</button></div>
  ${hasDev()?`<div class="sec">${roleLabel(S.role)}</div>
  <div class="card"><div class="card-top"><h3>개발자 메뉴</h3>
    <span class="lv">${roleLabel(S.role)}</span></div>
   <p>주화·행운·검 지급과 컷신 미리보기를 엽니다.${isDev()?" 계정 목록과 부개발자 권한 부여도 여기 있습니다.":" 본인 계정에만 적용됩니다."}</p>
   <div class="btn-row"><button class="buy" data-set="dev">개발자 메뉴 열기</button></div></div>`:""}
  <div class="sec">소리</div>
  <div class="card"><div class="card-top"><h3>효과음 · 음악</h3>
    <span class="lv ${S.sound?"own":""}">${S.sound?"켜짐":"꺼짐"}</span></div>
   <p>주조 효과음, 타자 소리, 컷신 음악을 재생합니다. 기기 정책상 화면을 한 번 누른 뒤부터 소리가 납니다.</p>
   <div class="btn-row"><button class="buy" data-set="sound">${S.sound?"소리 끄기":"소리 켜기"}</button></div></div>
  ${S.up.auto?`<div class="card"><div class="card-top"><h3>자동 주조</h3>
    <span class="lv ${S.auto?"own":""}">${S.auto?"켜짐":"꺼짐"}</span></div>
   <p>손을 떼도 화로가 계속 돕니다.</p>
   <div class="btn-row"><button class="buy" data-set="auto">${S.auto?"자동 주조 끄기":"자동 주조 켜기"}</button></div></div>`:""}
  <div class="sec">컷신</div>
  <div class="card"><div class="card-top"><h3>컷신을 재생할 등급</h3><span class="lv">${cutLabel(S.cutMin)}</span></div>
   <p>선택한 등급부터 컷신이 재생됩니다. 그 아래 등급은 결과만 표시됩니다. 컷신은 중간에 넘길 수 없으니, 자동 주조를 오래 돌릴 때는 기준을 올려 두세요.</p>
   <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:11px">
   ${CUT_STEPS.map(v=>`<button class="chip ${S.cutMin===v?"on":""}" data-cut="${v}">${v>=99?"끄기":RARITY[v].n}</button>`).join("")}</div>
   <div class="eff">${S.cutMin>=99?"모든 컷신이 생략됩니다":
     "재생 대상 "+RARITY.filter(r=>r.mode!=="none"&&RARITY.indexOf(r)>=S.cutMin).length+"개 등급 · 최소 확률 1 / "+RARITY[S.cutMin].one.toLocaleString()}</div></div>
  <div class="card"><div class="card-top"><h3>결과 카드를 띄울 등급</h3>
    <span class="lv">${cutLabel(S.cardMin)}</span></div>
   <p>선택한 등급부터 획득 정보를 카드로 보여줍니다. ${(CARD_MS/1000)}초 후 자동으로 닫히며, 자동 주조는 카드가 닫힐 때까지 멈춥니다. 컷신 기준과 따로 정할 수 있습니다.</p>
   <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:11px">
   ${CUT_STEPS.map(v=>`<button class="chip ${S.cardMin===v?"on":""}" data-card="${v}">${v>=99?"끄기":RARITY[v].n}</button>`).join("")}</div>
   <div class="eff">${S.cardMin>=99?"카드를 띄우지 않습니다":
     "대상 "+(RARITY.length-S.cardMin)+"개 등급 · 최소 확률 1 / "+RARITY[S.cardMin].one.toLocaleString()}</div></div>
  <div class="sec">성능</div>
  <div class="card"><div class="card-top"><h3>연출 품질</h3>
    <span class="lv">${QNAME[S.perf]}${S.perf?"":" (현재 "+QNAME[QLV]+")"}</span></div>
   <p>상위 등급 컷신은 합성 레이어가 많아 기기에 따라 끊길 수 있습니다. 낮출수록 입자와 보조 효과가 줄어듭니다. 자동으로 두면 기기 사양으로 시작해 실제 프레임이 낮을 때 한 단계씩 내립니다.</p>
   <div style="display:flex;gap:5px;margin-top:11px">
   ${[0,1,2,3].map(v=>`<button class="chip ${S.perf===v?"on":""}" data-perf="${v}">${QNAME[v]}</button>`).join("")}</div>
   <div class="eff">${["기기 사양과 프레임에 따라 자동 조정",
     "모든 입자와 효과를 그대로 재생",
     "입자 45% 감소 · 화면 진동과 보조 성운 정지",
     "입자 70% 감소 · 전면 합성과 큰 확대 축소"][S.perf]}</div></div>
  <div class="sec">광과민성 배려</div>
  <div class="card"><div class="card-top"><h3>연출 강도</h3><span class="lv">${SAFE_LV[S.safe].n}</span></div>
   <p>상위 등급 컷신에는 강한 섬광과 흑백 반전, 화면 진동이 포함됩니다. 빛에 민감하시거나 불편함을 느끼신다면 강도를 낮추십시오.</p>
   <div style="display:flex;gap:5px;margin-top:11px">
   ${SAFE_LV.map(o=>`<button class="chip ${S.safe===o.v?"on":""}" data-safe="${o.v}">${o.n}</button>`).join("")}</div>
   <div class="eff">${SAFE_DESC[S.safe]}</div></div>`;}
function renderBuffs(){
 const L=["luck","speed","gold"],N={luck:"행운",speed:"속도",gold:"주화"},h=[];
 L.forEach(k=>{const b=S.buff[k];if(b.t>now()){
  const sec=Math.ceil((b.t-now())/1000);
  h.push(`<div class="buff">${N[k]} ×${k==="speed"?(1/b.m).toFixed(1):b.m} · ${sec}초</div>`);}});
 $("buffs").innerHTML=h.join("");}

const potQty={};                                  // 물약별 구매 수량 (저장하지 않음)
/* 지금 주화로 살 수 있는 최대 강화 단계와 그 총비용 */
function maxUp(u){
 let lv=S.up[u.id],gold=S.gold,n=0,total=0;
 while(lv+n<u.max){
  const c=Math.floor(u.base*Math.pow(u.mul,lv+n));
  if(c>gold)break;
  gold-=c; total+=c; n++;
 }
 return {n,cost:total};}

function renderShop(){
 let h=`<div class="sec">환생</div>`+renderRebirth()+`<div class="sec">소모품</div>`;
 POTIONS.forEach(p=>{
  const own=S.inv[p.id]||0;
  const q=Math.max(1,potQty[p.id]||1);
  const total=p.cost*q, can=S.gold>=total;
  const maxAfford=Math.floor(S.gold/p.cost);
  const useN=Math.min(q,own);
  const val=p.k==="speed"?"주조 속도 ×"+(1/p.m).toFixed(1):(p.k==="luck"?"행운":"주화")+" ×"+p.m;
  h+=`<div class="card pot" style="--pc:${p.col}"><div class="card-top"><span class="pot-ico">${potionSVG(p)}</span><h3>${p.n}</h3><span class="lv own">보유 ${own}</span></div>
   <p>${p.d}</p><div class="eff">${val} · ${p.sec}초</div>
   <div class="qty">
     <button data-pq="${p.id}:-">−</button>
     <input type="text" inputmode="numeric" data-pqi="${p.id}" value="${q}">
     <button data-pq="${p.id}:+">+</button>
     <button data-pq="${p.id}:max" class="qmax">최대</button>
   </div>
   <div class="qhint">구매 ${fmt(total)} 주화 · 최대 ${maxAfford.toLocaleString()}개 구매 가능</div>
   <div class="btn-row">
     <button class="buy" data-pbuy="${p.id}" ${can?"":"disabled"}>${q}개 구매</button>
     <button class="buy use" data-puse="${p.id}" ${useN?"":"disabled"}>${useN>1?useN+"개 사용":"사용"}</button>
   </div></div>`;});
 h+=`<div class="sec">영구 강화</div>`;
 UPGRADES.forEach(u=>{
  const lv=S.up[u.id],mx=lv>=u.max,c=cost(u),can=S.gold>=c;
  h+=`<div class="card"><div class="card-top"><h3>${u.n}</h3><span class="lv">${mx?"최대":lv+" / "+u.max}</span></div>
   <p>${u.d}</p><div class="eff">현재 · ${u.eff(lv)}${mx?"":"　→　"+u.eff(lv+1)}</div>
   <div class="btn-row"><button class="buy" data-buy="${u.id}" ${mx||!can?"disabled":""}>
     ${mx?"더 강화할 수 없습니다":fmt(c)+" 주화로 강화"}</button>
     ${mx?"":`<button class="buy use" data-bmax="${u.id}" style="flex:0 0 108px"
       ${maxUp(u).n?"":"disabled"}>최대 +${maxUp(u).n}</button>`}</div>
   ${mx?"":`<div class="qhint">최대 강화 시 ${fmt(maxUp(u).cost)} 주화 소모 · ${u.eff(Math.min(u.max,lv+maxUp(u).n))}</div>`}
   </div>`;});
 h+=`<div class="sec">현재 능력치</div><div class="card">
   <div class="card-top"><h3>${S.equipped?S.equipped.n:"장착한 검 없음"}</h3></div>
   <p>검 장착과 인첸트는 <b>병기고</b>에서 합니다.</p>
   <div class="eff">${S.equipped?fxText(eqf()):"효과 없음"}</div>
   <div class="eff">합산 · 행운 ×${luck().toFixed(2)} · 주화 ×${goldMult().toFixed(2)} · ${rollDelay().toFixed(3)}초/회 · 보장 ${pityMax().toLocaleString()}회</div></div>`;
 $("v-shop").innerHTML=h;}

function renderCodex(){
 const tabs=[{id:"all",n:"전체"}].concat(RARITY.map(r=>({id:r.id,n:r.n})));
 $("codex-bar").innerHTML=tabs.map(t=>`<button class="chip ${S.filter===t.id?"on":""}" data-f="${t.id}">${t.n}</button>`).join("");
 const list=SWORDS.filter(s=>S.filter==="all"||RARITY[s.t].id===S.filter);
 $("codex-grid").innerHTML=list.map(s=>{
  const c=swordTotal(s.n),R=RARITY[s.t];
  return `<div class="tile ${c?"":"locked"} ${S.equipped&&S.equipped.n===s.n?"equipped":""}" style="--acc:${R.c}" data-s="${encodeURIComponent(s.n)}">
   ${c?`<span class="cnt">${c>999?"999+":c}</span>`:""}
   <div class="art">${swordSVG(s)}</div>
   <div class="tn">${c?gradText(R,s.n):"???"}</div><div class="tr">${gradText(R,R.n)}</div></div>`;}).join("");
 $("codex-badge").style.display="none";
 $("codex-count").textContent=`수집 ${coll()} / ${SWORDS.length}`;
 $("ach-cnt").textContent=`도전 과제 ${ACH.filter(a=>S.ach[a.id]).length} / ${ACH.length}`;}

const TRW=112,TRH=104;                       // 노드 간격
function renderTree(){
 const cols=5,rows=Math.max(...ACH.map(a=>a.y))+1;
 const W=cols*TRW,H=rows*TRH+18;
 const pos=a=>({x:a.x*TRW+(TRW-96)/2,y:a.y*TRH});
 let lines="";
 ACH.forEach(a=>a.p.forEach(pid=>{
  const q=ACHM[pid],A=pos(q),B=pos(a);
  lines+=`<line class="${S.ach[a.id]?"on":""}" x1="${A.x+48}" y1="${A.y+74}" x2="${B.x+48}" y2="${B.y}"/>`;}));
 const nodes=ACH.map(a=>{
  const done=!!S.ach[a.id],open=achOpen(a),P=pos(a);
  return `<div class="nd ${done?"done":open?"open":"lock"}" style="left:${P.x}px;top:${P.y}px">
    <b>${a.n}</b><i>${a.d||""}</i><u>${rewText(a.r)}</u></div>`;}).join("");
 const done=ACH.filter(a=>S.ach[a.id]).length;
 $("tree").innerHTML=`
  <div class="tr-head"><h2>도 전 과 제</h2>
    <span class="sum">${done} / ${ACH.length} · 행운 +${Math.round(AB.luck*100)}% · 주화 +${Math.round(AB.gold*100)}%</span>
    <button id="tr-close">닫기</button></div>
  <div class="tr-canvas" style="width:${W}px;height:${H}px">
    <svg width="${W}" height="${H}">${lines}</svg>${nodes}</div>`;
 $("tr-close").onclick=()=>$("tree").classList.remove("on");}

let rbArm=false;
function renderRebirth(){
 const c=rbCheck(),q=c.q,line=(ok,t)=>`<div class="rb-req ${ok?"ok":"no"}"><s>${ok?"✓":"·"}</s>${t}</div>`;
 return `<div class="rb-card">
   <div class="card-top"><h3>환생</h3><span class="lv">${S.rebirth}회</span></div>
   <p>지금까지 모은 주화와 강화, 소모품을 모두 내려놓고 처음부터 다시 시작합니다.
      도감과 도전 과제, 장착한 검은 그대로 남습니다.</p>
   <div class="eff">현재 보너스 · 주화 ×${rbGold().toFixed(2)} · 행운 ×${rbLuck().toFixed(2)}</div>
   <div class="eff" style="color:var(--ash-dim)">다음 환생 후 · 주화 ×${Math.pow(1.75,S.rebirth+1).toFixed(2)} · 행운 ×${Math.pow(1.45,S.rebirth+1).toFixed(2)}</div>
   <div style="margin-top:11px;border-top:1px solid var(--line);padding-top:9px">
     <div style="font-size:10px;color:var(--ash-dim);letter-spacing:.14em">${S.rebirth+1}회차 조건</div>
     ${line(c.gold,"주화 "+fmt(q.gold)+" 보유  (현재 "+fmt(S.gold)+")")}
     ${q.gems?line(c.gems,"💎 보석 "+q.gems.toLocaleString()+"  (현재 "+(S.gems||0).toLocaleString()+")"):""}
     ${line(c.sword,q.note)}
     ${q.coll?line(c.coll,"도감 "+q.coll+"종  (현재 "+coll()+"종)"):""}
   </div>
   ${rbArm?`
   <div class="rb-warn">주화 ${fmt(S.gold)}, 보석 ${(q.gems||0).toLocaleString()}, 영구 강화 ${Object.values(S.up).reduce((a,b)=>a+b,0)}단계,
     소모품 ${Object.values(S.inv).reduce((a,b)=>a+b,0)}개가 사라집니다. (보석은 요구치만 소모) 되돌릴 수 없습니다.</div>
   <div class="btn-row">
     <button class="buy" data-rb="go">정말 환생한다</button>
     <button class="buy use" data-rb="no" style="flex:0 0 76px">취소</button></div>`:`
   <div class="btn-row"><button class="buy" data-rb="arm" ${c.ok?"":"disabled"}>
     ${c.ok?"환생한다":"조건 미달"}</button></div>`}</div>`;}

function openSheet(name){
 const s=SWORDS.find(x=>x.n===name),R=RARITY[s.t],c=swordTotal(s.n),sh=$("sheet");
 sh.style.setProperty("--acc",R.c);
 sh.innerHTML=`<div class="sheet-art">${c?swordSVG(s):""}</div>
  <div class="sheet-r">${gradText(R,R.n)}</div><div class="sheet-n">${c?gradText(R,s.n):"미발견"}</div>
  <div class="sheet-d">${c?s.d:"아직 이 검을 뽑지 못했습니다."}</div>
  <div class="sheet-meta">
    <div><b>1 / ${R.one.toLocaleString()}</b><span>기본 확률</span></div>
    <div><b>${c.toLocaleString()}</b><span>보유</span></div></div>
  <div class="rc-fx" style="--acc:${R.c};max-width:30em;margin:16px auto 0">
    <i>장착 효과</i><p>${fxText(s.fx||{})}</p></div>
  <div class="btn-row" style="margin-top:20px">
   ${c&&R.mode!=="none"?`<button class="mini" id="sh-cut">컷신 다시 보기</button>`:""}
   <button class="mini" id="sh-close">닫기</button></div>`;
 sh.classList.add("on");
 const cu=$("sh-cut");if(cu)cu.onclick=()=>{sh.classList.remove("on");ac();playCutscene(s,R);};
 $("sh-close").onclick=()=>sh.classList.remove("on");}

let toastT=null;
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("on");
 clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),1600);}
