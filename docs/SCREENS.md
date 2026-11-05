# Telas e fluxo

## 1. Princípios de interface

- **Óbvio para uma criança de 7 anos:** números grandes, poucos botões, ícones com texto.
- **Tema escuro** no MVP (tema claro em "Ideias futuras").
- **Alvos de toque grandes:** no mínimo 56 × 56 px no teclado.
- **Números com largura fixa** (fonte com dígitos tabulares), para a tela não "pular" quando a resposta cresce.
- **Funciona em celular e computador:** layout em coluna única, com largura máxima (~480 px) centralizada no desktop.
- **Acessibilidade:** contraste AA, rótulos de acessibilidade nos botões e cor nunca como único sinal (✓ e ✗ além do verde e vermelho).

## 2. Mapa de navegação

```
Primeiro acesso ──► Boas-vindas ──┬─► Nivelamento ──► Resultado do nivelamento ──┐
                                  └─► (pular) ─────────────────────────────────────┤
                                                                                   ▼
                                    ┌──────────────────────────────────────── Início
                                    │                                    │    │    │
                                    ▼                                    ▼    ▼    ▼
                    Rodada (desafio/aquecimento)               Níveis  Treino  Configurações
                                    │                             │    livre
                                    ▼                             └──► Rodada
                               Resultado ──► Correção
                                    │
                    Próxima etapa / Tentar de novo / Início
```

## 3. Telas

### 3.1 Boas-vindas (só no primeiro acesso)
- Logo "Numa" e uma frase: "Treine sua mente alguns minutos por dia."
- Seletor de idioma discreto (pré-selecionado pelo aparelho).
- Botões: **Fazer teste de nivelamento** (principal) e **Começar do início**.

### 3.2 Início
- Sequência de dias: "🔥 5 dias".
- Botão grande: **Continuar — Nível 7 · Etapa B**.
- Botões secundários: **Níveis**, **Treino livre** e ⚙️ **Configurações**.

### 3.3 Níveis
- Lista vertical de níveis. Cada um mostra o nome curto (ex.: "Soma 2+1 com vai um") e as 3 etapas com estrelas.
- Etapas bloqueadas aparecem com cadeado. Tocar numa etapa desbloqueada inicia uma rodada de desafio.

### 3.4 Rodada
```
┌──────────────────────────────┐
│ ✕                            │  ← sair (pede confirmação)
│ ████████████░░░░░░░░░░░░░░░  │  ← barra de tempo (some no treino livre)
│                              │
│        24 + 73 = 9▌          │  ← conta atual + resposta + cursor
│         34 + 63 = ?          │  ← próxima (menor, esmaecida)
│          28 + 57 =           │  ← seguinte (mais esmaecida)
│                              │
│   ┌──────┬──────┬──────┐     │
│   │  1   │  2   │  3   │     │
│   ├──────┼──────┼──────┤     │
│   │  4   │  5   │  6   │     │
│   ├──────┼──────┼──────┤     │
│   │  7   │  8   │  9   │     │
│   ├──────┼──────┼──────┤     │
│   │  ⌫   │  0   │  ✓   │     │
│   └──────┴──────┴──────┘     │
└──────────────────────────────┘
```
- **Níveis armados** (D-028): a conta atual aparece um número em cima do outro, alinhados pela unidade, com a resposta embaixo da linha. O resto da tela é igual, e as 2 próximas continuam na linha, pequenas.
- Formato de teclado de celular: 1-2-3 em cima.
- ✓ desativado com o campo vazio.
- Cursor piscante à direita (esquerda → direita) ou à esquerda (direita → esquerda) da resposta.
- Animação de troca: a conta atual sobe e some, e a fila sobe uma posição. A animação deve ser **curta (≤ 150 ms)** e nunca bloquear a digitação da próxima conta.
- Tempo esgotado: a barra fica âmbar e cheia, com um pequeno texto "tempo esgotado, continue!".
- Aquecimento: rótulo "Aquecimento" no topo.
- **Teclado físico (web):** `0–9` (incluindo o teclado numérico), `Backspace` e `Enter`.

### 3.5 Contagem regressiva
- "3, 2, 1" em tela cheia antes da rodada (~1 s cada). As contas só aparecem depois.

### 3.6 Resultado
Ver a ordem dos elementos em [GAME_RULES.md §5](GAME_RULES.md). Lista das contas: certas com ✓ discreto, erradas destacadas com ✗ e "você respondeu 85".

### 3.7 Correção
- Uma conta errada por vez, com o mesmo teclado. Indicador "2 de 3".
- Acertou: ✓ verde e avança. Errou: tremida e tenta de novo. Após 2 erros: botão "Ver resposta".
- Balão de dica (uma única vez) sobre a direção da digitação.
- No fim: "Tudo corrigido! 👏" e o botão de voltar ao resultado ou ao início.

### 3.8 Treino livre
- Mesma lista da tela de Níveis, mostrando só as etapas desbloqueadas, sem estrelas.
- A rodada não tem barra de tempo. O resultado mostra acertos e tempo, sem estrelas.

### 3.9 Configurações
Ver [GAME_RULES.md §12](GAME_RULES.md).

## 4. Rotas (Expo Router)

| Rota | Tela |
|---|---|
| `/` | Início (redireciona para `/welcome` no primeiro acesso) |
| `/welcome` | Boas-vindas |
| `/placement` | Nivelamento |
| `/levels` | Níveis |
| `/practice` | Escolha do treino livre |
| `/play/[stageId]?mode=challenge\|practice\|warmup` | Rodada |
| `/result/[roundId]` | Resultado |
| `/review/[roundId]` | Correção |
| `/settings` | Configurações |
