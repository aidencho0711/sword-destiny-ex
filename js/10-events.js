/* ═════════ 이벤트 ═════════ */
$("btn-forge").onclick=()=>{ac();doRoll();};
$("btn-auto").onclick=()=>{if(!S.up.auto)return;S.auto=!S.auto;renderHUD();save();
 keepAwake(S.auto);if(S.auto&&!rolling)doRoll();};
$("btn-tree").onclick=()=>{renderTree();$("ach-badge").style.display="none";$("tree").classList.add("on");};
$("btn-set").onclick=()=>{ac();renderSettings();$("settings").classList.add("on");};
$("settings").addEventListener("click",e=>{
 const t=e.target.closest("button");if(!t)return;
 if(t.id==="set-close"){$("settings").classList.remove("on");return;}
 if(t.dataset.set==="dev"){ if(hasDev()){$("settings").classList.remove("on");
   renderDev().then(()=>$("devm").classList.add("on"));} return;}
 if(t.dataset.set==="sound"){S.sound=!S.sound;if(S.sound)ac();}
 else if(t.dataset.set==="auto"){S.auto=!S.auto;keepAwake(S.auto);if(S.auto&&!rolling)doRoll();}
 else if(t.dataset.cut!==undefined)S.cutMin=+t.dataset.cut;
 else if(t.dataset.card!==undefined)S.cardMin=+t.dataset.card;
 else if(t.dataset.safe!==undefined)S.safe=+t.dataset.safe;
 else if(t.dataset.perf!==undefined){S.perf=+t.dataset.perf;fpsWarned=false;resolveQ();}
 else return;
 save();renderHUD();renderSettings();});
document.querySelectorAll("nav button").forEach(b=>{b.onclick=()=>{
 document.querySelectorAll("nav button").forEach(x=>x.classList.remove("on"));
 document.querySelectorAll(".view").forEach(v=>v.classList.remove("on"));
 b.classList.add("on");$("v-"+b.dataset.v).classList.add("on");
 $("settings").classList.remove("on");$("tree").classList.remove("on");$("devm").classList.remove("on");
 if(b.dataset.v==="shop")renderShop();if(b.dataset.v==="codex")renderCodex();if(b.dataset.v==="armory")renderArmory();
 renderHUD();};});                                    // 창 전환 시 주화↔보석 표시 갱신

$("v-shop").addEventListener("change",e=>{
 const i=e.target;
 if(i.dataset&&i.dataset.pqi){
  const p=POTIONS.find(x=>x.id===i.dataset.pqi);
  let v=parseInt(String(i.value).replace(/[^0-9]/g,""),10);
  if(!isFinite(v)||v<1)v=1;
  potQty[p.id]=v;renderShop();}
});
$("v-shop").addEventListener("click",e=>{
 const t=e.target;
 if(t.dataset.rb){
  const m=t.dataset.rb;
  if(m==="no"){rbArm=false;renderShop();return;}
  if(m==="arm"){if(!rbCheck().ok)return;rbArm=true;renderShop();return;}
  if(m==="go"){
   if(!rbCheck().ok){rbArm=false;renderShop();toast("조건이 충족되지 않았습니다");return;}
   rbArm=false;doRebirth();renderShop();
   toast(S.rebirth+"회차로 환생했습니다 · 주화 ×"+rbGold().toFixed(2)+" 행운 ×"+rbLuck().toFixed(2));}
  return;}
 if(t.dataset.buy){const u=UPGRADES.find(x=>x.id===t.dataset.buy),c=cost(u);
  if(S.up[u.id]>=u.max||S.gold<c)return;S.gold-=c;S.up[u.id]++;save();renderHUD();renderShop();toast(u.n+" 강화 완료");return;}
 if(t.dataset.pq){
  const [pid,op]=t.dataset.pq.split(":");
  const p=POTIONS.find(x=>x.id===pid);
  let q=Math.max(1,potQty[pid]||1);
  if(op==="+")q++; else if(op==="-")q=Math.max(1,q-1);
  else if(op==="max")q=Math.max(1,Math.floor(S.gold/p.cost));
  potQty[pid]=q;renderShop();return;}
 if(t.dataset.pbuy){
  const p=POTIONS.find(x=>x.id===t.dataset.pbuy);
  const q=Math.max(1,potQty[p.id]||1),total=p.cost*q;
  if(S.gold<total)return;
  S.gold-=total;S.inv[p.id]=(S.inv[p.id]||0)+q;
  save();renderHUD();renderShop();toast(p.n+" "+q+"개 구매");return;}
 if(t.dataset.puse){
  const p=POTIONS.find(x=>x.id===t.dataset.puse);
  const own=S.inv[p.id]||0;
  const n=Math.min(Math.max(1,potQty[p.id]||1),own);
  if(n<1)return;
  S.inv[p.id]=own-n;
  const b=S.buff[p.k],better=p.k==="speed"?p.m<b.m:p.m>b.m;
  const dur=p.sec*1000*(1+(eqf().pdur||0)+AB.pdur);
  if(b.t<=now()||better){b.m=p.m;b.t=now()+dur*n;}else{b.t+=dur*n;}
  save();renderHUD();renderShop();toast(p.n+" "+n+"개 사용");return;}
 if(t.dataset.bmax){
  const u=UPGRADES.find(x=>x.id===t.dataset.bmax);
  const {n,cost:total}=maxUp(u);
  if(!n)return;
  S.gold-=total;S.up[u.id]+=n;
  save();renderHUD();renderShop();toast(u.n+" +"+n+"단계");return;}
 if(t.dataset.cut){S.cutMin=+t.dataset.cut;save();renderHUD();renderShop();
  toast("컷신 · "+cutLabel(S.cutMin));return;}
 if(t.dataset.prev){const R=RARITY.find(r=>r.id===t.dataset.prev);
  ac();playCutscene(pickSword(RARITY.indexOf(R)),R);return;}
 if(t.dataset.prevs){const s=SWORDS.find(x=>x.n===decodeURIComponent(t.dataset.prevs));
  ac();playCutscene(s,RARITY[s.t]);return;}});

$("v-codex").addEventListener("click",e=>{
 if(e.target.dataset.f){S.filter=e.target.dataset.f;renderCodex();return;}
 const tile=e.target.closest(".tile");if(tile)openSheet(decodeURIComponent(tile.dataset.s));});

document.addEventListener("keydown",e=>{
 if(e.code==="Space"){e.preventDefault();doRoll();}
 if(e.code==="Escape"){$("sheet").classList.remove("on");$("settings").classList.remove("on");
  $("tree").classList.remove("on");$("devm").classList.remove("on");}});

setInterval(()=>{
 renderBuffs();
 if($("v-roll").classList.contains("on")){
  $("s-luck").textContent="×"+(luck()>=1000?fmt(luck()):luck().toFixed(2));
  $("speed-txt").textContent=rollDelay().toFixed(2)+"초/회";}
},400);

