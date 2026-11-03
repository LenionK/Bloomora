import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { CARD_GAP } from '../calendar/dayLayout';

const WIDTH = 1;
const GRADIENT_ID = 'gapLineColors';

type Props = {
  height: number;
  topColor: string;
  bottomColor: string;
};

// A rectangle and not an SVG line, because a line has no width for a gradient to fill.
export default function GapLine({ height, topColor, bottomColor }: Props) {
  const lineHeight = height + CARD_GAP;

  return (
    <View style={styles.line} testID="day-gap-line">
      <Svg height={lineHeight} width={WIDTH}>
        <Defs>
          <LinearGradient id={GRADIENT_ID} x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={topColor} />
            <Stop offset="1" stopColor={bottomColor} />
          </LinearGradient>
        </Defs>
        <Rect
          fill={`url(#${GRADIENT_ID})`}
          height={lineHeight}
          width={WIDTH}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  // Starts at the bottom of the card above, which ends a gap earlier than its slot.
  line: {
    position: 'absolute',
    top: -CARD_GAP,
  },
});
