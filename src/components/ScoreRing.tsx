import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import Svg, { Circle } from 'react-native-svg';

const STROKE_WIDTH = 8;

type Props = {
  // A percentage, or null when there is nothing to count yet.
  score: number | null;
  color: string;
  trackColor: string;
  size: number;
};

export default function ScoreRing({ score, color, trackColor, size }: Props) {
  const center = size / 2;
  const radius = center - STROKE_WIDTH / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = {
    cx: center,
    cy: center,
    fill: 'none',
    r: radius,
    strokeWidth: STROKE_WIDTH,
  };

  return (
    <View style={[styles.ring, { width: size, height: size }]}>
      <Svg height={size} width={size}>
        <Circle {...arc} stroke={trackColor} />
        {score !== null && score > 0 && (
          <Circle
            {...arc}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - score / 100)}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
      </Svg>
      <Text style={[styles.text, { color, fontSize: size * 0.24 }]}>
        {score === null ? '–' : `${score}%`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    position: 'absolute',
    fontWeight: 'bold',
  },
});
