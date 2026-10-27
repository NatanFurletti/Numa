# Roadmap

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
- [x] Manifest, ícones e service worker (offline). Ícone provisório até existir um logo
- [x] Testes E2E dos fluxos críticos (TESTING §3.6)
- [x] Deploy na Vercel, com produção (`main`) e homologação (`homolog`) (D-025)
- [ ] Teste com 5–10 pessoas de idades diferentes e ajuste dos tempos ⚙️

**MVP pronto quando:** alguém joga do L01 ao L15 no celular e no computador, offline, em PT ou EN, sem perder progresso.

## Fase 2: contas, backend e dados

- [ ] Decidir o backend (D-003: Supabase × API própria)
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
- [ ] Desafio do dia (mesma seed para todos)
- [ ] Ranking (validação no servidor reaproveitando o engine)
- [ ] Monetização freemium (D-016)

## Ideias futuras (fora do MVP)

Anote aqui tudo que surgir e não couber na fase atual.

**Jogo**
- Opção de **confirmação automática** ao completar a quantidade de dígitos (D-007)
- ~~Níveis de **3 dígitos**~~ (feito: 3+2 e 3+3, D-028). Depois, **multiplicação** e **divisão**
- Números negativos
- ~~Conta em formato **vertical (armada)**~~ (feito: nível armado antes de cada conta na linha, D-028)
- Dificuldade **adaptativa por pessoa**, além da média por idade
- Pausa durante a rodada
- Rodadas de tamanho variável (5 / 10 / 20)

**Engajamento**
- Conquistas e medalhas
- Mascote do Numa
- Compartilhar resultado (imagem)
- Estatísticas pessoais (evolução de tempo por etapa, contas que mais erra)
- Perfis de família (vários jogadores no mesmo aparelho)

**Interface**
- Tema claro / automático
- Sons e vibração (haptics), com opção de desligar
- Tamanho de fonte ajustável
- Mais idiomas (ES)
