import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Pressable from './Pressable';
import { Text } from './AppText';
import { useStrings } from '../i18n/LanguageContext';
import { colors, MIN_TOUCH_SIZE } from '../theme';

type Props = {
  value: number[];
  color: string;
  onChange: (days: number[]) => void;
};

export default memo(function RepeatPicker({ value, color, onChange }: Props) {
  const t = useStrings();

  function toggleDay(day: number) {
    const days = value.includes(day)
      ? value.filter((selectedDay) => selectedDay !== day)
      : [...value, day];

    onChange(days.sort((a, b) => a - b));
  }

  return (
    <View style={styles.row}>
      {t.dates.weekdaysShort.map((label, day) => {
        const isSelected = value.includes(day);

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            key={day}
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
    height: MIN_TOUCH_SIZE,
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
    color: colors.onColor,
  },
});
