// Mascote do Numa: um ábaco de brinquedo com bracinhos (docs/DECISIONS.md D-029).
// O mesmo desenho, parado, vira os ícones do app em scripts/generate-icons.js.
// Mudou o desenho aqui? Mude lá também e gere os ícones de novo.

import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

import { colors } from './theme';

export type MascotMood = 'happy' | 'party' | 'focus' | 'support';

interface MascotProps {
  mood?: MascotMood;
  /** Lado do quadrado, em px. */
  size?: number;
}

// O desenho usa uma grade de 120 × 120.
const GRID = 120;
// Faixa dos olhos na grade. Fica em uma camada própria, para piscar e olhar de lado.
const EYES = { x: 30, y: 13, width: 60, height: 28 };
const INK = colors.background;
const WHITE = '#FFFFFF';

const BLINK_EVERY_MS = 3600;

/** Movimento de cada humor: sobe (em unidades da grade), inclina (graus) e olha de lado (grade). */
const MOTION: Record<MascotMood, { beatMs: number; lift: number; tilt: number; look: number }> = {
  happy: { beatMs: 1400, lift: 4, tilt: 0, look: 0 },
  party: { beatMs: 360, lift: 16, tilt: 3, look: 0 },
  focus: { beatMs: 1300, lift: 0, tilt: 0, look: 3 },
  support: { beatMs: 1700, lift: 0, tilt: 5, look: 0 },
};

type ArmPose = 'up' | 'down';
const ARMS: Record<MascotMood, { left: ArmPose; right: ArmPose }> = {
  happy: { left: 'down', right: 'up' },
  party: { left: 'up', right: 'up' },
  focus: { left: 'down', right: 'down' },
  support: { left: 'up', right: 'down' },
};
const ARM_SHAPES = {
  left: {
    up: { d: 'M17 68 Q3 63 6 47', hand: { cx: 6, cy: 45 } },
    down: { d: 'M17 68 Q5 73 7 88', hand: { cx: 7, cy: 90 } },
  },
  right: {
    up: { d: 'M103 68 Q117 63 114 47', hand: { cx: 114, cy: 45 } },
    down: { d: 'M103 68 Q115 73 113 88', hand: { cx: 113, cy: 90 } },
  },
};

const EYES_VIEW_BOX = `${EYES.x} ${EYES.y} ${EYES.width} ${EYES.height}`;

/** Mascote animado. É decorativo: a mensagem ao lado é que fala com o leitor de tela. */
export function Mascot({ mood = 'happy', size = 120 }: MascotProps) {
  const unit = size / GRID;
  const { beatMs, lift, tilt, look } = MOTION[mood];

  // Vai e volta entre 0 e 1 no ritmo do humor.
  const beat = useSharedValue(0);
  useEffect(() => {
    beat.set(0);
    beat.set(
      withRepeat(withTiming(1, { duration: beatMs, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
    return () => cancelAnimation(beat);
  }, [beat, beatMs]);

  const lid = useSharedValue(1);
  useEffect(() => {
    lid.set(
      withRepeat(
        withSequence(
          withDelay(BLINK_EVERY_MS, withTiming(0.1, { duration: 90 })),
          withTiming(1, { duration: 110 }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(lid);
  }, [lid]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -lift * unit * beat.get() },
      { rotate: `${tilt * (beat.get() * 2 - 1)}deg` },
    ],
  }));
  const eyesStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: lid.get() }] }));
  const pupilsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: look * unit * (beat.get() * 2 - 1) }],
  }));

  const arms = ARMS[mood];
  const smiling = mood === 'happy' || mood === 'party';
  const eyesBox = {
    left: EYES.x * unit,
    top: EYES.y * unit,
    width: EYES.width * unit,
    height: EYES.height * unit,
  };

  return (
    <Animated.View
      testID={`mascot-${mood}`}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, bodyStyle]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${GRID} ${GRID}`}>
        <Arm shape={ARM_SHAPES.left[arms.left]} />
        <Arm shape={ARM_SHAPES.right[arms.right]} />
        {/* Pés, colunas e base */}
        <Rect x={27} y={104} width={19} height={10} rx={5} fill={colors.accent} />
        <Rect x={74} y={104} width={19} height={10} rx={5} fill={colors.accent} />
        <Rect x={17} y={48} width={10} height={52} rx={5} fill={colors.accent} />
        <Rect x={93} y={48} width={10} height={52} rx={5} fill={colors.accent} />
        <Rect x={13} y={96} width={94} height={11} rx={5.5} fill={colors.accent} />
        {/* Hastes e contas */}
        <Rod y={70} />
        <Rod y={87} />
        <Bead cx={38} cy={70} color={colors.warning} />
        <Bead cx={52} cy={70} color={colors.warning} />
        <Bead cx={82} cy={70} color={colors.error} />
        <Bead cx={38} cy={87} color={colors.success} />
        <Bead cx={68} cy={87} color={colors.success} />
        <Bead cx={82} cy={87} color={colors.success} />
        {/* Cabeça e boca */}
        <Rect x={9} y={6} width={102} height={48} rx={24} fill={colors.accent} />
        {smiling ? (
          <Path
            d="M52 42 Q60 52 68 42 Z"
            fill={INK}
            stroke={INK}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        ) : (
          <Path
            d="M53 43 Q60 48 67 43"
            fill="none"
            stroke={INK}
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}
      </Svg>

      <Animated.View style={[styles.layer, eyesBox, eyesStyle]}>
        <Svg width={eyesBox.width} height={eyesBox.height} viewBox={EYES_VIEW_BOX}>
          <Circle cx={44} cy={27} r={11.5} fill={WHITE} />
          <Circle cx={76} cy={27} r={11.5} fill={WHITE} />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, pupilsStyle]}>
          <Svg width={eyesBox.width} height={eyesBox.height} viewBox={EYES_VIEW_BOX}>
            <Circle cx={45} cy={28} r={6} fill={INK} />
            <Circle cx={77} cy={28} r={6} fill={INK} />
            <Circle cx={47.2} cy={25.8} r={2.2} fill={WHITE} />
            <Circle cx={79.2} cy={25.8} r={2.2} fill={WHITE} />
          </Svg>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

function Arm({ shape }: { shape: { d: string; hand: { cx: number; cy: number } } }) {
  return (
    <>
      <Path d={shape.d} fill="none" stroke={colors.accent} strokeWidth={6} strokeLinecap="round" />
      <Circle cx={shape.hand.cx} cy={shape.hand.cy} r={5} fill={colors.accent} />
    </>
  );
}

function Rod({ y }: { y: number }) {
  return (
    <Line
      x1={27}
      y1={y}
      x2={93}
      y2={y}
      stroke={colors.textMuted}
      strokeWidth={3}
      strokeLinecap="round"
    />
  );
}

function Bead({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return <Ellipse cx={cx} cy={cy} rx={6.5} ry={7.5} fill={color} />;
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
  },
});
