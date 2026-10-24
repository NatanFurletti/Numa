import { render, screen, userEvent } from '@testing-library/react-native';

import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('mostra o nome do app', async () => {
    await render(<HomeScreen onStart={jest.fn()} />);

    expect(screen.getByText('Numa')).toBeOnTheScreen();
  });

  it('o botão "Começar" inicia a primeira rodada', async () => {
    const onStart = jest.fn();
    const user = userEvent.setup();
    await render(<HomeScreen onStart={onStart} />);

    await user.press(screen.getByRole('button', { name: 'Começar' }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
