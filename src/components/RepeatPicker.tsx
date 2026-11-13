import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { WEEKDAY_LABELS } from '../calendar/monthGrid';
import { colors } from '../theme';

type Props = {
  value: number[];
  color: string;
  onChange: (days: number[]) => void;
};

export default memo(function RepeatPicker({ value, color, onChange }: Props) {
  function toggleDay(day: number) {
    const days = value.includes(day)
      ? value.filter((selectedDay) => selectedDay !== day)
      : [...value, day];

    onChange(days.sort((a, b) => a - b));
  }

  return (
    <View style={styles.row}>
      {WEEKDAY_LABELS.map((label, day) => {
        const isSelected = value.includes(day);

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            key={label}
            onPress={() => toggleDay(day)}
            style={styles.option}
          >
            <View style={[styles.day, isSelected && { backgroundColor: color }]}>
              <Text style={[styles.dayText, isSelected && styles.selectedText]}>
                {label.charAt(0)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    height: 44,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dayText: {
    color: colors.text,
  },
  selectedText: {
    fontWeight: 'bold',
    color: colors.surface,
  },
});
