-- ══════════════════════════════════════════════════════════════
--  1 vs 1 정산 — bigint 를 걷어낸다
--
--  보상이 자산 비례로 바뀌면서 주화가 bigint 천장(9,223,372,036,854,775,807)
--  을 넘어섰다. 보고된 오류값의 앞 19자리가 그 증거다 —
--  실제 저장값은 1245092492997884300000 (22자리, 약 12해) 였고
--  ->> 로 꺼낸 문자열을 ::bigint 하다가 터졌다.
--
--  numeric 은 자릿수 제한이 사실상 없고, 1.2345e+21 같은 지수 표기도
--  받아들인다. 자바스크립트는 10^21 부터 지수 표기로 저장하므로
--  그 경우까지 한 번에 막힌다.
-- ══════════════════════════════════════════════════════════════

alter table public.pvp_log
  alter column gold type numeric using gold::numeric,
  alter column gems type numeric using gems::numeric;

drop function if exists public.pvp_report(uuid, uuid);

create or replace function public.pvp_report(mid uuid, winner_uid uuid)
returns jsonb language plpgsql security definer as $$
declare m public.pvp%rowtype; cnt int; loser uuid; pct numeric;
        g numeric; gm numeric; dg numeric; dgm numeric; lg record;
begin
  select * into m from public.pvp where id = mid;
  if not found then return jsonb_build_object('ok', false, 'why', 'no match'); end if;
  if auth.uid() <> m.from_uid and auth.uid() <> m.to_uid then
    return jsonb_build_object('ok', false, 'why', 'not yours'); end if;

  -- 이미 정산된 판이면 남겨 둔 결과를 그대로 돌려준다.
  -- 늦게 물어본 쪽도 같은 숫자를 봐야 한다.
  if m.status = 'done' then
    select * into lg from public.pvp_log where match_id = mid limit 1;
    if found then
      return jsonb_build_object('ok', true, 'gold', lg.gold, 'gems', lg.gems,
                                'winner', lg.winner);
    end if;
    return jsonb_build_object('ok', true, 'gold', 0, 'gems', 0);
  end if;
  if m.status = 'void' then return jsonb_build_object('ok', false, 'why', 'void'); end if;
  if m.status <> 'live' then return jsonb_build_object('ok', false, 'why', 'not live'); end if;

  insert into public.pvp_report(match_id, reporter, winner)
    values (mid, auth.uid(), winner_uid)
    on conflict do nothing;                      -- (판, 보고자) 가 기본키라 여러 번 불러도 한 번만 센다

  select count(*) into cnt from public.pvp_report where match_id = mid;
  if cnt < 2 then return jsonb_build_object('ok', false, 'why', 'waiting'); end if;

  select count(distinct winner) into cnt from public.pvp_report where match_id = mid;
  if cnt <> 1 then
    update public.pvp set status = 'void' where id = mid;
    return jsonb_build_object('ok', false, 'why', 'mismatch');
  end if;

  loser := case when winner_uid = m.from_uid then m.to_uid else m.from_uid end;
  pct   := 0.05 + random() * 0.15;               -- 5 ~ 20 %

  select coalesce((data->>'gold')::numeric, 0), coalesce((data->>'gems')::numeric, 0)
    into g, gm from public.saves where user_id = loser;

  -- 상한도 자산에 맞춰 비율로 둔다. 고정 5억은 주화가 해 단위가 된 지금
  -- 아무것도 막지 못하면서 이긴 쪽만 허탈하게 만든다.
  dg  := trunc(coalesce(g, 0)  * pct);
  dgm := trunc(coalesce(gm, 0) * pct);

  update public.saves set
    data = jsonb_set(jsonb_set(data, '{gold}',
             to_jsonb(greatest(0, trunc(coalesce((data->>'gold')::numeric, 0)) - dg))), '{gems}',
             to_jsonb(greatest(0, trunc(coalesce((data->>'gems')::numeric, 0)) - dgm))),
    updated_at = now()
   where user_id = loser;

  update public.saves set
    data = jsonb_set(jsonb_set(data, '{gold}',
             to_jsonb(trunc(coalesce((data->>'gold')::numeric, 0)) + dg)), '{gems}',
             to_jsonb(trunc(coalesce((data->>'gems')::numeric, 0)) + dgm)),
    updated_at = now()
   where user_id = winner_uid;

  insert into public.pvp_log(match_id, winner, loser, gold, gems)
    values (mid, winner_uid, loser, dg, dgm);
  update public.pvp set status = 'done' where id = mid;

  return jsonb_build_object('ok', true, 'gold', dg, 'gems', dgm, 'winner', winner_uid);
end$$;

grant execute on function public.pvp_report(uuid, uuid) to authenticated;

-- 터진 판들이 'live' 로 남아 있으면 그 쌍은 다시 붙을 때까지 걸리적거린다.
-- 한 시간 넘게 살아 있는 판은 정리한다.
update public.pvp set status = 'void'
 where status = 'live' and created_at < now() - interval '1 hour';
