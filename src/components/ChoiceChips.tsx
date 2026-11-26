import { StyleSheet, View } from 'react-native';
import Pressable from './Pressable';
import { Text } from './AppText';
import { colors, MIN_TOUCH_SIZE } from '../theme';

const CHIP_HEIGHT = 36;
// Taps above and below the chip count too, up to 48 points.
const CHIP_TAP_SPACE = {
  top: (MIN_TOUCH_SIZE - CHIP_HEIGHT) / 2,
  bottom: (MIN_TOUCH_SIZE - CHIP_HEIGHT) / 2,
};

type Option<T> = {
  value: T;
  label: string;
};

type Props<T> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export default function ChoiceChips<T extends string | number | null>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View accessibilityLabel={label} accessibilityRole="radiogroup" style={styles.row}>
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            hitSlop={CHIP_TAP_SPACE}
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            style={[styles.chip, isSelected && styles.selectedChip]}
          >
            <Text style={[styles.chipText, isSelected && styles.selectedText]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // A larger phone text makes the chip grow instead of cutting its label.
  chip: {
    minHeight: CHIP_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: CHIP_HEIGHT / 2,
    backgroundColor: colors.background,
  },
  selectedChip: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.text,
  },
  selectedText: {
    fontWeight: 'bold',
    color: colors.onColor,
  },
});
