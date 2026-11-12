// Teste do dia (docs/GAME_RULES.md §13, docs/SCREENS.md §3.10): a entrada do teste, o resultado
// de quem já fez e o ranking do dia.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { GAME_CONFIG } from '@/engine/config/game-config';
import type { DailyAttempt } from '@/engine/daily';
import { nicknameProblem, type NicknameProblem, normalizeNickname } from '@/engine/nickname';
import { ProblemRow } from '@/features/result/ProblemRow';
import { systemClock } from '@/lib/clock';
import { localDateString } from '@/lib/date';
import { formatSeconds, formatTenths } from '@/lib/format';
import { defaultRankingService } from '@/services/daily-ranking';
import type { RankingEntry, RankingService } from '@/services/ranking';
import { useDaily } from '@/store/daily';
import { Button } from '@/ui/Button';
import { colors, maxContentWidth, spacing } from '@/ui/theme';

import { type RankingState, useDailyRanking } from './useDailyRanking';

interface DailyScreenProps {
  onStart: () => void;
  onBack: () => void;
  /** Sem ela, usa o Supabase (ou nenhum, se o build não tem as variáveis). */
  service?: RankingService | null;
}

export function DailyScreen({ onStart, onBack, service: serviceProp }: DailyScreenProps) {
  const { t } = useTranslation();
  const [day] = useState(() => localDateString(systemClock.now()));
  const [service] = useState(() =>
    serviceProp === undefined ? defaultRankingService() : serviceProp,
  );
  const attempt = useDaily((s) => s.attempts[day]);
  const { state, reload } = useDailyRanking(day, service);

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
          <Intro needsNickname={service !== null} onStart={onStart} />
        ) : attempt.status === 'started' ? (
          <Text style={styles.text}>{t('daily.interrupted')}</Text>
        ) : (
          <MyResult attempt={attempt} state={state} pending={service !== null} />
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

/** Antes de jogar: as regras, o apelido (se há ranking) e o botão de começar. */
function Intro({ needsNickname, onStart }: { needsNickname: boolean; onStart: () => void }) {
  const { t } = useTranslation();
  const setNickname = useDaily((s) => s.setNickname);
  const [nickname, setDraft] = useState(() => useDaily.getState().nickname ?? '');
  const [problem, setProblem] = useState<NicknameProblem | null>(null);

  const start = () => {
    if (needsNickname) {
      const found = nicknameProblem(nickname);
      setProblem(found);
      if (found) return;
      setNickname(normalizeNickname(nickname));
    }
    onStart();
  };

  return (
    <View style={styles.section}>
      <Text style={styles.text}>{t('daily.intro')}</Text>
      <Text style={styles.hint}>{t('daily.rule')}</Text>
      {needsNickname ? (
        <View style={styles.field}>
          <Text style={styles.label}>{t('daily.nicknameLabel')}</Text>
          <TextInput
            accessibilityLabel={t('daily.nicknameLabel')}
            value={nickname}
            onChangeText={(text) => {
              setDraft(text);
              setProblem(null);
            }}
            maxLength={GAME_CONFIG.daily.nickname.maxLength}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={start}
            style={styles.input}
          />
          <Text style={styles.hint}>{t('daily.nicknameHint')}</Text>
          {problem ? (
            <Text style={styles.error} accessibilityRole="alert">
              {t(`daily.nicknameErrors.${problem}`)}
            </Text>
          ) : null}
        </View>
      ) : null}
      <Button label={t('daily.start')} onPress={start} />
    </View>
  );
}

type DoneAttempt = Extract<DailyAttempt, { status: 'done' }>;

/** Depois de jogar: placar, tempo e a posição no ranking. */
function MyResult({
  attempt,
  state,
  pending,
}: {
  attempt: DoneAttempt;
  state: RankingState;
  /** Há ranking neste build: avisa enquanto o resultado não foi enviado. */
  pending: boolean;
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
