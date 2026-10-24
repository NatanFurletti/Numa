// Fluxos críticos da Fase 1 (docs/TESTING.md §3.6), no navegador, com o site estático.

import { expect, test } from '@playwright/test';

import { answerCurrent, button, playRound, skipWelcome } from './helpers';

test('1. primeiro acesso → pular nivelamento → jogar L01-A → resultado → próxima etapa', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByText('Quer fazer um teste rápido para começar no seu nível?'),
  ).toBeVisible();
  await button(page, 'Começar do início').click();

  await button(page, 'Começar — Nível 1 · Etapa A').click();
  await playRound(page);

  await expect(page).toHaveURL(/\/result\//);
  await expect(page.getByText('10/10')).toBeVisible();
  await expect(page.getByLabel('3 de 3 estrelas')).toBeVisible();

  await button(page, 'Próxima etapa').click();
  await expect(page).toHaveURL(/\/play\/L01-B/);
});

test('2. rodada com erros → correção → "Ver resposta"', async ({ page }) => {
  await skipWelcome(page);
  await button(page, 'Começar — Nível 1 · Etapa A').click();
  await playRound(page, 10, [0]);

  await expect(page.getByText('9/10')).toBeVisible();
  await button(page, 'Corrigir erradas').click();
  await expect(page.getByText('1 de 1')).toBeVisible();

  await answerCurrent(page, false);
  await expect(page.getByText('Quase! Tente de novo.')).toBeVisible();
  await answerCurrent(page, false);
  await button(page, 'Ver resposta').click();
  await expect(page.getByText('Esta é a resposta certa.')).toBeVisible();

  await button(page, 'Próxima').click();
  await expect(page.getByText('Tudo corrigido! 👏')).toBeVisible();
});

test('3. recarregar a página mantém o progresso (e o resultado)', async ({ page }) => {
  await skipWelcome(page);
  await button(page, 'Começar — Nível 1 · Etapa A').click();
  await playRound(page);
  await expect(page.getByText('10/10')).toBeVisible();

  // O resultado continua lá depois de recarregar (rewrite de /result/<id>).
  await page.reload();
  await expect(page.getByText('10/10')).toBeVisible();

  await page.goto('/');
  await expect(button(page, 'Continuar — Nível 1 · Etapa B')).toBeVisible();
  await expect(page.getByText('🔥 1 dia')).toBeVisible();
});

test('4. trocar o idioma para EN (e continuar em EN depois de recarregar)', async ({ page }) => {
  await skipWelcome(page);
  await button(page, '⚙️ Configurações').click();
  await button(page, 'English').click();

  await expect(page.getByText('Settings', { exact: true })).toBeVisible();

  await page.goto('/');
  await expect(page.getByText('Train your mind a few minutes a day.')).toBeVisible();
  await page.reload();
  await expect(button(page, 'Start — Level 1 · Stage A')).toBeVisible();
});

test('5. direção direita → esquerda: digitar 2, 1, 1 resulta em 112', async ({ page }) => {
  await skipWelcome(page);
  await button(page, '⚙️ Configurações').click();
  await button(page, 'Direita → esquerda').click();
  await button(page, 'Voltar').click();

  await button(page, 'Começar — Nível 1 · Etapa A').click();
  await expect(page.getByTestId('current-problem')).toBeVisible({ timeout: 10_000 });
  await page.keyboard.type('211');

  await expect(page.getByTestId('answer')).toHaveText('▌112');
});

test('nivelamento: falhar no 1º bloco → começa no Nível 1 → início', async ({ page }) => {
  await page.goto('/');
  await button(page, 'Fazer teste de nivelamento').click();
  await button(page, 'Começar').click();

  await playRound(page, 5, [0, 1, 2, 3, 4]);

  await expect(page.getByText('Você começa no Nível 1!')).toBeVisible();
  await button(page, 'Vamos lá').click();
  await expect(button(page, 'Começar — Nível 1 · Etapa A')).toBeVisible();
});

test('offline: depois da primeira visita, o app abre sem internet', async ({ page, context }) => {
  await skipWelcome(page);
  // Espera o service worker assumir a página (ele guarda o site na primeira visita).
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);

  await page.reload();
  await expect(button(page, 'Começar — Nível 1 · Etapa A')).toBeVisible();
  await page.goto('/levels');
  await expect(page.getByText('Soma até 10')).toBeVisible();
  await page.goto('/play/L01-A');
  await expect(page.getByTestId('current-problem')).toBeVisible({ timeout: 10_000 });
});
