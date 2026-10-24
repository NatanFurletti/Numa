@AGENTS.md

# Numa

App de treino de cálculo mental (soma e subtração no MVP). Expo + Expo Router + TypeScript, web primeiro, lojas depois.

## Documentação (leia antes de mudar comportamento)

| Arquivo                                      | Conteúdo                                        |
| -------------------------------------------- | ----------------------------------------------- |
| [docs/GAME_RULES.md](docs/GAME_RULES.md)     | Especificação do jogo. Cada regra vira teste    |
| [docs/LEVELS.md](docs/LEVELS.md)             | Níveis, tempos e regras de geração de contas    |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Camadas, pastas e regras de importação          |
| [docs/DATA.md](docs/DATA.md)                 | Formato dos dados salvos                        |
| [docs/SCREENS.md](docs/SCREENS.md)           | Telas, fluxo e rotas                            |
| [docs/TESTING.md](docs/TESTING.md)           | TDD, pirâmide de testes, ordem do engine        |
| [docs/DECISIONS.md](docs/DECISIONS.md)       | Decisões e por quê. Não apague entradas antigas |
| [docs/ROADMAP.md](docs/ROADMAP.md)           | Fases e marcos. Marque os itens concluídos      |

## Comandos

Requer Node 22.13+ (versão em `.nvmrc`; com nvm: `nvm use`).

```bash
npm run web              # servidor de desenvolvimento no navegador
npm test                 # todos os testes
npm run test:watch       # modo watch (use durante o TDD)
npm run test:coverage    # testes com cobertura (o CI usa este)
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint, incluindo as fronteiras entre camadas
npm run format           # Prettier
npm run build:web        # site estático em dist/, com o service worker do PWA
npm run e2e              # testes E2E (Playwright) sobre o dist/; rode o build:web antes
npx expo install <pkg>   # sempre use para adicionar pacotes
```

Antes de dar uma tarefa como pronta: `npm run typecheck`, `npm run lint` e `npm test` passando.

## Branches e ambientes (D-025)

| Branch    | Ambiente                                        | Quando muda                                                |
| --------- | ----------------------------------------------- | ---------------------------------------------------------- |
| `main`    | Produção (Vercel, Production)                   | PR de `homolog` → `main`, depois de testado em homologação |
| `homolog` | Homologação (Vercel, Preview com endereço fixo) | PR de cada marco/feature → `homolog`                       |
| `mN-...`  | Preview próprio de cada branch                  | Trabalho do dia a dia                                      |

Branches de trabalho saem de `homolog`, e os PRs apontam para `homolog`, nunca direto para `main`.

## Regras do projeto

- **TDD sempre:** teste falhando primeiro, depois o código mínimo, depois refatorar. Bug → teste que reproduz antes da correção.
- **Rotas em `src/app/`** (D-017), finas: só chamam componentes de `src/features/`.
- **`src/engine/` é TypeScript puro:** sem React/Expo/storage, sem `Date` e sem `Math.random` (relógio e Rng injetados). O lint barra isso.
- Números ajustáveis (tempos, limites de estrelas, etc.) ficam em `src/engine/config/`, nunca espalhados no código.
- Textos de interface sempre pelo i18n: chave nova em `src/i18n/pt.ts` e `en.ts` (o typecheck acusa se faltar em um dos dois). Nada de texto fixo nas telas.
- Teste ao lado do arquivo (`scoring.ts` → `scoring.test.ts`). Sem snapshots de componentes inteiros.
