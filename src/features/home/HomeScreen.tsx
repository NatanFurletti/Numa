import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/ui/Button';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

interface HomeScreenProps {
  /** Provisório: no M4 vira "Continuar" para a etapa mais avançada. */
  onStart: () => void;
}

export function HomeScreen({ onStart }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Numa
        </Text>
        <Text style={styles.subtitle}>Treine sua mente alguns minutos por dia.</Text>
        <View style={styles.actions}>
          <Button label="Começar" onPress={onStart} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 56,
    fontWeight: '700',
  },
  actions: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    textAlign: 'center',
  },
});
