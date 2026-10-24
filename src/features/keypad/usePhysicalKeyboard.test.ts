import { renderHook } from '@testing-library/react-native';

import { type KeyTarget, usePhysicalKeyboard } from './usePhysicalKeyboard';

type Listener = (event: KeyboardLikeEvent) => void;
interface KeyboardLikeEvent {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  preventDefault: () => void;
}

function fakeTarget() {
  const listeners = new Set<Listener>();
  const target: KeyTarget = {
    addEventListener: (_type, fn) => listeners.add(fn as Listener),
    removeEventListener: (_type, fn) => listeners.delete(fn as Listener),
  };
  const press = (key: string, extra: Partial<KeyboardLikeEvent> = {}) => {
    const event = { key, preventDefault: jest.fn(), ...extra };
    listeners.forEach((fn) => fn(event));
    return event;
  };
  return { target, press, listeners };
}

function setup(enabled = true) {
  const keys = fakeTarget();
  const handlers = { onDigit: jest.fn(), onBackspace: jest.fn(), onSubmit: jest.fn() };
  const hook = renderHook(
    (props: { enabled: boolean }) =>
      usePhysicalKeyboard({ ...handlers, enabled: props.enabled, target: keys.target }),
    { initialProps: { enabled } },
  );
  return { keys, handlers, hook };
}

describe('usePhysicalKeyboard', () => {
  it('digitar 0–9 no teclado (inclusive o numérico) envia o dígito', async () => {
    const { keys, handlers, hook } = setup();
    await hook;

    keys.press('4');
    keys.press('0');

    expect(handlers.onDigit.mock.calls).toEqual([[4], [0]]);
  });

  it('Backspace apaga e Enter confirma', async () => {
    const { keys, handlers, hook } = setup();
    await hook;

    const backspace = keys.press('Backspace');
    keys.press('Enter');

    expect(handlers.onBackspace).toHaveBeenCalledTimes(1);
    expect(handlers.onSubmit).toHaveBeenCalledTimes(1);
    expect(backspace.preventDefault).toHaveBeenCalled();
  });

  it('ignora outras teclas e atalhos (Ctrl, Cmd, Alt)', async () => {
    const { keys, handlers, hook } = setup();
    await hook;

    const other = keys.press('a');
    keys.press('5', { ctrlKey: true });
    keys.press('5', { metaKey: true });
    keys.press('5', { altKey: true });

    expect(handlers.onDigit).not.toHaveBeenCalled();
    expect(other.preventDefault).not.toHaveBeenCalled();
  });

  it('desativado, não escuta o teclado', async () => {
    const { keys, handlers, hook } = setup(false);
    await hook;

    keys.press('5');

    expect(handlers.onDigit).not.toHaveBeenCalled();
    expect(keys.listeners.size).toBe(0);
  });

  it('para de escutar ao desmontar', async () => {
    const { keys, hook } = setup();
    const { unmount } = await hook;

    await unmount();

    expect(keys.listeners.size).toBe(0);
  });

  it('sem alvo (celular), não faz nada', async () => {
    const handlers = { onDigit: jest.fn(), onBackspace: jest.fn(), onSubmit: jest.fn() };

    await renderHook(() => usePhysicalKeyboard({ ...handlers, enabled: true, target: null }));

    expect(handlers.onDigit).not.toHaveBeenCalled();
  });
});
