import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Pressable from '../components/Pressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput } from '../components/AppText';
import {
  Activity,
  CleanupPeriod,
  getCleanupCutoff,
  getOldActivities,
  toDateKey,
} from '../calendar/activities';
import { ImportedActivity, parseIcs, withoutDuplicates } from '../calendar/ics';
import { isCalendarText, pickCalendarFile } from '../calendar/icsFile';
import {
  formatDuration,
  formatTimeInput,
  formatTimeOfDay,
  parseTime,
} from '../calendar/time';
import ChoiceChips from '../components/ChoiceChips';
import ConfirmModal from '../components/ConfirmModal';
import ScreenHeader from '../components/ScreenHeader';
import { Strings } from '../i18n/en';
import { LanguageSetting } from '../i18n/language';
import { useLanguageSetting, useStrings } from '../i18n/LanguageContext';
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
import { colors, fontSizes, radii, SCREEN_TOP } from '../theme';

const CLEANUP_PERIODS: CleanupPeriod[] = ['week', 'month', 'year'];
const LEAD_MINUTES = [null, 0, 5, 10, 30, 60];
const WATER_INTERVALS = [null, 60, 120, 180];
const LANGUAGE_SETTINGS: LanguageSetting[] = ['system', 'en', 'it'];

function leadOptions(t: Strings) {
  return LEAD_MINUTES.map((value) => ({
    value,
    label:
      value === null
        ? t.settings.off
        : value === 0
          ? t.settings.atStart
          : formatDuration(value),
  }));
}

function waterIntervalOptions(t: Strings) {
  return WATER_INTERVALS.map((value) => ({
    value,
    label: value === null ? t.settings.off : formatDuration(value),
  }));
}

type Props = {
  today: Date;
  activities: Activity[];
  onBack: () => void;
  onDeleteOld: (activities: Activity[]) => void;
  onImport: (activities: ImportedActivity[]) => void;
  onRemindersChange: () => Promise<void>;
};

type ImportPreview = {
  activities: ImportedActivity[];
  message: string;
};

function toTimeText(minutes: number): string {
  return formatTimeOfDay({ hours: Math.floor(minutes / 60), minutes: minutes % 60 });
}

export default function SettingsScreen({
  today,
  activities,
  onBack,
  onDeleteOld,
  onImport,
  onRemindersChange,
}: Props) {
  const t = useStrings();
  const { setting: languageSetting, changeSetting: changeLanguage } =
    useLanguageSetting();
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
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [hasHoursError, setHasHoursError] = useState(false);

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

  async function chooseCalendarFile() {
    setImportStatus(null);

    let text: string | null;
    try {
      text = await pickCalendarFile();
    } catch (error) {
      console.error(error);
      setImportStatus(t.settings.importUnreadable);
      return;
    }
    if (text === null) return;
    if (!isCalendarText(text)) {
      setImportStatus(t.settings.importNotCalendar);
      return;
    }

    const parsed = parseIcs(text, today, colors.primary, t.activity.untitled);
    const { activities: newActivities, duplicates } = withoutDuplicates(
      parsed.activities,
      activities,
    );
    const leftOut = t.settings.importLeftOut(
      parsed.past,
      duplicates,
      parsed.unsupported,
    );

    if (newActivities.length === 0) {
      setImportStatus(`${t.settings.importNothingNew}${leftOut}`);
      return;
    }
    setImportPreview({
      activities: newActivities,
      message: `${t.settings.importMessage}${leftOut}`,
    });
  }

  // The notifications are planned again, so they arrive in the new language.
  function chooseLanguage(setting: LanguageSetting) {
    if (setting === languageSetting) return;

    changeLanguage(setting);
    onRemindersChange().then(loadStatus).catch(console.error);
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
      // The saved hours come back, and the message says why.
      setHasHoursError(true);
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
      <ScreenHeader onBack={onBack} title={t.settings.title} />

      <Text accessibilityRole="header" style={styles.sectionTitle}>{t.settings.language}</Text>
      <View style={[styles.card, styles.notificationsCard]}>
        <ChoiceChips
          label={t.settings.language}
          onChange={chooseLanguage}
          options={LANGUAGE_SETTINGS.map((value) => ({
            value,
            label: t.settings.languageOptions[value],
          }))}
          value={languageSetting}
        />
      </View>
      <Text style={styles.note}>{t.settings.languageNote}</Text>

      <Text accessibilityRole="header" style={styles.sectionTitle}>{t.settings.notifications}</Text>
      <View style={[styles.card, styles.notificationsCard]}>
        {reminders === null ? (
          // The saved settings arrive in a few milliseconds: no loader, so nothing flickers.
          null
        ) : (
          <>
            <Text style={styles.fieldLabel}>{t.settings.beforeActivities}</Text>
            <ChoiceChips
              label={t.settings.beforeActivities}
              onChange={(value) => changeReminders({ activityLeadMinutes: value })}
              options={leadOptions(t)}
              value={reminders.activityLeadMinutes}
            />

            <Text style={[styles.fieldLabel, styles.nextField]}>
              {t.settings.drinkReminders}
            </Text>
            <ChoiceChips
              label={t.settings.drinkReminders}
              onChange={(value) => changeReminders({ waterIntervalMinutes: value })}
              options={waterIntervalOptions(t)}
              value={reminders.waterIntervalMinutes}
            />
            {reminders.waterIntervalMinutes !== null && (
              <View style={styles.timeRow}>
                <Text style={styles.rowText}>{t.settings.from}</Text>
                <TextInput
                  accessibilityLabel={t.settings.drinkFrom}
                  keyboardType="number-pad"
                  onBlur={completeWaterHours}
                  onChangeText={(text) => {
                    setHasHoursError(false);
                    setStartText(formatTimeInput(text));
                  }}
                  selectTextOnFocus
                  style={styles.timeInput}
                  value={startText}
                />
                <Text style={styles.rowText}>{t.settings.to}</Text>
                <TextInput
                  accessibilityLabel={t.settings.drinkTo}
                  keyboardType="number-pad"
                  onBlur={completeWaterHours}
                  onChangeText={(text) => {
                    setHasHoursError(false);
                    setEndText(formatTimeInput(text));
                  }}
                  selectTextOnFocus
                  style={styles.timeInput}
                  value={endText}
                />
              </View>
            )}
            {hasHoursError && (
              <Text
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                style={styles.hoursError}
              >
                {t.settings.hoursError}
              </Text>
            )}
          </>
        )}
      </View>
      <View style={[styles.card, styles.statusCard]}>
        {status && !status.isAllowed && (
          <Text style={styles.warning}>{t.settings.notAllowed}</Text>
        )}
        <View style={styles.row}>
          <Text style={styles.rowText}>{t.settings.plannedReminders}</Text>
          <Text style={styles.rowValue}>
            {status === null ? '' : status.plannedCount}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={t.settings.sendTest}
          accessibilityRole="button"
          onPress={sendTest}
          style={styles.row}
        >
          <Text style={styles.actionText}>
            {isTestSent ? t.settings.testSent(TEST_DELAY_SECONDS) : t.settings.sendTest}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.note}>{t.settings.remindersNote}</Text>

      <Text accessibilityRole="header" style={styles.sectionTitle}>{t.settings.import}</Text>
      <View style={styles.card}>
        <Pressable
          accessibilityLabel={t.settings.importButton}
          accessibilityRole="button"
          onPress={() => {
            chooseCalendarFile();
          }}
          style={styles.row}
        >
          <Text style={styles.actionText}>{t.settings.importButton}</Text>
          <Ionicons name="download-outline" size={20} color={colors.primary} />
        </Pressable>
        {importStatus && (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={styles.importStatus}
          >
            {importStatus}
          </Text>
        )}
      </View>
      <Text style={styles.note}>{t.settings.importNote}</Text>

      <Text accessibilityRole="header" style={styles.sectionTitle}>{t.settings.storage}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t.settings.spaceUsed}</Text>
          <Text style={styles.rowValue}>
            {databaseSize === null ? '' : formatBytes(databaseSize)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t.settings.activities}</Text>
          <Text style={styles.rowValue}>{t.settings.saved(activities.length)}</Text>
        </View>
      </View>

      <Text accessibilityRole="header" style={styles.sectionTitle}>{t.settings.deleteOld}</Text>
      <View style={styles.card}>
        {CLEANUP_PERIODS.map((period) => {
          const label = t.settings.olderThan[period];
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
      <Text style={styles.note}>{t.settings.deleteOldNote}</Text>

      <Text accessibilityRole="header" style={styles.sectionTitle}>{t.settings.stats}</Text>
      <View style={styles.card}>
        <Pressable
          accessibilityLabel={t.settings.resetStats}
          accessibilityRole="button"
          onPress={() => setIsResetOpen(true)}
          style={styles.row}
        >
          <Text style={styles.actionText}>{t.settings.resetStats}</Text>
          {isReset && <Text style={styles.rowValue}>{t.settings.resetToday}</Text>}
        </Pressable>
      </View>
      <Text style={styles.note}>{t.settings.resetNote}</Text>

      {isResetOpen && (
        <ConfirmModal
          confirmLabel={t.settings.reset}
          isDestructive
          message={t.settings.resetMessage}
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
          title={t.settings.resetTitle}
        />
      )}

      {importPreview && (
        <ConfirmModal
          confirmLabel={t.settings.importConfirm}
          message={importPreview.message}
          onClose={() => setImportPreview(null)}
          onConfirm={() => {
            onImport(importPreview.activities);
            setImportStatus(t.settings.imported(importPreview.activities.length));
            setImportPreview(null);
          }}
          title={t.settings.importTitle(importPreview.activities.length)}
        />
      )}

      {activitiesToDelete && (
        <ConfirmModal
          confirmLabel={t.common.delete}
          isDestructive
          message={t.settings.cannotBeUndone}
          onClose={() => setActivitiesToDelete(null)}
          onConfirm={() => {
            onDeleteOld(activitiesToDelete);
            setActivitiesToDelete(null);
          }}
          title={t.settings.deleteOldTitle(activitiesToDelete.length)}
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
    paddingTop: SCREEN_TOP,
    paddingBottom: 24,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  card: {
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
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
    minHeight: 44,
    borderRadius: 22,
    textAlign: 'center',
    backgroundColor: colors.background,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: 8,
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
  hoursError: {
    marginTop: 8,
    fontSize: fontSizes.caption,
    color: colors.danger,
  },
  importStatus: {
    marginTop: -4,
    marginBottom: 16,
    color: colors.textSecondary,
  },
  note: {
    marginTop: 8,
    marginHorizontal: 16,
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
});
