import { ReactNode } from 'react';
import { Modal, Pressable as NativePressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { colors, fontSizes, radii, spacing } from '../theme';
import Logo from './Logo';

type Props = {
  title: string;
  // The colour of the title and the logo: the activity's, or the primary.
  color: string;
  subtitle?: ReactNode;
  titleLines?: number;
  onClose: () => void;
  // A tap outside the fields, on the card or around it, such as to close the keyboard.
  onBackgroundPress?: () => void;
  backgroundTestID?: string;
  // The buttons at the bottom, from the least to the most important.
  actions: ReactNode;
  children?: ReactNode;
};

// The frame shared by every popup: a dimmed page, a card with the title and
// the logo, the content, and the buttons at the bottom right.
export default function ModalShell({
  title,
  color,
  subtitle,
  titleLines,
  onClose,
  onBackgroundPress,
  backgroundTestID,
  actions,
  children,
}: Props) {
  return (
    <Modal onRequestClose={onClose} transparent>
      {/* Not the faded Pressable: the whole popup would fade on each tap. */}
      <NativePressable
        accessible={false}
        disabled={!onBackgroundPress}
        onPress={onBackgroundPress}
        style={styles.backdrop}
        testID={backgroundTestID}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titles}>
              <Text
                accessibilityRole="header"
                numberOfLines={titleLines}
                style={[styles.title, { color }]}
              >
                {title}
              </Text>
              {subtitle !== undefined && (
                <Text style={styles.subtitle}>{subtitle}</Text>
              )}
            </View>
            <Logo color={color} size={44} />
          </View>
          {children}
          <View style={styles.actions}>{actions}</View>
        </View>
      </NativePressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.backdrop,
  },
  card: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titles: {
    flex: 1,
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
