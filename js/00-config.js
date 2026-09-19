/* ═════════ 클라우드 설정 ═════════
   여기 anon(publishable) 키는 공개용이라 정적 사이트에 넣어도 안전합니다.
   실제 데이터 보호는 Supabase의 RLS(행 수준 보안)가 담당해, 각 유저는 자기 저장만 접근합니다.
   두 값을 비우면 클라우드가 꺼지고 예전처럼 이 기기 안에서만 로컬 저장됩니다. */
const SUPABASE_URL = "https://ozwexbwrpqdiddmzpjru.supabase.co";
const SUPABASE_KEY = "sb_publishable_Fu1VfOLEBh81K758G8NMqQ_osy56LJx";
const CLOUD_ON = !!(SUPABASE_URL && SUPABASE_KEY);
