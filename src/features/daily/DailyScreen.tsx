// Teste do dia (docs/GAME_RULES.md §13, docs/SCREENS.md §3.10): a entrada do teste, o resultado
// de quem já fez e o ranking do dia. É aqui que o app pede o consentimento para enviar (D-034).

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { GAME_CONFIG } from '@/engine/config/game-config';
import type { DailyAttempt } from '@/engine/daily';
import { nicknameProblem, type NicknameProblem, normalizeNickname } from '@/engine/nickname';
import { ProblemRow } from '@/features/result/ProblemRow';
import { setSharing } from '@/features/sync/outbox';
import { systemClock } from '@/lib/clock';
import { localDateString } from '@/lib/date';
import { formatSeconds, formatTenths } from '@/lib/format';
import { defaultRankingService } from '@/services/daily-ranking';
import type { RankingEntry, RankingService } from '@/services/ranking';
import { useDaily } from '@/store/daily';
import { useSettings } from '@/store/settings';
import { Button } from '@/ui/Button';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

import { type RankingState, useDailyRanking } from './useDailyRanking';

interface DailyScreenProps {
  onStart: () => void;
  onBack: () => void;
  onOpenPrivacy: () => void;
  /** Sem ela, usa o Supabase (ou nenhum, se o build não tem as variáveis). */
  service?: RankingService | null;
}

export function DailyScreen({
  onStart,
  onBack,
  onOpenPrivacy,
  service: serviceProp,
}: DailyScreenProps) {
  const { t } = useTranslation();
  const [day] = useState(() => localDateString(systemClock.now()));
  const [service] = useState(() =>
    serviceProp === undefined ? defaultRankingService() : serviceProp,
  );
  const attempt = useDaily((s) => s.attempts[day]);
  const hasNickname = useDaily((s) => s.nickname !== null);
  const consent = useSettings((s) => s.shareRounds);
  const { state, reload } = useDailyRanking(day, service);
  // Sem servidor neste build não há o que enviar, então não há o que perguntar.
  const asking = service !== null && consent === null;
  const sharing = service !== null && consent === true;
  const declined = service !== null && consent === false;

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
            {t('daily.title')}
          </Text>
        </View>

        {attempt === undefined ? (
          asking ? (
            <>
              <Text style={styles.text}>{t('daily.intro')}</Text>
              <Consent onOpenPrivacy={onOpenPrivacy} />
            </>
          ) : (
            <Intro
              needsNickname={sharing}
              declined={declined}
              onStart={onStart}
              onOpenPrivacy={onOpenPrivacy}
            />
          )
        ) : attempt.status === 'started' ? (
          <Text style={styles.text}>{t('daily.interrupted')}</Text>
        ) : (
          <>
            <MyResult attempt={attempt} state={state} pending={sharing} declined={declined} />
            {asking ? <Consent onOpenPrivacy={onOpenPrivacy} /> : null}
            {sharing && !hasNickname && !attempt.submitted ? (
              <JoinRanking onOpenPrivacy={onOpenPrivacy} />
            ) : null}
          </>
        )}

        <Ranking state={state} onRetry={reload} />

        {attempt?.status === 'done' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('daily.answersTitle')}</Text>
            {attempt.problems.map((problem, i) => (
              <ProblemRow key={i} problem={problem} />
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

/**
 * O pedido de consentimento (D-034): aparece para quem ainda não respondeu, antes do apelido.
 * Recusar não impede de jogar.
 */
function Consent({ onOpenPrivacy }: { onOpenPrivacy: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle} accessibilityRole="header">
        {t('daily.consent.title')}
      </Text>
      <Text style={styles.cardText}>{t('daily.consent.body')}</Text>
      <Text style={styles.hint}>{t('daily.consent.hint')}</Text>
      <PrivacyLink onPress={onOpenPrivacy} />
      <Button label={t('daily.consent.accept')} onPress={() => setSharing(true)} />
      <Button
        label={t('daily.consent.decline')}
        onPress={() => setSharing(false)}
        variant="secondary"
      />
    </View>
  );
}

function PrivacyLink({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
      <Text style={styles.link}>{t('daily.privacyLink')}</Text>
    </Pressable>
  );
}

/** O campo do apelido, com as regras. `save` devolve false se o apelido não pode ser usado. */
function useNicknameField() {
  const setNickname = useDaily((s) => s.setNickname);
  const [nickname, setDraft] = useState(() => useDaily.getState().nickname ?? '');
  const [problem, setProblem] = useState<NicknameProblem | null>(null);

  const save = (): boolean => {
    const found = nicknameProblem(nickname);
    setProblem(found);
    if (found) return false;
    setNickname(normalizeNickname(nickname));
    return true;
  };
  const change = (text: string) => {
    setDraft(text);
    setProblem(null);
  };
  return { nickname, problem, change, save };
}

function NicknameField({
  field,
  onSubmit,
  onOpenPrivacy,
}: {
  field: ReturnType<typeof useNicknameField>;
  onSubmit: () => void;
  onOpenPrivacy: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{t('daily.nicknameLabel')}</Text>
      <TextInput
        accessibilityLabel={t('daily.nicknameLabel')}
        value={field.nickname}
        onChangeText={field.change}
        maxLength={GAME_CONFIG.daily.nickname.maxLength}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        style={styles.input}
      />
      <Text style={styles.hint}>{t('daily.nicknameHint')}</Text>
      <PrivacyLink onPress={onOpenPrivacy} />
      {field.problem ? (
        <Text style={styles.error} accessibilityRole="alert">
          {t(`daily.nicknameErrors.${field.problem}`)}
        </Text>
      ) : null}
    </View>
  );
}

/** Antes de jogar: as regras, o apelido (para quem entra no ranking) e o botão de começar. */
function Intro({
  needsNickname,
  declined,
  onStart,
  onOpenPrivacy,
}: {
  needsNickname: boolean;
  /** A pessoa escolheu não enviar: joga sem apelido e fica fora do ranking. */
  declined: boolean;
  onStart: () => void;
  onOpenPrivacy: () => void;
}) {
  const { t } = useTranslation();
  const field = useNicknameField();

  const start = () => {
    if (needsNickname && !field.save()) return;
    onStart();
  };

  return (
    <View style={styles.section}>
      <Text style={styles.text}>{t('daily.intro')}</Text>
      <Text style={styles.hint}>{t('daily.rule')}</Text>
      {needsNickname ? (
        <NicknameField field={field} onSubmit={start} onOpenPrivacy={onOpenPrivacy} />
      ) : null}
      {declined ? <Text style={styles.hint}>{t('daily.notSharing')}</Text> : null}
      <Button label={t('daily.start')} onPress={start} />
    </View>
  );
}

/** Aceitou enviar depois de jogar, sem apelido ainda: escolhe o apelido e o resultado é enviado. */
function JoinRanking({ onOpenPrivacy }: { onOpenPrivacy: () => void }) {
  const { t } = useTranslation();
  const field = useNicknameField();
  return (
    <View style={styles.section}>
      <NicknameField field={field} onSubmit={field.save} onOpenPrivacy={onOpenPrivacy} />
      <Button label={t('daily.join')} onPress={field.save} />
    </View>
  );
}

type DoneAttempt = Extract<DailyAttempt, { status: 'done' }>;

/** Depois de jogar: placar, tempo e a posição no ranking. */
function MyResult({
  attempt,
  state,
  pending,
  declined,
}: {
  attempt: DoneAttempt;
  state: RankingState;
  /** A pessoa entra no ranking: avisa enquanto o resultado não foi enviado. */
  pending: boolean;
  /** A pessoa escolheu não enviar. */
  declined: boolean;
}) {
  const { t } = useTranslation();
  const me = state.status === 'ready' ? state.ranking.entries.find((e) => e.isMe) : undefined;
  const total = state.status === 'ready' ? state.ranking.totalPlayers : 0;

  return (
    <View style={styles.scoreBlock}>
      <Text style={styles.score}>{`${attempt.correct}/${attempt.total}`}</Text>
      <Text style={styles.time}>{t('daily.time', { time: formatSeconds(attempt.elapsedMs) })}</Text>
      {me ? (
        <Text style={styles.position}>{t('daily.position', { rank: me.rank, total })}</Text>
      ) : null}
      {pending && !attempt.submitted && state.status !== 'loading' ? (
        <Text style={styles.hint}>{t('daily.pendingSubmit')}</Text>
      ) : null}
      {declined ? <Text style={styles.centeredHint}>{t('daily.notSharing')}</Text> : null}
    </View>
  );
}

function Ranking({ state, onRetry }: { state: RankingState; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('daily.rankingTitle')}</Text>
      {state.status === 'unavailable' ? (
        <Text style={styles.hint}>{t('daily.rankingUnavailable')}</Text>
      ) : state.status === 'loading' ? (
        <Text style={styles.hint}>{t('daily.rankingLoading')}</Text>
      ) : state.status === 'error' ? (
        <>
          <Text style={styles.hint}>{t('daily.rankingError')}</Text>
          <Button label={t('daily.rankingRetry')} onPress={onRetry} variant="secondary" />
        </>
      ) : state.ranking.entries.length === 0 ? (
        <Text style={styles.hint}>{t('daily.rankingEmpty')}</Text>
      ) : (
        state.ranking.entries.map((entry) => <RankingRow key={entry.rank} entry={entry} />)
      )}
    </View>
  );
}

function RankingRow({ entry }: { entry: RankingEntry }) {
  const { t } = useTranslation();
  const time = formatTenths(entry.elapsedMs);
  return (
    <View
      style={[styles.row, entry.isMe && styles.rowMe]}
      accessible
      accessibilityLabel={t(entry.isMe ? 'daily.rankingRowMe' : 'daily.rankingRow', {
        rank: entry.rank,
        nickname: entry.nickname,
        correct: entry.correct,
        time,
      })}
    >
      <Text style={styles.rank}>{entry.rank}</Text>
      <Text style={styles.nickname} numberOfLines={1}>
        {entry.isMe ? `${entry.nickname} (${t('daily.you')})` : entry.nickname}
      </Text>
      <Text style={styles.rowScore}>{entry.correct}</Text>
      <Text style={styles.rowTime}>{time}</Text>
    </View>
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
  text: {
    color: colors.text,
    fontSize: 18,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 14,
  },
  centeredHint: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  cardText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  field: {
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 18,
  },
  error: {
    color: colors.error,
    fontSize: 14,
  },
  link: {
    color: colors.accent,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  scoreBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  score: {
    color: colors.text,
    fontSize: 64,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  time: {
    color: colors.textMuted,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
  position: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  rowMe: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  rank: {
    width: 32,
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  nickname: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  rowScore: {
    width: 28,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  rowTime: {
    width: 64,
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
