# Níveis e geração de contas

Toda esta tabela é **configuração** (`src/engine/config/levels.ts`), não código. Os tempos são valores iniciais ⚙️, a calibrar em testes com pessoas reais e, na Fase 2, com dados.

A configuração tem um `rulesVersion` (inteiro). Ele sobe sempre que níveis, tempos ou limites mudam, e cada rodada salva registra a versão usada (ver [DATA.md](DATA.md)).

## 1. Princípios de dificuldade

A dificuldade depende de quatro fatores, nesta ordem de impacto:
1. **Operação:** soma é mais fácil que subtração.
2. **"Vai um" / "empresta":** 23+14 é bem mais fácil que 17+38.
3. **Quantidade de dígitos** dos operandos.
4. **Tempo** disponível por conta.

As operações são **intercaladas por faixa de dificuldade** (espiral): soma → subtração → misto em cada faixa, para que a subtração não chegue como um choque depois de muitos níveis só de soma.

## 2. Definições

- **Vai um** (soma): pelo menos uma coluna (unidade, dezena…) soma ≥ 10.
- **Empresta** (subtração): em pelo menos uma coluna, o dígito de cima é menor que o de baixo (dígitos ausentes contam como 0).
- `nd` = número com *n* dígitos (1d: 1–9, 2d: 10–99, 3d: 100–999).

## 3. Tabela de níveis (MVP)

Cada nível tem 3 etapas: **A** (tempo folgado), **B** (médio) e **C** (justo). Tempos para uma rodada de 10 contas. ID das etapas: `L01-A`, `L01-B`, …

| Nível | Tipo | Regra | A | B | C |
|---|---|---|---|---|---|
| **L01** | Soma | 1d + 1d, resultado ≤ 10 | 60s | 45s | 35s |
| **L02** | Soma | 1d + 1d, resultado 11–18 (passa da dezena) | 70s | 55s | 40s |
| **L03** | Subtração | 1d − 1d (resultado ≥ 0) | 60s | 45s | 35s |
| **L04** | Subtração | (11–18) − 1d, resultado 1d (ex.: 15 − 7) | 70s | 55s | 40s |
| **L05** | Misto | Contas de L01–L04 | 70s | 55s | 40s |
| **L06** | Soma | 2d + 1d, **sem** vai um | 70s | 55s | 45s |
| **L07** | Soma | 2d + 1d, **com** vai um | 80s | 65s | 50s |
| **L08** | Subtração | 2d − 1d, **sem** empresta | 70s | 55s | 45s |
| **L09** | Subtração | 2d − 1d, **com** empresta | 80s | 65s | 50s |
| **L10** | Misto | Contas de L06–L09 | 85s | 70s | 55s |
| **L11** | Soma | 2d + 2d, **sem** vai um | 80s | 65s | 50s |
| **L12** | Soma | 2d + 2d, **com** vai um (inclui resultado ≥ 100) | 100s | 80s | 65s |
| **L13** | Subtração | 2d − 2d, **sem** empresta | 80s | 65s | 50s |
| **L14** | Subtração | 2d − 2d, **com** empresta | 100s | 80s | 65s |
| **L15** | Misto | Contas de L11–L14 | 100s | 85s | 70s |

Total no MVP: **15 níveis × 3 etapas = 45 etapas**.

**Depois do MVP:** o mesmo ciclo com 3 dígitos (3d+1d, 3d+2d, 3d+3d…), e depois multiplicação e divisão. Ver "Ideias futuras" em [ROADMAP.md](ROADMAP.md).

### Níveis-checkpoint do nivelamento ⚙️
`L02, L05, L07, L10, L12, L15`. Ver [GAME_RULES.md §10](GAME_RULES.md).

## 4. Formato da configuração (rascunho)

```ts
type Operation = 'add' | 'sub';
type Carry = 'none' | 'required' | 'any';

interface ProblemSpec {
  op: Operation;
  a: { min: number; max: number };      // faixa do 1º operando
  b: { min: number; max: number };      // faixa do 2º operando
  carry: Carry;                         // vai um / empresta
  result?: { min?: number; max?: number };
}

interface LevelConfig {
  id: string;                           // 'L07'
  kind: 'add' | 'sub' | 'mixed';
  specs: ProblemSpec[];                 // misto = várias specs
  stages: { id: 'A' | 'B' | 'C'; timeLimitMs: number }[];
}

interface GameConfig {
  rulesVersion: number;
  problemsPerRound: number;             // 10
  maxAnswerDigits: number;              // 4
  stars: { minAccuracy: number; threeStarAccuracy: number; threeStarTimeRatio: number };
  warmup: { failsToTrigger: number; noPreviousStageTimeBonus: number };
  placement: { checkpoints: string[]; problemsPerCheckpoint: number; minCorrect: number; timeRatio: number };
  levels: LevelConfig[];
}
```

O formato final é definido pelos testes, durante o TDD do engine.

## 5. Regras de geração de uma rodada

O gerador recebe `(stage, seed)` e devolve sempre a **mesma** lista de contas para a mesma entrada (determinístico).

1. **Aleatoriedade com seed** (ex.: mulberry32). Nunca `Math.random()` dentro do engine.
2. **Respeita a spec:** faixas de operandos, vai um / empresta e faixa de resultado.
3. **Subtração:** `a ≥ b` sempre. Nada de resultado negativo no MVP.
4. **Sem 0 como operando.** O resultado 0 só é permitido na subtração, no máximo 1 vez por rodada.
5. **Sem repetição** na mesma rodada. `3 + 5` e `5 + 3` contam como repetidas.
6. **Soma:** a ordem dos operandos é sorteada (2d + 1d ou 1d + 2d), meio a meio.
7. **Misto:** metade de soma e metade de subtração, embaralhadas, distribuídas entre as specs do nível.
8. **Variedade:** os resultados devem se espalhar pela faixa possível, sem concentrar em poucos valores.
9. **Aquecimento:** 5 contas da etapa anterior + 5 da atual, intercaladas, começando pela anterior.
10. Se a spec não permite contas distintas suficientes, o gerador **lança erro**. Isso é um bug de configuração e é coberto por teste para todos os níveis.

Essas regras são ideais para **testes baseados em propriedades** (fast-check): "para qualquer seed, nenhuma conta de L06 tem vai um". Ver [TESTING.md](TESTING.md).
