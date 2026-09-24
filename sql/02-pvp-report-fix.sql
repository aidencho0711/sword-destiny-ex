-- ══════════════════════════════════════════════════════════════
--  1 vs 1 정산 고침
--
--  전에 만든 pvp_report 는 public.saves 를 uid 로 찾았는데
--  이 표의 열 이름은 user_id 다. plpgsql 본문은 만들 때 열 이름을
--  확인하지 않으므로 함수는 멀쩡히 만들어졌고, 실제로 부를 때마다
--  'column "uid" does not exist' 로 터졌다. 그래서 이긴 쪽에
--  아무것도 들어오지 않았다.
--
--  겸사겸사 결과를 text 대신 jsonb 로 돌려준다 —
--  오간 주화·보석을 결과 화면에 그대로 띄우기 위해서다.
-- ══════════════════════════════════════════════════════════════

drop function if exists public.pvp_report(uuid, uuid);

create or replace function public.pvp_report(mid uuid, winner_uid uuid)
returns jsonb language plpgsql security definer as $$
declare m public.pvp%rowtype; cnt int; loser uuid; pct numeric;
        g bigint; gm bigint; dg bigint; dgm bigint; lg record;
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

  select coalesce((data->>'gold')::bigint, 0), coalesce((data->>'gems')::bigint, 0)
    into g, gm from public.saves where user_id = loser;

  dg  := least(floor(coalesce(g, 0)  * pct), 500000000);   -- 1회 상한: 주화 5억
  dgm := least(floor(coalesce(gm, 0) * pct), 2000);        --            보석 2000

  update public.saves set
    data = jsonb_set(jsonb_set(data, '{gold}',
             to_jsonb(greatest(0, coalesce((data->>'gold')::bigint, 0) - dg))), '{gems}',
             to_jsonb(greatest(0, coalesce((data->>'gems')::bigint, 0) - dgm))),
    updated_at = now()
   where user_id = loser;

  update public.saves set
    data = jsonb_set(jsonb_set(data, '{gold}',
             to_jsonb(coalesce((data->>'gold')::bigint, 0) + dg)), '{gems}',
             to_jsonb(coalesce((data->>'gems')::bigint, 0) + dgm)),
    updated_at = now()
   where user_id = winner_uid;

  insert into public.pvp_log(match_id, winner, loser, gold, gems)
    values (mid, winner_uid, loser, dg, dgm);
  update public.pvp set status = 'done' where id = mid;

  return jsonb_build_object('ok', true, 'gold', dg, 'gems', dgm, 'winner', winner_uid);
end$$;

grant execute on function public.pvp_report(uuid, uuid) to authenticated;
