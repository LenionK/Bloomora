import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { DayWater } from '../stats/stats';
import { colors } from '../theme';
import { DAILY_GOAL_ML, formatLitres } from '../water/water';
import ChartDayLabels, {
  BAR_RADIUS,
  BARS_HEIGHT,
  MAX_DAYS_WITH_VALUES,
  VALUE_HEIGHT,
  weekdayOf,
} from './ChartDayLabels';

type Props = {
  days: DayWater[];
};

// Days at the goal are darker, and a dot marks days with nothing recorded. The
// scale leaves room above the goal line, and grows when a day goes past it.
// The chart keeps the same height for any number of days, so switching between
// them moves nothing around it.
export default function WaterChart({ days }: Props) {
  const isShort = days.length <= MAX_DAYS_WITH_VALUES;
  const scale = Math.max(
    DAILY_GOAL_ML * 1.25,
    ...days.map(({ millilitres }) => millilitres ?? 0),
  );
  const goalBottom = (DAILY_GOAL_ML / scale) * BARS_HEIGHT;

  return (
    <View>
      <Text style={styles.caption}>Goal {formatLitres(DAILY_GOAL_ML)}</Text>
      <View style={[styles.chart, !isShort && styles.denseChart]}>
        <View style={[styles.goalLine, { bottom: goalBottom }]} />
        {days.map(({ date, millilitres }) => (
          <View
            accessibilityLabel={`${weekdayOf(date)} ${date.getDate()}: ${
              millilitres === null ? 'not tracked' : formatLitres(millilitres)
            }`}
            accessible
            key={date.getTime()}
            style={styles.column}
          >
            {millilitres === null ? (
              <View style={[styles.untrackedDot, !isShort && styles.smallDot]} />
            ) : (
              <>
                {isShort && (
                  <Text style={styles.value}>{formatLitres(millilitres)}</Text>
                )}
                <View
                  style={[
                    styles.bar,
                    !isShort && styles.denseBar,
                    {
                      height: Math.max((millilitres / scale) * BARS_HEIGHT, 3),
                      backgroundColor:
                        millilitres >= DAILY_GOAL_ML
                          ? colors.water
                          : millilitres > 0
                            ? colors.waterMuted
                            : colors.waterTrack,
                    },
                  ]}
                />
              </>
            )}
          </View>
        ))}
      </View>
      <ChartDayLabels
        dates={days.map(({ date }) => date)}
        todayBackground={colors.waterSoft}
        todayColor={colors.water}
      />
    </View>
  );
}

// The key for the dots, kept apart from the chart so it never changes its height.
export function UntrackedLegend({ label = 'Not tracked' }: { label?: string }) {
  return (
    <View style={styles.legend}>
      <View style={styles.untrackedDot} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

export const chartStyles = StyleSheet.create({
  caption: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

const styles = StyleSheet.create({
  caption: {
    ...chartStyles.caption,
    color: colors.water,
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
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.waterMuted,
  },
  column: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  // On the card colour, so the goal line does not cross it.
  value: {
    alignSelf: 'center',
    marginBottom: 2,
    paddingHorizontal: 2,
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.water,
    backgroundColor: colors.surface,
  },
  bar: {
    borderRadius: BAR_RADIUS,
  },
  denseBar: {
    borderRadius: 2,
  },
  untrackedDot: {
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
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
