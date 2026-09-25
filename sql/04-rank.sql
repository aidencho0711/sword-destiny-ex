-- ══════════════════════════════════════════════════════════════
--  랭킹
--
--  saves 는 RLS 로 제 행만 보이므로 남의 기록을 읽을 수 없다.
--  그래서 security definer 함수 하나로만 열어 준다. 돌려주는 것은
--  이름과 순위 숫자뿐이고, 저장 데이터의 나머지는 나가지 않는다.
--
--  kind: wave(최고 웨이브) / rebirth(환생) / codex(도감) / pvp(1vs1 승수)
-- ══════════════════════════════════════════════════════════════

create or replace function public.rank_board(kind text, lim int default 50)
returns table(rn bigint, uid uuid, name text, val numeric, sub numeric)
language sql security definer stable as $$
  with rows as (
    select s.user_id as uid,
           coalesce(nullif(s.name,''), '이름 없음') as name,
           case kind
             when 'wave'    then coalesce((s.data->>'bestWave')::numeric, 0)
             when 'rebirth' then coalesce((s.data->>'rebirth')::numeric, 0)
             when 'codex'   then (select count(*) from jsonb_object_keys(
                                    coalesce(s.data->'owned','{}'::jsonb)))
             when 'pvp'     then (select count(*) from public.pvp_log l
                                   where l.winner = s.user_id)
             else 0 end as val,
           -- 동점일 때 갈라 줄 두 번째 값
           case kind
             when 'wave'    then coalesce((s.data->>'rebirth')::numeric, 0)
             when 'rebirth' then coalesce((s.data->>'best')::numeric, 0)
             when 'codex'   then coalesce((s.data->>'best')::numeric, 0)
             when 'pvp'     then (select count(*) from public.pvp_log l
                                   where l.loser = s.user_id)
             else 0 end as sub
      from public.saves s
     where s.data is not null
  )
  select row_number() over (order by val desc, sub desc, name asc) as rn,
         uid, name, val, sub
    from rows
   where val > 0
   order by rn
   limit greatest(1, least(coalesce(lim,50), 100));
$$;

grant execute on function public.rank_board(text, int) to authenticated;

-- 내 등수는 목록(상위 50) 밖에 있을 수 있으므로 따로 묻는다.
-- 정렬 기준은 rank_board 와 글자 하나까지 같아야 한다 —
-- 다르면 목록에 3위로 떠 있는데 "내 순위 4위"가 되는 일이 생긴다.
create or replace function public.rank_me(kind text)
returns table(rn bigint, val numeric, total bigint)
language sql security definer stable as $$
  with rows as (
    select s.user_id as uid,
           coalesce(nullif(s.name,''), '이름 없음') as name,
           case kind
             when 'wave'    then coalesce((s.data->>'bestWave')::numeric, 0)
             when 'rebirth' then coalesce((s.data->>'rebirth')::numeric, 0)
             when 'codex'   then (select count(*) from jsonb_object_keys(
                                    coalesce(s.data->'owned','{}'::jsonb)))
             when 'pvp'     then (select count(*) from public.pvp_log l
                                   where l.winner = s.user_id)
             else 0 end as val,
           case kind
             when 'wave'    then coalesce((s.data->>'rebirth')::numeric, 0)
             when 'rebirth' then coalesce((s.data->>'best')::numeric, 0)
             when 'codex'   then coalesce((s.data->>'best')::numeric, 0)
             when 'pvp'     then (select count(*) from public.pvp_log l
                                   where l.loser = s.user_id)
             else 0 end as sub
      from public.saves s
     where s.data is not null
  ), ranked as (
    select uid, val,
           row_number() over (order by val desc, sub desc, name asc) as rn
      from rows where val > 0
  )
  select r.rn, r.val, (select count(*) from ranked)
    from ranked r where r.uid = auth.uid();
$$;

grant execute on function public.rank_me(text) to authenticated;
