/* ═════════ 뽑기 ═════════ */
function rollOnce(L){
 for(let i=RARITY.length-1;i>=1;i--) if(Math.random()<L/RARITY[i].one) return i;
 return 0;}
function pickRarity(){
 const L=luck(),f=eqf();
 if(S.pity>=pityMax())return CUT_FROM;
 let t=rollOnce(L);
 if(f.twin)t=Math.max(t,rollOnce(L));            // 쌍 판정
 if(f.rer&&t<=f.rer)t=Math.max(t,rollOnce(L));   // 재굴림
 return t;}
const pickSword=t=>{const p=SWORDS.filter(s=>s.t===t);return p[Math.floor(Math.random()*p.length)];};

let rolling=false,pending=null,cardT=null;
const CARD_MS=9000;
function showCard(){
 const d=pending;pending=null;if(!d)return;
 const el=$("rcard");
 el.style.setProperty("--acc",d.R.c);
 const fx=d.s.fx||{},eq=S.equipped===d.s.n;
 el.innerHTML=`<div class="rc">
   <div class="rc-art">${swordSVG(d.s)}</div>
   <div class="rc-r">${d.R.n}</div>
   <div class="rc-n">${d.s.n}</div>
   ${d.isNew?'<div class="rc-new"><span>신 규 획 득</span></div>':""}
   <div class="rc-g">
     <div><b>1 / ${d.R.one.toLocaleString()}</b><span>기본 확률</span></div>
     <div><b>#${d.rolls.toLocaleString()}</b><span>주조 회차</span></div>
     <div><b>×${d.luck>=1000?fmt(d.luck):d.luck.toFixed(2)}</b><span>당시 행운</span></div>
     <div><b>+${fmt(d.g)}</b><span>획득 주화</span></div>
     <div><b>${d.own.toLocaleString()}</b><span>보유 수량</span></div>
     <div><b>${d.buff>1?"×"+d.buff:"없음"}</b><span>사용 중 물약</span></div>
   </div>
   <div class="rc-fx"><i>장착 효과</i><p>${fxText(fx)}</p></div>
   <div class="btn-row">
     <button class="mini" id="rc-eq">${eq?"장착 해제":"장착하기"}</button>
     ${d.R.mode!=="none"?'<button class="mini" id="rc-cut">컷신 다시 보기</button>':""}
     <button class="mini" id="rc-x">닫기</button>
   </div>
   <div class="rc-bar"><i style="--rt:${CARD_MS}ms"></i></div>
 </div>`;
 el.classList.add("on");
 clearTimeout(cardT);cardT=setTimeout(closeCard,CARD_MS);
 $("rc-eq").onclick=e=>{e.stopPropagation();
  S.equipped=S.equipped===d.s.n?null:d.s.n;save();renderHUD();toast(S.equipped?"장착했습니다":"해제했습니다");closeCard();};
 const c=$("rc-cut");
 if(c)c.onclick=e=>{e.stopPropagation();clearTimeout(cardT);
  el.classList.remove("on");el.innerHTML="";pending=d;ac();playCutscene(d.s,d.R);};
 $("rc-x").onclick=e=>{e.stopPropagation();closeCard();};}
function closeCard(){
 clearTimeout(cardT);const el=$("rcard");
 if(!el.classList.contains("on"))return;
 el.classList.remove("on");el.innerHTML="";
 if(S.auto&&S.up.auto)setTimeout(doRoll,120);}
$("rcard").addEventListener("click",closeCard);
function afterResult(){
 if(pending)showCard();
 else{pending=null;if(S.auto&&S.up.auto)setTimeout(doRoll,110);}}
function doRoll(){
 if(rolling||$("cs").classList.contains("on")||$("rcard").classList.contains("on"))return;
 rolling=true;
 const btn=$("btn-forge");btn.disabled=true;
 const dur=rollDelay();btn.style.setProperty("--dur",dur+"s");
 btn.classList.remove("charging");void btn.offsetWidth;btn.classList.add("charging");
 $("slot").classList.add("idle");
 $("r-rarity").textContent="주조 중…";$("r-name").textContent="";$("r-odds").textContent="";
 setTimeout(()=>{
  const t=pickRarity(),s=pickSword(t),R=RARITY[t];
  S.rolls++;S.pity=t>=CUT_FROM?0:S.pity+1;
  const isNew=!S.owned[s.n];S.owned[s.n]=(S.owned[s.n]||0)+1;
  let g=Math.floor(R.g*goldMult());
  if(!isNew)g=Math.floor(g*(1+(eqf().dupe||0)));
  S.gold+=g;S.goldTot+=g;
  if(t>S.best)S.best=t;
  if(isNew)$("codex-badge").style.display="block";
  showResult(s,R,g,isNew);checkAch();save();renderHUD();
  rolling=false;btn.disabled=false;
  if(t>=S.cardMin)pending={s,R,g,isNew,rolls:S.rolls,luck:luck(),own:S.owned[s.n],
    buff:S.buff.luck.t>now()?S.buff.luck.m:1};
  if(R.mode!=="none"&&t>=S.cutMin)playCutscene(s,R);
  else afterResult();
 },dur*1000);}

function showResult(s,R,g,isNew){
 const slot=$("slot"),glow=$("glow");
 slot.style.setProperty("--acc",s.acc||R.c);
 slot.style.setProperty("--gb",s.t>=4?(8+s.t*3)+"px":"0px");
 glow.style.setProperty("--acc",R.c);glow.style.opacity=.09+s.t*.03;
 slot.classList.remove("idle","drop");void slot.offsetWidth;
 slot.innerHTML=swordSVG(s);slot.classList.add("drop");
 const ro=$("r-rarity");ro.textContent=R.n+(isNew?" · 신규":"");ro.style.color=R.c;
 $("r-name").textContent=s.n;
 $("r-odds").textContent="1 / "+R.one.toLocaleString()+"　·　+"+fmt(g)+" 주화";
 sfxClink(s.t);
 if(s.t>=CUT_FROM){$("app").classList.add("shake");setTimeout(()=>$("app").classList.remove("shake"),450);}}
