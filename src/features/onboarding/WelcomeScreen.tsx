// Boas-vindas, só no primeiro acesso (docs/SCREENS.md §3.1).

import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LANGUAGE_NAMES, LANGUAGES } from '@/i18n';
import { useSettings } from '@/store/settings';
import { Button } from '@/ui/Button';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

interface WelcomeScreenProps {
  onPlacement: () => void;
  /** Pulou o nivelamento: começa do L01-A. */
  onStart: () => void;
}

export function WelcomeScreen({ onPlacement, onStart }: WelcomeScreenProps) {
  const { t } = useTranslation();
  const language = useSettings((s) => s.language);
  const setLanguage = useSettings((s) => s.setLanguage);
  const markOnboardingDone = useSettings((s) => s.markOnboardingDone);

  const start = () => {
    markOnboardingDone();
    onStart();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {/* Seletor de idioma discreto, pré-selecionado pelo aparelho. */}
        <View style={styles.languages}>
          {LANGUAGES.map((code) => (
            <Pressable
              key={code}
              accessibilityRole="button"
              accessibilityLabel={LANGUAGE_NAMES[code]}
              accessibilityState={{ selected: language === code }}
              onPress={() => setLanguage(code)}
              hitSlop={8}
            >
              <Text style={[styles.language, language === code && styles.languageSelected]}>
                {LANGUAGE_NAMES[code]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.title} accessibilityRole="header">
          Numa
        </Text>
        <Text style={styles.tagline}>{t('home.tagline')}</Text>
        <Text style={styles.question}>{t('welcome.question')}</Text>

        <View style={styles.actions}>
          <Button label={t('welcome.placement')} onPress={onPlacement} />
          <Button label={t('welcome.fromStart')} onPress={start} variant="secondary" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
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
  languages: {
    flexDirection: 'row',
    gap: spacing.md,
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  language: {
    color: colors.textMuted,
    fontSize: 14,
  },
  languageSelected: {
    color: colors.text,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  title: {
    color: colors.text,
    fontSize: 56,
    fontWeight: '700',
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 18,
    textAlign: 'center',
  },
  question: {
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
