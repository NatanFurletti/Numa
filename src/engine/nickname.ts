// Apelido do ranking (docs/GAME_RULES.md §13.3). Aparece para todo mundo, então tem regras.

import { GAME_CONFIG } from './config/game-config';

export type NicknameProblem = 'tooShort' | 'tooLong' | 'invalidChars' | 'blocked';

/** Tira os espaços das pontas e junta espaços repetidos. */
export function normalizeNickname(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

const ALLOWED = /^[\p{L}\p{N} _.-]+$/u;

/** 'Mérda' → 'merda'. */
const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** O que há de errado com o apelido, ou null se ele pode ser usado. */
export function nicknameProblem(raw: string): NicknameProblem | null {
  const { minLength, maxLength, blockedWords } = GAME_CONFIG.daily.nickname;
  const nickname = normalizeNickname(raw);
  const length = [...nickname].length;
  if (length < minLength) return 'tooShort';
  if (length > maxLength) return 'tooLong';
  if (!ALLOWED.test(nickname)) return 'invalidChars';
  // Palavra inteira, para não recusar "computador".
  const words = plain(nickname).split(/[^\p{L}]+/u);
  if (words.some((word) => blockedWords.includes(word))) return 'blocked';
  return null;
}
