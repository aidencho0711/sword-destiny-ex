/* ═════════ 검 ═════════ */
// b:날 g:가드 c:[밝은색,어두운색] e:날끝 gem gr:손잡이 th:전용테마
const SWORDS=[
 {t:0,n:"낡은 철검",b:"straight",g:"bar",c:["#6e7075","#494c50"],e:"#9aa0a6",gem:"#6b6f74",gr:"#4a3c2e",d:"창고 구석에서 녹과 함께 늙었다. 그래도 벨 수는 있다."},
 {t:0,n:"견습생의 도",b:"katana",g:"bar",c:["#787a7e","#525458"],e:"#a3a8ad",gem:"#5c5f63",gr:"#3e3529",d:"첫 손잡이는 언제나 미끄럽다."},
 {t:0,n:"병영 지급검",b:"straight",g:"cross",c:["#73757a","#4d5054"],e:"#95999e",gem:"#5f6367",gr:"#453a30",d:"천 자루 중 한 자루. 이름은 없다."},
 {t:0,n:"무딘 대검",b:"great",g:"bar",c:["#6b6d71","#46484c"],e:"#8e9297",gem:"#585b5f",gr:"#40362b",d:"베기보다 때리기에 가깝다."},
 {t:1,n:"은도금 장검",b:"straight",g:"cross",c:["#cdd6cf","#7f8f85"],e:"#e8f2ea",gem:"#7fd4a0",gr:"#2f3f36",d:"장식용으로 만들어졌지만 날은 진짜다."},
 {t:1,n:"사냥꾼의 사브르",b:"katana",g:"wing",c:["#9fd6ac","#4d7a5c"],e:"#d6f5dd",gem:"#5fbf7e",gr:"#33452f",d:"짐승의 결을 아는 자만이 이 곡선을 이해한다."},
 {t:1,n:"숲지기의 칼",b:"rapier",g:"ring",c:["#b4e0bc","#568a66"],e:"#e2f7e6",gem:"#79cf92",gr:"#2d3a2c",d:"나무를 베지 않기 위해 만들어진 검."},
 {t:1,n:"강철 파쇄검",b:"great",g:"cross",c:["#a8c4ad","#5a7a61"],e:"#d8ecda",gem:"#6ec48a",gr:"#354338",d:"방패를 부수는 용도. 검이라 부르기는 애매하다."},
 {t:2,n:"서리이빨",b:"crystal",g:"wing",c:["#b8e6ff","#2f7fb8"],e:"#e4f6ff",gem:"#4aa8e8",gr:"#1e3a4d",d:"칼집에 성에가 낀다. 뽑으면 숨결이 하얗게 변한다."},
 {t:2,n:"심해의 갈퀴",b:"fang",g:"ring",c:["#7fd0e8","#1f6a92"],e:"#cdf0ff",gem:"#38b4d8",gr:"#16303f",d:"물에 젖은 적이 없는데 늘 젖어 있다."},
 {t:2,n:"뇌문도",b:"katana",g:"cross",c:["#a6d8ff","#3a76c4"],e:"#dceeff",gem:"#5fa8f0",gr:"#1c2f4a",d:"날의 무늬가 번개가 지나간 자국이라는 소문이 있다."},
 {t:2,n:"비취 낫검",b:"flame",g:"wing",c:["#9de0d4","#2b7f78"],e:"#d6f7f0",gem:"#44c4b4",gr:"#1b3a38",d:"곡선을 따라 베면 상처가 늦게 벌어진다."},
 {t:3,n:"흑철 근위검",b:"straight",g:"crown",c:["#7fe0d0","#1f6a66"],e:"#cbfff4",gem:"#3fd8c4",gr:"#13332f",d:"성문 앞에 백 년을 서 있던 자들의 제식검."},
 {t:3,n:"백랑의 송곳니",b:"fang",g:"wing",c:["#a8f0e0","#2a8478"],e:"#dbfff6",gem:"#52e0c8",gr:"#173b36",d:"무리를 잃은 늑대의 이빨로 날을 세웠다."},
 {t:3,n:"사막 유리검",b:"crystal",g:"ring",c:["#9ae8dc","#26776f"],e:"#d2fff6",gem:"#47d8c0",gr:"#12332e",d:"모래가 번개를 맞은 자리에서 캐냈다."},
 {t:4,n:"흑요석 파멸검",b:"great",g:"crown",c:["#8f6be0","#3b2a66"],e:"#c9b0ff",gem:"#a184e8",gr:"#241a3d",d:"들어올린 자의 그림자가 한 박자 늦게 따라온다."},
 {t:4,n:"용린검",b:"flame",g:"wing",c:["#c48ae8","#5a2f7a"],e:"#e8c9ff",gem:"#b06ae0",gr:"#2e1a3d",d:"비늘을 한 장씩 겹쳐 두드려 만든 날. 열에 강하다."},
 {t:4,n:"성좌의 레이피어",b:"rapier",g:"ring",c:["#b0a0f0","#4a3a90"],e:"#ded6ff",gem:"#8f7ae8",gr:"#241d47",d:"찌를 때마다 밤하늘의 한 점이 잠깐 어두워진다."},
 {t:4,n:"혈월도",b:"katana",g:"crown",c:["#a878e0","#4a2a70"],e:"#d8bcff",gem:"#9c6ad8",gr:"#2a1a3a",d:"보름달이 붉을 때만 제 무게를 되찾는다."},
 {t:5,n:"폭풍을 삼킨 칼",b:"flame",g:"halo",c:["#ff9ec4","#a02f66"],e:"#ffd6e8",gem:"#e86a9c",gr:"#4d1533",d:"칼집에 귀를 대면 아직도 바람 소리가 난다."},
 {t:5,n:"불사조 깃대검",b:"rapier",g:"wing",c:["#ffb0cc","#b03a72"],e:"#ffdcec",gem:"#f濃",gr:"#551a3a",d:"부러질 때마다 더 얇고 날카롭게 다시 선다."},
 {t:5,n:"그림자 계약검",b:"rift",g:"crown",c:["#f090b8","#8f2a5c",],e:"#ffcfe2",gem:"#ff6aa0",gr:"#45122e",d:"주인을 고르지 않는다. 대가만 고른다."},
 {t:6,n:"여명의 서약",b:"straight",g:"halo",c:["#ffe08a","#b8781f"],e:"#fff6d4",gem:"#e8b23a",gr:"#4a3210",d:"해가 뜨는 방향으로만 날이 선다. 맹세를 어기면 무뎌진다."},
 {t:6,n:"심연의 포식자",b:"fang",g:"crown",c:["#e0b04a","#6b4410"],e:"#ffedb8",gem:"#ffcc55",gr:"#3d2a0c",d:"벤 것의 이름을 기억한다. 주인의 이름도 언젠가는."},
 {t:6,n:"뇌신 무라쿠모",b:"katana",g:"ring",c:["#ffd76e","#a06c14"],e:"#fff4c4",gem:"#f0b840",gr:"#443008",d:"구름을 가르고 나온 칼. 뽑는 소리가 천둥과 같다."},
 {t:6,n:"파멸의 왕관검",b:"great",g:"crown",c:["#f0c05a","#8f5e12"],e:"#fff0bc",gem:"#e8b43c",gr:"#3f2c0a",d:"왕을 셋 베고 왕관을 셋 삼켰다."},
 {t:7,n:"재의 불사자",b:"flame",g:"halo",c:["#ffb07a","#a8410f"],e:"#ffe0c8",gem:"#ff7a3d",gr:"#4d1e08",d:"타고 남은 것으로 다시 벼려졌다. 여덟 번째다."},
 {t:7,n:"천년의 맹세",b:"straight",g:"crown",c:["#ffc49a","#b84f16"],e:"#ffe8d4",gem:"#ff8f52",gr:"#54230a",d:"약속한 자는 모두 죽었고, 검만 아직 지키고 있다."},
 {t:7,n:"시간을 거스르는 날",b:"rift",g:"ring",c:["#ffa870","#9c3c0c"],e:"#ffddc0",gem:"#ff6f28",gr:"#471c06",d:"벤 상처가 벤 순간보다 먼저 생긴다."},
 {t:8,n:"세계수의 가지",b:"rift",g:"halo",c:["#ff8f9e","#a01f32"],e:"#ffd0d6",gem:"#ff4d5e",gr:"#5c1020",d:"아직도 자란다. 매달 조금씩 길어진다."},
 {t:8,n:"종언의 나팔검",b:"flame",g:"crown",c:["#ff7f92","#8f1a2e"],e:"#ffc6ce",gem:"#ff3d52",gr:"#54101f",d:"휘두르면 소리가 나지 않는다. 소리가 뒤늦게 도착한다."},
 {t:8,n:"별을 가르는 자",b:"crystal",g:"halo",c:["#ff9aa8","#b02a40"],e:"#ffd8de",gem:"#ff5a70",gr:"#601624",d:"한 번 휘두른 자리에 별자리가 하나 사라졌다."},
 {t:9,n:"공허의 이빨",b:"fang",g:"none",c:["#cf9aff","#6a1fa8"],e:"#ecd4ff",gem:"#b44dff",gr:"#330d52",d:"베인 자리에 아무것도 남지 않는다. 상처조차."},
 {t:9,n:"법칙의 조각",b:"crystal",g:"halo",c:["#c48aff","#5c1a9c"],e:"#e8ccff",gem:"#a83dff",gr:"#2c0a4a",d:"세계가 깨질 때 떨어져 나온 한 줄의 규칙."},
 {t:9,n:"무형의 칼",b:"rift",g:"none",c:["#d8aaff","#7228b8"],e:"#f0dcff",gem:"#c05dff",gr:"#3a1058",d:"형태가 없어서 막을 수도 없다."},
 {t:10,n:"천구의 축",b:"rift",g:"halo",c:["#a0f0f5","#1a7f8a"],e:"#d8ffff",gem:"#5fd8e0",gr:"#0d3d44",th:"orrery",d:"하늘이 도는 기준점. 이 검은 움직이지 않고 세계가 돈다."},
 {t:10,n:"뇌정의 심판",b:"katana",g:"crown",c:["#b8f0ff","#1f6f92"],e:"#e4ffff",gem:"#6fe0f0",gr:"#0f3340",th:"storm",d:"판결은 소리보다 먼저 도착한다."},
 {t:11,n:"만상의 눈",b:"crystal",g:"halo",c:["#fff4c8","#a8955a"],e:"#fffbe8",gem:"#f2e6b0",gr:"#4a4020",th:"eye",pd:EYE_PD,end:EYE_END,d:"보는 것이 아니라 보여지는 쪽이 된다."},
 {t:11,n:"창세의 첫 획",b:"rift",g:"none",c:["#fff8d8","#b0a068"],e:"#ffffff",gem:"#f7ecc0",gr:"#524628",th:"ink",pd:INK_PD,end:INK_END,d:"검이 아니라 획이다. 무언가를 처음 나눈 흔적."},
 {t:12,n:"EQUINOX",b:"rift",g:"none",c:["#ffffff","#111111"],e:"#ffffff",gem:"#ffffff",gr:"#6e6e6e",th:"equinox",d:"음과 양, 있음과 없음을 모두 가진 채 경계 밖에 선다. 남은 방향은 영(零)뿐이다."},
 {t:12,n:"적요 寂寥",b:"rift",g:"none",c:["#f2f4f8","#7d838c"],e:"#ffffff",gem:"#e8ecf2",gr:"#6a6f77",
  th:"hush",pd:6.4,end:13000,acc:"#dfe6ee",vb:"-30 0 260 560",d:"소리가 닿지 않는 자리. 이 검이 지난 곳은 한동안 아무 말도 들리지 않는다."},
 {t:12,n:"태동 胎動",b:"straight",g:"halo",c:["#fff6e0","#b8a680"],e:"#fffdf6",gem:"#ffeec0",gr:"#6e6450",
  th:"breath",pd:6.4,end:13000,acc:"#ffe9b0",d:"아직 태어나지 않은 것이 처음으로 몸을 뒤척였다."},
 {t:12,n:"관측자 觀測者",b:"rapier",g:"ring",c:["#dff4ff","#6f8ea0"],e:"#f4fcff",gem:"#c8ecff",gr:"#4a5c66",
  th:"grid",pd:6.4,end:13000,acc:"#bfe6ff",vb:"-56 0 312 560",d:"재기 전까지 세계는 정해져 있지 않았다. 이 검이 눈금을 그었다."},
 {t:13,n:"O P P R E S S I O N",b:"great",g:"crown",c:["#e6ebf2","#6a717c"],e:"#ffffff",gem:"#cfd6e0",gr:"#3a3f47",
  th:"oppress",pd:10.2,end:19500,acc:"#cfd6e0",d:"눌러 두는 것이 목적이다. 베는 것은 그 다음이다."},
 {t:13,n:"회귀 回歸",b:"crystal",g:"halo",c:["#ffe89a","#8a6f20"],e:"#fffbe0",gem:"#ffd45e",gr:"#4a3708",
  th:"recur",pd:8.4,end:15500,vb:"-34 0 268 560",d:"같은 순간으로 몇 번이나 돌아왔는지 세는 것을 그만두었다."},
 {t:13,n:"심판 審判",b:"great",g:"cross",c:["#fff0b8","#9a7a18"],e:"#fffce8",gem:"#ffdf6e",gr:"#4f3c0a",
  th:"scale",pd:8.4,end:15500,d:"빛과 어둠을 같은 접시에 올린다. 기우는 쪽이 곧 판결이다."},
 {t:13,n:"천기 天機",b:"straight",g:"halo",c:["#ffe89a","#b8912a"],e:"#fffbe0",gem:"#ffd45e",gr:"#4f3a0c",th:"fate",d:"하늘의 기틀. 이 검을 쥔 자는 고르지 않는다. 이미 골라져 있었을 뿐이다."},
 /* ── 운명 이상: 무극(14)·혼돈(15)·영겁(16). 공용 승천 컷신(th:ascend) ── */
 {t:14,n:"무한의 나선",b:"rift",g:"halo",c:["#bfffe6","#2f9f86"],e:"#e8fff6",gem:"#5fe0c4",gr:"#123a32",th:"ascend",d:"끝을 향해 감기지만 끝이 없다. 감길수록 처음에서 멀어질 뿐이다."},
 {t:14,n:"경계 밖의 관측",b:"crystal",g:"ring",c:["#bcd0ff","#5a6fd0"],e:"#eef2ff",gem:"#8fa0ff",gr:"#1c2350",th:"ascend",d:"선 밖에서 보면, 안에 있던 모든 것이 한 점이었다."},
 {t:14,n:"무극 無極",b:"great",g:"crown",c:["#d8bcff","#6a3fb0"],e:"#f2e6ff",gem:"#b48cff",gr:"#2a1a4a",th:"ascend",d:"더 나눌 수 없고 더 합칠 수 없는 자리. 끝도 시작도 없는 곳."},
 {t:15,n:"혼돈의 이빨",b:"fang",g:"crown",c:["#ff9ce0","#a02f7a"],e:"#ffd6f2",gem:"#ff6ac4",gr:"#4a1236",th:"ascend",d:"물릴 때마다 규칙이 하나씩 사라진다. 무엇이 남을지는 정해지지 않았다."},
 {t:15,n:"뒤틀린 인과",b:"rift",g:"none",c:["#ffb0a0","#a03f2f"],e:"#ffe0d6",gem:"#ff7a5a",gr:"#4a1e12",th:"ascend",d:"결과가 원인을 고른다. 벤 뒤에야 왜 베였는지 정해진다."},
 {t:15,n:"혼돈 混沌",b:"flame",g:"crown",c:["#ffcf6e","#b07a1a"],e:"#fff0c4",gem:"#ffb84a",gr:"#4a3208",th:"ascend",d:"질서가 잠깐 한눈판 사이, 세계는 이 모습이었다."},
 {t:16,n:"영겁의 파수꾼",b:"great",g:"crown",c:["#ffffff","#8a8a9a"],e:"#ffffff",gem:"#e8ecf5",gr:"#3a3f4a",th:"ascend",d:"셀 수 없는 시간을 서 있었다. 무엇을 지키는지는 잊은 지 오래다."},
 {t:16,n:"시간의 종착",b:"crystal",g:"halo",c:["#ffe89a","#8a6f20"],e:"#fffbe0",gem:"#ffd45e",gr:"#4a3708",th:"ascend",d:"모든 시곗바늘이 여기서 멈춘다. 다음은 없다."},
 {t:16,n:"영겁 永劫",b:"rift",g:"halo",c:["#eaf2ff","#9aa8c0"],e:"#ffffff",gem:"#cfe0ff",gr:"#2a3550",th:"ascend",d:"처음도 끝도 이 검 안에서 한 점이 된다. 뽑는 것 자체가 있을 수 없는 일이다."},
 /* ── ABSOLUTE ── */
 {t:17,n:"T I M E  D E S T R O Y E R",b:"rift",g:"halo",c:["#dff0ff","#2f6fc4"],e:"#ffffff",gem:"#8fd0ff",gr:"#16294a",
  th:"tdz",pd:TDZ_PD,end:TDZ_END,vb:"-72 0 344 560",acc:"#bfe0ff",
  d:"시간을 베는 검이 아니다. 시간이 있었다는 사실을 지우는 검이다. 이 검이 지나간 자리에는 전과 후가 없다."},
];
SWORDS.forEach(s=>{if(s.gem==="#f濃")s.gem="#ff8fb8";});

/* ═════════ 장착 고유 효과 ═════════
   gold 주화 / luck 행운 / speed 주조속도 / pity 보장가속 / dupe 중복주화
   pdur 포션지속 / twin 쌍판정 / rer 재굴림(이 등급 이하면 한 번 더) */
const FX={
 "심해의 갈퀴":{gold:.2,dupe:.3},
 "뇌문도":{speed:.06},
 "흑요석 파멸검":{luck:.05},
 "성좌의 레이피어":{luck:.07},
 "폭풍을 삼킨 칼":{speed:.09},
 "그림자 계약검":{dupe:.5},
 "여명의 서약":{pity:1.4},
 "심연의 포식자":{dupe:.8},
 "뇌신 무라쿠모":{speed:.12},
 "재의 불사자":{pity:1.7},
 "시간을 거스르는 날":{speed:.16},
 "세계수의 가지":{pdur:.2},
 "별을 가르는 자":{luck:.12},
 "공허의 이빨":{dupe:1.2},
 "법칙의 조각":{pdur:.35},
 "무형의 칼":{speed:.2},
 "천구의 축":{luck:.25},
 "뇌정의 심판":{speed:.28},
 "만상의 눈":{rer:2},
 "창세의 첫 획":{pity:2.2},
 "EQUINOX":{twin:1,luck:.15},
 "적요 寂寥":{speed:.34},
 "태동 胎動":{pdur:.6},
 "관측자 觀測者":{rer:4,luck:.18},
 "O P P R E S S I O N":{dupe:2,gold:.35},
 "회귀 回歸":{pity:3.2,luck:.22},
 "심판 審判":{twin:1},
 "천기 天機":{luck:.6,pdur:.5},
 /* 운명 이상 — 보석 획득(gem)·인첸트 성공(ench) 효과 포함 */
 "무한의 나선":{gem:.6,luck:.3},
 "경계 밖의 관측":{ench:.15,luck:.4},
 "무극 無極":{luck:.9,speed:.2},
 "혼돈의 이빨":{gem:1.0,dupe:1.5},
 "뒤틀린 인과":{ench:.25,speed:.4},
 "혼돈 混沌":{luck:1.2,gem:.5},
 "영겁의 파수꾼":{luck:1.5,ench:.3},
 "시간의 종착":{gem:2.0,gold:.6},
 "영겁 永劫":{luck:2.0,gem:1.0,ench:.2},
 /* ABSOLUTE — 시간을 부수는 검. 주조 속도와 쌍 판정을 동시에 가진다 */
 "T I M E  D E S T R O Y E R":{luck:2.6,speed:.72,gem:1.6,pdur:.8,twin:1},
};
SWORDS.forEach(x=>{x.fx=FX[x.n]||{gold:x.t*.02};});

/* ═════════ 인첸트 ═════════
   각 검의 "대표 효과" 하나만 레벨 I~V로 키운다. 대표는 값이 가장 큰 수치 fx,
   동률이면 아래 우선순위. twin/rer 만 가진 검은 대표가 없으므로 소량 주화를 대표로 부여. */
const ENCH_PRI=["luck","gold","speed","pity","dupe","pdur","gem","ench"];
SWORDS.forEach(x=>{
 if(!ENCH_PRI.some(k=>x.fx[k]!=null)) x.fx.gold=Math.max(0.05,x.t*.02);   // 대표 없는 검 보정
});
const ENCH_MAX=5, ENCH_STEP=0.20;                                          // 레벨당 대표효과 +20%
/* 인첸트 대표 효과별 색조 (글린트·라벨에 사용) */
const ENCH_COLOR={luck:"#8fd0c0",gold:"#e0b04a",speed:"#e8a24d",pity:"#c98cff",dupe:"#7fd0e8",pdur:"#9be08a",gem:"#5fe0c4",ench:"#c9a3ff"};
function enchKey(sw){
 const fx=sw.fx||{}; let best=null,bv=-1;
 for(const k of ENCH_PRI) if(fx[k]!=null&&+fx[k]>bv){bv=+fx[k];best=k;}
 return best;}
/* 인첸트 레벨을 반영한 fx (원본 불변, 복사본 반환) */
function enchFx(sw,lv){
 const fx=Object.assign({},sw.fx||{});
 if(lv>0){ const k=enchKey(sw); if(k!=null) fx[k]=+fx[k]*(1+ENCH_STEP*lv); }
 return fx;}

const FXN={gold:"주화 획득",luck:"행운",speed:"주조 속도",pity:"전설 보장",
 dupe:"중복 주화",pdur:"포션 지속",gem:"보석 획득",ench:"인첸트 성공",twin:"",rer:""};
function fxText(fx){
 const o=[];
 if(fx.twin)o.push("주조마다 등급 판정을 두 번 굴려 높은 쪽을 취함");
 if(fx.rer)o.push(RARITY[fx.rer].n+" 이하가 나오면 한 번 다시 굴림");
 for(const k of ["luck","speed","gold","dupe","pdur","gem"]) if(fx[k]){
  o.push(FXN[k]+(k==="speed"?" -":" +")+Math.round(fx[k]*100)+"%");}
 if(fx.ench)o.push("인첸트 성공 +"+Math.round(fx.ench*100)+"%p");
 if(fx.pity)o.push("전설 보장 "+fx.pity.toFixed(1)+"배 빠름");
 return o.length?o.join(" · "):"효과 없음";}
