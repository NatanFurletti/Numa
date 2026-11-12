// POST /api/daily: o teste do dia, conferido no servidor (D-034).
// Vercel Function. A lógica fica em src/server; aqui só entram imports relativos
// (a Vercel não lê os atalhos `@/` do tsconfig).

import { endpoint } from '../src/server/http';
import { submitDaily } from '../src/server/submissions';

const handle = endpoint(submitDaily);

export const POST = handle;
export const OPTIONS = handle;
