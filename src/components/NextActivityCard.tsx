import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Occurrence } from '../calendar/activities';
import { MONTH_NAMES, WEEKDAY_LABELS } from '../calendar/monthGrid';
import { formatTime } from '../calendar/time';
import { colors } from '../theme';
import Logo from './Logo';

type Props = {
  occurrence: Occurrence | null;
  onPress: (date: Date) => void;
};

export default function NextActivityCard({ occurrence, onPress }: Props) {
  if (!occurrence) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Text style={styles.emptyText}>No upcoming activities</Text>
      </View>
    );
  }

  const { activity, start, end } = occurrence;
  const weekday = WEEKDAY_LABELS[(start.getDay() + 6) % 7];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(start)}
      style={[styles.card, { backgroundColor: activity.color }]}
    >
      <Logo color={colors.surface} size={40} />
      <View style={styles.details}>
        <Text style={styles.label}>
          Next · {weekday} {start.getDate()} {MONTH_NAMES[start.getMonth()]}
        </Text>
        <Text numberOfLines={1} style={styles.title}>
          {activity.title}
        </Text>
        <Text style={styles.label}>
          {formatTime(start)}–{formatTime(end)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 96,
    padding: 16,
    borderRadius: 24,
  },
  emptyCard: {
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  details: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: colors.surface,
  },
  title: {
    marginVertical: 2,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.surface,
  },
});
