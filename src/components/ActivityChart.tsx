import { StyleSheet, Text, View } from 'react-native';
import { DayActivities } from '../stats/stats';
import { colors } from '../theme';
import ChartDayLabels, {
  BAR_RADIUS,
  BARS_HEIGHT,
  MAX_DAYS_WITH_VALUES,
  VALUE_HEIGHT,
  weekdayOf,
} from './ChartDayLabels';
import { chartStyles } from './WaterChart';

// The scale fits at least this many activities, so one activity is not a full bar.
const MIN_SCALE = 3;

type Props = {
  days: DayActivities[];
};

// Each bar is the activities planned that day, with the done ones filled from
// the bottom. A dot marks days with nothing planned. It has the same height as
// the water chart, so switching between them moves nothing.
export default function ActivityChart({ days }: Props) {
  const isShort = days.length <= MAX_DAYS_WITH_VALUES;
  const scale = Math.max(MIN_SCALE, ...days.map(({ planned }) => planned));

  return (
    <View>
      <Text style={styles.caption}>Done out of planned</Text>
      <View style={[styles.chart, !isShort && styles.denseChart]}>
        {days.map(({ date, done, planned }) => (
          <View
            accessibilityLabel={`${weekdayOf(date)} ${date.getDate()}: ${
              planned === 0 ? 'nothing planned' : `${done} of ${planned} done`
            }`}
            accessible
            key={date.getTime()}
            style={styles.column}
          >
            {planned === 0 ? (
              <View style={[styles.emptyDot, !isShort && styles.smallDot]} />
            ) : (
              <>
                {isShort && (
                  <Text style={styles.value}>
                    {done}/{planned}
                  </Text>
                )}
                <View
                  style={[
                    styles.bar,
                    !isShort && styles.denseBar,
                    { height: (planned / scale) * BARS_HEIGHT },
                  ]}
                >
                  <View style={[styles.done, { flex: done }]} />
                  <View style={{ flex: planned - done }} />
                </View>
              </>
            )}
          </View>
        ))}
      </View>
      <ChartDayLabels
        dates={days.map(({ date }) => date)}
        todayBackground={colors.primarySoft}
        todayColor={colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    ...chartStyles.caption,
    color: colors.primary,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: BARS_HEIGHT + VALUE_HEIGHT,
  },
  denseChart: {
    gap: 2,
  },
  column: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  value: {
    alignSelf: 'center',
    marginBottom: 2,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
  },
  // The part not done shows the track colour, the done part fills from below.
  bar: {
    flexDirection: 'column-reverse',
    overflow: 'hidden',
    borderRadius: BAR_RADIUS,
    backgroundColor: colors.primaryTrack,
  },
  denseBar: {
    borderRadius: 2,
  },
  done: {
    backgroundColor: colors.primary,
  },
  emptyDot: {
    alignSelf: 'center',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral,
  },
  smallDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
