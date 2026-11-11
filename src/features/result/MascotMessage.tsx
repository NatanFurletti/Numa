import { StyleSheet, Text, View } from 'react-native';

import { Mascot, type MascotMood } from '@/ui/Mascot';
import { colors, spacing } from '@/ui/theme';

const MASCOT_SIZE = 96;
const TAIL_SIZE = 14;

/** O mascote dizendo a mensagem da rodada em um balão. */
export function MascotMessage({ text, mood }: { text: string; mood: MascotMood }) {
  return (
    <View style={styles.row}>
      <Mascot mood={mood} size={MASCOT_SIZE} />
      <View style={styles.bubble}>
        <View style={styles.tail} />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  tail: {
    position: 'absolute',
    left: -TAIL_SIZE / 2,
    top: '50%',
    width: TAIL_SIZE,
    height: TAIL_SIZE,
    borderRadius: 3,
    backgroundColor: colors.surface,
    transform: [{ rotate: '45deg' }],
  },
  text: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
});
