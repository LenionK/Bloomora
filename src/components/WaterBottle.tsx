import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, {
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { colors } from '../theme';

// A sport bottle with straight sides and a flip lid.
const BOTTLE_PATH =
  'M54 74 H146 Q160 74 160 88 V268 Q160 288 140 288 H60 Q40 288 40 268 V88 Q40 74 54 74 Z';
const BOTTOM = 288;
// The goal fills the bottle up to just under the lid.
const FULL_LEVEL = 90;
const FILL_RANGE = BOTTOM - FULL_LEVEL;
const VIEW_WIDTH = 200;
const VIEW_HEIGHT = 300;
// The middle of the bottle, where the percentage goes.
const PERCENT_MIDDLE = 189;
const PERCENT_FONT_SIZE = 32;
const REFLECTION_TOP = 100;
const REFLECTION_BOTTOM = 270;
const MARKS = [0.25, 0.5, 0.75, 1];
const MARK_LITRES = ['0.5', '1', '1.5', '2'];

const WAVE_LENGTH = 60;
const WAVE_HEIGHT = 5;
const BACK_WAVE_RISE = 4;
const WAVE_DURATION = 3000;
const FILL_DURATION = 500;
// The water layer, in drawing units: a wave on top of the full height of water.
const WATER_HEIGHT = FILL_RANGE + WAVE_HEIGHT + BACK_WAVE_RISE;
const WAVE_VIEW_WIDTH = VIEW_WIDTH + WAVE_LENGTH;
const WATER_TOP = FULL_LEVEL - WAVE_HEIGHT - BACK_WAVE_RISE;
// The water is cut to a box just around the bottle, so nothing of it can show
// past the edges of the drawing when the level goes down.
const BOX = { left: 38, right: 162, top: WATER_TOP - 2, bottom: BOTTOM + 2 };

// Bubbles rise inside the water layer, so they never show above the water.
// Each has its own speed and start, in drawing units and milliseconds.
const BUBBLES = [
  { x: 128, r: 3, duration: 3600, delay: 0 },
  { x: 140, r: 2.5, duration: 4200, delay: 1400 },
  { x: 92, r: 3.5, duration: 3900, delay: 700 },
  { x: 116, r: 4.5, duration: 4600, delay: 2100 },
  { x: 80, r: 2, duration: 3300, delay: 2800 },
];
// Where bubbles stop, below the surface so they fade before reaching it.
const BUBBLE_TOP = WAVE_HEIGHT + BACK_WAVE_RISE + 10;

// Waves from left to right, filled down to the bottom of the layer. Moving
// them by one wave length looks the same, so they can loop without a jump.
const WAVE_PATH = (() => {
  let path = `M0 ${WAVE_HEIGHT}`;
  for (let x = 0; x < WAVE_VIEW_WIDTH; x += WAVE_LENGTH) {
    path += ` q${WAVE_LENGTH / 4} ${-WAVE_HEIGHT} ${WAVE_LENGTH / 2} 0 t${WAVE_LENGTH / 2} 0`;
  }
  return `${path} L${WAVE_VIEW_WIDTH} ${WATER_HEIGHT} L0 ${WATER_HEIGHT} Z`;
})();

// Everything around the bottle, painted over the water so it stays inside.
const OUTSIDE_PATH = `M0 0 H${VIEW_WIDTH} V${VIEW_HEIGHT} H0 Z ${BOTTLE_PATH}`;

type Props = {
  // From 0 to 1.
  share: number;
  // The height of the drawing; its width is two thirds of it.
  size: number;
};

function levelOf(share: number): number {
  return BOTTOM - share * FILL_RANGE;
}

function Wave({ color, width, height }: { color: string; width: number; height: number }) {
  return (
    <Svg
      height={height}
      viewBox={`0 0 ${WAVE_VIEW_WIDTH} ${WATER_HEIGHT}`}
      width={width}
    >
      <Path d={WAVE_PATH} fill={color} />
    </Svg>
  );
}

// Level and waves move with native animations, which stay smooth because they
// do not wait for JavaScript at every frame.
export default function WaterBottle({ share, size }: Props) {
  // Whole pixels, so the layers line up exactly.
  const height = Math.round(size);
  const scale = height / VIEW_HEIGHT;
  const width = Math.round(VIEW_WIDTH * scale);
  const [animatedShare] = useState(() => new Animated.Value(share));
  const [wave] = useState(() => new Animated.Value(0));
  const [bubbles] = useState(() => BUBBLES.map(() => new Animated.Value(0)));
  const level = levelOf(share);
  const percent = Math.round(share * 100);
  const isPercentUnderWater = level < PERCENT_MIDDLE;

  useEffect(() => {
    Animated.timing(animatedShare, {
      toValue: share,
      duration: FILL_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animatedShare, share]);

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

  useEffect(() => {
    const rising = Animated.parallel(
      BUBBLES.map(({ duration, delay }, index) =>
        Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.timing(bubbles[index], {
              toValue: 1,
              duration,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ),
        ]),
      ),
    );

    rising.start();
    return () => rising.stop();
  }, [bubbles]);

  // An empty bottle hides the waves too, which would otherwise show at the bottom.
  const waterShift = animatedShare.interpolate({
    inputRange: [0, 0.001, 1],
    outputRange: [WATER_HEIGHT * scale, FILL_RANGE * scale, 0],
  });
  // The two waves run in opposite directions, so the surface seems to move.
  const frontWaveShift = wave.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -WAVE_LENGTH * scale],
  });
  const backWaveShift = wave.interpolate({
    inputRange: [0, 1],
    outputRange: [-WAVE_LENGTH * scale, 0],
  });
  const waveSize = {
    width: WAVE_VIEW_WIDTH * scale,
    height: WATER_HEIGHT * scale,
  };

  return (
    <View
      accessibilityLabel={`Bottle ${percent}% full`}
      accessible
      style={[styles.bottle, { width, height }]}
    >
      <Svg
        height={height}
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        width={width}
      >
        <Path d={BOTTLE_PATH} fill={colors.waterSoft} />
      </Svg>

      <View
        style={[
          styles.waterBox,
          {
            left: BOX.left * scale,
            top: BOX.top * scale,
            width: (BOX.right - BOX.left) * scale,
            height: (BOX.bottom - BOX.top) * scale,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.water,
            {
              left: -BOX.left * scale,
              top: (WATER_TOP - BOX.top) * scale,
              transform: [{ translateY: waterShift }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ translateX: backWaveShift }] }}>
            <Wave color={colors.waterMuted} {...waveSize} />
          </Animated.View>
          <Animated.View
            style={[
              styles.frontWave,
              {
                top: BACK_WAVE_RISE * scale,
                transform: [{ translateX: frontWaveShift }],
              },
            ]}
          >
            <Wave color={colors.water} {...waveSize} />
          </Animated.View>
          {BUBBLES.map(({ x, r }, index) => (
            <Animated.View
              key={x}
              style={[
                styles.bubble,
                {
                  left: (x - r) * scale,
                  top: (WATER_HEIGHT - 2 * r) * scale,
                  width: 2 * r * scale,
                  height: 2 * r * scale,
                  borderRadius: r * scale,
                  opacity: bubbles[index].interpolate({
                    inputRange: [0, 0.1, 0.8, 1],
                    outputRange: [0, 0.45, 0.45, 0],
                  }),
                  transform: [
                    {
                      translateY: bubbles[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (BUBBLE_TOP - WATER_HEIGHT) * scale],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>
      </View>

      <Svg
        height={height}
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        width={width}
      >
        <Path d={OUTSIDE_PATH} fill={colors.background} fillRule="evenodd" />

        {/* A shine on the glass itself, so it stays put whatever the level. */}
        <Rect
          fill={colors.surface}
          height={REFLECTION_BOTTOM - REFLECTION_TOP}
          opacity={0.55}
          rx={3.5}
          width={7}
          x={146}
          y={REFLECTION_TOP}
        />

        {/* Inside the bottle: white once the water covers a mark, blue above it. */}
        {MARKS.map((markShare, index) => {
          const y = levelOf(markShare);
          // At the mark's own level the water covers it too, as at 100%.
          const isCovered = level <= y;
          const color = isCovered ? colors.surface : colors.water;

          return (
            <G key={markShare}>
              <Line
                opacity={isCovered ? 0.85 : 0.6}
                stroke={color}
                strokeLinecap="round"
                strokeWidth={2.5}
                x1={40}
                x2={56}
                y1={y}
                y2={y}
              />
              <SvgText
                fill={color}
                fontSize={12}
                fontWeight={markShare === 1 ? 'bold' : 'normal'}
                opacity={isCovered ? 0.9 : 0.75}
                x={60}
                y={y + 4.5}
              >
                {MARK_LITRES[index]}
              </SvgText>
            </G>
          );
        })}

        <Path
          d={BOTTLE_PATH}
          fill="none"
          stroke={colors.water}
          strokeLinejoin="round"
          strokeWidth={4}
        />
        <Rect
          fill={colors.waterDark}
          height={32}
          rx={12}
          width={104}
          x={48}
          y={44}
        />
        <Rect
          fill={colors.waterDark}
          height={20}
          rx={6}
          width={22}
          x={112}
          y={28}
        />
        <Rect
          fill={colors.waterMuted}
          height={6}
          opacity={0.6}
          rx={3}
          width={40}
          x={60}
          y={54}
        />
      </Svg>

      {/* A plain text box across the whole width, so it is centred on the
          bottle. The glow in the opposite colour keeps it readable while the
          surface of the water crosses it. */}
      <Text
        style={[
          styles.percent,
          {
            top: (PERCENT_MIDDLE - PERCENT_FONT_SIZE * 0.65) * scale,
            fontSize: PERCENT_FONT_SIZE * scale,
            color: isPercentUnderWater ? colors.surface : colors.water,
            textShadowColor: isPercentUnderWater
              ? colors.waterDark
              : colors.waterSoft,
          },
        ]}
      >
        {percent}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bottle: {
    overflow: 'hidden',
  },
  waterBox: {
    position: 'absolute',
    overflow: 'hidden',
  },
  water: {
    position: 'absolute',
  },
  frontWave: {
    position: 'absolute',
    left: 0,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: colors.surface,
  },
  percent: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
