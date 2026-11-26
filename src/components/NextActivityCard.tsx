import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { Occurrence } from '../calendar/activities';
import { formatDayMonth, shortWeekday } from '../i18n/dates';
import { useStrings } from '../i18n/LanguageContext';
import { formatTime } from '../calendar/time';
import { cardShadow, colors } from '../theme';
import Logo from './Logo';

type Props = {
  occurrence: Occurrence | null;
  onPress: (date: Date) => void;
  onPlan: () => void;
};

export default function NextActivityCard({ occurrence, onPress, onPlan }: Props) {
  const t = useStrings();

  // With nothing planned, the card invites to plan instead of only saying so.
  if (!occurrence) {
    return (
      <Pressable
        accessibilityLabel={t.nextActivity.plan}
        accessibilityRole="button"
        onPress={onPlan}
        style={[styles.card, styles.emptyCard]}
      >
        <Logo color={colors.surface} size={40} />
        <View style={styles.details}>
          <Text style={styles.emptyTitle}>{t.nextActivity.emptyTitle}</Text>
          <Text style={styles.emptyText}>{t.nextActivity.emptyText}</Text>
        </View>
      </Pressable>
    );
  }

  const { activity, start, end } = occurrence;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(start)}
      style={[styles.card, { backgroundColor: activity.color }]}
    >
      <Logo color={colors.surface} size={40} />
      <View style={styles.details}>
        <Text style={styles.label}>
          {t.nextActivity.next} · {shortWeekday(start, t)} {formatDayMonth(start, t)}
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
    ...cardShadow,
  },
  emptyCard: {
    backgroundColor: colors.primary,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.surface,
  },
  emptyText: {
    marginTop: 2,
    color: colors.surface,
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
