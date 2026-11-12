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
- Total de pontos: "✨ 120 pontos" ([GAME_RULES §14](GAME_RULES.md)). Some enquanto a pessoa não tem pontos.
- Botão grande: **Continuar — Nível 7 · Etapa B**.
- Botões secundários: **Teste do dia** (com ✓ depois de feito no dia), **Níveis**, **Treino livre** e ⚙️ **Configurações**.

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
Ver a ordem dos elementos em [GAME_RULES.md §5](GAME_RULES.md). O mascote (um ábaco com bracinhos) diz a mensagem em um balão: comemora, sorri, se concentra ou dá apoio, conforme o resultado. Lista das contas: certas com ✓ discreto, erradas destacadas com ✗ e "você respondeu 85".

Logo abaixo das estrelas, os pontos ganhos ("+105 pontos") e, quando há mais de uma parte, "30 dos acertos · 45 das estrelas novas · 30 da etapa nova". Quando a trava do dia segurou os acertos, uma frase avisa que eles voltam a valer amanhã. Com 0 pontos e sem trava, nada aparece ([GAME_RULES §14.4](GAME_RULES.md)).

### 3.7 Correção
- Uma conta errada por vez, com o mesmo teclado. Indicador "2 de 3".
- Acertou: ✓ verde e avança. Errou: tremida e tenta de novo. Após 2 erros: botão "Ver resposta".
- Balão de dica (uma única vez) sobre a direção da digitação.
- No fim: "Tudo corrigido! 👏" e o botão de voltar ao resultado ou ao início.

### 3.8 Treino livre
- Mesma lista da tela de Níveis, mostrando só as etapas desbloqueadas, sem estrelas.
- A rodada não tem barra de tempo. O resultado mostra acertos e tempo, sem estrelas.

### 3.9 Configurações
Ver [GAME_RULES.md §12](GAME_RULES.md). Na seção "Privacidade", duas opções (**Enviar minhas rodadas** / **Não enviar**), com uma linha explicando cada uma, e o botão da política. Nenhuma vem marcada enquanto a pessoa não respondeu. As opções só aparecem se o build tem servidor configurado.

### 3.10 Teste do dia
Regras em [GAME_RULES.md §13](GAME_RULES.md). Uma tela só, que muda conforme a tentativa do dia:
- **Quem ainda não respondeu ao pedido de consentimento** ([GAME_RULES §13.4](GAME_RULES.md)): explicação curta e um cartão com o pedido, o link da política e os botões **Aceitar e entrar no ranking** e **Jogar sem enviar**. Sem campo de apelido e sem botão de começar até responder. Embaixo, o ranking de hoje.
- **Antes de jogar:** explicação curta, campo do apelido (com o aviso de que ele é público) e o botão **Começar o teste**. Quem recusou o envio não vê o campo do apelido, e sim o aviso de que fica fora do ranking. Embaixo, o ranking de hoje.
- **Depois de jogar:** placar grande, tempo, os pontos ganhos ("+27 pontos"), "Você ficou em 12º de 340.", o ranking (a linha da pessoa em destaque, com "(você)") e a lista das contas com as respostas.
- **Depois de jogar, sem ter respondido ao pedido:** o placar e o mesmo cartão do pedido. Ao aceitar, o resultado é enviado. Quem aceitou e não tem apelido vê o campo do apelido com o botão **Entrar no ranking**. Quem recusou vê o aviso de que fica fora do ranking.
- **Teste interrompido:** aviso de que a tentativa de hoje acabou, e o ranking.
- Ranking: posição, apelido, acertos e tempo com décimos (`41.5s`). Estados: carregando, erro com "Tentar de novo", vazio e indisponível.
- A rodada do teste (`/daily-play`) é a tela da rodada, sem barra de tempo, com o rótulo "Teste do dia".
- Embaixo do aviso do apelido, um link para a **Política de privacidade**.

### 3.11 Política de privacidade
- Texto corrido, em seções: o que fica no aparelho, o que vai para o servidor e só com o aceite (teste do dia e rodadas de desafio), quem guarda, por quanto tempo, direitos, crianças e mudanças. Data da última atualização no topo.
- Abre pelas Configurações (seção "Privacidade") e pelo link junto do apelido no teste do dia.
- O e-mail de contato fica em `src/features/privacy/contact.ts`. Mudou o que é enviado ao servidor? Atualize o texto e a data (D-033).

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
| `/daily` | Teste do dia: entrada, resultado e ranking |
| `/daily-play` | Rodada do teste do dia |
| `/privacy` | Política de privacidade |
