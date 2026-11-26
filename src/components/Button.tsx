import { StyleSheet } from 'react-native';
import { Text } from './AppText';
import Pressable from './Pressable';
import { colors, MIN_TOUCH_SIZE, spacing } from '../theme';

const HEIGHT = 44;
const COMPACT_HEIGHT = 32;

type Props = {
  label: string;
  onPress: () => void;
  // Filled for the main action, text for the one beside it, such as Cancel.
  variant?: 'filled' | 'text';
  color?: string;
  // Text drawn on the filled colour, for a white button on a coloured card.
  textColor?: string;
  // A smaller pill inside a card. Its tap area stays as large as a normal one.
  isCompact?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export default function Button({
  label,
  onPress,
  variant = 'filled',
  color = colors.primary,
  textColor = colors.onColor,
  isCompact = false,
  disabled = false,
  accessibilityLabel,
}: Props) {
  const height = isCompact ? COMPACT_HEIGHT : HEIGHT;
  const isFilled = variant === 'filled';
  const extraTapSpace = (MIN_TOUCH_SIZE - height) / 2;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={{ top: extraTapSpace, bottom: extraTapSpace }}
      onPress={onPress}
      style={[
        styles.button,
        { minHeight: height, borderRadius: height / 2 },
        isFilled && { backgroundColor: color },
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          isFilled ? styles.filledText : null,
          { color: isFilled ? textColor : color },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  filledText: {
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.4,
  },
});
