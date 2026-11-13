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

### D-023 · Detalhes do M4 (progressão e persistência)
**Data:** 2026-10-23
**Substitui:** o item "Histórico e configurações só em memória até o M4" do D-022.
- **Formato salvo:** cada chave (`numa.settings`, `numa.progress`, `numa.history`) guarda um JSON com `schemaVersion` junto dos campos, como no DATA §1. A leitura e as migrações ficam em `src/storage/document.ts` (`migrations[n]` leva da versão n para a n + 1). `src/store/persist.ts` liga isso ao `persist` do Zustand.
- **Leitura tolerante:** um campo com valor inválido volta ao padrão, e os outros são mantidos. Etapas que não existem mais são descartadas, e etapas novas (de uma atualização) entram bloqueadas. Registros estragados do histórico são descartados. Documento ilegível ou de versão desconhecida: o app usa os padrões e registra o erro com `console.warn`.
- **Versão mais nova que o app** (ex.: voltou para uma versão antiga): também cai nos padrões. A próxima gravação sobrescreve o dado. É raro na Fase 1; rever quando houver sincronização (Fase 2).
- **O app espera os dados carregarem** (`useStoresReady`) antes de abrir qualquer tela. Assim o "Continuar" nunca aparece com o progresso zerado.
- **Páginas estáticas da web:** durante o `expo export` não há `window`. Ali o armazenamento não lê nem salva nada, e o navegador carrega os dados ao abrir a página.
- **Aquecimento:** decidido quando a rodada abre (`playModeFor`). Pedir um desafio numa etapa com aquecimento pendente abre o aquecimento. Depois da 3ª falha seguida, o resultado avisa e o botão vira "Fazer aquecimento".
- **Etapa bloqueada** aberta direto pelo endereço (`/play/L10-A`) mostra um aviso, em vez da rodada.
- **Início:** "Começar" enquanto nenhuma rodada de desafio foi concluída, e "Continuar" depois. A sequência some quando é 0 e usa "1 dia" no singular. Treino livre e Configurações entram no M5.
- **Nomes curtos dos níveis** em `src/features/levels/names.ts`. Vão para o i18n no M5, assim como o idioma salvo (fixo em `pt` até lá).
- **Cobertura:** `src/storage` exige ≥ 85%, o mesmo alvo do store.

### D-024 · Detalhes do M5 (treino livre, configurações e i18n)
**Data:** 2026-10-24
- **Dicionários em TypeScript** (`src/i18n/pt.ts` e `en.ts`), e não em JSON como previa o ARCHITECTURE. O `en.ts` tem o tipo do `pt.ts`, então uma chave faltando ou sobrando em inglês quebra o typecheck. As chaves de `t('...')` também são tipadas (`src/i18n/i18next.d.ts`).
- **Idioma padrão:** o do aparelho (`expo-localization`), se for português ou inglês. Para qualquer outro idioma, português (GAME_RULES §12).
- **`numa.settings` sobe para a versão 2.** Na v1 (M4), o idioma era gravado sempre como `pt`, sem a pessoa poder escolher. A migração 1 → 2 descarta esse valor, e o app volta a seguir o aparelho. É a primeira migração real, testada com um dado gravado pelo M4.
- **O app espera o idioma escolhido entrar** (`useLanguageSync`) antes de mostrar a primeira tela, para nada piscar no idioma errado.
- **Treino livre** reaproveita a tela de níveis (`variant="practice"`): só as etapas desbloqueadas, sem estrelas, e só os níveis com alguma etapa liberada.
- **Apagar progresso:** apaga o progresso (estrelas, etapas, sequência) e o histórico de rodadas. Idioma, direção e a dica já vista ficam. São duas confirmações ("Apagar todo o progresso?" e "Tem certeza?").
- **"Refazer nivelamento" foi para o M6**, junto com a tela de nivelamento. Sem ela, o botão não teria o que abrir.
- **Testes em português:** o `jest.setup.js` simula o aparelho em pt-BR e inicializa o i18n em pt. Os testes de inglês trocam o idioma e voltam ao pt no fim.
- **Nomes dos idiomas** sempre no próprio idioma ("Português", "English"), qualquer que seja o idioma do app.

### D-025 · Ambientes de produção e homologação
**Data:** 2026-10-24
**Decisão:** dois ambientes na Vercel, separados por branch.
- **Produção:** branch `main` (Production Branch da Vercel). Recebe só PRs vindos de `homolog`.
- **Homologação:** branch `homolog`, publicada como Preview com um endereço fixo (domínio ligado à branch). Recebe os PRs de cada marco ou feature.
- **Fluxo:** branch de trabalho sai de `homolog` → PR para `homolog` → testar no endereço de homologação → PR de `homolog` para `main` → produção.
**Por quê:** dá para mostrar uma versão estável para testes com pessoas, enquanto o projeto avança, sem que cada merge chegue direto a elas. Os dados de cada ambiente ficam separados, porque são endereços diferentes e cada endereço tem o seu `localStorage`.
**Plano gratuito:** a Vercel Hobby não tem "ambientes personalizados", então homologação é um Preview com domínio fixo. Se um dia for preciso, migrar para um Custom Environment não muda o fluxo de branches.

### D-026 · Nivelamento pela mediana do tempo por conta, e boas-vindas
**Data:** 2026-10-24
**Substitui:** a regra "≥ 4/5 certas dentro do tempo" do GAME_RULES §10.
**Contexto:** medir só o tempo total do bloco deixava uma única hesitação (alguém chamou, a pessoa se distraiu) reprovar quem domina o nível. E a primeira conta do teste sai mais lenta, porque a pessoa ainda está conhecendo o teclado. Medir só o tempo de cada conta, sem o acerto, também não serve: o tamanho da resposta pesa no tempo de digitar, e rápido-e-errado não pode passar.
**Decisão:**
- Passa no bloco com **4 de 5 certas** e a **mediana do tempo por conta** ≤ o ritmo da etapa B (tempo-limite da B ÷ contas da rodada). A barra de tempo continua mostrando metade do tempo da B, como referência.
- No **primeiro bloco**, a 1ª conta fica fora do cálculo do tempo (`placement.ignoreFirstProblemTime`).
- Cada bloco vai para o histórico (`mode: 'placement'`, etapa B do checkpoint), com o tempo de cada conta. Isso permite calibrar a regra na Fase 2 com dados reais. Os blocos não contam como dia jogado na sequência.
- **Boas-vindas** só para quem nunca jogou. Quem já jogava antes do M6 (sem `onboardingDone` salvo) vai direto ao início.
- O resultado do nivelamento é aplicado assim que o último bloco termina, e não ao tocar em "Vamos lá". Assim vale mesmo se a pessoa fechar o app nessa tela. Refazer o nivelamento nunca bloqueia o que já estava liberado.

### D-027 · PWA, testes E2E e o bug da troca de idioma (M6)
**Data:** 2026-10-24
- **PWA:** `public/manifest.json`, ícones em `public/icons` e o service worker gerado pelo Workbox depois do `expo export` (`npm run build:web`, config em `workbox-config.js`). O registro do service worker fica no `src/app/+html.tsx` e só entra no build de produção.
- **`+html.tsx` no SDK 58:** precisa renderizar `headNodes` e `bodyNodes` de `useServerDocumentContext()`, porque são eles que trazem os scripts do app. O guia de PWA do Expo ainda mostra o template antigo. Com ele, a página abre em branco.
- **Atualizações:** o service worker guarda o site inteiro. Um deploy novo chega na visita seguinte: o service worker novo baixa os arquivos em segundo plano e assume na próxima abertura (`skipWaiting`, `clientsClaim`). Um aviso de "nova versão disponível" fica para depois, se fizer falta.
- **Offline em `/result/<id>` e `/review/<id>`:** não há arquivo por id, então o service worker responde com o `index.html`. Todas as páginas estáticas são iguais (o app só desenha depois de carregar os dados salvos), então isso não tem efeito colateral.
- **Ícone provisório:** um "+" branco num círculo azul, gerado por `scripts/generate-pwa-icons.js`. Trocar quando houver um logo. O ícone dos apps nativos (`app.json`) continua o padrão do Expo até a Fase 3.
- **E2E sem seed fixa:** os testes leem a conta na tela e calculam a resposta. Isso substitui a ideia do TESTING de uma seed por variável de ambiente, e evita um build especial só para testes. Rodam no CI em um job próprio (`e2e`), com o Chromium do Playwright, emulando um celular (Pixel 7) em pt-BR.
- **Bug corrigido (vinha do M5):** trocar o idioma nas configurações voltava o app ao início. O layout escondia as telas até o idioma novo entrar, o que desmontava a navegação. Agora as telas só esperam na primeira abertura (`useAppReady`). Há um teste de unidade e um E2E para isso.
- **Botão "Sair do teste"** no nivelamento, e não "Sair": dois botões com o mesmo nome confundiam o leitor de tela.

### D-028 · Contas armadas antes das contas na linha, e níveis de 3 dígitos
**Data:** 2026-10-27
**Contexto:** ver a conta armada (um número em cima do outro, como no papel) é mais fácil do que lê-la numa linha (`14 + 27 =`). Faltava esse degrau entre os níveis, e faltavam contas de 3 algarismos.
**Decisão:**
- A partir de 2 dígitos (2+1, 2+2, 3+2 e 3+3), cada soma e cada subtração ganha uma **versão armada logo antes** da versão na linha, com as mesmas regras e os mesmos tempos. Os níveis de 1 dígito e os mistos ficam só na linha.
- **Faixas novas:** 3 dígitos com 2 (L16–L20) e 3 dígitos com 3 (L21–L25), no mesmo ciclo das outras: soma e subtração, sem e com vai um/empresta, e um misto. Não entraram níveis 3+1: a versão armada de "Soma 3+2 sem vai um" já faz a ponte.
- A tabela vai de 15 para **41 níveis** (123 etapas). `rulesVersion` sobe para 2. Os checkpoints do nivelamento ganham L17, L20, L22 e L25.
- **Ids fixos:** os níveis que já existiam mantêm o id (`L07`), e a versão armada usa `L07V`. O número na tela é a posição na tabela. Assim o progresso salvo e o histórico continuam válidos sem migração de chaves.
- **Quem já jogava:** ao carregar o progresso, os níveis inseridos antes da etapa mais avançada liberada entram liberados, com 0 estrelas, como no nivelamento.
- **Na tela:** só a conta atual fica armada. A resposta entra embaixo da linha, alinhada pela unidade. O cursor da direita fica fora da coluna, para não empurrar os dígitos. As 2 próximas continuam na linha. A correção também mostra a conta armada. O aquecimento usa o formato da etapa atual.
- **Gerador:** para 3 dígitos, sorteia operandos em vez de listar todas as contas, que seriam até 810 mil (lento no celular). Os níveis de 1 e 2 dígitos continuam com a lista, então as rodadas deles não mudam.
- **Tempos de 3 dígitos:** estimativas iniciais, a calibrar.
**Pendência encontrada:** o console da web mostra o erro #418 do React (hidratação) desde o M6. Ele vem do `react-native-safe-area-context`, usado pelo Expo Router, que renderiza diferente no build e no navegador. O app funciona (o React refaz a página no navegador), mas vale resolver depois.

### D-029 · Mascote: ábaco de brinquedo com bracinhos
**Data:** 2026-11-11
**Contexto:** o app precisava de um logo e de um ícone definitivos. A ideia foi um mascote que servisse de logo, de ícone e de assistente dentro do app, dizendo as mensagens de apoio que já existiam.
**Decisão:**
- O mascote é um **ábaco de brinquedo com rosto, bracinhos e pés**, nas cores do tema. Foram comparadas outras formas (só a moldura com olhos de conta, uma conta sozinha, ábaco de pinos, versão com volume 3D) e esta foi a escolhida.
- **Desenho em código** (`src/ui/Mascot.tsx`, com `react-native-svg`), animado com o Reanimated. Sem arquivo de animação externo (Lottie, Rive) e sem modelo 3D: é leve, funciona offline e em qualquer tamanho.
- **Humores:** `party` (pula, braços para cima), `happy` (balança e acena), `focus` (olha de um lado para o outro) e `support` (inclina, um braço para cima). Ele também pisca. Os olhos ficam em uma camada separada do corpo, para piscar e olhar de lado sem animar atributos do SVG.
- **No resultado**, o mascote diz a mensagem em um balão. Cada mensagem tem um humor (`src/features/result/mascot-mood.ts`): ⭐⭐⭐ comemora; ⭐⭐ e "certo, mas devagar" sorriem; "rápido, com erros" se concentra; "errou e estourou o tempo" dá apoio. Sem mensagem (aquecimento, treino livre), sem mascote.
- **Acessibilidade:** o mascote é decorativo e fica fora da leitura de tela. A mensagem continua sendo um texto.
- **Ícones:** `scripts/generate-icons.js` desenha o mesmo mascote, parado, e gera os ícones do PWA, o favicon, o ícone do app, o ícone adaptativo do Android e a tela de abertura. Ele substitui o `generate-pwa-icons.js` e o ícone provisório do D-027. O desenho está repetido no script e no componente: ao mudar um, mudar o outro.
**Pendências:** o ícone do iOS (`assets/expo.icon`) continua o padrão do Expo até a Fase 3. As mensagens ainda têm emojis (🔥 🎯 💪), que podem sair agora que o mascote mostra o humor. Mascote no início e no nivelamento, e a versão com volume 3D, ficam em "Ideias futuras".

### D-030 · Níveis de multiplicação e divisão
**Data:** 2026-11-11
**Contexto:** o jogo só tinha soma e subtração. Multiplicação e divisão estavam em "Ideias futuras".
**Decisão:**
- **10 níveis novos no fim da tabela** (L26–L35), em duas faixas, no mesmo ciclo das outras (duas de uma operação, duas da outra e um misto):
  - **Tabuada:** L26 (do 2 ao 5), L27 (do 6 ao 9), L28 e L29 (as divisões que desfazem essas tabuadas) e L30 (misto).
  - **2 dígitos por 1:** L31 (multiplicação sem vai um), L32 (com vai um), L33 (2d ÷ 1d) e L34 (3d ÷ 1d), as duas divisões com quociente de 2 dígitos, e L35 (misto).
- **No fim, e não intercalados:** a tabuada é mais fácil que a subtração de 3 dígitos, mas colocar os níveis no meio mudaria o caminho de quem já está jogando, e operação nova é um assunto novo. Rever a ordem quando houver dados de uso (Fase 2).
- **Divisão sempre exata.** Divisão com resto pede outra forma de resposta (dois números) e fica para depois.
- **Sem 1** como fator, divisor ou quociente.
- **Vai um na multiplicação** (por 1 dígito): alguma coluna, fora a mais alta, passa de 9. `72 × 3 = 216` conta como "sem vai um": nada é levado de uma coluna para outra.
- **Só na linha.** A conta armada (D-028) continua só para soma e subtração. A multiplicação armada pode vir depois; a divisão armada (na chave) é outro desenho.
- **Misto:** metade multiplicação, metade divisão. A regra do gerador ficou geral: divide as contas por igual entre as operações do nível. Os mistos de soma e subtração geram as mesmas rodadas de antes.
- **Engine:** `Operation` ganha `'mul'` e `'div'`. Na spec da divisão, `a` é o dividendo, `b` é o divisor e `result` é o quociente. Sinais na tela: `×` e `÷`.
- A tabela vai de 41 para **51 níveis** (153 etapas). `rulesVersion` sobe para 3. Os checkpoints do nivelamento ganham L27, L30, L32 e L35 (o nivelamento completo passa de 10 para 14 blocos).
- **Quem já tinha terminado a tabela antiga** (2+ estrelas no L25-C): ao carregar o progresso, a etapa seguinte à mais avançada entra liberada quando a mais avançada já foi aprovada. Sem isso, a pessoa teria que jogar o L25-C de novo para liberar o L26-A.
- **Tempos:** estimativas iniciais, a calibrar.

### D-031 · Teste do dia com ranking diário, no Supabase
**Data:** 2026-11-11
**Resolve:** o D-003 (backend em aberto) e adianta dois itens da Fase 3 do roadmap.
**Contexto:** faltava um motivo para voltar todo dia além da sequência, e algo para comparar com outras pessoas.
**Decisão:**
- **Teste do dia:** as mesmas 10 contas para todo mundo, em dificuldade crescente, com as quatro operações. A seed sai da data local, então o teste é gerado no aparelho e funciona offline. Sem tempo-limite: o tempo é medido para o ranking.
- **Uma tentativa por dia.** Vale desde que a primeira conta aparece. Sair no meio encerra com o que foi respondido, e fechar o app no meio deixa a tentativa como interrompida. É a forma de as contas não serem vistas antes de valer.
- **Ranking:** mais acertos, depois menor tempo. Os 50 primeiros e a posição da própria pessoa.
- **Backend: Supabase.** Banco, API e login prontos, com pouco código de servidor. A alternativa era Vercel Functions + Postgres, que reaproveitaria o engine no servidor com mais facilidade.
- **Identidade: apelido, sem conta.** Cada aparelho vira um usuário anônimo do Supabase no primeiro envio. Sem e-mail e sem senha. Outro aparelho (ou dados do navegador apagados) é outro usuário.
- **Segurança no banco:** cada usuário só insere o próprio resultado, uma vez por dia. Ninguém lê a tabela direto: a leitura passa pela função `daily_ranking`, que não devolve os ids.
- **Camada nova `src/services/`**, atrás da interface `RankingService`. Sem as variáveis do Supabase, o app funciona sem ranking (é assim nos testes e no CI).
- **Cliente do Supabase com o AsyncStorage** que o projeto já usa, em vez do `expo-sqlite` do guia do Expo. O guia só cobre Android e iOS, e o app é web primeiro.
- O teste do dia não entra no `numa.history` nem altera etapas. Fica em `numa.daily`. Conta como dia jogado na sequência.

**Limites conhecidos (aceitos por enquanto):**
- **O servidor confia no placar enviado.** Quem souber usar as ferramentas do navegador consegue enviar um resultado falso. O próximo passo é uma Edge Function que refaz o teste com o `src/engine` e confere as respostas.
- **Uma tentativa por aparelho, não por pessoa.** Apagar os dados do navegador cria outro usuário anônimo.
- **Dia local:** o ranking de um dia junta pessoas de fusos diferentes. O banco aceita o dia do aparelho com 1 dia de folga em relação ao servidor.
- **Versões diferentes do app no mesmo dia** podem gerar contas diferentes, se a lista de níveis do teste ou o gerador mudarem. O `rules_version` vai junto com o resultado para dar para investigar. Mudou `daily.levels` ou o gerador? Suba o `rulesVersion`.
- **Login anônimo tem limite por IP** no Supabase (30 por hora, por padrão). Uma escola inteira na mesma rede pode esbarrar nele no primeiro uso. Ajustável no painel.
- **Filtro de apelido simples:** formato e uma lista curta de palavrões, só no app. O banco confere só o tamanho.

**Pendências antes de ir para produção:** política de privacidade cobrindo o apelido público, e decidir sobre CAPTCHA no login anônimo (recomendado pelo Supabase).

### D-032 · Pontos, evolução do mascote, missões, ranking semanal e desafios: decisões de base
**Data:** 2026-11-12
**Contexto:** foram pensadas cinco funcionalidades de engajamento: pontos por jogar, mascote que evolui, missões diárias, ranking semanal de pontos e desafios enviados a amigos por link. Todas dependem dos pontos, e o ranking e os desafios dependem do servidor. Esta entrada fixa só o que as outras decisões precisam. Os detalhes de cada parte são decididos ao iniciar o marco dela (M8 a M13 no [ROADMAP.md](ROADMAP.md)).
**Decisão:**
- **O servidor é a fonte da verdade dos pontos que valem para ranking e desafios.** O app envia a rodada (seed, respostas e tempos) e o servidor refaz as contas e calcula os pontos com o mesmo `src/engine`. O app calcula os mesmos pontos na hora, com a mesma função, para mostrar sem esperar a internet.
- **Enviar rodadas exige consentimento.** Quem não aceita joga normalmente, ganha pontos e evolui o mascote só no aparelho, e fica fora do ranking e dos desafios.
- **Identidade: continua o usuário anônimo com apelido** (D-031). Trocar de aparelho ou apagar os dados do navegador perde pontos e mascote. A conta opcional da Fase 2 resolve isso depois, vinculando o usuário anônimo a uma conta.
- **O mascote evolui pelos pontos totais**, e não pelo nível do jogo. Quem está travado em uma etapa continua evoluindo, e quem pula níveis no nivelamento começa do mascote inicial como todo mundo. Nível alto ainda ajuda, porque cada acerto vale mais. O mascote nunca regride.
- **Dois números da mesma moeda:** pontos da semana (ranking) e pontos totais (mascote). Sem moeda para gastar por enquanto.
- **Pontos vêm dos acertos, não da participação**, com travas contra repetição de propósito. É o princípio; a fórmula e os valores ficam para o M9, em `src/engine/config/`.
- **Desafios entre amigos passam pelo servidor**, para quem desafiou ver o resultado e para o bônus de vitória ser conferido.
- **Ordem:** a conferência das rodadas no servidor vem primeiro (M8). Ela já era pendência do D-031 para o ranking diário.

**Em aberto (decidir ao iniciar cada marco):** valores da fórmula de pontos, desenho e quantidade de estágios do mascote, lista de missões, corte da semana do ranking e regras dos desafios.

### D-033 · Política de privacidade simples, dentro do app
**Data:** 2026-11-12
**Resolve:** a pendência do D-031 (política cobrindo o apelido público antes da produção).
**Contexto:** o teste do dia mostra o apelido para todo mundo e guarda resultados no Supabase. Era preciso ter uma política antes de levar o ranking para a produção. A versão completa, cobrindo o envio das rodadas, estava prevista no M8.
**Decisão:**
- **Uma tela no app (`/privacy`)**, com o texto no i18n (PT e EN), e não uma página fora do app. Funciona offline e segue o idioma escolhido.
- **Abre pelas Configurações** (seção "Privacidade") e **pelo link junto do apelido** no teste do dia, que é onde o dado público é pedido.
- **Conteúdo:** o que fica só no aparelho; o que vai para o servidor (só o teste do dia: apelido, acertos, tempo, dia e um código aleatório); o que é público no ranking; quem guarda (Supabase e Vercel, possivelmente fora do Brasil); por quanto tempo (até pedirem para apagar); direitos pela LGPD; crianças; mudanças.
- **Contato por um e-mail próprio do projeto**, e não o e-mail pessoal nem issues do GitHub. Fica em `src/features/privacy/contact.ts`.
- **Sem aceite obrigatório:** o teste do dia continua começando direto. O consentimento para enviar as rodadas de desafio fica para o M8, quando a política ganha a parte sobre essas rodadas.

**Regra:** mudou o que vai para o servidor? Atualize o texto da política e a data no topo, no mesmo PR.

### D-034 · Rodadas conferidas no servidor (Vercel Function) e consentimento para enviar (M8)
**Data:** 2026-11-12
**Resolve:** o limite "o servidor confia no placar enviado" do D-031 e os três itens de "Decidir ao iniciar" do M8.
**Contexto:** o ranking aceitava qualquer placar gravado direto no banco pelo navegador. E o D-032 pede que o servidor refaça as rodadas com o mesmo `src/engine` antes de os pontos existirem.
**Decisão:**
- **A conferência roda em Vercel Functions** (`api/`), e não em Edge Functions do Supabase. A função importa o `src/engine` direto e é publicada junto com o app a cada push, então produção, homologação e cada preview usam o engine do mesmo commit do app. A Edge Function roda em Deno, pediria adaptar ou empacotar o engine (imports sem extensão) e teria um deploy separado. Custo aceito: a chave secreta do Supabase fica nas variáveis da Vercel (`SUPABASE_SECRET_KEY`).
- **O app envia respostas e tempos, nunca o placar.** O servidor refaz as contas (pela data, no teste do dia; pela etapa e seed, no desafio), confere cada resposta e calcula acertos, tempo e estrelas. O tempo total é a soma dos tempos por conta.
- **O navegador não grava mais no banco.** A política de insert da `daily_results` sai. Só a função grava, com a chave secreta, depois de identificar o usuário anônimo pelo token dele.
- **O que o servidor recusa:** dia a mais de 1 dia de distância da data do servidor; `rulesVersion` diferente da do servidor; quantidade de respostas errada; resposta fora do teclado (não inteira, negativa ou com mais de 4 dígitos); conta respondida depois de uma sem resposta; conta respondida em menos de 250 ms ⚙️; apelido fora das regras (as mesmas do app, agora também no servidor).
- **Consentimento pedido ao abrir o teste do dia**, antes do apelido, e não nas boas-vindas. Um aceite só vale para o teste do dia e para as rodadas de desafio. Quem nunca abre o teste do dia não é perguntado e não envia nada. A opção fica nas Configurações (seção "Privacidade").
- **Quem recusa** joga tudo normalmente, inclusive o teste do dia, e vê o ranking. Não tem apelido, não entra no ranking e nenhum usuário anônimo é criado para o aparelho.
- **Quem já tinha apelido** vê o pedido na próxima vez que abrir o teste do dia. Até aceitar, nada novo é enviado. Os resultados antigos continuam nos rankings dos dias passados.
- **Desligar nas Configurações** para os envios e esvazia a fila. O que já foi enviado continua no servidor até a pessoa pedir para apagar (política de privacidade).
- **Rodadas de desafio:** concluídas e abandonadas, só as jogadas com o consentimento ligado. Ficam numa fila no aparelho (`numa.outbox`) e saem quando há internet. O envio é idempotente pelo `id` da rodada. Treino livre, aquecimento e nivelamento não são enviados por enquanto.
- **Camada nova `src/server/`**: a lógica das funções, em TypeScript sem React nem Expo, testada no Jest com um banco falso. Os arquivos de `api/` só ligam a requisição a essa lógica.

**Limites conhecidos (aceitos por enquanto):**
- **Quem calcula as respostas com um programa** e envia tempos plausíveis ainda passa. O servidor não mede o tempo: o teste do dia funciona offline, então o tempo vem do aparelho. O piso de 250 ms por conta só barra o absurdo.
- **App antigo em cache** (PWA) com `rulesVersion` diferente tem o envio recusado até atualizar. O resultado do dia fica só no aparelho.
- **Resultados antigos não conferidos** continuam na tabela, marcados com `verified = false`.

### D-035 · Pontos: peso por faixa, bônus por estrelas novas, travas por dia (M9)
**Data:** 2026-11-12
**Resolve:** os itens de "Decidir ao iniciar" do M9 e a fórmula deixada em aberto no D-032.
**Contexto:** os pontos movem o mascote (M10), as missões (M11) e o ranking semanal (M12). O servidor recalcula os pontos de cada rodada que recebe (D-032), então a fórmula só pode usar o que ele também tem: a rodada e as rodadas anteriores da mesma pessoa.
**Decisão:**
- **Acertos × peso da faixa do nível.** O peso é fixo por faixa, e não pela posição na tabela, porque a tabuada (L26–L30) vem depois dos 3 dígitos e é mais fácil: 1 dígito (L01–L05) = 1; 2d ± 1d (L06–L10) = 2; 2d ± 2d (L11–L15) = 3; 3d ± 2d (L16–L20) = 4; 3d ± 3d (L21–L25) = 5; tabuada e divisão de 1 dígito (L26–L30) = 2; 2d × 1d e divisão de 2 dígitos (L31–L35) = 4 ⚙️. A versão armada tem o peso da versão na linha.
- **Bônus por estrela nova:** 5 × peso por estrela acima da melhor nota anterior da etapa ⚙️. Repetir uma etapa com a mesma nota não rende bônus.
- **Bônus de etapa nova:** 10 × peso na primeira vez que a pessoa passa da etapa (⭐⭐ ou mais) ⚙️. As etapas liberadas pelo nivelamento ainda não foram passadas e rendem o bônus.
- **Travas:** os acertos só rendem nas **3 primeiras rodadas de desafio concluídas** de cada etapa, por dia (horário local) ⚙️. Rodada com menos de **50%** de acerto não rende acertos ⚙️ (e não tem estrelas). Os bônus continuam valendo depois da trava: eles só saem uma vez por etapa.
- **Modos:** só o desafio concluído e o teste do dia rendem. O teste do dia vale **acertos × 3** ⚙️, uma vez por dia, inclusive quando a pessoa sai no meio (as contas respondidas). Treino livre, aquecimento, nivelamento e rodadas abandonadas não rendem: o servidor não recebe essas rodadas, e o total dele precisa bater com o do aparelho.
- **Sem pontos retroativos:** todo mundo começa do zero quando o M9 chega. O servidor nunca recebeu as rodadas antigas.
- **No aparelho:** os pontos de cada rodada são calculados ao gravar a rodada e somados uma vez só (`numa.points`, pelo id da rodada). A melhor nota anterior vem do progresso; as rodadas do dia, do histórico.
- **Pontos da semana:** o aparelho guarda os pontos de cada dia (últimos 14 dias ⚙️). O corte da semana fica para o M12.
- **"Apagar progresso" zera os pontos**, junto com o histórico.
- **`rulesVersion` sobe para 4:** os valores dos pontos fazem parte das regras que o servidor usa para recalcular. Nada sai do aparelho por causa dos pontos, então a política de privacidade não muda.

**Pendente para o item do servidor (depois da homologação do M8):** a trava "por dia" usa o dia local do aparelho, que o servidor não sabe. O envio da rodada vai precisar levar o dia local, como o teste do dia já leva. Quem já jogava antes de aceitar enviar terá no aparelho mais pontos que no servidor, que só conhece as rodadas enviadas.

### D-036 · Conta opcional como marco próprio (M14), antes do ranking semanal
**Data:** 2026-11-13
**Contexto:** o D-032 manteve o usuário anônimo por aparelho e deixou a conta opcional da Fase 2 para "depois", sem marco. Com os pontos no servidor (M9), o mascote (M10) e o ranking semanal (M12), trocar de aparelho ou apagar os dados do navegador passa a custar semanas de pontos.
**Decisão:**
- **A conta vira o marco M14**, feito depois do item do servidor do M9 e antes do M12. O número é 14, e não 12, para não renumerar os marcos que outras decisões já citam.
- **O usuário anônimo continua sendo o padrão.** A conta é opcional: o Supabase vincula um e-mail ou um login social ao mesmo usuário anônimo (`updateUser` / `linkIdentity`), sem trocar o `user_id`. Rodadas, ranking e pontos já enviados continuam ligados à pessoa.
- **Quem não aceitou enviar rodadas** não tem usuário anônimo. Para criar uma conta, a pessoa precisa aceitar o envio antes.
- **Primeiro o que já está no servidor** (ranking e pontos). Sincronizar o progresso que só existe no aparelho (níveis, estrelas, histórico) é decidido ao iniciar o marco, e pode virar um marco próprio.

**Em aberto (decidir ao iniciar o M14):** quais logins oferecer; o que acontece quando a pessoa entra na conta num aparelho que já tem progresso anônimo; o escopo da sincronização; crianças e LGPD; "Apagar conta" no app; o envio de e-mails.
