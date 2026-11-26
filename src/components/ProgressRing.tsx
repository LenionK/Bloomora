import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import Svg, { Circle } from 'react-native-svg';
import { useStrings } from '../i18n/LanguageContext';
import { colors } from '../theme';

const SIZE = 60;
const STROKE_WIDTH = 6;
const CENTER = SIZE / 2;
const RADIUS = CENTER - STROKE_WIDTH / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = {
  completed: number;
  total: number;
};

export default function ProgressRing({ completed, total }: Props) {
  const t = useStrings();
  const arc = {
    cx: CENTER,
    cy: CENTER,
    fill: 'none',
    r: RADIUS,
    strokeWidth: STROKE_WIDTH,
  };

  return (
    <View
      accessibilityLabel={t.day.completedOf(completed, total)}
      accessible
      style={styles.ring}
    >
      <Svg height={SIZE} width={SIZE}>
        <Circle {...arc} stroke={colors.primaryContainer} />
        {completed > 0 && (
          <Circle
            {...arc}
            stroke={colors.primary}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - completed / total)}
            strokeLinecap="round"
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        )}
      </Svg>
      <Text style={styles.text}>
        {completed}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    position: 'absolute',
    fontWeight: 'bold',
    color: colors.text,
  },
});
