-- Teste do dia: um resultado por aparelho por dia, e o ranking (docs/DATA.md §2.5, D-031).
-- Rode este arquivo no SQL Editor do Supabase (ou com `supabase db push`).
-- Antes, ligue os logins anônimos no painel do Supabase (Authentication > Providers > Anonymous).

create table public.daily_results (
  day           date        not null,
  user_id       uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  nickname      text        not null check (char_length(nickname) between 2 and 16),
  correct       smallint    not null,
  total         smallint    not null check (total between 1 and 50),
  elapsed_ms    integer     not null check (elapsed_ms > 0),
  rules_version integer     not null,
  created_at    timestamptz not null default now(),
  -- Uma tentativa por dia: o segundo envio do mesmo usuário é recusado.
  primary key (day, user_id),
  check (correct between 0 and total)
);

alter table public.daily_results enable row level security;

-- Cada usuário (anônimo, um por aparelho) só grava o próprio resultado, e só de um dia
-- próximo de hoje. O dia é o do horário local do aparelho, por isso a folga de 1 dia.
create policy "grava o proprio resultado do dia"
  on public.daily_results for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and day between (now() at time zone 'utc')::date - 1 and (now() at time zone 'utc')::date + 1
  );

-- Sem política de select, update ou delete: ninguém lê a tabela direto (os ids dos usuários
-- não saem do banco), e um resultado gravado não muda. A leitura é pela função abaixo.

-- Ranking de um dia: os `p_limit` primeiros e, se estiver fora deles, quem está pedindo.
-- Ordem: mais acertos, depois menor tempo, depois quem enviou primeiro.
create function public.daily_ranking(p_day date, p_limit integer default 50)
returns table (
  rank          bigint,
  nickname      text,
  correct       smallint,
  elapsed_ms    integer,
  is_me         boolean,
  total_players bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with ranked as (
    select
      r.nickname,
      r.correct,
      r.elapsed_ms,
      r.user_id,
      row_number() over (order by r.correct desc, r.elapsed_ms asc, r.created_at asc) as rank,
      count(*) over () as total_players
    from public.daily_results r
    where r.day = p_day
  )
  select
    ranked.rank,
    ranked.nickname,
    ranked.correct,
    ranked.elapsed_ms,
    coalesce(ranked.user_id = (select auth.uid()), false) as is_me,
    ranked.total_players
  from ranked
  where ranked.rank <= least(greatest(p_limit, 1), 100)
     or ranked.user_id = (select auth.uid())
  order by ranked.rank;
$$;

revoke all on function public.daily_ranking(date, integer) from public;
grant execute on function public.daily_ranking(date, integer) to anon, authenticated;
