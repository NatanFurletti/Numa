# Regras do jogo

Este documento é a **especificação de comportamento** do jogo. Cada regra aqui deve virar pelo menos um teste (ver [TESTING.md](TESTING.md)). Os números marcados com ⚙️ ficam em configuração (`src/engine/config/`) e serão calibrados com uso real.

## 1. Conceitos

| Termo | Significado |
|---|---|
| **Conta** (`Problem`) | Uma operação: `a op b`, com `op` ∈ {`+`, `−`} no MVP |
| **Rodada** (`Round`) | Sequência de contas resolvidas de uma vez, com tempo-limite |
| **Nível** (`Level`) | Um tipo de conta (ex.: "2 dígitos + 1 dígito, com vai um") |
| **Etapa** (`Stage`) | Subdivisão do nível (A, B, C), com tempo cada vez mais curto |
| **Estrelas** | Nota de 0 a 3 de uma rodada |
| **Modo** | `challenge` (desafio), `practice` (treino livre), `warmup` (aquecimento), `placement` (nivelamento) |

Tabela de níveis e regras de geração: [LEVELS.md](LEVELS.md).

## 2. A rodada (modo desafio)

### 2.1 Início
- Contagem regressiva "3, 2, 1" antes da primeira conta. Ela não conta no tempo.
- A rodada tem **10 contas** ⚙️ e um **tempo-limite** definido pela etapa ⚙️.
- O cronômetro começa quando a primeira conta aparece.

### 2.2 Durante
- Ficam visíveis a **conta atual** (grande) e as **2 próximas** (menores, esmaecidas).
- A pessoa digita a resposta pelo teclado na tela, ou pelo teclado físico na web.
- O ✓ (ou Enter) **confirma**. Com o campo vazio, o ✓ fica desativado.
- Depois de confirmar, a conta sobe e sai de cena, e a próxima assume o destaque. **Não há indicação de certo ou errado.**
- O **apagar** remove o último dígito digitado.
- Uma resposta tem no máximo **4 dígitos** ⚙️. Dígitos além disso são ignorados.
- A resposta é comparada pelo **valor numérico** (`07` = `7`).
- Uma **barra de tempo** no topo esvazia aos poucos. **Não há contador de contas** visível durante a rodada.

### 2.3 Tempo esgotado
- A barra chega ao fim e muda de cor (ex.: âmbar). **A rodada continua normalmente** até a 10ª conta.
- O tempo excedente é registrado e mostrado no resultado.

### 2.4 Saída no meio
- O botão "sair" pede confirmação. A rodada é **abandonada**: não afeta progresso nem sequência, mas fica no histórico com status `abandoned`.
- Se o app vai para segundo plano, o tempo continua contando (baseado em horário de início, não em ticks).

### 2.5 Medições
- `elapsedMs`: do aparecimento da 1ª conta à confirmação da última.
- Por conta: `timeMs`, do momento em que ela virou a conta atual até a confirmação.
- Por conta: a resposta dada e se está correta.

## 3. Estrelas

Sejam `accuracy = corretas / total` e `limit` = tempo-limite da etapa.

| Estrelas | Condição |
|---|---|
| 0 | `accuracy < 0.80` ⚙️ |
| ⭐ | `accuracy ≥ 0.80` (com ou sem tempo estourado) |
| ⭐⭐ | `accuracy ≥ 0.80` **e** `elapsedMs ≤ limit` |
| ⭐⭐⭐ | `accuracy ≥ 0.95` ⚙️ **e** `elapsedMs ≤ 0.75 × limit` ⚙️ |

- Com 10 contas: ⭐ = 8+ certas; ⭐⭐⭐ = 10/10 (pois 9/10 = 0.90 < 0.95).
- Avalia-se sempre a maior faixa atingida.
- Com o tempo estourado, o máximo é ⭐.

## 4. Progressão

- **Passa de etapa** com ⭐⭐ ou ⭐⭐⭐ no modo desafio. A próxima etapa é desbloqueada (A → B → C → próximo nível A).
- Com 0 ou ⭐, **repete** a mesma etapa, com contas novas (seed nova).
- Guarda-se a **melhor nota** de cada etapa. Etapas já desbloqueadas podem ser rejogadas para melhorar as estrelas. Rejogar nunca bloqueia nada de novo.
- O "Continuar" da tela inicial leva à **etapa mais avançada desbloqueada**.

## 5. Resultado

Ordem dos elementos na tela:
1. **Placar**: `7/10` e o tempo total (ex.: `52s de 60s`, ou `68s, passou 8s`).
2. **Estrelas** (animação simples).
3. **Mensagem** (seção 6).
4. **Comparação pessoal** com a tentativa anterior **na mesma etapa** (seção 6.2), quando houver.
5. **Lista das 10 contas**, com as erradas em destaque e a resposta dada.
6. Botões: **Corrigir erradas** (se houver), **Próxima etapa** (se passou) ou **Tentar de novo** (se não passou), **Início**.

## 6. Mensagens

Todas as mensagens são amigáveis e incentivadoras, nunca punitivas. Os textos finais ficam no i18n; abaixo estão os exemplos.

### 6.1 Por resultado

| Situação | Exemplo |
|---|---|
| ⭐⭐⭐ | "Perfeito! Rápido e certeiro. 🔥" |
| ⭐⭐ | "Etapa concluída! Bora para a próxima." |
| Acerto ok, tempo estourado (⭐) | "10 de 10, mandou muito bem! 🎯 Agora é ganhar velocidade: você passou 8s do tempo." |
| Acerto baixo, dentro do tempo | "Rápido você já é! Agora foca na precisão, sem pressa." |
| Acerto baixo e tempo estourado | "Começa pela precisão. A velocidade vem com a prática. 💪" |

### 6.2 Comparação pessoal (sempre que for positiva)
Mostre **uma** frase, na ordem de prioridade:
1. Novo melhor tempo na etapa: "Seu melhor tempo aqui: 52s → 47s!" (só com 100% de acerto, D-020)
2. Mais acertos que a tentativa anterior: "2 acertos a mais que da última vez."
3. Mais rápido que a tentativa anterior: "Você foi 4s mais rápido que da última vez." (só com 100% de acerto, D-020)
4. Nenhuma melhora: não mostra nada (nunca diga "você piorou").

## 7. Correção (após a rodada)

- Opcional. Mostra **só as contas erradas**, uma por vez, **sem tempo**.
- Aqui **há retorno**: acertou → ✓ verde e passa para a próxima; errou → leve tremida e tenta de novo.
- Depois de 2 tentativas erradas na mesma conta, aparece o botão **"Ver resposta"**.
- A correção **não altera** estrelas nem progressão. Os resultados dela ficam registrados no histórico.
- **Dica única de digitação:** na primeira vez que alguém abre a correção, um balão explica que dá para mudar a direção da digitação nas configurações. Aparece uma vez só (`hasSeenDirectionTip`).

## 8. Aquecimento (anti-frustração)

- Cada etapa tem um contador de **falhas seguidas** (rodadas de desafio com < ⭐⭐).
- Ao chegar a **3 falhas seguidas** ⚙️, a próxima rodada dessa etapa vira **aquecimento**:
  - 10 contas: 5 da **etapa anterior** e 5 da **etapa atual**, intercaladas, começando pelas mais fáceis.
  - Mesmo tempo-limite da etapa atual.
  - Se não existe etapa anterior (L01-A), usa a etapa atual com **+50% de tempo** ⚙️.
  - Tela com o rótulo "Aquecimento". O resultado mostra acertos e tempo, **sem estrelas**, e **não conta para a progressão**.
- Depois do aquecimento, o contador volta a 0 e a rodada seguinte é um desafio normal.
- Passar de etapa também zera o contador.

## 9. Treino livre

- Escolha qualquer **etapa já desbloqueada**.
- **Sem barra de tempo** e sem estrelas. O tempo é medido em silêncio, só para o histórico.
- Mesmo fluxo da rodada (sem retorno durante) e mesma tela de correção.
- Nunca afeta a progressão. Conta para a sequência de dias.

## 10. Teste de nivelamento

- Oferecido **no primeiro acesso** ("Quer fazer um teste rápido para começar no seu nível?"). Pode ser pulado e refeito depois nas configurações.
- Testa uma sequência de **níveis-checkpoint** ⚙️ (ver [LEVELS.md](LEVELS.md)), em ordem.
- Em cada checkpoint: **5 contas** ⚙️ com a configuração da etapa B e metade do tempo-limite dela.
- **Passa o checkpoint** com ≥ 4/5 certas dentro do tempo.
- Para no primeiro checkpoint em que falhar. A pessoa começa na **etapa A do nível seguinte ao último checkpoint aprovado** (ou no L01-A se não passou nenhum).
- Todas as etapas anteriores ao ponto de início ficam desbloqueadas, com 0 estrelas.
- Sem tela de correção. Mensagem final: "Você começa no Nível X!".

## 11. Sequência de dias (streak)

- Um dia conta quando a pessoa conclui **pelo menos 1 rodada** (desafio, treino livre ou aquecimento) naquele dia, pelo **horário local**.
- Jogou ontem e hoje → `current + 1`. Pulou um dia ou mais → volta a 1.
- Guarda `current` e `best`. Aparece na tela inicial ("🔥 5 dias").

## 12. Configurações

| Opção | Valores | Padrão |
|---|---|---|
| Idioma | Português, English | Idioma do aparelho (PT se não for nenhum dos dois) |
| Direção da digitação | Esquerda → direita / Direita → esquerda | Esquerda → direita |
| Refazer nivelamento | ação | – |
| Apagar progresso | ação com confirmação dupla | – |

### 12.1 Direção da digitação
- **Esquerda → direita:** digitando `1`, `1`, `2`, aparece `1` → `11` → `112`. O cursor fica à **direita** do número.
- **Direita → esquerda:** digitando `2`, `1`, `1`, aparece `2` → `12` → `112`. Cada dígito novo entra à esquerda. O cursor fica à **esquerda** do número.
- **Nenhum indicador revela a quantidade de dígitos da resposta** (sem tracinhos por dígito).
- O "apagar" sempre remove o **último dígito digitado**, qualquer que seja a direção.
