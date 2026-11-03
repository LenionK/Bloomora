import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Activity,
  CleanupPeriod,
  getCleanupCutoff,
  getOldActivities,
} from '../calendar/activities';
import ConfirmModal from '../components/ConfirmModal';
import { getDatabaseSize } from '../storage/activityDatabase';
import { formatBytes } from '../storage/formatBytes';
import { colors } from '../theme';

const CLEANUP_OPTIONS: { period: CleanupPeriod; label: string }[] = [
  { period: 'week', label: 'Older than a week' },
  { period: 'month', label: 'Older than a month' },
  { period: 'year', label: 'Older than a year' },
];

type Props = {
  today: Date;
  activities: Activity[];
  onBack: () => void;
  onDeleteOld: (activities: Activity[]) => void;
};

export default function SettingsScreen({
  today,
  activities,
  onBack,
  onDeleteOld,
}: Props) {
  const [databaseSize, setDatabaseSize] = useState<number | null>(null);
  const [activitiesToDelete, setActivitiesToDelete] = useState<
    Activity[] | null
  >(null);

  useEffect(() => {
    getDatabaseSize().then(setDatabaseSize).catch(console.error);
  }, [activities]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onBack();
        return true;
      },
    );

    return () => subscription.remove();
  }, [onBack]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Back to calendar"
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
          <Text style={styles.backText}>Calendar</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionTitle}>Storage</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowText}>Space used</Text>
          <Text style={styles.rowValue}>
            {databaseSize === null ? '…' : formatBytes(databaseSize)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>Activities</Text>
          <Text style={styles.rowValue}>{activities.length} saved</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Delete old activities</Text>
      <View style={styles.card}>
        {CLEANUP_OPTIONS.map(({ period, label }) => {
          const oldActivities = getOldActivities(
            activities,
            getCleanupCutoff(period, today),
          );
          const isEmpty = oldActivities.length === 0;

          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="button"
              accessibilityState={{ disabled: isEmpty }}
              disabled={isEmpty}
              key={period}
              onPress={() => setActivitiesToDelete(oldActivities)}
              style={styles.row}
            >
              <Text style={[styles.rowText, isEmpty && styles.emptyText]}>
                {label}
              </Text>
              <Text style={[styles.rowValue, isEmpty && styles.emptyText]}>
                {oldActivities.length}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.note}>
        Repeating activities are always kept. Delete them from their day.
      </Text>

      {activitiesToDelete && (
        <ConfirmModal
          confirmLabel="Delete"
          message="This cannot be undone."
          onClose={() => setActivitiesToDelete(null)}
          onConfirm={() => {
            onDeleteOld(activitiesToDelete);
            setActivitiesToDelete(null);
          }}
          title={`Delete ${activitiesToDelete.length} old ${
            activitiesToDelete.length === 1 ? 'activity' : 'activities'
          }?`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 56,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
  },
  backText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  title: {
    marginTop: 16,
    fontSize: 40,
    lineHeight: 44,
    includeFontPadding: false,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  card: {
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
  },
  rowText: {
    color: colors.text,
  },
  rowValue: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyText: {
    fontWeight: 'normal',
    color: colors.textSecondary,
  },
  note: {
    marginTop: 8,
    marginHorizontal: 16,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
