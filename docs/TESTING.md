# Testes e TDD

O Numa é desenvolvido com **TDD (Test-Driven Development)**: o teste vem antes do código.

## 1. O ciclo

```
  ┌──────────┐     ┌──────────┐     ┌────────────┐
  │   RED    │ ──► │  GREEN   │ ──► │  REFACTOR  │ ──┐
  │ teste    │     │ código   │     │ melhorar   │   │
  │ que falha│     │ mínimo   │     │ sem mudar  │   │
  └──────────┘     └──────────┘     │ comportam. │   │
       ▲                            └────────────┘   │
       └─────────────────────────────────────────────┘
```

1. **Red:** escreva um teste pequeno para o próximo comportamento. Rode e **veja falhar** (e confira que a falha é a esperada, não um erro de digitação).
2. **Green:** escreva o mínimo de código que faz o teste passar. Pode ser "feio".
3. **Refactor:** com tudo verde, melhore nomes, remova duplicação e organize. Rode de novo.
4. Faça commit em um ponto verde.

**Regras de ouro**
- Nada de código de produção sem um teste falhando que o exija.
- Um teste por comportamento. O nome do teste descreve a regra em linguagem de negócio.
- Bug encontrado → primeiro um teste que o reproduz, depois a correção.
- Testes rápidos: a suíte do engine deve rodar em segundos, para o modo watch ficar confortável.

## 2. Pirâmide de testes

| Nível | Onde | Ferramenta | Quantidade | Alvo de cobertura |
|---|---|---|---|---|
| **Unidade (engine)** | `src/engine/**` | Jest + fast-check | Muitos | **≥ 95%** linhas e branches |
| **Store / hooks** | `src/store`, `src/features/**/use*.ts` | Jest + `renderHook` (RNTL) | Médio | ≥ 85% |
| **Componentes** | `src/features/**`, `src/ui/**` | React Native Testing Library | Médio | ≥ 80% |
| **E2E** | `e2e/` | Playwright (web) | Poucos, só fluxos críticos | – |

O CI falha se a cobertura ficar abaixo desses limites (`coverageThreshold` do Jest).

## 3. Como testar cada tipo de coisa

### 3.1 Engine: regras puras
Entrada → saída, sem mocks. Os nomes dos testes podem ser em português, para ficarem iguais às regras do [GAME_RULES.md](GAME_RULES.md):

```ts
// src/engine/scoring.test.ts
describe('calculateStars', () => {
  it('dá 0 estrelas abaixo de 80% de acerto', () => {
    expect(calculateStars({ correct: 7, total: 10, elapsedMs: 30_000, limitMs: 60_000 })).toBe(0);
  });

  it('dá no máximo 1 estrela quando o tempo estoura, mesmo com 10/10', () => {
    expect(calculateStars({ correct: 10, total: 10, elapsedMs: 61_000, limitMs: 60_000 })).toBe(1);
  });

  it('dá 3 estrelas com 10/10 e 25% do tempo sobrando', () => {
    expect(calculateStars({ correct: 10, total: 10, elapsedMs: 45_000, limitMs: 60_000 })).toBe(3);
  });
});
```

### 3.2 Gerador: testes baseados em propriedades
Para regras do tipo "sempre" ou "nunca", use o **fast-check**: ele testa centenas de seeds aleatórias e, se achar uma falha, mostra o menor exemplo que a reproduz.

```ts
it('L06 nunca gera conta com vai um', () => {
  fc.assert(fc.property(fc.integer(), (seed) => {
    const problems = generateRound(stage('L06-A'), seed);
    return problems.every((p) => !hasCarry(p));
  }));
});
```

Propriedades obrigatórias para **todos os níveis**:
- quantidade correta de contas;
- todas respeitam faixas, operação e vai um / empresta;
- nenhum resultado negativo;
- sem repetição (incluindo a ordem trocada na soma);
- mesma seed → mesma rodada;
- o gerador não lança erro (há contas distintas suficientes).

### 3.3 Tempo
- O engine recebe `at` / `Clock` por parâmetro, então os testes passam horários fixos. Sem `sleep`.
- Em hooks e componentes, use os **fake timers** do Jest (`jest.useFakeTimers()`, `jest.advanceTimersByTime()`).

### 3.4 Componentes
- Teste o que o usuário vê e faz, não detalhes internos: `getByRole('button', { name: '7' })`, `fireEvent.press(...)`, `getByText('24 + 73 = 97')`.
- Os textos vêm do i18n: nos testes, inicialize o i18n em `pt` para as buscas por texto serem estáveis.

### 3.5 Persistência e migrações
- Use uma implementação **em memória** da interface `Storage` nos testes.
- Cada migração tem um teste com um dado real da versão anterior (fixture).

### 3.6 E2E (Playwright, web)
Fluxos críticos da Fase 1:
1. Primeiro acesso → pular nivelamento → jogar L01-A → resultado → próxima etapa.
2. Rodada com erros → correção → "Ver resposta".
3. Recarregar a página mantém o progresso.
4. Trocar o idioma para EN.
5. Direção direita → esquerda: digitar `2,1,1` resulta em `112`.

Para os testes E2E serem determinísticos, o app aceita uma seed fixa via variável de ambiente **apenas em builds de teste**.

## 4. Ordem sugerida do TDD no engine

Do mais simples para o mais complexo. Cada item é uma sequência de ciclos red → green → refactor:

1. `rng`: mesma seed → mesma sequência; valores em [0, 1)
2. `carry`: `hasCarry(17+38) = true`, `hasCarry(23+14) = false`, `hasBorrow(52−17) = true`…
3. `answer-input`: digitar, apagar, direção `ltr`/`rtl`, limite de 4 dígitos, valor numérico
4. `scoring`: acertos e estrelas (tabela da seção 3 do GAME_RULES)
5. `generator`: uma spec simples → todas as specs → misto → aquecimento (com fast-check)
6. `round`: reducer: início, digitar, confirmar, avançar, tempo por conta, fim, tempo estourado, abandono
7. `progression`: desbloquear, melhor nota, falhas seguidas, disparo do aquecimento
8. `feedback`: escolha da mensagem e da comparação pessoal
9. `streak`: mesmo dia, dia seguinte, dia pulado
10. `placement`: checkpoints, ponto de parada, etapas desbloqueadas

## 5. Comandos

```bash
npm test                 # todos os testes
npm run test:watch       # modo watch (use durante o TDD)
npm run test:coverage    # com cobertura
npm run e2e              # Playwright
```

## 6. Convenções

- Arquivo de teste ao lado do código: `scoring.ts` → `scoring.test.ts`.
- Estrutura **Arrange / Act / Assert**, separada por linhas em branco.
- Helpers de teste em `src/test-utils/` (ex.: `buildRound()`, `fakeClock()`, `memoryStorage()`).
- Sem snapshots de componentes inteiros: quebram à toa e não descrevem regra nenhuma.
