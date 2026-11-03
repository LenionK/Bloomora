import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Activity, getDaysWithActivities } from '../calendar/activities';
import { buildMonthGrid, WEEKDAY_LABELS } from '../calendar/monthGrid';
import { colors } from '../theme';

const CELL_HEIGHT = 56;
// The weekday row plus the 6 weeks of the longest months, so that what is below
// the calendar stays in the same place in every month.
const MAX_ROWS = 7;

type Props = {
  year: number;
  month: number;
  today: Date;
  selectedDate: Date;
  activities: Activity[];
  onSelectDate: (date: Date) => void;
};

export default function CalendarGrid({
  year,
  month,
  today,
  selectedDate,
  activities,
  onSelectDate,
}: Props) {
  const cells = buildMonthGrid(year, month);
  const daysWithActivities = useMemo(
    () => getDaysWithActivities(activities, year, month),
    [activities, year, month],
  );
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  return (
    <View style={styles.grid}>
      {WEEKDAY_LABELS.map((label, index) => (
        <View key={index} style={styles.cell}>
          <Text style={[styles.weekday, label === 'Sun' && styles.sunday]}>
            {label}
          </Text>
        </View>
      ))}

      {cells.map((day, index) => {
        const isToday = isCurrentMonth && day === today.getDate();
        const isSelected =
          selectedDate.getFullYear() === year &&
          selectedDate.getMonth() === month &&
          selectedDate.getDate() === day;
        const hasActivities = day !== null && daysWithActivities.has(day);

        return (
          <View key={`${year}-${month}-${index}`} style={styles.cell}>
            {day !== null && (
              <Pressable
                accessibilityHint={hasActivities ? 'Has activities' : undefined}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelectDate(new Date(year, month, day))}
                style={[
                  styles.day,
                  isToday && styles.today,
                  isSelected && !isToday && styles.selected,
                ]}
              >
                {isSelected && isToday && (
                  <View style={styles.todaySelectedRing} />
                )}
                <View>
                  <Text style={[styles.dayText, isToday && styles.todayText]}>
                    {day}
                  </Text>
                  {hasActivities && (
                    <View
                      style={[styles.activityDot, isToday && styles.todayDot]}
                      testID={`activity-dot-${day}`}
                    />
                  )}
                </View>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    minHeight: CELL_HEIGHT * MAX_ROWS,
  },
  cell: {
    width: '14.2857%',
    height: CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekday: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  sunday: {
    color: colors.primary,
  },
  day: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    backgroundColor: colors.primary,
  },
  dayText: {
    color: colors.text,
  },
  todayText: {
    fontWeight: 'bold',
    color: colors.surface,
  },
  selected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  activityDot: {
    position: 'absolute',
    top: -3,
    alignSelf: 'center',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  todayDot: {
    backgroundColor: colors.surface,
  },
  todaySelectedRing: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
