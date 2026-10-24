import { expect, type Page } from '@playwright/test';

/** Botão pelo nome exato (o Playwright procura por trecho, e "1" casaria com "10"). */
export const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

/** "24 + 73 =" → 97; "52 − 17 =" → 35. */
function solveText(text: string): number {
  const match = /(\d+)\s*([+−])\s*(\d+)/.exec(text);
  if (!match) throw new Error(`Conta não reconhecida: ${text}`);
  const [, a, op, b] = match;
  return op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
}

/** Lê a conta atual na tela e responde pelo teclado físico (certa, ou errada de propósito). */
export async function answerCurrent(page: Page, right = true) {
  const current = page.getByTestId('current-problem');
  // Durante a troca (≤ 150 ms) a conta que sai ainda aparece: espera sobrar só a atual.
  await expect(current).toHaveCount(1);
  const answer = solveText(await current.innerText());
  await page.keyboard.type(String(right ? answer : answer + 1));
  await page.keyboard.press('Enter');
}

/** Espera a contagem 3-2-1 e responde `total` contas; `wrong` diz quais errar (índices). */
export async function playRound(page: Page, total = 10, wrong: number[] = []) {
  await expect(page.getByTestId('current-problem')).toBeVisible({ timeout: 10_000 });
  for (let i = 0; i < total; i++) await answerCurrent(page, !wrong.includes(i));
}

/** Primeiro acesso: pula o nivelamento e chega ao início. */
export async function skipWelcome(page: Page) {
  await page.goto('/');
  await button(page, 'Começar do início').click();
  await expect(page.getByText('Treine sua mente alguns minutos por dia.')).toBeVisible();
}
