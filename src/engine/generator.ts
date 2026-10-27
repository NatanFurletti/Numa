// Gera as contas de uma rodada (docs/LEVELS.md §5).
// Determinístico: a mesma etapa com a mesma seed gera sempre a mesma lista.

import { needsRegrouping, problemKey, solve } from './carry';
import { GAME_CONFIG } from './config/game-config';
import type { LevelConfig, ProblemSpec, Range } from './config/levels';
import { createRng, randomInt, type Rng, shuffle } from './rng';
import type { Stage } from './stages';
import type { Problem } from './types';

const inRange = (n: number, r: Range) => n >= r.min && n <= r.max;

function fitsOperands(a: number, b: number, spec: ProblemSpec): boolean {
  return inRange(a, spec.a) && inRange(b, spec.b);
}

/** A conta obedece à spec? Na soma, aceita os operandos em qualquer ordem. */
export function matchesSpec(problem: Problem, spec: ProblemSpec): boolean {
  const { a, b, op } = problem;
  if (op !== spec.op || a === 0 || b === 0) return false;
  const operandsOk = fitsOperands(a, b, spec) || (op === 'add' && fitsOperands(b, a, spec));
  if (!operandsOk) return false;
  if (op === 'sub' && a < b) return false;
  if (spec.carry === 'required' && !needsRegrouping(problem)) return false;
  if (spec.carry === 'none' && needsRegrouping(problem)) return false;
  const result = solve(problem);
  if (spec.result?.min !== undefined && result < spec.result.min) return false;
  if (spec.result?.max !== undefined && result > spec.result.max) return false;
  return true;
}

// Todas as contas possíveis de uma spec, sem repetição. Calculado uma vez por spec.
const candidatesCache = new WeakMap<ProblemSpec, Problem[]>();

function candidatesFor(spec: ProblemSpec): Problem[] {
  const cached = candidatesCache.get(spec);
  if (cached) return cached;
  const seen = new Set<string>();
  const list: Problem[] = [];
  for (let a = spec.a.min; a <= spec.a.max; a++) {
    for (let b = spec.b.min; b <= spec.b.max; b++) {
      const problem: Problem = { a, b, op: spec.op };
      const key = problemKey(problem);
      if (seen.has(key) || !matchesSpec(problem, spec)) continue;
      seen.add(key);
      list.push(problem);
    }
  }
  candidatesCache.set(spec, list);
  return list;
}

/** Estado compartilhado por todas as contas de uma rodada. */
interface RoundPool {
  rng: Rng;
  usedKeys: Set<string>;
  resultCounts: Map<number, number>;
}

function newPool(seed: number): RoundPool {
  return { rng: createRng(seed), usedKeys: new Set(), resultCounts: new Map() };
}

/**
 * Sorteia uma conta da spec, priorizando os resultados menos usados na rodada.
 * Assim os resultados se espalham pela faixa possível.
 */
function pickOne(spec: ProblemSpec, pool: RoundPool): Problem {
  if (spaceSize(spec) > LIST_LIMIT) return sampleOne(spec, pool);
  const zeroUsed = (pool.resultCounts.get(0) ?? 0) > 0;
  const byResult = new Map<number, Problem[]>();
  for (const p of candidatesFor(spec)) {
    const result = solve(p);
    if (pool.usedKeys.has(problemKey(p)) || (result === 0 && zeroUsed)) continue;
    const group = byResult.get(result) ?? [];
    group.push(p);
    byResult.set(result, group);
  }
  if (byResult.size === 0) {
    throw new Error(`Spec sem contas distintas suficientes: ${JSON.stringify(spec)}`);
  }

  const usage = (r: number) => pool.resultCounts.get(r) ?? 0;
  const results = [...byResult.keys()];
  const minUsage = Math.min(...results.map(usage));
  const leastUsed = results.filter((r) => usage(r) === minUsage);
  const result = leastUsed[randomInt(pool.rng, 0, leastUsed.length - 1)];
  const group = byResult.get(result)!;
  const problem = group[randomInt(pool.rng, 0, group.length - 1)];

  pool.usedKeys.add(problemKey(problem));
  pool.resultCounts.set(result, usage(result) + 1);
  return problem;
}

/**
 * Acima disso (3 dígitos: até 810 mil pares), listar todas as contas fica lento demais.
 * Aí a conta é sorteada direto (D-028). Os níveis de 1 e 2 dígitos continuam com a lista.
 */
const LIST_LIMIT = 20_000;
const SAMPLE_ATTEMPTS = 5_000;

const spaceSize = (spec: ProblemSpec) =>
  (spec.a.max - spec.a.min + 1) * (spec.b.max - spec.b.min + 1);

/**
 * Sorteia operandos nas faixas até achar uma conta da spec que ainda não saiu.
 * Na primeira metade das tentativas, só aceita resultados ainda não usados na rodada,
 * para espalhar os resultados como na lista.
 */
function sampleOne(spec: ProblemSpec, pool: RoundPool): Problem {
  for (let attempt = 0; attempt < SAMPLE_ATTEMPTS; attempt++) {
    const problem: Problem = {
      a: randomInt(pool.rng, spec.a.min, spec.a.max),
      b: randomInt(pool.rng, spec.b.min, spec.b.max),
      op: spec.op,
    };
    if (!matchesSpec(problem, spec) || pool.usedKeys.has(problemKey(problem))) continue;
    const result = solve(problem);
    const used = pool.resultCounts.get(result) ?? 0;
    if (used > 0 && attempt < SAMPLE_ATTEMPTS / 2) continue;
    pool.usedKeys.add(problemKey(problem));
    pool.resultCounts.set(result, used + 1);
    return problem;
  }
  throw new Error(`Spec sem contas distintas suficientes: ${JSON.stringify(spec)}`);
}

/** Qual spec cada conta usa. Misto: metade soma, metade subtração, revezando as specs. */
function planSpecs(level: LevelConfig, count: number): ProblemSpec[] {
  if (level.kind !== 'mixed') {
    return Array.from({ length: count }, (_, i) => level.specs[i % level.specs.length]);
  }
  const adds = level.specs.filter((s) => s.op === 'add');
  const subs = level.specs.filter((s) => s.op === 'sub');
  const addCount = Math.ceil(count / 2);
  return [
    ...Array.from({ length: addCount }, (_, i) => adds[i % adds.length]),
    ...Array.from({ length: count - addCount }, (_, i) => subs[i % subs.length]),
  ];
}

/** Na soma, sorteia a ordem dos operandos (2d + 1d ou 1d + 2d), meio a meio. */
function randomizeOrder(problem: Problem, rng: Rng): Problem {
  if (problem.op === 'add' && rng() < 0.5) return { ...problem, a: problem.b, b: problem.a };
  return problem;
}

function generateFromLevel(level: LevelConfig, count: number, pool: RoundPool): Problem[] {
  const problems = planSpecs(level, count).map((spec) => pickOne(spec, pool));
  return shuffle(pool.rng, problems).map((p) => randomizeOrder(p, pool.rng));
}

export function generateRound(
  stage: Stage,
  seed: number,
  count: number = GAME_CONFIG.problemsPerRound,
): Problem[] {
  return generateFromLevel(stage.level, count, newPool(seed));
}

/**
 * Aquecimento: metade da etapa anterior e metade da atual, intercaladas,
 * começando pela anterior. Sem etapa anterior, usa só a atual.
 */
export function generateWarmupRound(
  current: Stage,
  previous: Stage | null,
  seed: number,
  count: number = GAME_CONFIG.problemsPerRound,
): Problem[] {
  if (!previous) return generateRound(current, seed, count);
  const pool = newPool(seed);
  const previousCount = Math.ceil(count / 2);
  const easier = generateFromLevel(previous.level, previousCount, pool);
  const harder = generateFromLevel(current.level, count - previousCount, pool);
  return easier.flatMap((p, i) => (i < harder.length ? [p, harder[i]] : [p]));
}
