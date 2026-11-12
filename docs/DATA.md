# Dados

## 1. Fase 1: tudo no aparelho

Os dados são salvos com Zustand `persist` + AsyncStorage (`localStorage` na web), em seis chaves independentes, cada uma com `schemaVersion` para migrações.

### 1.1 `numa.settings`
```ts
interface Settings {
  schemaVersion: 3;                     // v1 → v2: o idioma salvo é descartado (D-024)
                                        // v2 → v3: entra `shareRounds`, como null (D-034)
  language: 'pt' | 'en';
  inputDirection: 'ltr' | 'rtl';        // esquerda→direita / direita→esquerda
  onboardingDone: boolean;
  hasSeenDirectionTip: boolean;
  shareRounds: boolean | null;          // consentimento para enviar rodadas; null = não perguntado
}
```
- Só `shareRounds === true` deixa alguma coisa sair do aparelho. Na migração, todo mundo volta a `null`, inclusive quem já tinha apelido no ranking.
- "Apagar progresso" não mexe nas configurações, então o consentimento fica.

### 1.2 `numa.progress`
```ts
interface StageProgress {
  unlocked: boolean;
  bestStars: 0 | 1 | 2 | 3;
  bestTimeMs?: number;                  // melhor tempo em rodada de desafio 100% certa (D-020)
  bestCorrect?: number;
  attempts: number;                     // rodadas de desafio concluídas
  consecutiveFails: number;             // para o aquecimento
  pendingWarmup: boolean;
}

interface Progress {
  schemaVersion: 1;
  stages: Record<string, StageProgress>; // chave: 'L07-B'
  placementDone: boolean;
  streak: { current: number; best: number; lastPlayedDate?: string }; // 'YYYY-MM-DD' local
}
```

### 1.3 `numa.history`: registro de rodadas
É o dado mais valioso para o futuro. Ele já nasce no formato que será enviado ao servidor na Fase 2.

```ts
interface ProblemAttempt {
  a: number;
  b: number;
  op: 'add' | 'sub' | 'mul' | 'div';
  expected: number;
  answer: number | null;                // null = não respondida (abandono)
  correct: boolean;
  timeMs: number;
  keystrokes: number;                   // inclui apagar; mede hesitação
  reviewAttempts?: number;              // tentativas na correção
}

interface RoundRecord {
  id: string;                           // uuid
  schemaVersion: 1;
  rulesVersion: number;                 // versão da configuração de níveis
  appVersion: string;
  stageId: string;                      // 'L07-B'
  mode: 'challenge' | 'practice' | 'warmup' | 'placement';
  status: 'completed' | 'abandoned';
  seed: number;
  startedAt: string;                    // ISO 8601
  elapsedMs: number;
  timeLimitMs: number | null;           // null no treino livre
  correct: number;
  total: number;
  stars: 0 | 1 | 2 | 3 | null;          // null fora do desafio
  inputDirection: 'ltr' | 'rtl';
  problems: ProblemAttempt[];
}
```

- São mantidas as **últimas 500 rodadas** ⚙️. As mais antigas são descartadas. O `Progress` guarda os melhores resultados, então nada importante se perde.
- O `seed` permite recriar exatamente a rodada (útil para depurar e, no futuro, para o desafio do dia).

### 1.4 `numa.daily`: teste do dia
```ts
type DailyAttempt =
  | { status: 'started' }               // as contas apareceram e o teste não chegou ao fim
  | {
      status: 'done';
      correct: number;
      total: number;
      elapsedMs: number;
      problems: ProblemAttempt[];
      submitted: boolean;               // já enviado ao ranking
    };

interface Daily {
  schemaVersion: 1;
  nickname: string | null;              // apelido no ranking
  attempts: Record<string, DailyAttempt>; // chave: o dia, 'YYYY-MM-DD' local
}
```
- Ficam só as tentativas dos **últimos 7 dias** ⚙️.
- "Apagar progresso" **não** apaga esta chave: a tentativa do dia continua usada.
- A sessão anônima do Supabase fica em chaves próprias do `supabase-js`, no mesmo armazenamento. Ela só é criada no primeiro envio, ou seja, só para quem aceitou enviar.
- `submitted` vira `true` quando o servidor aceita as respostas. O que vai é `problems` reduzido a resposta, tempo e teclas de cada conta: o placar é o servidor que calcula (§2.4).

### 1.5 `numa.outbox`: fila de envio
```ts
interface Outbox {
  schemaVersion: 1;
  roundIds: string[];                   // ids de rodadas do `numa.history`, da mais antiga para a mais nova
}
```
- Entram só as rodadas de **desafio** (concluídas ou abandonadas) jogadas com `shareRounds === true`.
- Uma rodada sai da fila quando o servidor aceita, quando ele recusa de vez (não adianta tentar de novo) ou quando ela não existe mais no histórico. Sem internet ou com o servidor fora do ar, fica.
- O envio acontece ao abrir o app, quando uma rodada termina e quando a internet volta (na web).
- No máximo **200 rodadas** ⚙️. As mais antigas são descartadas.
- Desligar o envio nas configurações **esvazia a fila**. "Apagar progresso" apaga o histórico, e as rodadas que estavam na fila saem dela sem ser enviadas.

### 1.6 `numa.points`: pontos (GAME_RULES §14, D-035)
```ts
interface PointsBreakdown {
  hits: number;                         // acertos × peso
  stars: number;                        // estrelas novas
  newStage: number;                     // primeira vez que passa da etapa
  total: number;
  capped: boolean;                      // a trava do dia segurou os acertos
}

interface Points {
  schemaVersion: 1;
  total: number;                        // pontos totais (mascote)
  days: Record<string, number>;         // pontos de cada dia, 'YYYY-MM-DD' local (ranking da semana)
  awards: { id: string; day: string; points: PointsBreakdown }[]; // da mais antiga para a mais nova
}
```
- `id` é o id da rodada, ou `daily:YYYY-MM-DD` no teste do dia. Um id que já está em `awards` não soma de novo.
- Ganhos de 0 pontos não entram, a não ser quando a trava do dia segurou os acertos (a tela de resultado explica a trava).
- Ficam os **últimos 14 dias** ⚙️ em `days` e os **últimos 100** ⚙️ ganhos em `awards` (a tela de resultado lê os pontos da rodada daqui).
- Sem a chave (quem já jogava antes do M9), tudo começa em zero: não há pontos retroativos.
- "Apagar progresso" zera esta chave.

### 1.7 Migrações
- Toda mudança de formato sobe o `schemaVersion` e ganha uma função de migração **testada** (`migrate(v1) → v2`).
- Dados ilegíveis ou corrompidos não travam o app: ele volta aos padrões e registra o erro.

## 2. Fase 2: backend (planejado)

### 2.1 Modelo relacional (rascunho, Postgres)
```
users            (id, created_at, locale, age_band NULL, is_anonymous)
devices          (id, user_id, platform, created_at)
round_records    (id, user_id, device_id, stage_id, mode, status, rules_version,
                  app_version, seed, started_at, elapsed_ms, time_limit_ms,
                  correct, total, stars, input_direction)
problem_attempts (round_id, idx, a, b, op, expected, answer, correct, time_ms, keystrokes)
rules_configs    (version, json, published_at)
```

### 2.2 Sincronização
- O app continua funcionando offline. As rodadas ficam numa fila local e são enviadas quando houver conexão (envio idempotente pelo `id`).
- O progresso no servidor é **recalculado a partir das rodadas** (fonte da verdade = histórico), o que evita conflito entre aparelhos.

### 2.3 Calibração da régua com dados
Objetivo: perguntas como "70% das pessoas de 7–9 anos fazem a L07-B com ⭐⭐ em até 55s".
- Consultas SQL sobre `round_records`, agrupadas por `stage_id`, `rules_version` e `age_band`.
- Novos tempos e limites são publicados como uma nova versão em `rules_configs`. O app baixa a versão e usa a local como fallback.
- Como a regra já é configuração desde a Fase 1 (D-004, D-010), isso **não exige reescrever o engine**.

### 2.4 Ranking do teste do dia (D-031, D-034)
Primeiro pedaço do backend, no Supabase. O SQL está em `supabase/migrations/`.
```
daily_results (day, user_id, nickname, correct, total, elapsed_ms, rules_version, verified, created_at)
              chave primária: (day, user_id)
```
- **`user_id`** é um usuário **anônimo** do Supabase Auth, criado no primeiro envio de cada aparelho. Sem e-mail nem senha.
- **Gravar:** o navegador **não grava** na tabela (não há política de insert). O app chama `POST /api/daily` com o token do usuário anônimo e este corpo:
  ```
  { day, nickname, rulesVersion, answers: [{ answer, timeMs, keystrokes }, …] }
  ```
  A função refaz as contas do dia com o `src/engine`, confere as respostas e grava, com a chave secreta, o placar que ela mesma calculou (`verified = true`). Uma vez por dia (chave primária): o segundo envio não muda nada.
- **A função recusa:** token inválido (401); corpo fora do formato (400); `rulesVersion` diferente da do servidor (409); e, com 422, apelido fora das regras, dia a mais de 1 dia de distância da data do servidor (o dia do app é o do horário local) ou respostas que não passam na conferência (quantidade errada, resposta que o teclado não produz, conta respondida depois de uma sem resposta, conta respondida em menos de 250 ms ⚙️).
- **Ler:** ninguém lê a tabela direto. A função SQL `daily_ranking(p_day, p_limit)` devolve posição, apelido, acertos, tempo, `is_me` e o total de jogadores. Os ids dos usuários não saem do banco. Ler o ranking não cria usuário anônimo.
- Os resultados de antes do M8 não foram conferidos e ficam com `verified = false`.

### 2.5 Rodadas de desafio conferidas (D-034)
```
round_records (id, user_id, stage_id, seed, rules_version, app_version, status, started_at,
               elapsed_ms, time_limit_ms, correct, total, stars, input_direction, problems, created_at)
              chave primária: id (o uuid da rodada no aparelho)
```
- O app chama `POST /api/rounds` para cada rodada da fila (§1.5), com:
  ```
  { id, stageId, seed, rulesVersion, appVersion, startedAt, inputDirection,
    answers: [{ answer, timeMs, keystrokes }, …] }
  ```
- A função refaz as contas pela etapa e pela seed, confere as respostas e calcula acertos, tempo, estrelas e se a rodada foi concluída ou abandonada. `problems` (jsonb) guarda cada conta refeita, no formato do `ProblemAttempt`.
- É **uma tabela só**, com as contas em `jsonb`, e não as duas do rascunho da §2.1: basta para os pontos (M9) e para as consultas de calibração, e a função grava tudo de uma vez.
- Ninguém lê nem grava pelo navegador (sem políticas). Os pontos do M9 serão calculados a partir daqui.
- Só rodadas de **desafio**. Treino livre, aquecimento e nivelamento não são enviados por enquanto.

### 2.6 Privacidade (LGPD)
- A conta continua **opcional**. Sem conta, os dados são enviados de forma **anônima**, só com o consentimento informado (`shareRounds`, §1.1). O pedido aparece ao abrir o teste do dia, e a opção fica nas Configurações (D-034).
- Idade apenas como **faixa etária** (ex.: `7-9`, `10-12`, `13-17`, `18+`), sem data de nascimento.
- Para menores de 12 anos, **consentimento de um responsável** antes de qualquer coleta identificável.
- Política de privacidade publicada antes do lançamento da Fase 2.
- **O que é enviado**, ligado a um id anônimo: do teste do dia, o apelido e a resposta e o tempo de cada conta; das rodadas de desafio, a etapa, a seed, as respostas, os tempos, as teclas, a direção da digitação, a versão do app e o horário de início. O apelido é público. A tela pede para não usar o nome completo.
- A política de privacidade do app (`/privacy`) cobre tudo isso. Mudou o que é enviado? Atualize o texto e a data no mesmo PR (D-033).
