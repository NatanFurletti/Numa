import { render, screen } from '@testing-library/react-native';

import type { Problem } from '@/engine/types';

import { ProblemQueue } from './ProblemQueue';

const problems: Problem[] = [
  { a: 24, b: 73, op: 'add' },
  { a: 34, b: 63, op: 'add' },
  { a: 28, b: 57, op: 'add' },
];

describe('ProblemQueue', () => {
  it('mostra a conta atual com a resposta digitada', async () => {
    await render(<ProblemQueue problems={problems} answerText="9" direction="ltr" />);

    expect(screen.getByText('24 + 73 =')).toBeOnTheScreen();
    expect(screen.getByLabelText('24 + 73 = 9')).toBeOnTheScreen();
  });

  it('mostra as 2 próximas: a primeira com "?", a segunda sem', async () => {
    await render(<ProblemQueue problems={problems} answerText="" direction="ltr" />);

    expect(screen.getByText('34 + 63 = ?')).toBeOnTheScreen();
    expect(screen.getByText('28 + 57 =')).toBeOnTheScreen();
  });

  it('usa o sinal de menos tipográfico na subtração', async () => {
    await render(
      <ProblemQueue problems={[{ a: 15, b: 7, op: 'sub' }]} answerText="" direction="ltr" />,
    );

    expect(screen.getByText('15 − 7 =')).toBeOnTheScreen();
  });

  it('esquerda → direita: o cursor fica à direita da resposta', async () => {
    await render(<ProblemQueue problems={problems} answerText="9" direction="ltr" />);

    expect(screen.getByTestId('answer')).toHaveTextContent('9▌');
  });

  it('direita → esquerda: o cursor fica à esquerda da resposta', async () => {
    await render(<ProblemQueue problems={problems} answerText="9" direction="rtl" />);

    expect(screen.getByTestId('answer')).toHaveTextContent('▌9');
  });

  it('com a resposta vazia, mostra só o cursor (nada revela o tamanho da resposta)', async () => {
    await render(<ProblemQueue problems={problems} answerText="" direction="ltr" />);

    expect(screen.getByTestId('answer')).toHaveTextContent('▌');
  });

  it('sem contas, não mostra nada', async () => {
    await render(<ProblemQueue problems={[]} answerText="" direction="ltr" />);

    expect(screen.queryByTestId('answer')).not.toBeOnTheScreen();
  });
});
