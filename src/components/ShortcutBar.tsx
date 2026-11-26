import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Pressable from './Pressable';
import { cardShadow, colors, radii } from '../theme';

type Shortcut = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  isMain?: boolean;
  onPress: () => void;
};

type Props = {
  shortcuts: Shortcut[];
};

export default function ShortcutBar({ shortcuts }: Props) {
  return (
    <View style={styles.bar}>
      {shortcuts.map(({ label, icon, isMain, onPress }) => (
        <Pressable
          accessibilityLabel={label}
          accessibilityRole="button"
          key={label}
          onPress={onPress}
          style={styles.shortcut}
        >
          {isMain ? (
            <View style={styles.mainButton}>
              <Ionicons name={icon} size={28} color={colors.onColor} />
            </View>
          ) : (
            <Ionicons name={icon} size={26} color={colors.primary} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  shortcut: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
