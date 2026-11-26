import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Pressable from './Pressable';
import { Text } from './AppText';
import { useStrings } from '../i18n/LanguageContext';
import { colors, fontSizes } from '../theme';
import Logo from './Logo';

// The arrows look 40 points wide, and take taps across 48.
const ARROW_TAP_SPACE = 4;

type Props = {
  year: number;
  month: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export default function CalendarHeader({
  year,
  month,
  onPreviousMonth,
  onNextMonth,
}: Props) {
  const t = useStrings();

  return (
    <>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Logo color={colors.primary} size={28} />
          <Text style={styles.logo}>Bloomora</Text>
        </View>
      </View>

      <Text style={styles.year}>{year}</Text>
      <View style={styles.monthRow}>
        <Text accessibilityRole="header" style={styles.month}>
          {t.dates.months[month]}
        </Text>
        <View style={styles.arrows}>
          <Pressable
            accessibilityLabel={t.calendar.previousMonth}
            accessibilityRole="button"
            hitSlop={ARROW_TAP_SPACE}
            onPress={onPreviousMonth}
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.onColor} />
          </Pressable>
          <Pressable
            accessibilityLabel={t.calendar.nextMonth}
            accessibilityRole="button"
            hitSlop={ARROW_TAP_SPACE}
            onPress={onNextMonth}
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.onColor} />
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: fontSizes.title,
    fontWeight: 'bold',
    color: colors.text,
  },
  year: {
    marginTop: 24,
    color: colors.textSecondary,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  month: {
    fontSize: fontSizes.display,
    lineHeight: 44,
    includeFontPadding: false,
    fontWeight: 'bold',
    color: colors.text,
  },
  arrows: {
    flexDirection: 'row',
    gap: 8,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
