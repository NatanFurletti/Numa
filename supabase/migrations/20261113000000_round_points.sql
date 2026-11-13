-- Pontos calculados no servidor (docs/DATA.md §2.4 e §2.5, D-035, D-037).
-- Rode este arquivo no SQL Editor do Supabase (ou com `supabase db push`).
--
-- ORDEM: rode ANTES de publicar o app novo. Só acrescenta colunas com valor padrão, então o
-- código antigo continua gravando normalmente. O código novo grava `day` e `points`, e sem estas
-- colunas o envio falha (a rodada fica na fila do aparelho até a migração rodar).

-- 1. Rodadas de desafio: o dia local do aparelho (trava por dia) e os pontos da rodada.

alter table public.round_records
  -- Data local do aparelho no início da rodada. null nas rodadas gravadas antes do M9.
  add column day    date,
  add column points integer not null default 0 check (points >= 0);

-- Os pontos de uma rodada olham as rodadas anteriores da mesma pessoa na mesma etapa.
create index round_records_user_stage_idx on public.round_records (user_id, stage_id);

-- 2. Teste do dia: os pontos (acertos × peso do teste do dia).

alter table public.daily_results
  add column points integer not null default 0 check (points >= 0);

-- Total de uma pessoa (ou da semana, filtrando `day`): a soma das duas tabelas.
-- O total não fica guardado à parte, para nunca divergir das rodadas (D-037).
--   select coalesce(sum(points), 0) from round_records where user_id = :id
--   + select coalesce(sum(points), 0) from daily_results where user_id = :id and verified;
