import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { WEEKDAY_LABELS } from '../calendar/monthGrid';
import { colors } from '../theme';

export const BARS_HEIGHT = 80;
// Room above the tallest bar for its value.
export const VALUE_HEIGHT = 16;
export const BAR_RADIUS = 6;
// With more days the bars are too thin for values and every day's label.
export const MAX_DAYS_WITH_VALUES = 7;
const LABEL_EVERY_DAYS = 5;
// Two lines of labels: weekday and day number.
const LABELS_HEIGHT = 34;

type Props = {
  dates: Date[];
  todayColor: string;
  todayBackground: string;
};

export function weekdayOf(date: Date): string {
  return WEEKDAY_LABELS[(date.getDay() + 6) % 7];
}

// The labels under the bars of a chart of days, with today on a coloured tile.
export default function ChartDayLabels({
  dates,
  todayColor,
  todayBackground,
}: Props) {
  const isShort = dates.length <= MAX_DAYS_WITH_VALUES;

  return (
    <View style={[styles.labels, !isShort && styles.dense]}>
      {dates.map((date, index) => {
        const isToday = index === dates.length - 1;
        const todayText = isToday && [styles.bold, { color: todayColor }];
        const isLabelled =
          isShort || (dates.length - 1 - index) % LABEL_EVERY_DAYS === 0;

        return (
          <View
            key={date.getTime()}
            style={[
              styles.column,
              isToday && isShort && { backgroundColor: todayBackground },
            ]}
          >
            {isShort && (
              <Text style={[styles.weekday, todayText]}>{weekdayOf(date)}</Text>
            )}
            {isLabelled && (
              <Text numberOfLines={1} style={[styles.dayNumber, todayText]}>
                {date.getDate()}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    gap: 8,
    height: LABELS_HEIGHT,
    marginTop: 6,
  },
  dense: {
    gap: 2,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    overflow: 'visible',
  },
  weekday: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  dayNumber: {
    width: 24,
    fontSize: 11,
    textAlign: 'center',
    color: colors.text,
  },
  bold: {
    fontWeight: 'bold',
  },
});
