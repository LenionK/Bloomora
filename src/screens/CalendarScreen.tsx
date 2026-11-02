import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  buildMonthGrid,
  MONTH_NAMES,
  WEEKDAY_LABELS,
} from '../calendar/monthGrid';
import { colors } from '../theme';

type Props = {
  today?: Date;
};

export default function CalendarScreen({ today = new Date() }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const cells = buildMonthGrid(year, month);
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  function changeMonth(offset: number) {
    setVisibleMonth(new Date(year, month + offset, 1));
  }

  function goToToday() {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>✿ Bloomora</Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={goToToday}
          style={styles.todayButton}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </Pressable>
      </View>

      <Text style={styles.year}>{year}</Text>
      <View style={styles.monthRow}>
        <Text style={styles.month}>{MONTH_NAMES[month]}</Text>
        <View style={styles.arrows}>
          <Pressable
            accessibilityLabel="Previous month"
            accessibilityRole="button"
            onPress={() => changeMonth(-1)}
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.surface} />
          </Pressable>
          <Pressable
            accessibilityLabel="Next month"
            accessibilityRole="button"
            onPress={() => changeMonth(1)}
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.surface} />
          </Pressable>
        </View>
      </View>

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

          return (
            <View key={`${year}-${month}-${index}`} style={styles.cell}>
              {day !== null && (
                <View style={[styles.day, isToday && styles.today]}>
                  <Text style={[styles.dayText, isToday && styles.todayText]}>
                    {day}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 56,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  todayButtonText: {
    fontSize: 11,
    color: colors.surface,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  year: {
    marginTop: 24,
    color: colors.textSecondary,
  },
  month: {
    fontSize: 40,
    lineHeight: 44,
    includeFontPadding: false,
    fontWeight: 'bold',
    color: colors.text,
  },
  arrows: {
    flexDirection: 'row',
    gap: 8,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
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
});
