import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildMonthGrid, WEEKDAY_LABELS } from '../calendar/monthGrid';
import { colors } from '../theme';

type Props = {
  year: number;
  month: number;
  today: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

export default function CalendarGrid({
  year,
  month,
  today,
  selectedDate,
  onSelectDate,
}: Props) {
  const cells = buildMonthGrid(year, month);
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

        return (
          <View key={`${year}-${month}-${index}`} style={styles.cell}>
            {day !== null && (
              <Pressable
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
                <Text style={[styles.dayText, isToday && styles.todayText]}>
                  {day}
                </Text>
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
  },
  cell: {
    width: '14.2857%',
    height: 56,
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
