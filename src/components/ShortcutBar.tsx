import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

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
              <Ionicons name={icon} size={28} color={colors.surface} />
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
    borderRadius: 24,
    backgroundColor: colors.surface,
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
