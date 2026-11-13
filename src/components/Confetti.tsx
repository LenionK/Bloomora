import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { activityColors, colors } from '../theme';

const PIECES = 48;
const MIN_DURATION = 2200;
const EXTRA_DURATION = 1200;
const MAX_DELAY = 500;
const PIECE_COLORS = [
  colors.water,
  colors.waterMuted,
  colors.primary,
  colors.streak,
  ...activityColors.map(({ value }) => value),
];
// The golden ratio spreads the pieces evenly without random numbers, so every
// celebration looks lively and the same pieces fall in the same way each time.
const GOLDEN = 0.618034;

type Props = {
  onDone: () => void;
};

function spread(index: number, seed: number): number {
  return ((index + 1) * GOLDEN * seed) % 1;
}

// Pieces of paper falling over the whole screen, without catching any touch.
export default function Confetti({ onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const [pieces] = useState(() =>
    Array.from({ length: PIECES }, (_, index) => ({
      progress: new Animated.Value(0),
      left: spread(index, 1) * width,
      drift: (spread(index, 3) - 0.5) * 120,
      spin: (spread(index, 5) - 0.5) * 1440,
      duration: MIN_DURATION + spread(index, 7) * EXTRA_DURATION,
      delay: spread(index, 11) * MAX_DELAY,
      color: PIECE_COLORS[index % PIECE_COLORS.length],
      isRound: index % 4 === 0,
    })),
  );

  useEffect(() => {
    const fall = Animated.parallel(
      pieces.map(({ progress, duration, delay }) =>
        Animated.timing(progress, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    );

    fall.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => fall.stop();
  }, [pieces, onDone]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="confetti">
      {pieces.map(({ progress, left, drift, spin, color, isRound }, index) => (
        <Animated.View
          key={index}
          style={[
            styles.piece,
            isRound && styles.round,
            {
              left,
              backgroundColor: color,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-24, height + 24],
                  }),
                },
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, drift],
                  }),
                },
                {
                  rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${spin}deg`],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    width: 8,
    height: 13,
    borderRadius: 2,
  },
  round: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
});
