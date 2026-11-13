import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '../theme';
import { DAILY_GOAL_ML, GLASS_ML } from '../water/water';

const GOAL_GLASSES = DAILY_GOAL_ML / GLASS_ML;
const GLASSES_PER_ROW = 5;
const GLASS_WIDTH = 44;
const GLASS_HEIGHT = 52;
const GLASS_GAP = 14;
// A tumbler with rounded corners at the rim and at the base.
const GLASS_PATH =
  'M10 6 H34 Q38 6 38 10 L35 40 Q34 48 26 48 H18 Q10 48 9 40 L6 10 Q6 6 10 6 Z';
// Water with a gentle wave on top. It is wider than the glass by two waves: one
// for the different starting point of each glass, one to slide while looping.
const WAVE_LENGTH = 22;
const WATER_WIDTH = GLASS_WIDTH + 2 * WAVE_LENGTH;
const WATER_PATH = (() => {
  let path = 'M0 16';
  for (let x = 0; x < WATER_WIDTH; x += WAVE_LENGTH) {
    path += ` q${WAVE_LENGTH / 4} -1.4 ${WAVE_LENGTH / 2} 0 t${WAVE_LENGTH / 2} 0`;
  }
  return `${path} L${WATER_WIDTH} ${GLASS_HEIGHT} L0 ${GLASS_HEIGHT} Z`;
})();
const WAVE_DURATION = 2400;
// Everything around the glass, painted over the water so it stays inside.
const OUTSIDE_PATH = `M0 0 H${GLASS_WIDTH} V${GLASS_HEIGHT} H0 Z ${GLASS_PATH}`;
const PLUS_PATH = 'M16 28 H28 M22 22 V34';

type Props = {
  glasses: number;
  isDisabled: boolean;
  onAdd: () => void;
  onRemove: () => void;
};

type GlassProps = {
  isFull: boolean;
  // The shared wave, moved by a different amount in each glass.
  waveShift: Animated.AnimatedInterpolation<number>;
};

function Glass({ isFull, waveShift }: GlassProps) {
  if (!isFull) {
    return (
      <Svg
        height={GLASS_HEIGHT}
        viewBox={`0 0 ${GLASS_WIDTH} ${GLASS_HEIGHT}`}
        width={GLASS_WIDTH}
      >
        <Path
          d={GLASS_PATH}
          fill={colors.waterSoft}
          stroke={colors.waterMuted}
          strokeLinejoin="round"
          strokeWidth={2.5}
        />
        <Path
          d={PLUS_PATH}
          stroke={colors.water}
          strokeLinecap="round"
          strokeWidth={2.5}
        />
      </Svg>
    );
  }

  // As in the bottle: a moving water layer, then the glass drawn over it with
  // the space around it in the background colour.
  return (
    <View style={styles.glass}>
      <Svg
        height={GLASS_HEIGHT}
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${GLASS_WIDTH} ${GLASS_HEIGHT}`}
        width={GLASS_WIDTH}
      >
        <Path d={GLASS_PATH} fill={colors.waterSoft} />
      </Svg>
      <Animated.View
        style={[styles.water, { transform: [{ translateX: waveShift }] }]}
      >
        <Svg
          height={GLASS_HEIGHT}
          viewBox={`0 0 ${WATER_WIDTH} ${GLASS_HEIGHT}`}
          width={WATER_WIDTH}
        >
          <Path d={WATER_PATH} fill={colors.water} />
        </Svg>
      </Animated.View>
      <Svg
        height={GLASS_HEIGHT}
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${GLASS_WIDTH} ${GLASS_HEIGHT}`}
        width={GLASS_WIDTH}
      >
        <Path d={OUTSIDE_PATH} fill={colors.background} fillRule="evenodd" />
        <Rect
          fill={colors.surface}
          height={18}
          opacity={0.4}
          rx={1.5}
          width={3}
          x={12}
          y={20}
        />
        <Path
          d={GLASS_PATH}
          fill="none"
          stroke={colors.water}
          strokeLinejoin="round"
          strokeWidth={2.5}
        />
      </Svg>
    </View>
  );
}

// One glass for each 200 ml of the goal: an empty one, with a plus, adds a
// glass, and a full one takes one away. The count stops at the goal.
export default function GlassRow({ glasses, isDisabled, onAdd, onRemove }: Props) {
  const [wave] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(wave, {
        toValue: 1,
        duration: WAVE_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => loop.stop();
  }, [wave]);

  // Each glass starts at another point of the wave, so they do not move in step.
  const waveShifts = useMemo(
    () =>
      Array.from({ length: GOAL_GLASSES }, (_, index) => {
        const start = -((index * 7) % WAVE_LENGTH);

        return wave.interpolate({
          inputRange: [0, 1],
          outputRange: [start, start - WAVE_LENGTH],
        });
      }),
    [wave],
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        {Array.from({ length: GOAL_GLASSES }, (_, index) => {
          const isFull = index < glasses;

          return (
            <Pressable
              accessibilityHint={isFull ? 'Removes a glass' : 'Adds a glass'}
              accessibilityLabel={`Glass ${index + 1} of ${GOAL_GLASSES}, ${
                isFull ? 'full' : 'empty'
              }`}
              accessibilityRole="button"
              accessibilityState={{ disabled: isDisabled }}
              disabled={isDisabled}
              key={index}
              onPress={isFull ? onRemove : onAdd}
            >
              <Glass isFull={isFull} waveShift={waveShifts[index]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  glass: {
    width: GLASS_WIDTH,
    height: GLASS_HEIGHT,
    overflow: 'hidden',
  },
  water: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: GLASS_GAP,
    width: GLASSES_PER_ROW * GLASS_WIDTH + (GLASSES_PER_ROW - 1) * GLASS_GAP,
  },
});
