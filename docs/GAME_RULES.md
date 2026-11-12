# Regras do jogo

Este documento é a **especificação de comportamento** do jogo. Cada regra aqui deve virar pelo menos um teste (ver [TESTING.md](TESTING.md)). Os números marcados com ⚙️ ficam em configuração (`src/engine/config/`) e serão calibrados com uso real.

## 1. Conceitos

| Termo | Significado |
|---|---|
| **Conta** (`Problem`) | Uma operação: `a op b`, com `op` ∈ {`+`, `−`, `×`, `÷`}. A divisão é sempre exata (D-030) |
| **Rodada** (`Round`) | Sequência de contas resolvidas de uma vez, com tempo-limite |
| **Nível** (`Level`) | Um tipo de conta (ex.: "2 dígitos + 1 dígito, com vai um") |
| **Etapa** (`Stage`) | Subdivisão do nível (A, B, C), com tempo cada vez mais curto |
| **Estrelas** | Nota de 0 a 3 de uma rodada |
| **Modo** | `challenge` (desafio), `practice` (treino livre), `warmup` (aquecimento), `placement` (nivelamento) |
| **Teste do dia** | As mesmas contas para todo mundo, uma tentativa por dia, com ranking (seção 13) |

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
3. **Mensagem** (seção 6), dita pelo mascote em um balão. O humor do mascote acompanha a mensagem (D-029).
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
- Em cada checkpoint: um bloco de **5 contas** ⚙️ com a configuração da etapa B. A barra de tempo mostra metade do tempo-limite dela.
- **Passa o checkpoint** com ≥ 4/5 certas ⚙️ **e** a **mediana do tempo por conta** dentro do ritmo da etapa B (tempo-limite da B ÷ 10). A mediana evita que uma única hesitação reprove (D-026).
- No **primeiro bloco**, o tempo da 1ª conta não conta ⚙️: a pessoa ainda está conhecendo o teclado.
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
| Enviar minhas rodadas | Enviar / Não enviar (só com servidor configurado) | sem resposta, até a pessoa ser perguntada (§13.4) |

### 12.1 Direção da digitação
- **Esquerda → direita:** digitando `1`, `1`, `2`, aparece `1` → `11` → `112`. O cursor fica à **direita** do número.
- **Direita → esquerda:** digitando `2`, `1`, `1`, aparece `2` → `12` → `112`. Cada dígito novo entra à esquerda. O cursor fica à **esquerda** do número.
- **Nenhum indicador revela a quantidade de dígitos da resposta** (sem tracinhos por dígito).
- O "apagar" sempre remove o **último dígito digitado**, qualquer que seja a direção.

## 13. Teste do dia e ranking (D-031, D-034)

### 13.1 O teste
- **Todo mundo faz as mesmas contas no mesmo dia.** A seed sai da data (`dailySeed('2026-11-11')`), então o teste é gerado no aparelho, sem servidor, e funciona offline.
- O dia é o do **horário local** do aparelho, como na sequência de dias.
- São **10 contas** ⚙️, uma de cada nível da lista `daily.levels` ⚙️, em **dificuldade crescente**, misturando as quatro operações: soma, subtração, tabuada e divisão de 1 dígito, e depois as mesmas quatro com 2 dígitos.
- **Sem tempo-limite e sem barra de tempo.** O tempo é medido e vale para o ranking. Sem estrelas e sem tela de correção.
- Mesma tela da rodada (contagem 3-2-1, sem retorno de certo ou errado), com o rótulo "Teste do dia".

### 13.2 Uma tentativa por dia
- A tentativa está **usada quando a primeira conta aparece**. Sair durante a contagem não usa a tentativa.
- **Sair no meio** (com confirmação) encerra a tentativa com as contas já respondidas. As outras contam como erradas.
- Se o app fechar no meio do teste, a tentativa do dia fica como **interrompida**: sem resultado e sem nova chance. Sem isso, bastaria recarregar a página para ver as contas antes de valer.
- Depois de jogar, a tela mostra o placar, o tempo, a posição no ranking e a lista das contas com as respostas.
- O teste concluído **conta como dia jogado** na sequência. Não mexe em etapas nem estrelas, e não entra no histórico de rodadas.

### 13.3 Ranking
- **Ordem:** mais acertos primeiro. No empate, o menor tempo. Se ainda empatar, quem enviou primeiro.
- A tela mostra os **50 primeiros** do dia e, se estiver fora deles, a posição da própria pessoa ("Você ficou em 62º de 340.").
- O ranking pode ser visto antes de jogar: ele não mostra as contas.
- **Só entra no ranking quem aceita enviar os resultados** (§13.4). Quem recusa faz o teste do mesmo jeito, sem apelido, e vê o ranking.
- **Apelido, sem conta:** pedido antes do primeiro teste de quem aceitou, e lembrado depois. De 2 a 16 caracteres ⚙️: letras, números, espaço, ponto, hífen e sublinhado. Uma lista curta de palavrões é recusada ⚙️. A tela avisa que o apelido aparece para todo mundo e pede para não usar o nome completo.
- **Sem internet:** o teste funciona. O resultado fica guardado e é enviado na próxima vez que a tela do teste do dia abrir com internet, se ainda for o mesmo dia.
- **Sem o Supabase configurado** (build sem as variáveis): o teste funciona, sem pedido de consentimento, sem apelido e sem ranking.

### 13.4 Consentimento para enviar (D-034)
- Na **primeira vez que a pessoa abre o teste do dia**, antes do apelido, o app pergunta se ela quer entrar no ranking e explica o que é enviado. Dois botões: **Aceitar e entrar no ranking** e **Jogar sem enviar**. Há um link para a política de privacidade.
- **Um aceite vale para tudo o que é enviado:** o teste do dia e as rodadas de desafio.
- **Sem resposta ou com recusa, nada sai do aparelho.** Quem recusa joga tudo normalmente.
- **Quem já tinha apelido** antes desta regra também é perguntado, na próxima vez que abrir o teste do dia. Até aceitar, nada novo é enviado.
- **Quem já jogou o teste de hoje e aceita depois** tem o resultado enviado na hora. Se ainda não tinha apelido, escolhe um.
- A escolha pode ser mudada em **Configurações > Privacidade**. Desligar para os envios e descarta as rodadas que esperavam na fila. O que já foi enviado continua no servidor até a pessoa pedir para apagar.

### 13.5 Conferência no servidor (D-034)
- **O app nunca envia o placar.** Envia a resposta, o tempo e o número de teclas de cada conta. O servidor refaz as contas com o mesmo engine (pela data, no teste do dia; pela etapa e seed, no desafio) e calcula acertos, tempo e estrelas.
- **O tempo total é a soma dos tempos por conta.**
- O servidor **recusa** a rodada inteira quando:
  - a quantidade de respostas não bate com a de contas;
  - uma resposta não é um número que o teclado produz (inteiro de 0 a 9999);
  - há conta respondida depois de uma conta sem resposta (a rodada para no abandono);
  - uma conta foi respondida em menos de **250 ms** ⚙️;
  - um tempo é negativo, não inteiro ou maior que 24 h ⚙️;
  - a versão das regras (`rulesVersion`) é diferente da do servidor;
  - no teste do dia: o dia está a mais de 1 dia da data do servidor, ou o apelido está fora das regras.
- **Rodadas de desafio** de quem aceitou são enviadas ao terminar (concluídas ou abandonadas). Sem internet, ficam numa fila no aparelho e saem depois. Treino livre, aquecimento e nivelamento não são enviados.
- **Limite conhecido:** o tempo vem do aparelho, porque o teste funciona offline. Quem calcula as respostas com um programa e envia tempos plausíveis ainda passa.

## 14. Pontos (D-032, D-035)

Os pontos vêm dos **acertos**, e não da participação. Eles movem o mascote (pontos totais) e o ranking da semana (pontos de cada dia). Não há moeda para gastar.

### 14.1 Rodada de desafio concluída
Seja `peso` o peso da faixa do nível ⚙️:

| Faixa | Níveis | Peso |
|---|---|---|
| 1 dígito | L01–L05 | 1 |
| 2d ± 1d | L06–L10 | 2 |
| 2d ± 2d | L11–L15 | 3 |
| 3d ± 2d | L16–L20 | 4 |
| 3d ± 3d | L21–L25 | 5 |
| Tabuada e divisão de 1 dígito | L26–L30 | 2 |
| 2d × 1d e divisão de 2 dígitos | L31–L35 | 4 |

A versão armada (`L07V`) tem o peso da versão na linha (`L07`).

- **Acertos:** `acertos × peso`.
- **Estrelas novas:** `5 × peso` ⚙️ por estrela acima da melhor nota anterior da etapa. Repetir com a mesma nota (ou menor) não rende bônus.
- **Etapa nova:** `10 × peso` ⚙️ na primeira vez que a pessoa passa da etapa (⭐⭐ ou mais). Etapas liberadas pelo nivelamento ainda contam como novas.
- Ex.: 10/10 com ⭐⭐⭐ pela primeira vez na L12-B (peso 3): `30 + 3 × 15 + 30 = 105`.

### 14.2 Travas
- **Por dia:** os acertos só rendem nas **3 primeiras** ⚙️ rodadas de desafio concluídas de cada etapa no dia (horário local). Da 4ª em diante, só os bônus, que de qualquer jeito saem uma vez por etapa.
- **Acerto mínimo:** rodada com menos de **50%** ⚙️ de acerto não rende acertos.

### 14.3 Outros modos
- **Teste do dia:** `acertos × 3` ⚙️, uma vez por dia. Sair no meio rende as contas respondidas.
- **Treino livre, aquecimento, nivelamento e rodadas abandonadas** não rendem pontos.

### 14.4 Onde aparecem
- **Resultado** (desafio e teste do dia): os pontos ganhos, com as partes (acertos, estrelas novas, etapa nova). Quando a trava do dia segurou os acertos, uma frase explica, sem tom de bronca. Com 0 pontos, a linha não aparece.
- **Tela inicial:** o total de pontos.

### 14.5 Contagem
- Os pontos de uma rodada são calculados ao gravá-la e somados **uma vez só** (pelo id da rodada, ou pelo dia no teste do dia).
- **Sem pontos retroativos:** as rodadas de antes desta regra não rendem.
- "Apagar progresso" zera os pontos.
- O servidor recalcula os pontos das rodadas que recebe com a mesma função do engine (D-032).
