// Configurações (docs/GAME_RULES.md §12, docs/SCREENS.md §3.9).
// "Refazer nivelamento" entra no M6, junto com a tela de nivelamento (D-024).

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LANGUAGE_NAMES, LANGUAGES } from '@/i18n';
import { useHistory } from '@/store/history';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { Button } from '@/ui/Button';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

type EraseStep = 'idle' | 'first' | 'second' | 'done';

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const language = useSettings((s) => s.language);
  const direction = useSettings((s) => s.inputDirection);
  const setLanguage = useSettings((s) => s.setLanguage);
  const setDirection = useSettings((s) => s.setInputDirection);
  const resetProgress = useProgress((s) => s.resetProgress);
  const clearHistory = useHistory((s) => s.clearHistory);
  const [erase, setErase] = useState<EraseStep>('idle');

  const eraseEverything = () => {
    resetProgress();
    clearHistory();
    setErase('done');
  };

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
            {t('settings.title')}
          </Text>
        </View>

        <Section title={t('settings.language')}>
          {LANGUAGES.map((code) => (
            <Option
              key={code}
              label={LANGUAGE_NAMES[code]}
              selected={language === code}
              onPress={() => setLanguage(code)}
            />
          ))}
        </Section>

        <Section title={t('settings.direction')}>
          <Option
            label={t('settings.ltr')}
            hint={t('settings.ltrExample')}
            selected={direction === 'ltr'}
            onPress={() => setDirection('ltr')}
          />
          <Option
            label={t('settings.rtl')}
            hint={t('settings.rtlExample')}
            selected={direction === 'rtl'}
            onPress={() => setDirection('rtl')}
          />
        </Section>

        <Section title={t('settings.eraseSection')}>
          <Text style={styles.hint}>{t('settings.eraseHint')}</Text>
          <Button
            label={t('settings.erase')}
            onPress={() => setErase('first')}
            variant="secondary"
          />
          {erase === 'done' ? <Text style={styles.erased}>{t('settings.erased')}</Text> : null}
        </Section>
      </View>

      <ConfirmDialog
        visible={erase === 'first'}
        title={t('settings.eraseTitle')}
        message={t('settings.eraseMessage')}
        confirmLabel={t('settings.eraseContinue')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => setErase('second')}
        onCancel={() => setErase('idle')}
      />
      <ConfirmDialog
        visible={erase === 'second'}
        title={t('settings.eraseConfirmTitle')}
        message={t('settings.eraseConfirmMessage')}
        confirmLabel={t('settings.eraseConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={eraseEverything}
        onCancel={() => setErase('idle')}
      />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Option({
  label,
  hint,
  selected,
  onPress,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={selected ? t('settings.selected', { option: label }) : label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {/* ✓ além da cor (SCREENS §1: cor nunca é o único sinal). */}
      <Text style={styles.check}>{selected ? '✓' : ''}</Text>
    </Pressable>
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
    gap: spacing.lg,
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
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  selected: {
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 14,
  },
  check: {
    width: 24,
    color: colors.accent,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  erased: {
    color: colors.success,
    fontSize: 16,
  },
});
