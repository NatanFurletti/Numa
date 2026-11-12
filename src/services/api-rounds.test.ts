import type { ApiClient } from './api';
import { createApiRoundSync } from './api-rounds';
import type { RoundSubmission } from './rounds';

const ROUND: RoundSubmission = {
  id: '3f2c1d7e-8a4b-4c6d-9e0f-1a2b3c4d5e6f',
  stageId: 'L07-B',
  seed: 4242,
  rulesVersion: 3,
  appVersion: '0.1.0',
  startedAt: '2026-11-12T11:58:00.000Z',
  inputDirection: 'ltr',
  answers: [{ answer: 5, timeMs: 2000, keystrokes: 1 }],
};

const fakeApi = (status: number): ApiClient => ({ post: jest.fn(async () => status) });

describe('createApiRoundSync.submitRound', () => {
  it('envia a rodada para a função do servidor', async () => {
    const api = fakeApi(200);

    await expect(createApiRoundSync(api).submitRound(ROUND)).resolves.toBe('sent');
    expect(api.post).toHaveBeenCalledWith('/api/rounds', ROUND);
  });

  it.each([400, 409, 413, 422])(
    'recusa definitiva (%p): não adianta tentar de novo',
    async (status) => {
      await expect(createApiRoundSync(fakeApi(status)).submitRound(ROUND)).resolves.toBe(
        'rejected',
      );
    },
  );

  it.each([401, 404, 429, 500, 503])(
    'falha passageira (%p): erro, para tentar depois',
    async (status) => {
      await expect(createApiRoundSync(fakeApi(status)).submitRound(ROUND)).rejects.toThrow(
        String(status),
      );
    },
  );

  it('sem internet: o erro é repassado', async () => {
    const api: ApiClient = { post: jest.fn().mockRejectedValue(new Error('sem rede')) };

    await expect(createApiRoundSync(api).submitRound(ROUND)).rejects.toThrow('sem rede');
  });
});
