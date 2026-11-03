import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { activityColors } from '../theme';

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export default memo(function ColorPicker({ value, onChange }: Props) {
  return (
    <View accessibilityRole="radiogroup" style={styles.row}>
      {activityColors.map((color) => {
        const isSelected = color.value === value;

        return (
          <Pressable
            accessibilityLabel={color.name}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            key={color.value}
            onPress={() => onChange(color.value)}
            style={styles.option}
          >
            <View style={[styles.ring, isSelected && { borderColor: color.value }]}>
              <View style={[styles.swatch, { backgroundColor: color.value }]} />
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
  ring: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
  },
});
