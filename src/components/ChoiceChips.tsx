import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Option = {
  value: number | null;
  label: string;
};

type Props = {
  label: string;
  options: Option[];
  value: number | null;
  onChange: (value: number | null) => void;
};

export default function ChoiceChips({ label, options, value, onChange }: Props) {
  return (
    <View accessibilityLabel={label} accessibilityRole="radiogroup" style={styles.row}>
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
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
  chip: {
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 18,
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
    color: colors.surface,
  },
});
