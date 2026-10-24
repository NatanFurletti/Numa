import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import type { Stars as StarCount } from '@/engine/types';
import { colors, spacing } from '@/ui/theme';

const MAX_STARS = 3;
const STAR_DELAY_MS = 180;

/** Estrelas da rodada, uma depois da outra (animação simples). */
export function Stars({ count }: { count: StarCount }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${count} de ${MAX_STARS} estrelas`}
    >
      {Array.from({ length: MAX_STARS }, (_, i) => {
        const filled = i < count;
        return (
          <Animated.View key={i} entering={ZoomIn.delay(i * STAR_DELAY_MS).springify()}>
            <Text style={[styles.star, filled ? styles.filled : styles.empty]}>
              {filled ? '★' : '☆'}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  star: {
    fontSize: 48,
  },
  filled: {
    color: colors.warning,
  },
  empty: {
    color: colors.textMuted,
    opacity: 0.5,
  },
});
