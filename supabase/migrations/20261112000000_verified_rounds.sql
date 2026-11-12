-- Rodadas conferidas no servidor (docs/DATA.md §2.4 e §2.5, D-034).
-- Rode este arquivo no SQL Editor do Supabase (ou com `supabase db push`).
--
-- ORDEM: rode só DEPOIS de o app novo estar publicado no ambiente que usa este banco, com a
-- variável SUPABASE_SECRET_KEY cadastrada na Vercel. Este arquivo tira do navegador a permissão
-- de gravar na `daily_results`: um app antigo (que grava direto) para de conseguir enviar.

-- 1. Teste do dia: só o servidor grava, depois de conferir as respostas.

drop policy "grava o proprio resultado do dia" on public.daily_results;

-- Sem nenhuma política de insert, só a chave secreta (usada pela função api/daily) grava.
-- Ela passa por cima das políticas, então quem confere o dono, o dia e o placar é a função.

-- Os resultados de antes desta mudança não foram conferidos.
alter table public.daily_results
  add column verified boolean not null default false;

-- 2. Rodadas de desafio enviadas por quem aceitou (consentimento no app).

create table public.round_records (
  -- uuid criado no aparelho: enviar de novo a mesma rodada não grava outra.
  id              uuid        primary key,
  user_id         uuid        not null references auth.users (id) on delete cascade,
  stage_id        text        not null,
  seed            integer     not null check (seed >= 0),
  rules_version   integer     not null,
  app_version     text        not null check (char_length(app_version) <= 32),
  status          text        not null check (status in ('completed', 'abandoned')),
  -- Horário do aparelho quando a primeira conta apareceu.
  started_at      timestamptz not null,
  elapsed_ms      integer     not null check (elapsed_ms >= 0),
  time_limit_ms   integer     not null check (time_limit_ms > 0),
  correct         smallint    not null,
  total           smallint    not null check (total between 1 and 50),
  -- null na rodada abandonada.
  stars           smallint    check (stars between 0 and 3),
  input_direction text        not null check (input_direction in ('ltr', 'rtl')),
  -- Uma entrada por conta, refeita pelo servidor:
  -- { a, b, op, expected, answer, correct, timeMs, keystrokes }.
  problems        jsonb       not null,
  created_at      timestamptz not null default now(),
  check (correct between 0 and total)
);

create index round_records_user_created_idx on public.round_records (user_id, created_at);
create index round_records_stage_idx on public.round_records (stage_id, rules_version);

-- Sem nenhuma política: ninguém lê nem grava pelo navegador. Só a função api/rounds, com a
-- chave secreta.
alter table public.round_records enable row level security;
