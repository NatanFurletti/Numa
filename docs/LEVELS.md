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

## 3. Tabela de níveis

Cada nível tem 3 etapas: **A** (tempo folgado), **B** (médio) e **C** (justo). Tempos para uma rodada de 10 contas.

### 3.1 Conta armada antes da conta na linha (D-028)

A partir de 2 dígitos, cada soma e cada subtração aparece **duas vezes seguidas**:
1. **Armada:** um número em cima do outro, alinhados pela unidade, com a resposta embaixo da linha (como no papel). É mais fácil de visualizar.
2. **Na linha:** `24 + 73 =`, como antes.

As duas versões têm as mesmas regras de conta e os mesmos tempos. Os níveis de 1 dígito e os mistos só existem na linha.

### 3.2 Ids e números na tela

- O id da versão na linha não muda (`L07`). A versão armada tem um `V` no fim (`L07V`). As etapas seguem o padrão `L07V-A`, `L07-B`, …
- O **número na tela é a posição na tabela**, e não o id. Ex.: `L07V` é o Nível 8 e `L07` é o Nível 9.
- Os ids ficam fixos porque o progresso salvo e o histórico usam eles.

### 3.3 Tabela

| Nº | Id | Tipo | Regra | A | B | C |
|---|---|---|---|---|---|---|
| 1 | L01 | Soma | 1d + 1d, resultado ≤ 10 | 60s | 45s | 35s |
| 2 | L02 | Soma | 1d + 1d, resultado 11–18 (passa da dezena) | 70s | 55s | 40s |
| 3 | L03 | Subtração | 1d − 1d (resultado ≥ 0) | 60s | 45s | 35s |
| 4 | L04 | Subtração | (11–18) − 1d, resultado 1d (ex.: 15 − 7) | 70s | 55s | 40s |
| 5 | L05 | Misto | Contas de L01–L04 | 70s | 55s | 40s |
| 6–7 | L06V, L06 | Soma | 2d + 1d, **sem** vai um | 70s | 55s | 45s |
| 8–9 | L07V, L07 | Soma | 2d + 1d, **com** vai um | 80s | 65s | 50s |
| 10–11 | L08V, L08 | Subtração | 2d − 1d, **sem** empresta | 70s | 55s | 45s |
| 12–13 | L09V, L09 | Subtração | 2d − 1d, **com** empresta | 80s | 65s | 50s |
| 14 | L10 | Misto | Contas de L06–L09 | 85s | 70s | 55s |
| 15–16 | L11V, L11 | Soma | 2d + 2d, **sem** vai um | 80s | 65s | 50s |
| 17–18 | L12V, L12 | Soma | 2d + 2d, **com** vai um (inclui resultado ≥ 100) | 100s | 80s | 65s |
| 19–20 | L13V, L13 | Subtração | 2d − 2d, **sem** empresta | 80s | 65s | 50s |
| 21–22 | L14V, L14 | Subtração | 2d − 2d, **com** empresta | 100s | 80s | 65s |
| 23 | L15 | Misto | Contas de L11–L14 | 100s | 85s | 70s |
| 24–25 | L16V, L16 | Soma | 3d + 2d, **sem** vai um | 90s | 75s | 60s |
| 26–27 | L17V, L17 | Soma | 3d + 2d, **com** vai um | 110s | 90s | 75s |
| 28–29 | L18V, L18 | Subtração | 3d − 2d, **sem** empresta | 90s | 75s | 60s |
| 30–31 | L19V, L19 | Subtração | 3d − 2d, **com** empresta | 120s | 100s | 80s |
| 32 | L20 | Misto | Contas de L16–L19 | 115s | 95s | 80s |
| 33–34 | L21V, L21 | Soma | 3d + 3d, **sem** vai um | 100s | 80s | 65s |
| 35–36 | L22V, L22 | Soma | 3d + 3d, **com** vai um (inclui resultado ≥ 1000) | 130s | 105s | 85s |
| 37–38 | L23V, L23 | Subtração | 3d − 3d, **sem** empresta | 100s | 80s | 65s |
| 39–40 | L24V, L24 | Subtração | 3d − 3d, **com** empresta | 140s | 115s | 90s |
| 41 | L25 | Misto | Contas de L21–L24 | 130s | 110s | 90s |

Total: **41 níveis × 3 etapas = 123 etapas**. Os tempos de 3 dígitos são estimativas iniciais ⚙️, a calibrar com o teste com pessoas.

**Depois:** multiplicação e divisão. Ver "Ideias futuras" em [ROADMAP.md](ROADMAP.md).

### Níveis-checkpoint do nivelamento ⚙️
`L02, L05, L07, L10, L12, L15, L17, L20, L22, L25`. Os checkpoints são sempre a versão na linha. Ver [GAME_RULES.md §10](GAME_RULES.md).

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
10. **Contas de 3 dígitos:** com até 810 mil pares possíveis, o gerador sorteia operandos até achar uma conta da spec (em vez de listar todas). Ele dá preferência a resultados ainda não usados na rodada (D-028).
11. Se a spec não permite contas distintas suficientes, o gerador **lança erro**. Isso é um bug de configuração e é coberto por teste para todos os níveis.

Essas regras são ideais para **testes baseados em propriedades** (fast-check): "para qualquer seed, nenhuma conta de L06 tem vai um". Ver [TESTING.md](TESTING.md).
