import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MONTH_NAMES } from '../calendar/monthGrid';
import { colors } from '../theme';
import Logo from './Logo';

type Props = {
  year: number;
  month: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
};

export default function CalendarHeader({
  year,
  month,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: Props) {
  return (
    <>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Logo color={colors.primary} size={28} />
          <Text style={styles.logo}>Bloomora</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onToday}
          style={styles.todayButton}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </Pressable>
      </View>

      <Text style={styles.year}>{year}</Text>
      <View style={styles.monthRow}>
        <Text style={styles.month}>{MONTH_NAMES[month]}</Text>
        <View style={styles.arrows}>
          <Pressable
            accessibilityLabel="Previous month"
            accessibilityRole="button"
            onPress={onPreviousMonth}
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.surface} />
          </Pressable>
          <Pressable
            accessibilityLabel="Next month"
            accessibilityRole="button"
            onPress={onNextMonth}
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.surface} />
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  todayButtonText: {
    fontSize: 11,
    color: colors.surface,
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
    fontSize: 40,
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
