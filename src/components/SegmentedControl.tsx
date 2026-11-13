import { useEffect, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme';

const HEIGHT = 34;

type Option<T> = {
  value: T;
  label: string;
};

type Props<T> = {
  label: string;
  options: Option<T>[];
  value: T;
  color: string;
  // White on the page background, grey inside a white card.
  trackColor?: string;
  style?: ViewStyle;
  onChange: (value: T) => void;
};

// Options side by side in one track as tall as the chosen one, whose colour
// slides to the option picked.
export default function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  color,
  trackColor = colors.background,
  style,
  onChange,
}: Props<T>) {
  const [width, setWidth] = useState(0);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );
  const [position] = useState(() => new Animated.Value(selectedIndex));
  const segmentWidth = width / options.length;

  useEffect(() => {
    Animated.spring(position, {
      toValue: selectedIndex,
      speed: 20,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  }, [position, selectedIndex]);

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="radiogroup"
      onLayout={(event: LayoutChangeEvent) =>
        setWidth(event.nativeEvent.layout.width)
      }
      style={[styles.track, { backgroundColor: trackColor }, style]}
    >
      {width > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: segmentWidth,
              backgroundColor: color,
              transform: [
                {
                  translateX: position.interpolate({
                    inputRange: [0, Math.max(options.length - 1, 1)],
                    outputRange: [
                      0,
                      segmentWidth * Math.max(options.length - 1, 1),
                    ],
                  }),
                },
              ],
            },
          ]}
        />
      )}
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            style={styles.option}
          >
            <Text style={[styles.text, isSelected && styles.selectedText]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.text,
  },
  selectedText: {
    fontWeight: 'bold',
    color: colors.surface,
  },
});
