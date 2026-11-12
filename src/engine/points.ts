// Pontos (docs/GAME_RULES.md §14, D-035). A mesma função roda no aparelho, para mostrar na hora,
// e no servidor, que recalcula as rodadas que recebe.

import { GAME_CONFIG } from './config/game-config';
import { PASSING_STARS } from './progression';
import { accuracy } from './scoring';
import { getStage } from './stages';
import { daysBetween } from './streak';
import type { Mode, Stars } from './types';

export interface PointsBreakdown {
  /** Acertos × peso. */
  hits: number;
  /** Estrelas acima da melhor nota anterior da etapa. */
  stars: number;
  /** Primeira vez que passa da etapa. */
  newStage: number;
  total: number;
  /** A trava do dia segurou os acertos. */
  capped: boolean;
}

export const NO_POINTS: PointsBreakdown = {
  hits: 0,
  stars: 0,
  newStage: 0,
  total: 0,
  capped: false,
};

/** O que importa de uma rodada para os pontos (um RoundRecord serve). */
export interface PointsRound {
  stageId: string;
  mode: Mode;
  status: 'completed' | 'abandoned';
  correct: number;
  total: number;
  stars: Stars | null;
}

export interface PointsContext {
  /** Melhor nota da etapa antes desta rodada. */
  bestStarsBefore: Stars;
  /** Rodadas de desafio concluídas da mesma etapa, no mesmo dia, antes desta. */
  earlierRoundsToday: number;
}

const rules = () => GAME_CONFIG.points;

/** Peso da faixa do nível, pelo número do id (a versão armada 'L07V' pesa como 'L07'). */
export function levelWeight(levelId: string): number {
  const number = Number(/^L(\d+)V?$/.exec(levelId)?.[1]);
  const band = rules().levelWeights.find((b) => number >= b.from && number <= b.to);
  if (!band) throw new Error(`Nível sem peso de pontos: ${levelId}`);
  return band.weight;
}

const breakdown = (hits: number, stars: number, newStage: number, capped: boolean) => ({
  hits,
  stars,
  newStage,
  total: hits + stars + newStage,
  capped,
});

/** Pontos de uma rodada. Só o desafio concluído rende (o teste do dia usa `dailyPoints`). */
export function roundPoints(round: PointsRound, context: PointsContext): PointsBreakdown {
  if (round.mode !== 'challenge' || round.status !== 'completed') return NO_POINTS;

  const weight = levelWeight(getStage(round.stageId).levelId);
  const stars = round.stars ?? 0;

  const earnsHits = accuracy(round.correct, round.total) >= rules().minAccuracy;
  const capped =
    earnsHits && round.correct > 0 && context.earlierRoundsToday >= rules().roundsPerStagePerDay;
  const hits = earnsHits && !capped ? round.correct * weight : 0;

  const newStars = Math.max(0, stars - context.bestStarsBefore);
  const firstPass = stars >= PASSING_STARS && context.bestStarsBefore < PASSING_STARS;

  return breakdown(
    hits,
    newStars * rules().perNewStar * weight,
    firstPass ? rules().newStage * weight : 0,
    capped,
  );
}

/** Pontos do teste do dia: acertos × peso do teste do dia. */
export function dailyPoints(correct: number): PointsBreakdown {
  return correct > 0 ? breakdown(correct * rules().dailyWeight, 0, 0, false) : NO_POINTS;
}

/** Rodadas de desafio concluídas da etapa no dia. `day` é a data local, 'YYYY-MM-DD'. */
export function countEarlierRoundsToday(
  rounds: readonly (PointsRound & { day: string })[],
  stageId: string,
  day: string,
): number {
  return rounds.filter(
    (r) =>
      r.stageId === stageId && r.day === day && r.mode === 'challenge' && r.status === 'completed',
  ).length;
}

// ---------- Pontos somados no aparelho (docs/DATA.md §1.6) ----------

export interface PointsAward {
  /** Id da rodada, ou 'daily:YYYY-MM-DD' no teste do dia. */
  id: string;
  /** Data local, 'YYYY-MM-DD'. */
  day: string;
  points: PointsBreakdown;
}

export interface PointsLedger {
  /** Pontos totais (mascote). */
  total: number;
  /** Pontos de cada dia (ranking da semana). Chave: 'YYYY-MM-DD' local. */
  days: Record<string, number>;
  /** Da mais antiga para a mais nova. */
  awards: PointsAward[];
}

export function emptyLedger(): PointsLedger {
  return { total: 0, days: {}, awards: [] };
}

function isRecent(day: string, today: string): boolean {
  try {
    return daysBetween(day, today) < rules().keepDays;
  } catch {
    return false;
  }
}

/** Soma um ganho uma vez só (pelo id). Mantém os últimos dias e os últimos ganhos da configuração. */
export function addAward(ledger: PointsLedger, award: PointsAward): PointsLedger {
  if (award.points.total <= 0 && !award.points.capped) return ledger;
  if (ledger.awards.some((a) => a.id === award.id)) return ledger;

  const days = { ...ledger.days, [award.day]: (ledger.days[award.day] ?? 0) + award.points.total };
  const awards = [...ledger.awards, award];
  return {
    total: ledger.total + award.points.total,
    days: Object.fromEntries(Object.entries(days).filter(([day]) => isRecent(day, award.day))),
    awards: awards.slice(Math.max(0, awards.length - rules().keepAwards)),
  };
}
