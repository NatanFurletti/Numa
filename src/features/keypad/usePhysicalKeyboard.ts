import { useEffect } from 'react';
import { Platform } from 'react-native';

export interface KeyEventLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  preventDefault: () => void;
}

/** Algo que emite eventos de teclado (na web, o `window`). */
export interface KeyTarget {
  addEventListener(type: 'keydown', listener: (event: KeyEventLike) => void): void;
  removeEventListener(type: 'keydown', listener: (event: KeyEventLike) => void): void;
}

interface Options {
  onDigit: (digit: number) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  enabled: boolean;
  /** Padrão: `window` na web; nada no celular. */
  target?: KeyTarget | null;
}

function defaultTarget(): KeyTarget | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return window as unknown as KeyTarget;
}

/** Teclado físico na web: 0–9 (inclusive o numérico), Backspace e Enter. */
export function usePhysicalKeyboard({ onDigit, onBackspace, onSubmit, enabled, target }: Options) {
  const keyTarget = target === undefined ? defaultTarget() : target;

  useEffect(() => {
    if (!enabled || !keyTarget) return;

    const listener = (event: KeyEventLike) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        onDigit(Number(event.key));
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        onBackspace();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        onSubmit();
      }
    };

    keyTarget.addEventListener('keydown', listener);
    return () => keyTarget.removeEventListener('keydown', listener);
  }, [enabled, keyTarget, onDigit, onBackspace, onSubmit]);
}
