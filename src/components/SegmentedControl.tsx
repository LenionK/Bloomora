import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Pressable from './Pressable';
import { Text } from './AppText';
import { colors, durations, MIN_TOUCH_SIZE } from '../theme';
import { useReducedMotion } from './useReducedMotion';

const HEIGHT = 34;
// Taps just above and below the track still choose an option.
const OPTION_TAP_SPACE = {
  top: (MIN_TOUCH_SIZE - HEIGHT) / 2,
  bottom: (MIN_TOUCH_SIZE - HEIGHT) / 2,
};

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
  const isMotionReduced = useReducedMotion();

  // The indicator slides to the chosen option, or jumps with reduced motion.
  useEffect(() => {
    if (isMotionReduced) {
      position.setValue(selectedIndex);
      return;
    }
    Animated.timing(position, {
      toValue: selectedIndex,
      duration: durations.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isMotionReduced, position, selectedIndex]);

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
            hitSlop={OPTION_TAP_SPACE}
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
    color: colors.onColor,
  },
});
