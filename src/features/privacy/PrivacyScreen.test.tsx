import { render, screen, userEvent } from '@testing-library/react-native';

import { PRIVACY_CONTACT_EMAIL } from './contact';
import { PrivacyScreen } from './PrivacyScreen';

async function renderPrivacy() {
  const onBack = jest.fn();
  await render(<PrivacyScreen onBack={onBack} />);
  return { onBack, user: userEvent.setup() };
}

describe('PrivacyScreen', () => {
  it('mostra o título e o que fica só no aparelho', async () => {
    await renderPrivacy();

    expect(screen.getByRole('header', { name: 'Política de privacidade' })).toBeOnTheScreen();
    expect(screen.getByText('O que fica só no seu aparelho')).toBeOnTheScreen();
  });

  it('explica que o apelido e o resultado do teste do dia são públicos', async () => {
    await renderPrivacy();

    expect(screen.getByText('O que vai para o servidor, e só se você aceitar')).toBeOnTheScreen();
    expect(screen.getByText(/aparecem no ranking para qualquer pessoa/)).toBeOnTheScreen();
  });

  it('explica o consentimento, as rodadas de desafio enviadas e como parar de enviar', async () => {
    await renderPrivacy();

    expect(screen.getByText(/Se você não aceitar, nada é enviado/)).toBeOnTheScreen();
    expect(
      screen.getByText(/das rodadas de desafio: a etapa, a resposta, o tempo/),
    ).toBeOnTheScreen();
    expect(screen.getByText(/Configurações > Privacidade/)).toBeOnTheScreen();
    expect(screen.getByText(/retirar o seu aceite a qualquer momento/)).toBeOnTheScreen();
  });

  it('mostra o contato para pedir a exclusão dos dados', async () => {
    await renderPrivacy();

    expect(screen.getByText(new RegExp(PRIVACY_CONTACT_EMAIL))).toBeOnTheScreen();
  });

  it('o botão de voltar sai da tela', async () => {
    const { onBack, user } = await renderPrivacy();

    await user.press(screen.getByRole('button', { name: 'Voltar' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
