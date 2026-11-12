# Arquitetura

## 1. Visão geral (Fase 1)

```
┌──────────────────────── Aparelho (navegador ou celular) ────────────────────────┐
│                                                                                 │
│   app/ (telas)  ──►  src/features/ (hooks + componentes)  ──►  src/engine/      │
│        │                        │                              (regras puras)   │
│        │                        ▼                                               │
│        │                  src/store/ (Zustand) ──► src/storage/ ──► AsyncStorage│
│        ▼                                                         (localStorage) │
│   src/i18n/  ·  src/ui/                                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
      Hospedagem estática (Vercel) como PWA. Sem o servidor, o resto do app funciona igual.

┌──────────────────────────────── Servidor (D-034) ───────────────────────────────┐
│                                                                                 │
│   src/services ──HTTP──►  api/ (Vercel Functions) ──► src/server ──► src/engine │
│        │                                                   │        (o mesmo)   │
│        │ ler o ranking                                     ▼ gravar             │
│        └──────────────────────────────────────────────► Supabase (Postgres)     │
└─────────────────────────────────────────────────────────────────────────────────┘
      O app envia respostas e tempos. O servidor refaz as contas e grava o placar.
```

Na Fase 2, o `src/storage/` ganha uma implementação que também sincroniza com uma API. O resto do app não muda.

## 2. Stack

| Camada | Tecnologia | Para quê |
|---|---|---|
| Framework | **Expo** (SDK estável mais recente) | Um código para Web, iOS e Android |
| Navegação | **Expo Router** | Rotas a partir de arquivos em `app/` |
| Linguagem | **TypeScript** (`strict`) | Tipos em todo o projeto |
| Estado | **Zustand** + middleware `persist` | Estado global simples, salvo no aparelho |
| Persistência | **@react-native-async-storage/async-storage** | Usa `localStorage` na web |
| i18n | **i18next** + **react-i18next** + **expo-localization** | PT e EN, detectando o idioma do aparelho |
| Animação | **react-native-reanimated** | Fila de contas subindo, tremida e barra de tempo |
| Desenho vetorial | **react-native-svg** | Mascote (`src/ui/Mascot.tsx`) |
| Testes | **Jest** (`jest-expo`), **React Native Testing Library**, **fast-check** | Unidade, componentes e propriedades |
| E2E | **Playwright** (web) | Fluxos completos no navegador |
| Qualidade | **ESLint** + **Prettier** | Padrão de código |
| CI | **GitHub Actions** | typecheck, lint e testes em todo push/PR |
| Hospedagem | **Vercel** ou **Netlify** | `npx expo export -p web`, saída estática |
| PWA | `manifest.json` + service worker (Workbox) | Instalável e offline |

> Versões exatas são fixadas na Fase 0, no `package.json`.

## 3. Estrutura de pastas

```
numa/
├─ src/app/                    # Rotas (Expo Router). Telas FINAS. (D-017)
│  ├─ _layout.tsx              # Providers: i18n, tema, store
│  ├─ index.tsx                # Início
│  ├─ welcome.tsx
│  ├─ placement.tsx
│  ├─ levels.tsx
│  ├─ practice.tsx
│  ├─ settings.tsx
│  ├─ play/[stageId].tsx
│  ├─ result/[roundId].tsx
│  └─ review/[roundId].tsx
├─ src/
│  ├─ engine/                  # ★ TS PURO. Coração do jogo. Sem React/Expo.
│  │  ├─ config/
│  │  │  ├─ game-config.ts     # rulesVersion, limites de estrelas, aquecimento...
│  │  │  └─ levels.ts          # tabela de níveis (LEVELS.md)
│  │  ├─ rng.ts                # PRNG com seed
│  │  ├─ carry.ts              # detecta vai um / empresta
│  │  ├─ generator.ts          # gera as contas de uma rodada
│  │  ├─ answer-input.ts       # digitação: direção, apagar, limite de dígitos
│  │  ├─ round.ts              # máquina de estados da rodada (reducer puro)
│  │  ├─ scoring.ts            # acertos, estrelas
│  │  ├─ progression.ts        # desbloqueio, falhas seguidas, aquecimento
│  │  ├─ feedback.ts           # escolhe a mensagem e a comparação pessoal
│  │  ├─ placement.ts          # teste de nivelamento
│  │  ├─ streak.ts             # sequência de dias
│  │  ├─ types.ts
│  │  └─ *.test.ts             # testes ao lado de cada módulo
│  ├─ features/                # Hooks + componentes por funcionalidade
│  │  ├─ round/                # useRound, ProblemQueue, TimeBar
│  │  ├─ keypad/               # Keypad, usePhysicalKeyboard
│  │  ├─ result/
│  │  ├─ review/
│  │  ├─ levels/
│  │  └─ settings/
│  ├─ store/                   # Zustand: progress, settings, history
│  ├─ storage/                 # Interface Storage + implementação AsyncStorage
│  ├─ i18n/                    # index.ts, pt.ts, en.ts (D-024)
│  ├─ ui/                      # Botões, tema (cores, fontes), layout
│  ├─ services/                # Serviços externos: ranking e envio de rodadas (Supabase e api/)
│  ├─ server/                  # Lógica das funções do servidor. Sem React/Expo. Só importa o engine
│  ├─ lib/                     # clock.ts (relógio injetável), id.ts
├─ api/                        # Vercel Functions: arquivos finos que chamam src/server
├─ supabase/migrations/        # SQL do banco (tabelas, políticas, funções)
├─ e2e/                        # Playwright
├─ docs/
├─ CLAUDE.md
└─ README.md
```

## 4. Regras entre camadas

| Camada | Pode importar | Não pode importar |
|---|---|---|
| `src/engine` | apenas `src/engine` | React, Expo, RN, store, storage, i18n |
| `src/store` | engine, storage | componentes, app, services |
| `src/services` | apenas `src/services` | engine, store, features, app, server |
| `src/server`, `api/` | engine, server | React, Expo, RN e todo o resto do app. Só imports relativos |
| `src/features` | engine, store, services, ui, i18n, lib | app, server |
| `src/app` | features, ui, i18n | engine diretamente (passe pelos hooks), services, server |

Essas regras são verificadas pelo lint (`no-restricted-imports` em `eslint.config.js`). O `npm run lint` cobre `src/` e `api/`.

## 5. Peças-chave do engine

### 5.1 Relógio e aleatoriedade injetados
```ts
interface Clock { now(): number }      // em produção: Date.now; nos testes: fake
type Rng = () => number;               // [0, 1), criado a partir de uma seed
```
Nada no engine chama `Date.now()` ou `Math.random()`. Por isso, tudo é reproduzível nos testes.

### 5.2 Rodada como reducer puro
```ts
type RoundEvent =
  | { type: 'start'; at: number }
  | { type: 'digit'; digit: number }
  | { type: 'backspace' }
  | { type: 'submit'; at: number }
  | { type: 'abandon'; at: number };

function roundReducer(state: RoundState, event: RoundEvent): RoundState;
```
O hook `useRound` só liga o teclado e o relógio a esse reducer. Toda a regra (quando termina, o tempo de cada conta, o tempo estourado) é testada sem interface.

### 5.3 Tempo
- O tempo é calculado por **marcas de horário** (`startedAt`, `submittedAt`), nunca somando ticks de `setInterval`.
- A barra de tempo só **lê** `clock.now() - startedAt` para desenhar.

## 6. Web, PWA e offline

- `npx expo export -p web` gera um site estático.
- Um `manifest.json` (nome, ícones, cores) permite "instalar" na tela inicial.
- Um service worker (Workbox) guarda os arquivos em cache para abrir offline.
- Todos os dados ficam no aparelho, então o app funciona 100% offline depois da primeira visita.

## 7. Serviços externos (`src/services/`)

O ranking do teste do dia é a primeira parte do app que fala com um servidor (D-031).

- `ranking.ts` define a interface `RankingService` (`submit`, `fetchRanking`). As telas só conhecem essa interface, e os testes passam uma implementação falsa.
- `supabase-ranking.ts` é a implementação: lê o ranking pela função SQL do Supabase e envia as respostas por `POST /api/daily`. `supabase.ts` cria o cliente **só quando alguém pede**, nunca ao importar o arquivo: na geração das páginas estáticas não há `window`.
- `rounds.ts` define a interface `RoundSyncService` (`submitRound`), e `api-rounds.ts` a implementa com `POST /api/rounds`.
- `api.ts` faz as chamadas às funções: pega o token do usuário anônimo (criando o usuário no primeiro envio) e manda no cabeçalho `Authorization`.
- Configuração por variáveis de ambiente (`.env.example`): `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Sem elas, `defaultRankingService()` devolve `null` e o app funciona sem ranking. `EXPO_PUBLIC_API_URL` diz onde ficam as funções quando elas não estão no mesmo endereço do site (o `npm run web` local e os apps nativos).
- O teste do dia em si não depende do servidor: as contas saem da data, no engine.

## 8. Servidor (`api/` e `src/server/`)

Tudo o que vale para ranking é conferido no servidor (D-034). As funções rodam na Vercel, no mesmo deploy do site, então cada ambiente usa o engine do mesmo commit do app.

- **`api/daily.ts` e `api/rounds.ts`** são as Vercel Functions. São finas: só entregam a requisição ao `src/server`. Aqui e no `src/server` valem só **imports relativos**, porque a Vercel não lê os atalhos `@/` do `tsconfig`.
- **`src/server/submissions.ts`** tem a regra: identifica o usuário pelo token, confere o formato, chama o `src/engine/verify.ts` para refazer as contas e grava o placar calculado. Não conhece HTTP nem Supabase.
- **`src/server/repo.ts`** é a interface do banco (`ServerRepo`), e `supabase-repo.ts` a implementa. Os testes usam um banco falso.
- **`src/server/http.ts`** liga uma `Request` a um handler: lê o token e o JSON, responde ao preflight (CORS aberto, porque não há cookies) e transforma erro inesperado em 500.
- **Variáveis no servidor** (projeto na Vercel): `SUPABASE_SECRET_KEY`, a chave secreta do Supabase, que passa por cima das políticas das tabelas. O endereço vem de `SUPABASE_URL` ou, se ela não existir, de `EXPO_PUBLIC_SUPABASE_URL`. Sem a chave, as funções respondem 503 e o app deixa os envios pendentes.
- **No aparelho**, `src/features/sync/` cuida da fila das rodadas de desafio (`numa.outbox`) e do consentimento. O hook `useRoundSync` fica no layout raiz.
- **Testar as funções localmente:** os testes do Jest cobrem a regra. Para chamar de verdade, use o preview que a Vercel cria para a branch.

## 9. Evolução prevista

| Fase | Mudança na arquitetura |
|---|---|
| 2 | API + Postgres. `src/storage` ganha sincronização. Configuração de regras baixada do servidor (com fallback local). Envio anônimo de rodadas para métricas |
| 3 | Builds nativos via EAS, notificações push. A validação do ranking no servidor reaproveitando `src/engine` já está feita (§8) |
