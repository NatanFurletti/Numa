import { useSettings } from './settings';

beforeEach(() => useSettings.setState(useSettings.getInitialState(), true));

describe('useSettings', () => {
  it('padrões: digitação da esquerda para a direita e dica ainda não vista', () => {
    expect(useSettings.getState()).toMatchObject({
      inputDirection: 'ltr',
      hasSeenDirectionTip: false,
    });
  });

  it('marca a dica de direção como vista', () => {
    useSettings.getState().markDirectionTipSeen();

    expect(useSettings.getState().hasSeenDirectionTip).toBe(true);
  });

  it('troca a direção da digitação', () => {
    useSettings.getState().setInputDirection('rtl');

    expect(useSettings.getState().inputDirection).toBe('rtl');
  });
});
