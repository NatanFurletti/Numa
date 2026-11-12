// POST /api/rounds: uma rodada de desafio, conferida no servidor (D-034).
// Vercel Function. A lógica fica em src/server; aqui só entram imports relativos
// (a Vercel não lê os atalhos `@/` do tsconfig).

import { endpoint } from '../src/server/http';
import { submitRound } from '../src/server/submissions';

const handle = endpoint(submitRound);

export const POST = handle;
export const OPTIONS = handle;
