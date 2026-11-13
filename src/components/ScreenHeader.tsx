import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  title: string;
  onBack: () => void;
  // Shows an info button on the right when given.
  onInfo?: () => void;
  isInfoOpen?: boolean;
};

export default function ScreenHeader({
  title,
  onBack,
  onInfo,
  isInfoOpen = false,
}: Props) {
  return (
    <View style={styles.header}>
      {/* Centred on the whole width, so the arrow does not push it aside. */}
      <Text
        accessibilityRole="header"
        pointerEvents="none"
        style={styles.title}
      >
        {title}
      </Text>
      <Pressable
        accessibilityLabel="Back to calendar"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onBack}
        style={[styles.button, styles.backButton]}
      >
        <Ionicons name="chevron-back" size={28} color={colors.text} />
      </Pressable>
      {onInfo && (
        <Pressable
          accessibilityLabel={`About ${title.toLowerCase()}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: isInfoOpen }}
          hitSlop={8}
          onPress={onInfo}
          style={[styles.button, styles.infoButton]}
        >
          <Ionicons
            name={isInfoOpen ? 'information-circle' : 'information-circle-outline'}
            size={26}
            color={colors.text}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    marginLeft: -8,
  },
  infoButton: {
    marginRight: -8,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
});
