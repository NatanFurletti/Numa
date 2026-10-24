import { render, screen } from '@testing-library/react-native';

import { TimeBar } from './TimeBar';

describe('TimeBar', () => {
  it('mostra quanto tempo ainda resta', async () => {
    await render(<TimeBar ratio={0.5} timeUp={false} />);

    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ min: 0, max: 100, now: 50 });
    expect(screen.queryByText('tempo esgotado, continue!')).not.toBeOnTheScreen();
  });

  it('com o tempo esgotado, avisa para continuar', async () => {
    await render(<TimeBar ratio={0} timeUp />);

    expect(screen.getByText('tempo esgotado, continue!')).toBeOnTheScreen();
  });

  it('sem tempo-limite (treino livre), não aparece', async () => {
    await render(<TimeBar ratio={null} timeUp={false} />);

    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
  });
});
