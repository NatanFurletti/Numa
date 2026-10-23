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
                 Sem servidor. Hospedagem estática (Vercel/Netlify) como PWA.
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
│  ├─ i18n/                    # index.ts, pt.json, en.json
│  ├─ ui/                      # Botões, tema (cores, fontes), layout
│  └─ lib/                     # clock.ts (relógio injetável), id.ts
├─ e2e/                        # Playwright
├─ docs/
├─ CLAUDE.md
└─ README.md
```

## 4. Regras entre camadas

| Camada | Pode importar | Não pode importar |
|---|---|---|
| `src/engine` | apenas `src/engine` | React, Expo, RN, store, storage, i18n |
| `src/store` | engine, storage | componentes, app |
| `src/features` | engine, store, ui, i18n, lib | app |
| `src/app` | features, ui, i18n | engine diretamente (passe pelos hooks) |

Essas regras serão verificadas por lint (`eslint-plugin-boundaries` ou `no-restricted-imports`) na Fase 0.

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

## 7. Evolução prevista

| Fase | Mudança na arquitetura |
|---|---|
| 2 | API + Postgres. `src/storage` ganha sincronização. Configuração de regras baixada do servidor (com fallback local). Envio anônimo de rodadas para métricas |
| 3 | Builds nativos via EAS, notificações push, ranking (validação no servidor reaproveitando `src/engine`) |
