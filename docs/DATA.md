# Dados

## 1. Fase 1: tudo no aparelho

Os dados são salvos com Zustand `persist` + AsyncStorage (`localStorage` na web), em três chaves independentes, cada uma com `schemaVersion` para migrações.

### 1.1 `numa.settings`
```ts
interface Settings {
  schemaVersion: 1;
  language: 'pt' | 'en';
  inputDirection: 'ltr' | 'rtl';        // esquerda→direita / direita→esquerda
  onboardingDone: boolean;
  hasSeenDirectionTip: boolean;
}
```

### 1.2 `numa.progress`
```ts
interface StageProgress {
  unlocked: boolean;
  bestStars: 0 | 1 | 2 | 3;
  bestTimeMs?: number;                  // melhor tempo em rodada de desafio
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
  op: 'add' | 'sub';
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

### 1.4 Migrações
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

### 2.4 Privacidade (LGPD)
- A conta continua **opcional**. Sem conta, os dados podem ser enviados de forma **anônima**, só com o consentimento informado.
- Idade apenas como **faixa etária** (ex.: `7-9`, `10-12`, `13-17`, `18+`), sem data de nascimento.
- Para menores de 12 anos, **consentimento de um responsável** antes de qualquer coleta identificável.
- Política de privacidade publicada antes do lançamento da Fase 2.
