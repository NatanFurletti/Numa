import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/ui/theme';

interface KeypadProps {
  onDigit: (digit: number) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  submitDisabled: boolean;
}

type Key = { kind: 'digit'; digit: number } | { kind: 'backspace' } | { kind: 'submit' };

// Formato de teclado de celular: 1-2-3 em cima.
const ROWS: Key[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
].map((row) => row.map((digit): Key => ({ kind: 'digit', digit })));
ROWS.push([{ kind: 'backspace' }, { kind: 'digit', digit: 0 }, { kind: 'submit' }]);

function keyLabel(key: Key): { text: string; label: string } {
  if (key.kind === 'digit') return { text: String(key.digit), label: String(key.digit) };
  if (key.kind === 'backspace') return { text: '⌫', label: 'Apagar' };
  return { text: '✓', label: 'Confirmar' };
}

export function Keypad({ onDigit, onBackspace, onSubmit, submitDisabled }: KeypadProps) {
  const handlePress = (key: Key) => {
    if (key.kind === 'digit') onDigit(key.digit);
    else if (key.kind === 'backspace') onBackspace();
    else onSubmit();
  };

  return (
    <View style={styles.grid}>
      {ROWS.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((key) => {
            const { text, label } = keyLabel(key);
            const disabled = key.kind === 'submit' && submitDisabled;
            return (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => handlePress(key)}
                style={({ pressed }) => [
                  styles.key,
                  key.kind === 'submit' && styles.submit,
                  pressed && styles.pressed,
                  disabled && styles.disabled,
                ]}
              >
                <Text style={styles.keyText}>{text}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  key: {
    flex: 1,
    minHeight: 64,
    minWidth: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  submit: {
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.35,
  },
  keyText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
