import { render, screen, userEvent } from '@testing-library/react-native';

import { ConfirmDialog } from './ConfirmDialog';

function renderDialog(visible: boolean) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const result = render(
    <ConfirmDialog
      visible={visible}
      title="Sair da rodada?"
      message="Esta rodada não vai contar."
      confirmLabel="Sair"
      cancelLabel="Continuar jogando"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { result, onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('mostra o título, a mensagem e as duas opções', async () => {
    await renderDialog(true).result;

    expect(screen.getByText('Sair da rodada?')).toBeOnTheScreen();
    expect(screen.getByText('Esta rodada não vai contar.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Continuar jogando' })).toBeOnTheScreen();
  });

  it('avisa quando a pessoa confirma ou cancela', async () => {
    const { result, onConfirm, onCancel } = renderDialog(true);
    const user = userEvent.setup();
    await result;

    await user.press(screen.getByRole('button', { name: 'Sair' }));
    await user.press(screen.getByRole('button', { name: 'Continuar jogando' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('escondido, não mostra nada', async () => {
    await renderDialog(false).result;

    expect(screen.queryByText('Sair da rodada?')).not.toBeOnTheScreen();
  });

  it('a mensagem é opcional', async () => {
    await render(
      <ConfirmDialog
        visible
        title="Tem certeza?"
        confirmLabel="Sim"
        cancelLabel="Não"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText('Tem certeza?')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Sim' })).toBeOnTheScreen();
  });
});
