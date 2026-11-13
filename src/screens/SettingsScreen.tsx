import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput } from '../components/AppText';
import {
  Activity,
  CleanupPeriod,
  getCleanupCutoff,
  getOldActivities,
  toDateKey,
} from '../calendar/activities';
import { formatTimeInput, formatTimeOfDay, parseTime } from '../calendar/time';
import ChoiceChips from '../components/ChoiceChips';
import ConfirmModal from '../components/ConfirmModal';
import { ReminderSettings } from '../notifications/reminders';
import {
  getReminderStatus,
  ReminderStatus,
  sendTestNotification,
  TEST_DELAY_SECONDS,
} from '../notifications/scheduler';
import {
  getDatabaseSize,
  loadReminderSettings,
  resetStats,
  saveReminderSettings,
} from '../storage/activityDatabase';
import { formatBytes } from '../storage/formatBytes';
import { colors } from '../theme';

const CLEANUP_OPTIONS: { period: CleanupPeriod; label: string }[] = [
  { period: 'week', label: 'Older than a week' },
  { period: 'month', label: 'Older than a month' },
  { period: 'year', label: 'Older than a year' },
];

const LEAD_OPTIONS = [
  { value: null, label: 'Off' },
  { value: 0, label: 'At start' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 h' },
];

const WATER_INTERVAL_OPTIONS = [
  { value: null, label: 'Off' },
  { value: 60, label: '1 h' },
  { value: 120, label: '2 h' },
  { value: 180, label: '3 h' },
];

type Props = {
  today: Date;
  activities: Activity[];
  onBack: () => void;
  onDeleteOld: (activities: Activity[]) => void;
  onRemindersChange: () => Promise<void>;
};

function toTimeText(minutes: number): string {
  return formatTimeOfDay({ hours: Math.floor(minutes / 60), minutes: minutes % 60 });
}

export default function SettingsScreen({
  today,
  activities,
  onBack,
  onDeleteOld,
  onRemindersChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const [databaseSize, setDatabaseSize] = useState<number | null>(null);
  const [activitiesToDelete, setActivitiesToDelete] = useState<
    Activity[] | null
  >(null);
  const [reminders, setReminders] = useState<ReminderSettings | null>(null);
  const [startText, setStartText] = useState('');
  const [endText, setEndText] = useState('');
  const [status, setStatus] = useState<ReminderStatus | null>(null);
  const [isTestSent, setIsTestSent] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isReset, setIsReset] = useState(false);

  function loadStatus() {
    getReminderStatus().then(setStatus).catch(console.error);
  }

  useEffect(() => {
    getDatabaseSize().then(setDatabaseSize).catch(console.error);
  }, [activities]);

  useEffect(() => {
    getReminderStatus().then(setStatus).catch(console.error);
  }, []);

  useEffect(() => {
    loadReminderSettings()
      .then((settings) => {
        setReminders(settings);
        setStartText(toTimeText(settings.waterStartMinutes));
        setEndText(toTimeText(settings.waterEndMinutes));
      })
      .catch(console.error);
  }, []);

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

  function changeReminders(changes: Partial<ReminderSettings>) {
    if (!reminders) return;

    const settings = { ...reminders, ...changes };

    setReminders(settings);
    saveReminderSettings(settings)
      .then(onRemindersChange)
      .then(loadStatus)
      .catch(console.error);
  }

  function sendTest() {
    sendTestNotification()
      .then((isSent) => {
        setIsTestSent(isSent);
        loadStatus();
      })
      .catch(console.error);
  }

  // A wrong or reversed range goes back to the saved one instead of being kept.
  function completeWaterHours() {
    if (!reminders) return;

    const start = parseTime(startText);
    const end = parseTime(endText);
    const startMinutes = start && start.hours * 60 + start.minutes;
    const endMinutes = end && end.hours * 60 + end.minutes;

    if (startMinutes !== null && endMinutes !== null && startMinutes < endMinutes) {
      setStartText(toTimeText(startMinutes));
      setEndText(toTimeText(endMinutes));
      if (
        startMinutes !== reminders.waterStartMinutes ||
        endMinutes !== reminders.waterEndMinutes
      ) {
        changeReminders({
          waterStartMinutes: startMinutes,
          waterEndMinutes: endMinutes,
        });
      }
    } else {
      setStartText(toTimeText(reminders.waterStartMinutes));
      setEndText(toTimeText(reminders.waterEndMinutes));
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: 24 + insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled"
      style={styles.container}
    >
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

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={[styles.card, styles.notificationsCard]}>
        {reminders === null ? (
          <Text style={styles.rowText}>…</Text>
        ) : (
          <>
            <Text style={styles.fieldLabel}>Before activities</Text>
            <ChoiceChips
              label="Before activities"
              onChange={(value) => changeReminders({ activityLeadMinutes: value })}
              options={LEAD_OPTIONS}
              value={reminders.activityLeadMinutes}
            />

            <Text style={[styles.fieldLabel, styles.nextField]}>
              Drink reminders
            </Text>
            <ChoiceChips
              label="Drink reminders"
              onChange={(value) => changeReminders({ waterIntervalMinutes: value })}
              options={WATER_INTERVAL_OPTIONS}
              value={reminders.waterIntervalMinutes}
            />
            {reminders.waterIntervalMinutes !== null && (
              <View style={styles.timeRow}>
                <Text style={styles.rowText}>From</Text>
                <TextInput
                  accessibilityLabel="Drink reminders from"
                  keyboardType="number-pad"
                  onBlur={completeWaterHours}
                  onChangeText={(text) => setStartText(formatTimeInput(text))}
                  selectTextOnFocus
                  style={styles.timeInput}
                  value={startText}
                />
                <Text style={styles.rowText}>to</Text>
                <TextInput
                  accessibilityLabel="Drink reminders to"
                  keyboardType="number-pad"
                  onBlur={completeWaterHours}
                  onChangeText={(text) => setEndText(formatTimeInput(text))}
                  selectTextOnFocus
                  style={styles.timeInput}
                  value={endText}
                />
              </View>
            )}
          </>
        )}
      </View>
      <View style={[styles.card, styles.statusCard]}>
        {status && !status.isAllowed && (
          <Text style={styles.warning}>
            Notifications are not allowed. Allow them for this app in the phone
            settings.
          </Text>
        )}
        <View style={styles.row}>
          <Text style={styles.rowText}>Planned reminders</Text>
          <Text style={styles.rowValue}>
            {status === null ? '…' : status.plannedCount}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Send a test notification"
          accessibilityRole="button"
          onPress={sendTest}
          style={styles.row}
        >
          <Text style={styles.actionText}>
            {isTestSent
              ? `Test sent, it arrives in ${TEST_DELAY_SECONDS} seconds`
              : 'Send a test notification'}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.note}>
        Reminders are planned a week ahead. Open the app at least once a week to
        keep them coming. Drink reminders stop for the day at 2 L.
      </Text>

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

      <Text style={styles.sectionTitle}>Stats</Text>
      <View style={styles.card}>
        <Pressable
          accessibilityLabel="Reset stats"
          accessibilityRole="button"
          onPress={() => setIsResetOpen(true)}
          style={styles.row}
        >
          <Text style={styles.actionText}>Reset stats</Text>
          {isReset && <Text style={styles.rowValue}>Reset today</Text>}
        </Pressable>
      </View>
      <Text style={styles.note}>
        Stats start again from today and the water history is deleted. Your
        activities and the calendar stay as they are.
      </Text>

      {isResetOpen && (
        <ConfirmModal
          confirmLabel="Reset"
          message="Water history and activity scores start again from today. This cannot be undone."
          onClose={() => setIsResetOpen(false)}
          onConfirm={() => {
            setIsResetOpen(false);
            resetStats(toDateKey(today))
              .then(() => {
                setIsReset(true);
                return getDatabaseSize().then(setDatabaseSize);
              })
              .catch(console.error);
          }}
          title="Reset all stats?"
        />
      )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 24,
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
  notificationsCard: {
    paddingVertical: 16,
  },
  statusCard: {
    marginTop: 8,
  },
  warning: {
    marginTop: 12,
    color: colors.primary,
  },
  actionText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  fieldLabel: {
    marginBottom: 8,
    color: colors.text,
  },
  nextField: {
    marginTop: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  timeInput: {
    width: 76,
    height: 40,
    borderRadius: 20,
    textAlign: 'center',
    backgroundColor: colors.background,
    color: colors.text,
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
