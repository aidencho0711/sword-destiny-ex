/* ═════════ 클라우드 (Supabase) — 인증 + 저장 동기화 ═════════
   이름 기반 로그인: 이름을 해시해 가짜 이메일(u<hash>@sworddestiny.local)을 만들어
   Supabase Auth 에 넘긴다. 진짜 이메일은 필요 없고, 비밀번호는 Supabase 가 안전하게 처리한다.
   SDK(CDN)가 안 떴거나 오프라인이면 SB 가 null 이 되어 전부 로컬로 폴백한다. */
const SB = (CLOUD_ON && window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY,
      {auth:{persistSession:true, autoRefreshToken:true, storageKey:"sd-auth"}})
  : null;
function cloudReady(){ return !!SB; }

async function sha256hex(str){
 try{ const b=await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join(""); }
 catch(e){ let h=0; for(const c of str) h=(h*31+c.charCodeAt(0))|0; return "f"+(h>>>0).toString(16); }}
/* 이름 → 결정적 ASCII 이메일 (한글 이름도 안전) */
async function nameEmail(name){
 const h=await sha256hex("sd-name:"+String(name).trim().toLowerCase());
 return "u"+h.slice(0,40)+"@sworddestiny.local"; }

async function cloudSignUp(name,pw){
 const email=await nameEmail(name);
 return SB.auth.signUp({email,password:pw,options:{data:{name:String(name).trim()}}}); }
async function cloudSignIn(name,pw){
 const email=await nameEmail(name);
 return SB.auth.signInWithPassword({email,password:pw}); }
async function cloudSignOut(){ try{ if(SB) await SB.auth.signOut(); }catch(e){} }
async function cloudSession(){
 if(!SB)return null;
 try{ const {data}=await SB.auth.getSession(); return (data&&data.session)||null; }catch(e){ return null; } }

/* 저장 데이터 읽기/쓰기 (본인 행만 — RLS). role 컬럼은 서버가 관리하는 권한(권위 기준) */
async function cloudGetSave(uid){
 if(!SB)return null;
 try{ const {data,error}=await SB.from("saves").select("data,name,role,updated_at").eq("user_id",uid).maybeSingle();
  return error?null:data; }catch(e){ return null; } }

/* 관리자 RPC (서버 함수가 is_admin 검사로 게이트) */
async function adminList(){ if(!SB)return {data:null,error:"no client"}; return SB.rpc("admin_list"); }
async function adminSetRole(target,role){ if(!SB)return {error:"no client"}; return SB.rpc("admin_set_role",{target,new_role:role||""}); }
async function adminGrant(target,gold,gems){ if(!SB)return {error:"no client"}; return SB.rpc("admin_grant",{target,gold_delta:gold||0,gems_delta:gems||0}); }
async function adminReset(target){ if(!SB)return {error:"no client"}; return SB.rpc("admin_reset",{target}); }
/* 내 계정 표시 이름 변경 (auth 메타데이터). 로그인 이름 자체는 유지됨 */
async function cloudRename(newName){ if(!SB)return {error:"no client"}; return SB.auth.updateUser({data:{name:String(newName).trim()}}); }
/* 대상 계정 전체 데이터 읽기 (관리자만) — 행운 계산용 */
async function adminGet(target){ if(!SB)return {error:"no client"};
 const {data,error}=await SB.rpc("admin_get",{target}); return error?{error:error.message||String(error)}:(data||{}); }
/* 대상 devLuck 설정 (관리자만) */
async function adminSetLuck(target,value){ if(!SB)return {error:"no client"}; return SB.rpc("admin_set_luck",{target,value}); }
/* 대상 표시 이름 변경 (관리자만, saves.name 이 표시 기준) */
async function adminRename(target,newName){ if(!SB)return {error:"no client"}; return SB.rpc("admin_rename",{target,new_name:String(newName).trim()}); }
/* 대상 계정 완전 삭제 (관리자만, auth 유저 + saves 캐스케이드) */
async function adminDelete(target){ if(!SB)return {error:"no client"}; return SB.rpc("admin_delete",{target}); }

/* ── 거래 ── */
async function findUser(name){ if(!SB)return {error:"no client"};
 const {data,error}=await SB.rpc("find_user",{uname:String(name).trim()}); return error?{error:error.message||String(error)}:{uid:data}; }
async function tradeList(){ if(!SB)return {data:[],error:"no client"};
 return SB.from("trades").select("*").eq("status","pending").order("created_at",{ascending:false}); }
async function tradeCreate(row){ if(!SB)return {error:"no client"}; return SB.from("trades").insert(row); }
async function tradeAccept(tid){ if(!SB)return {error:"no client"}; return SB.rpc("trade_accept",{tid}); }
async function tradeCancel(tid){ if(!SB)return {error:"no client"}; return SB.rpc("trade_cancel",{tid}); }
async function cloudPutSave(uid,name,stateObj){
 if(!SB)return "no client";
 try{ const {error}=await SB.from("saves")
    .upsert({user_id:uid,name:name||null,data:stateObj,updated_at:new Date().toISOString()},{onConflict:"user_id"});
  return error||null; }catch(e){ return e; } }

/* Supabase 오류 → 한글 메시지 */
function cloudErr(error){
 const m=((error&&error.message)||"").toLowerCase();
 if(m.includes("already"))return "이미 있는 이름입니다. 로그인하거나 다른 이름을 쓰세요";
 if(m.includes("invalid login")||m.includes("invalid credentials"))return "이름 또는 비밀번호가 틀렸습니다";
 if(m.includes("password"))return "비밀번호는 6자 이상이어야 합니다";
 if(m.includes("email not confirmed")||m.includes("not confirmed"))return "Supabase 설정에서 이메일 확인(Confirm email)을 꺼주세요";
 if(m.includes("network")||m.includes("failed to fetch"))return "네트워크 오류. 연결을 확인하세요";
 return (error&&error.message)||"오류가 발생했습니다"; }
