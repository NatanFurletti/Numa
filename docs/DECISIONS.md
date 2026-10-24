# Registro de decisões

Cada decisão tem: contexto, o que foi decidido e por quê. Para mudar uma decisão, adicione uma nova entrada que a substitui. Não apague as antigas.

---

### D-001 · Expo (React Native + Web) como base única
**Data:** 2026-10-23
**Contexto:** O app precisa rodar na web agora e nas lojas (iOS/Android) depois. O dono domina JS/TS, mas não conhece React nem mobile.
**Decisão:** Expo + Expo Router + TypeScript.
**Por quê:** Um único código e uma única ferramenta para aprender. A Fase 3 (lojas) não exige reescrever nada. Notificações push nativas (para a sequência de dias) funcionam melhor no app nativo do que em PWA no iOS.
**Alternativa descartada:** React + Vite (PWA) + Capacitor depois. É mais simples hoje, mas mais trabalhoso na hora de ir para as lojas.

### D-002 · Fase 1 sem backend (offline-first)
**Data:** 2026-10-23
**Decisão:** Toda a lógica do jogo roda no aparelho, e o progresso fica salvo localmente.
**Por quê:** Gerar contas, cronometrar e corrigir não precisam de servidor. Custo zero, escala ilimitada e funciona offline. Valida o jogo antes de investir em backend.
**Consequência:** Os dados de rodadas já são salvos num formato pronto para envio futuro (ver [DATA.md](DATA.md)).

### D-003 · Backend da Fase 2 em aberto
**Data:** 2026-10-23
**Decisão:** Decidir na Fase 2 entre Supabase e uma API própria em TS (Hono + Postgres/Neon + Drizzle + Better Auth).
**Por quê:** O dono nunca usou Supabase. Na Fase 1 não é necessário, e a decisão fica melhor informada com o jogo pronto.

### D-004 · Motor do jogo em TypeScript puro
**Data:** 2026-10-23
**Decisão:** `src/engine/` sem dependência de React, Expo ou storage. Relógio e aleatoriedade são injetados.
**Por quê:** É o coração do produto e precisa ser 100% testável com TDD. Também pode ser reaproveitado no backend (validação anti-trapaça, ranking).

### D-005 · TDD como processo de desenvolvimento
**Data:** 2026-10-23
**Decisão:** Todo código de produção começa por um teste que falha. Ver [TESTING.md](TESTING.md).

### D-006 · Jest como executor de testes único
**Data:** 2026-10-23
**Contexto:** Inicialmente sugeri Vitest para o motor.
**Decisão:** Jest (preset `jest-expo`) para tudo, mais React Native Testing Library para componentes e Playwright para E2E web.
**Por quê:** `jest-expo` é o padrão oficial do Expo. Um único executor evita duas configurações e duas sintaxes enquanto o dono aprende o ecossistema.

### D-007 · Confirmação explícita da resposta (botão ✓)
**Data:** 2026-10-23
**Decisão:** No MVP, a resposta é enviada com ✓ (ou Enter).
**Por quê:** Avançar sozinho ao digitar o número certo nunca registra erro, só lentidão, e o jogo mede precisão e velocidade.
**Futuro:** Opção de confirmar automaticamente ao completar a quantidade de dígitos (ver ROADMAP).

### D-008 · Sem retorno de certo ou errado durante a rodada
**Data:** 2026-10-23
**Decisão:** A conta respondida apenas sobe e a próxima entra. O resultado só aparece no fim.
**Por quê:** Mantém o ritmo e o "mistério", como numa prova. A aprendizagem acontece na tela de correção.

### D-009 · Tempo esgotado não interrompe a rodada
**Data:** 2026-10-23
**Decisão:** Quando o tempo acaba, a barra muda de cor e a pessoa termina as 10 contas normalmente. O máximo nesse caso é ⭐ (não passa de etapa).
**Por quê:** A pessoa vê o próprio acerto completo e recebe uma mensagem clara de que o próximo passo é a velocidade.

### D-010 · Regras de estrelas e progressão
**Data:** 2026-10-23
**Decisão:** ⭐ ≥ 80% de acerto · ⭐⭐ ≥ 80% dentro do tempo · ⭐⭐⭐ ≥ 95% com ≥ 25% do tempo sobrando. Passa de etapa com ⭐⭐ ou mais.
**Por quê:** A regra é simples de entender. O domínio é provado pelas várias etapas de cada nível, que sobem a dificuldade aos poucos.
**Futuro:** Valores calibrados com dados reais (Fase 2), por isso ficam em configuração.

### D-011 · Aquecimento em vez de "treino sem tempo" após falhas
**Data:** 2026-10-23
**Decisão:** Após 3 falhas seguidas na mesma etapa, a próxima rodada mistura contas da etapa anterior. Essa rodada não conta para a progressão.
**Por quê:** A frustração faz parte do treino. O objetivo é recuperar a confiança sem tirar a pessoa do treino de velocidade. O progresso pessoal ("4s mais rápido") é sempre mostrado.

### D-012 · Direção da digitação configurável, sem tracinhos por dígito
**Data:** 2026-10-23
**Decisão:** Configuração "esquerda → direita" (padrão) ou "direita → esquerda" (como no papel). Um cursor piscante indica onde entra o próximo dígito.
**Por quê:** Respeita as duas formas de raciocinar (ex.: 56+56: quem calcula a unidade primeiro digita o 2 antes). Um tracinho por dígito revelaria o tamanho da resposta.

### D-013 · Estado com Zustand e persistência via AsyncStorage
**Data:** 2026-10-23
**Decisão:** Zustand para o estado global, persistido com AsyncStorage (que usa `localStorage` na web), por trás de uma interface em `src/storage/`.
**Por quê:** É simples, pequeno e fácil de testar. A interface permite trocar por sincronização com backend na Fase 2.

### D-014 · Idiomas português e inglês desde o MVP
**Data:** 2026-10-23
**Decisão:** i18next + react-i18next + expo-localization. O idioma do aparelho é detectado, e a pessoa pode trocar nas configurações.

### D-015 · Nome "Numa"
**Data:** 2026-10-23
**Decisão:** Nome do app: **Numa**. Nas lojas: "Numa: Treino Mental" / "Numa: Mental Math Training".
**Contexto:** Não há app de cálculo conhecido com esse nome. Existem outras empresas "Numa" (hotéis na Europa, plataforma de homeschooling nos EUA). `numa.app` já está registrado por terceiros.
**Pendente:** Busca oficial no INPI antes da publicação nas lojas e escolha de domínio (livres em 23/10/2026: `numatraining.com`, `numatraining.app`, `numamath.app`, `playnuma.app`).

### D-016 · Sem anúncios; monetização futura via freemium
**Data:** 2026-10-23
**Decisão:** MVP 100% gratuito. A monetização futura deve ser freemium (modos extras, estatísticas, perfis de família), sem anúncios.
**Por quê:** O público inclui crianças, e anúncios contradizem a proposta de combater a "dopamina fácil".

### D-017 · Rotas em `src/app/` (padrão do Expo SDK 58)
**Data:** 2026-10-23
**Contexto:** O ARCHITECTURE previa `app/` na raiz. O template atual do Expo (SDK 58) coloca as rotas em `src/app/`.
**Decisão:** Rotas em `src/app/`. Todo o resto continua em `src/` como planejado.
**Por quê:** Seguir o padrão do Expo evita brigar com a documentação oficial e com o template. As regras entre camadas (ARCHITECTURE §4) continuam iguais, só muda o caminho.

### D-018 · Node 22.13+ e versões fixadas na Fase 0
**Data:** 2026-10-23
**Decisão:** Node 22.13+ (`.nvmrc` = 22.23.4, `engines` no `package.json`). Expo SDK 58, React 19.3, React Native 0.88, TypeScript 6, Jest 30 (`jest-expo`), React Native Testing Library 14.
**Por quê:** O Expo SDK 58 não roda em Node 20. A RNTL 14 usa o pacote `test-renderer` no lugar do antigo `react-test-renderer`.

### D-019 · Detalhes de regra decididos no TDD do engine (M1)
**Data:** 2026-10-23
**Contexto:** Pontos que os docs não definiam e que apareceram ao escrever os testes.
**Decisões:**
- **Melhor tempo** de uma etapa só conta rodadas com pelo menos ⭐ (≥ 80% de acerto). Uma rodada rápida e cheia de erros não vira recorde nem gera a frase "Seu melhor tempo aqui".
- **Espalhar os resultados** (LEVELS §5, regra 8): cada conta nova sai do resultado menos usado até ali na rodada. Na prática, nenhum resultado aparece mais de 2 vezes em 10 contas, inclusive nos níveis mistos.
- **Misto com quantidade ímpar** (ex.: 5 contas no nivelamento): a soma fica com a conta a mais.
- **Nivelamento aprovado até o L15:** começa na última etapa (L15-C), já que não há nível seguinte.
- **Relógio do aparelho voltando no tempo:** a sequência de dias não muda.
- **Sequência no início:** mostra 0 se a pessoa não jogou nem hoje nem ontem (em vez de um número antigo).
- **Teclas (`keystrokes`):** contam todos os toques em dígitos e apagar, inclusive dígitos ignorados por passar do limite.

### D-020 · Recorde de tempo só com 100% de acerto (substitui o 1º item do D-019)
**Data:** 2026-10-23
**Decisão:** Uma rodada só conta como **melhor tempo** da etapa, e só gera as frases "Seu melhor tempo aqui" ou "Você foi Xs mais rápido que da última vez", se tiver **100% de acerto** (`records.minAccuracy = 1` em `game-config.ts`).
**Por quê:** Terminar rápido com erros não pode ser premiado. O jogo mede precisão **e** velocidade, e o recorde deve refletir as duas. A frase "mais acertos que da última vez" continua valendo para qualquer rodada.

### D-021 · Ajustes técnicos do M2 (rodada jogável)
**Data:** 2026-10-23
- **Tipos das rotas:** `npm run typecheck` roda antes `scripts/generate-route-types.js`, que gera `.expo/types/router.d.ts` sem subir o servidor. Sem isso, o typecheck local (com tipos velhos) e o do CI (sem tipos) davam resultados diferentes. O script usa uma parte interna do Expo; se quebrar numa atualização do SDK, é o primeiro lugar a olhar.
- **Uma página estática por etapa** (`generateStaticParams` em `src/app/play/[stageId].tsx`): `/play/L07-B` abre direto na hospedagem estática e fica pronto para o cache offline do PWA.
- **Confirmação de saída própria** (`src/ui/ConfirmDialog.tsx`), porque o `Alert` do React Native não funciona na web.
- **Fim da rodada provisório:** até o M3, a rodada termina num painel simples (placar, tempo, "Jogar de novo" e "Início"). O botão "Começar" do início sempre abre a L01-A até o M4 trazer o "Continuar".
- **Textos em português direto no código** até o M5 (i18n).

### D-022 · Detalhes do M3 (resultado e correção)
**Data:** 2026-10-23
**Substitui:** o item "Fim da rodada provisório" do D-021.
- **Histórico e configurações só em memória até o M4:** `src/store/history.ts` e `src/store/settings.ts` já usam Zustand, mas ainda sem persistência. Recarregar a página apaga as rodadas, e `/result/<id>` mostra "Rodada não encontrada". O M4 acrescenta a persistência e as migrações.
- **Rodadas no histórico:** toda rodada concluída ou abandonada é gravada (`RoundRecord`, DATA §1.3). A exceção é sair durante a contagem 3-2-1: nenhuma conta apareceu, então não há o que gravar.
- **Comparação pessoal a partir do histórico:** a tentativa anterior e o melhor tempo anterior (só rodadas 100% certas, D-020) vêm das rodadas de desafio concluídas na mesma etapa.
- **Frase de comparação arredondada:** se a melhora some ao arredondar para segundos (ex.: 0,3s mais rápido), a frase não aparece. Nunca mostramos "52s → 52s".
- **Aquecimento e treino livre no resultado:** placar, tempo e lista, sem estrelas, mensagem nem comparação. Botões: "Voltar ao desafio" (aquecimento) e "Treinar de novo" (treino livre). Passar na última etapa (L15-C) mostra "Jogar de novo" no lugar de "Próxima etapa".
- **Correção:** o ✓ verde fica 0,7s na tela e a próxima conta entra sozinha. "Ver resposta" mostra a resposta certa e um botão "Próxima" (Enter também avança). As tentativas (`reviewAttempts`) vão para o histórico a cada resposta, então valem mesmo se a pessoa sair no meio. A regra fica em `src/engine/review.ts`; o limite de 2 erros, em `GAME_CONFIG.review`.
- **Dica de direção:** marcada como vista (`hasSeenDirectionTip`) assim que aparece, e não quando a pessoa toca em "Entendi".
- **Navegação:** a rodada terminada é trocada pelo resultado (`router.replace`), para o "voltar" não reabrir uma rodada encerrada. "Início" usa `router.dismissTo('/')`. `/result` e `/review` não têm página estática por id, porque os ids são criados no aparelho.

