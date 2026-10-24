import { render, screen, userEvent } from '@testing-library/react-native';

import { Keypad } from './Keypad';

function setup(submitDisabled = false) {
  const handlers = { onDigit: jest.fn(), onBackspace: jest.fn(), onSubmit: jest.fn() };
  return {
    handlers,
    render: () => render(<Keypad {...handlers} submitDisabled={submitDisabled} />),
  };
}

describe('Keypad', () => {
  it('mostra os 10 dígitos, apagar e confirmar, no formato de celular (1-2-3 em cima)', async () => {
    const { render } = setup();

    await render();

    const labels = screen.getAllByRole('button').map((b) => b.props.accessibilityLabel);
    expect(labels).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'Apagar',
      '0',
      'Confirmar',
    ]);
  });

  it('avisa o dígito tocado', async () => {
    const { render, handlers } = setup();
    const user = userEvent.setup();
    await render();

    await user.press(screen.getByRole('button', { name: '7' }));
    await user.press(screen.getByRole('button', { name: '0' }));

    expect(handlers.onDigit.mock.calls).toEqual([[7], [0]]);
  });

  it('avisa apagar e confirmar', async () => {
    const { render, handlers } = setup();
    const user = userEvent.setup();
    await render();

    await user.press(screen.getByRole('button', { name: 'Apagar' }));
    await user.press(screen.getByRole('button', { name: 'Confirmar' }));

    expect(handlers.onBackspace).toHaveBeenCalledTimes(1);
    expect(handlers.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('com o campo vazio, o confirmar fica desativado', async () => {
    const { render, handlers } = setup(true);
    const user = userEvent.setup();
    await render();

    const confirm = screen.getByRole('button', { name: 'Confirmar' });
    await user.press(confirm);

    expect(confirm).toBeDisabled();
    expect(handlers.onSubmit).not.toHaveBeenCalled();
  });
});
