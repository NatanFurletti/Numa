# Roadmap

> **Próximo passo:** terminar o teste do dia (D-031) e levar para `homolog`. Depois, **M8** (Fase 4). Ao concluir um marco, atualize esta linha.

## Fase 0: setup do projeto

- [x] Repositório Git + GitHub
- [x] Criar o app Expo com TypeScript e Expo Router
- [x] Jest (`jest-expo`) + React Native Testing Library + fast-check, com 1 teste de exemplo passando
- [x] ESLint + Prettier + regra de fronteiras entre camadas (ARCHITECTURE §4)
- [x] Scripts: `test`, `test:watch`, `test:coverage`, `typecheck`, `lint`, `web`
- [x] GitHub Actions: typecheck + lint + testes com cobertura
- [x] Atualizar a tabela de comandos do `CLAUDE.md` com os comandos reais

**Pronto quando:** `npm test`, `npm run typecheck` e `npm run lint` passam localmente e no CI, e `npm run web` abre uma tela "Numa".

## Fase 1: MVP web (offline, PWA)

### M1 · Motor do jogo (só TDD, sem interface)
Ordem em [TESTING.md §4](TESTING.md): rng → carry → answer-input → scoring → generator → round → progression → feedback → streak → placement.
**Pronto quando:** todas as regras de GAME_RULES e LEVELS cobertas, com engine ≥ 95% de cobertura.

- [x] rng · carry · answer-input · scoring · generator · round · progression · feedback · streak · placement

### M2 · Rodada jogável
- [x] Teclado na tela + teclado físico
- [x] Fila de contas (atual + 2 próximas) com animação
- [x] Resposta no lugar do "?" com cursor e direção da digitação
- [x] Barra de tempo, incluindo o estado "tempo esgotado"
- [x] Contagem 3-2-1 e saída com confirmação

### M3 · Resultado e correção
- [x] Tela de resultado (placar, estrelas, mensagem, comparação, lista)
- [x] Tela de correção com "Ver resposta"
- [x] Balão de dica da direção da digitação (uma vez)

### M4 · Progressão e persistência
- [x] Stores (settings, progress, history) com persistência e migrações
- [x] Tela de níveis com estrelas e cadeados
- [x] Início com "Continuar" e sequência de dias
- [x] Aquecimento após 3 falhas

### M5 · Treino livre, configurações e i18n
- [x] Treino livre
- [x] Configurações (idioma, direção, apagar progresso). "Refazer nivelamento" foi para o M6 (D-024)
- [x] Todos os textos em PT e EN

### M6 · Nivelamento, PWA e publicação
- [x] Boas-vindas + teste de nivelamento, com "Refazer nivelamento" nas configurações
- [x] Manifest, ícones e service worker (offline). O ícone provisório foi trocado pelo mascote (D-029)
- [x] Testes E2E dos fluxos críticos (TESTING §3.6)
- [x] Deploy na Vercel, com produção (`main`) e homologação (`homolog`) (D-025)
- [ ] Teste com 5–10 pessoas de idades diferentes e ajuste dos tempos ⚙️

**MVP pronto quando:** alguém joga do L01 ao L15 no celular e no computador, offline, em PT ou EN, sem perder progresso.

## Fase 2: contas, backend e dados

- [x] Decidir o backend (D-003: Supabase × API própria): Supabase (D-031)
- [ ] Conta opcional + sincronização entre aparelhos
- [ ] Envio anônimo de rodadas com consentimento (DATA §2.4)
- [ ] Faixa etária opcional
- [ ] Configuração de regras baixada do servidor (`rules_configs`)
- [ ] Painel/consultas de calibração por etapa e faixa etária
- [ ] Política de privacidade
- [ ] Registrar domínio e fazer a busca de marca no INPI

## Fase 3: lojas e engajamento

- [ ] Builds iOS/Android via EAS e publicação nas lojas
- [ ] Notificações push ("não perca sua sequência")
- [x] Teste do dia (mesma seed para todos) com ranking diário (D-031)
- [ ] Ranking: conferir as respostas no servidor reaproveitando o engine (hoje o servidor confia no placar). Está no M8
- [ ] Ranking: CAPTCHA no login anônimo e limpeza periódica de usuários anônimos antigos
- [ ] Monetização freemium (D-016)

## Fase 4: pontos, mascote e desafios (D-032)

Marcos em ordem. Cada um cabe em uma sessão de trabalho própria, em uma branch `mN-...` saindo de `homolog`. Os itens de **"Decidir ao iniciar"** são conversados no começo da sessão e registrados no DECISIONS antes do código.

O M9 depende do M8 só na parte do servidor. O M10 e o M11 dependem só do M9. O M12 e o M13 dependem do M8 e do M9.

### M8 · Rodadas conferidas no servidor e consentimento
- [ ] Teste técnico: rodar o `src/engine` no servidor (Edge Function do Supabase × Vercel Function) e escolher
- [ ] Teste do dia conferido no servidor: o app envia respostas e tempos, e o servidor refaz as contas pela seed e calcula o placar
- [ ] Consentimento para enviar rodadas (DATA §2.4), com a opção nas configurações
- [ ] Envio das rodadas de desafio (seed, respostas, tempos), com fila para quando não há internet
- [ ] Política de privacidade (apelido público e rodadas enviadas)

**Decidir ao iniciar:** onde a conferência roda; em que momento pedir o consentimento (primeiro acesso ou ao abrir o ranking); o que acontece com quem já tem apelido.
**Pronto quando:** um placar falso enviado pelo navegador é recusado, e quem não consentiu joga sem enviar nada.

### M9 · Pontos
- [ ] Regras dos pontos no GAME_RULES e valores em `src/engine/config/`
- [ ] `points` no engine (TDD): acertos × peso do nível, bônus por estrelas e por etapa nova, e as travas
- [ ] Pontos ganhos na tela de resultado e total na tela inicial
- [ ] Store local dos pontos (total e da semana), com migração
- [ ] Servidor: recalcula os pontos de cada rodada recebida e guarda o total e o da semana

**Decidir ao iniciar:** pesos, bônus e travas; se treino livre, aquecimento e teste do dia rendem pontos; se as rodadas já guardadas no histórico rendem pontos retroativos.
**Pronto quando:** toda rodada mostra os pontos ganhos, repetir e falhar de propósito não rende, e o total do servidor bate com o do aparelho.

### M10 · Evolução do mascote
- [ ] Desenhar os estágios, comparando opções na tela como no D-029 (de uma peça sozinha ao ábaco completo, ganhando fileiras)
- [ ] `Mascot` aceita o estágio; limites de pontos de cada estágio em `src/engine/config/`
- [ ] Mascote na tela inicial com o progresso até a próxima evolução
- [ ] Momento da evolução (animação e mensagem)

**Decidir ao iniciar:** quantos estágios, o desenho de cada um, os limites de pontos, e o que vem depois do ábaco completo (cores, acessórios). Os ícones do app continuam com o ábaco completo.
**Pronto quando:** um jogador novo começa com o mascote inicial e vê pelo menos uma evolução na primeira semana de uso normal.

### M11 · Missões diárias
- [ ] `missions` no engine (TDD): 3 missões por dia, sorteadas pela seed da data, e o progresso calculado a partir das rodadas do dia
- [ ] Cartão de missões na tela inicial e bônus por completar as três
- [ ] Pontos das missões somados no aparelho e no servidor

**Decidir ao iniciar:** a lista de missões e quanto vale cada uma. Ponto de partida: concluir o teste do dia (bônus com 8/10 ou mais), completar 3 rodadas, acertar 25 contas, corrigir todas as erradas de uma rodada, fazer uma rodada 10/10, melhorar as estrelas de uma etapa antiga. A missão de desafiar um amigo entra com o M13.
**Pronto quando:** as missões funcionam offline, mudam todo dia e nunca aparecem como algo perdido.

### M12 · Ranking semanal de pontos
- [ ] Tabela e função de ranking da semana no Supabase
- [ ] Tela do ranking com abas "Hoje" e "Semana": os 50 primeiros e a posição da própria pessoa
- [ ] Estágio do mascote ao lado do apelido

**Decidir ao iniciar:** o corte da semana (sugestão: segunda-feira, 00:00 de Brasília); se o ranking é global ou em grupos (ligas) desde o início.
**Pronto quando:** os pontos conferidos pelo servidor aparecem no ranking da semana, que zera sozinho na virada.

### M13 · Desafios entre amigos
- [ ] Tabela de desafios no Supabase: etapa, seed, quem desafiou e os resultados
- [ ] "Desafiar um amigo" no resultado: cria o desafio e compartilha o link
- [ ] Rota do link: quem chega joga as mesmas contas, mesmo sem ter a etapa liberada e sem passar pelas boas-vindas
- [ ] Comparação no fim e aviso do resultado para quem desafiou
- [ ] Bônus de vitória e missão "desafie um amigo"

**Decidir ao iniciar:** quanto vale ganhar e o limite diário de bônus (para dois amigos não trocarem pontos entre si); validade do link; se o mesmo link serve para várias pessoas; como quem desafiou fica sabendo do resultado.
**Pronto quando:** uma pessoa sem o app aberto recebe o link, joga, vê quem ganhou, e quem desafiou vê o resultado.

## Ideias futuras (fora do MVP)

Anote aqui tudo que surgir e não couber na fase atual.

**Jogo**
- Opção de **confirmação automática** ao completar a quantidade de dígitos (D-007)
- ~~Níveis de **3 dígitos**~~ (feito: 3+2 e 3+3, D-028)
- ~~**Multiplicação** e **divisão**~~ (feito: tabuada e 2 dígitos por 1, L26–L35, D-030). Depois: multiplicação por 2 dígitos, divisão com resto e conta armada de multiplicação
- Números negativos
- ~~Conta em formato **vertical (armada)**~~ (feito: nível armado antes de cada conta na linha, D-028)
- Dificuldade **adaptativa por pessoa**, além da média por idade
- Pausa durante a rodada
- Rodadas de tamanho variável (5 / 10 / 20)

**Engajamento**
- Conquistas e medalhas
- ~~Mascote do Numa~~ (feito: ábaco com bracinhos no resultado e nos ícones, D-029). Depois: mascote no início e no nivelamento, e versão com volume 3D
- Compartilhar resultado (imagem)
- Estatísticas pessoais (evolução de tempo por etapa, contas que mais erra)
- Perfis de família (vários jogadores no mesmo aparelho)

**Interface**
- Tema claro / automático
- Sons e vibração (haptics), com opção de desligar
- Tamanho de fonte ajustável
- Mais idiomas (ES)
