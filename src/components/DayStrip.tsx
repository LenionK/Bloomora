import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { toDateKey } from '../calendar/activities';
import { MONTH_NAMES, WEEKDAY_LABELS } from '../calendar/monthGrid';
import { colors } from '../theme';

const DAYS_SHOWN = 60;

type Props = {
  firstDate: Date;
  value: Date;
  color: string;
  onChange: (date: Date) => void;
};

export default function DayStrip({ firstDate, value, color, onChange }: Props) {
  const selectedKey = toDateKey(value);
  const dates = Array.from(
    { length: DAYS_SHOWN },
    (_, offset) =>
      new Date(
        firstDate.getFullYear(),
        firstDate.getMonth(),
        firstDate.getDate() + offset,
      ),
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
    >
      {dates.map((date) => {
        const key = toDateKey(date);
        const isSelected = key === selectedKey;
        const weekday = WEEKDAY_LABELS[(date.getDay() + 6) % 7];

        return (
          <Pressable
            accessibilityLabel={`${weekday} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            key={key}
            onPress={() => onChange(date)}
            style={[styles.day, isSelected && { backgroundColor: color }]}
          >
            <Text style={[styles.weekday, isSelected && styles.selectedText]}>
              {weekday}
            </Text>
            <Text style={[styles.number, isSelected && styles.selectedText]}>
              {date.getDate()}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexGrow: 0,
    marginBottom: 12,
  },
  content: {
    gap: 8,
  },
  day: {
    width: 44,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.background,
  },
  weekday: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  number: {
    fontWeight: 'bold',
    color: colors.text,
  },
  selectedText: {
    color: colors.surface,
  },
});
