import { StyleSheet, Text, View } from 'react-native';

import { colors, maxContentWidth, spacing } from '@/ui/theme';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Numa
        </Text>
        <Text style={styles.subtitle}>Treine sua mente alguns minutos por dia.</Text>
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
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    textAlign: 'center',
  },
});
