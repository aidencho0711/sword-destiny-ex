/* ═════════ 병기고 (인벤토리 · 장착 · 인첸트) ═════════
   보유한 검을 변형별로 분류해 보여주고, 여기서만 장착·인첸트한다.
   인첸트본은 같은 검이라도 별도 항목으로 취급한다. */
const ROMAN=["","I","II","III","IV","V"];
function enchLabel(sw,lv){ return (FXN[enchKey(sw)]||"강화")+" "+(ROMAN[lv]||("+"+lv)); }

/* 한 검의 변형 목록 — 기본(e:0) + 인첸트 레벨별 */
function armVariants(name){
 const out=[];
 if((S.owned[name]||0)>0)out.push({e:0,c:S.owned[name]});
 const em=S.ench&&S.ench[name];
 if(em)Object.keys(em).map(Number).sort((a,b)=>a-b).forEach(lv=>{if(em[lv]>0)out.push({e:lv,c:em[lv]});});
 return out;}
function variantCount(name,lv){ return lv===0?(S.owned[name]||0):((S.ench[name]&&S.ench[name][lv])||0); }

function renderArmory(){
 const eqS=S.equipped&&SWORDS.find(x=>x.n===S.equipped.n);
 const eqName=!S.equipped?"없음"
  :(eqS?gradText(RARITY[eqS.t],eqS.n,eqS):S.equipped.n)+(S.equipped.e>0?" ✦"+ROMAN[S.equipped.e]:"");
 const cloudOn=S.cloud&&typeof cloudReady==="function"&&cloudReady();
 $("arm-head").innerHTML=`
  <div class="arm-top">
    <div class="arm-gem">💎 <b>${fmt(S.gems||0)}</b><span>보석</span></div>
    <div class="arm-eq"><span>장착</span><b>${eqName}</b></div>
    ${cloudOn?`<button class="mini" id="arm-trade" style="flex:0 0 auto;margin-left:8px">거래</button>`:""}
  </div>
  <div class="arm-eff">${S.equipped?fxText(eqf()):"장착한 검이 없습니다. 아래에서 검을 눌러 장착하세요."}</div>
  <div class="card arm-ench">${S.rebirth<ENCH_UNLOCK_RB
    ? `인첸트는 <b>환생 ${ENCH_UNLOCK_RB}회</b>부터 열립니다. (현재 ${S.rebirth}회)`
    : `검을 눌러 상세 창에서 <b>보석</b>으로 인첸트할 수 있습니다.`}</div>`;
 const tb=$("arm-trade"); if(tb)tb.onclick=()=>{if(typeof openTrade==="function")openTrade();};

 const tabs=[{id:"all",n:"전체"}].concat(RARITY.map(r=>({id:r.id,n:r.n})));
 $("arm-bar").innerHTML=tabs.map(t=>`<button class="chip ${S.vfilter===t.id?"on":""}" data-vf="${t.id}">${t.n}</button>`).join("");

 const list=SWORDS.filter(s=>hasSword(s.n)&&(S.vfilter==="all"||RARITY[s.t].id===S.vfilter));
 let items="";
 list.forEach(s=>{const R=RARITY[s.t];
  armVariants(s.n).forEach(v=>{
   const eqd=S.equipped&&S.equipped.n===s.n&&(S.equipped.e||0)===v.e;
   const acc=v.e>0?(ENCH_COLOR[enchKey(s)]||R.c):R.c;
   items+=`<div class="tile ${eqd?"equipped":""} ${v.e>0?"ench":""}" style="--acc:${acc}" data-vn="${encodeURIComponent(s.n)}" data-ve="${v.e}">
     ${v.c>1?`<span class="cnt">×${v.c>999?"999+":v.c}</span>`:""}
     <div class="art">${swordSVG(s,v.e)}</div>
     <div class="tn">${gradText(R,s.n,s)}</div>
     <div class="tr">${v.e>0?enchLabel(s,v.e):gradText(R,R.n)}</div>
   </div>`;
  });});
 $("arm-grid").innerHTML=items||`<div class="arm-empty">보유한 검이 없습니다. 화로에서 검을 뽑아 보세요.</div>`;
 $("arm-count").textContent=`수집 ${coll()} / ${SWORDS.length}　·　검을 누르면 상세 · 장착 · 인첸트`;
}

/* 검 변형 상세 — 장착과 인첸트를 여기서 한다 */
function openArmSheet(name,level){
 const s=SWORDS.find(x=>x.n===name); if(!s)return;
 const R=RARITY[s.t], sh=$("sheet");
 const cnt=variantCount(name,level);
 const eqd=S.equipped&&S.equipped.n===name&&(S.equipped.e||0)===level;
 const acc=level>0?(ENCH_COLOR[enchKey(s)]||R.c):R.c;
 sh.style.setProperty("--acc",acc);

 let enchBlock="";
 if(S.rebirth<ENCH_UNLOCK_RB){
  enchBlock=`<div class="ench-panel locked">인첸트는 환생 ${ENCH_UNLOCK_RB}회부터 열립니다 (현재 ${S.rebirth}회)</div>`;
 }else if(level>=ENCH_MAX){
  enchBlock=`<div class="ench-panel">최고 레벨입니다 · ✦${ROMAN[ENCH_MAX]}</div>`;
 }else{
  const cost=enchCost(level),rate=Math.round(Math.min(.99,enchRate(level)+(eqf().ench||0)+AB.ench)*100),afford=(S.gems||0)>=cost;
  enchBlock=`<div class="ench-panel">
    <div class="ench-row"><span>${level>0?"✦"+ROMAN[level]:"기본"} → ✦${ROMAN[level+1]}</span><b>💎 ${cost}</b></div>
    <div class="ench-row"><span>성공 확률</span><b>${rate}%</b></div>
    <div class="ench-row warn"><span>실패 시</span><b>레벨 1 하락</b></div>
    <div class="ench-next">성공 시 효과 · ${fxText(enchFx(s,level+1))}</div>
    <button class="buy" id="arm-ench-go" ${afford?"":"disabled"}>${afford?"인첸트 하기":"보석 부족"} · 💎${cost}</button>
  </div>`;
 }

 sh.innerHTML=`<div class="sheet-art">${swordSVG(s,level)}</div>
  <div class="sheet-r">${gradText(R,R.n)}${level>0?" · "+enchLabel(s,level):""}</div>
  <div class="sheet-n">${gradText(R,s.n,s)}</div>
  <div class="sheet-d">보유 ${cnt}자루</div>
  <div class="rc-fx" style="--acc:${acc};max-width:30em;margin:14px auto 0"><i>효과</i><p>${fxText(enchFx(s,level))}</p></div>
  ${enchBlock}
  <div class="btn-row" style="margin-top:18px">
    <button class="mini" id="arm-eq">${eqd?"장착 해제":"장착하기"}</button>
    ${R.mode!=="none"?`<button class="mini" id="arm-cut">컷신 다시 보기</button>`:""}
    <button class="mini" id="arm-x">닫기</button>
  </div>`;
 sh.classList.add("on");
 $("arm-eq").onclick=()=>{const same=eqd;S.equipped=same?null:{n:name,e:level};save();renderArmory();renderHUD();
   sh.classList.remove("on");toast(same?"장착 해제":"장착 · "+name+(level>0?" ✦"+ROMAN[level]:""));};
 const cu=$("arm-cut"); if(cu)cu.onclick=()=>{sh.classList.remove("on");ac();playCutscene(s,R);};
 $("arm-x").onclick=()=>sh.classList.remove("on");
 const go=$("arm-ench-go"); if(go)go.onclick=()=>doEnchant(name,level);
}

/* 인첸트 시도 — 보석 소모, 확률 성공, 실패 시 레벨 1 하락 */
function doEnchant(name,level){
 if(S.rebirth<ENCH_UNLOCK_RB){toast("환생 "+ENCH_UNLOCK_RB+"회부터 가능합니다");return;}
 if(level>=ENCH_MAX)return;
 const s=SWORDS.find(x=>x.n===name); if(!s)return;
 const cost=enchCost(level);
 if((S.gems||0)<cost){toast("보석이 부족합니다");return;}
 if(variantCount(name,level)<1){toast("대상 검이 없습니다");return;}
 S.gems-=cost;
 if(level===0)S.owned[name]--; else S.ench[name][level]--;
 const ok=Math.random()<Math.min(.99,enchRate(level)+(eqf().ench||0)+AB.ench);   // 장착 검·도전과제 인첸트 효과 반영
 const nl=ok?level+1:Math.max(0,level-1);
 if(ok)S.enchMax=Math.max(S.enchMax||0,nl);
 if(nl===0)S.owned[name]=(S.owned[name]||0)+1;
 else{S.ench[name]=S.ench[name]||{};S.ench[name][nl]=(S.ench[name][nl]||0)+1;}
 if(S.equipped&&S.equipped.n===name&&(S.equipped.e||0)===level)S.equipped={n:name,e:nl};
 if(level>0&&S.ench[name]&&S.ench[name][level]<=0)delete S.ench[name][level];
 if(S.ench[name]&&!Object.keys(S.ench[name]).length)delete S.ench[name];
 save();renderArmory();renderHUD();
 toast(ok?("✦ 인첸트 성공 · "+ROMAN[nl]):("인첸트 실패 · "+(nl>0?"✦"+ROMAN[nl]:"기본")+"로 하락"));
 openArmSheet(name,nl);
 enchBurst(ok,ENCH_COLOR[enchKey(s)]||"#fff");
}

/* 인첸트 결과 이펙트 — 성공: 색 섬광·링·입자 / 실패: 붉은 섬광·흔들림·✖ */
function enchBurst(ok,color){
 const sh=$("sheet"); if(!sh||!sh.classList.contains("on"))return;
 const b=document.createElement("div");
 b.className="ench-burst "+(ok?"ok":"no");
 b.style.setProperty("--bc",color||"#fff");
 if(ok){
  const n=QC(10);
  b.innerHTML=`<div class="eb-flash"></div><div class="eb-ring"></div><div class="eb-parts">`+
    Array.from({length:n},(_,i)=>`<i style="--a:${Math.round(i*360/n)}deg;--d:${54+(i%3)*16}px"></i>`).join("")+`</div>`;
  setTimeout(()=>b.remove(),1000);
 }else{
  b.innerHTML=`<div class="eb-flash"></div><div class="eb-x">✖</div>`;
  const art=sh.querySelector(".sheet-art");
  if(art){art.classList.remove("eb-shake");void art.offsetWidth;art.classList.add("eb-shake");
   setTimeout(()=>art.classList.remove("eb-shake"),500);}
  setTimeout(()=>b.remove(),820);
 }
 sh.appendChild(b);
}

$("v-armory").addEventListener("click",e=>{
 const t=e.target;
 if(t.dataset&&t.dataset.vf){S.vfilter=t.dataset.vf;renderArmory();return;}
 const tile=e.target.closest(".tile");
 if(tile&&tile.dataset.vn)openArmSheet(decodeURIComponent(tile.dataset.vn),+tile.dataset.ve);
});
