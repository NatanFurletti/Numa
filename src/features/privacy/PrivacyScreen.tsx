// Política de privacidade (docs/SCREENS.md §3.11). Texto todo no i18n (`privacy.*`).

import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, maxContentWidth, spacing } from '@/ui/theme';

import { PRIVACY_CONTACT_EMAIL } from './contact';

const SECTIONS = ['device', 'server', 'providers', 'keep', 'rights', 'kids', 'changes'] as const;

interface PrivacyScreenProps {
  onBack: () => void;
}

export function PrivacyScreen({ onBack }: PrivacyScreenProps) {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={onBack}
            hitSlop={12}
            style={styles.back}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            {t('privacy.title')}
          </Text>
        </View>

        <Text style={styles.muted}>{t('privacy.updated')}</Text>
        <Text style={styles.body}>{t('privacy.intro')}</Text>

        {SECTIONS.map((key) => (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {t(`privacy.sections.${key}.title`)}
            </Text>
            <Text style={styles.body}>
              {t(`privacy.sections.${key}.body`, { email: PRIVACY_CONTACT_EMAIL })}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: colors.textMuted,
    fontSize: 26,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
