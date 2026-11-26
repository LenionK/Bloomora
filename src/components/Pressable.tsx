import {
  Pressable as NativePressable,
  PressableProps,
  PressableStateCallbackType,
  StyleSheet,
} from 'react-native';

// Every button of the app fades a little while pressed, so a tap always shows
// that it was felt.
export default function Pressable({
  style,
  disabled,
  ...props
}: PressableProps) {
  return (
    <NativePressable
      disabled={disabled}
      style={(state: PressableStateCallbackType) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && !disabled && styles.pressed,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.6,
  },
});
