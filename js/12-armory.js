/* ═════════ 병기고 (인벤토리 · 장착 · 인첸트) ═════════
   보유한 검을 변형별로 분류해 보여주고, 여기서만 장착한다.
   인첸트본은 같은 검이라도 별도 항목으로 취급한다. (인첸트 기능 자체는 2단계) */
const ROMAN=["","I","II","III","IV","V"];
const ENCH_COLOR={luck:"#8fd0c0",gold:"#e0b04a",speed:"#e8a24d",pity:"#c98cff",dupe:"#7fd0e8",pdur:"#9be08a"};
function enchLabel(sw,lv){ return (FXN[enchKey(sw)]||"강화")+" "+(ROMAN[lv]||("+"+lv)); }

/* 한 검의 변형 목록 — 기본(e:0) + 인첸트 레벨별 */
function armVariants(name){
 const out=[];
 if((S.owned[name]||0)>0)out.push({e:0,c:S.owned[name]});
 const em=S.ench&&S.ench[name];
 if(em)Object.keys(em).map(Number).sort((a,b)=>a-b).forEach(lv=>{if(em[lv]>0)out.push({e:lv,c:em[lv]});});
 return out;}

function renderArmory(){
 const eqName=S.equipped?S.equipped.n+(S.equipped.e>0?" ✦"+ROMAN[S.equipped.e]:""):"없음";
 $("arm-head").innerHTML=`
  <div class="arm-top">
    <div class="arm-gem">💎 <b>${fmt(S.gems||0)}</b><span>보석</span></div>
    <div class="arm-eq"><span>장착</span><b>${eqName}</b></div>
  </div>
  <div class="arm-eff">${S.equipped?fxText(eqf()):"장착한 검이 없습니다. 아래에서 검을 눌러 장착하세요."}</div>
  <div class="card arm-ench">${S.rebirth<3
    ? `인첸트는 <b>환생 3회</b>부터 열립니다. (현재 ${S.rebirth}회)`
    : `인첸트 준비 중입니다. 곧 이 자리에서 보석으로 검을 강화할 수 있습니다.`}</div>`;

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
     <div class="art">${swordSVG(s)}</div>
     <div class="tn">${s.n}</div>
     <div class="tr">${v.e>0?enchLabel(s,v.e):R.n}</div>
   </div>`;
  });});
 $("arm-grid").innerHTML=items||`<div class="arm-empty">보유한 검이 없습니다. 화로에서 검을 뽑아 보세요.</div>`;
 $("arm-count").textContent=`수집 ${coll()} / ${SWORDS.length}　·　검을 누르면 장착됩니다`;
}

$("v-armory").addEventListener("click",e=>{
 const t=e.target;
 if(t.dataset&&t.dataset.vf){S.vfilter=t.dataset.vf;renderArmory();return;}
 const tile=e.target.closest(".tile");
 if(tile&&tile.dataset.vn){
  const n=decodeURIComponent(tile.dataset.vn),ev=+tile.dataset.ve;
  const same=S.equipped&&S.equipped.n===n&&(S.equipped.e||0)===ev;
  S.equipped=same?null:{n,e:ev};
  save();renderArmory();renderHUD();
  toast(same?"장착 해제":"장착 · "+n+(ev>0?" ✦"+ROMAN[ev]:""));
 }
});
