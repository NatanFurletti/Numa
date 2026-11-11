import { render, screen } from '@testing-library/react-native';

import { Mascot, type MascotMood } from './Mascot';

const MOODS: MascotMood[] = ['happy', 'party', 'focus', 'support'];

describe('Mascot', () => {
  it.each(MOODS)('desenha o humor "%s"', async (mood) => {
    await render(<Mascot mood={mood} />);

    expect(screen.getByTestId(`mascot-${mood}`, { includeHiddenElements: true })).toBeTruthy();
  });

  it('sem humor informado, fica feliz', async () => {
    await render(<Mascot />);

    expect(screen.getByTestId('mascot-happy', { includeHiddenElements: true })).toBeTruthy();
  });

  it('é decorativo: fica fora da leitura de tela', async () => {
    await render(<Mascot mood="party" />);

    expect(screen.queryByTestId('mascot-party')).toBeNull();
  });
});
