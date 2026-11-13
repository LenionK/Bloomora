import {
  AndroidImportance,
  cancelAllScheduledNotificationsAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import { Activity, toDateKey } from '../calendar/activities';
import {
  loadReminderSettings,
  loadWaterGlasses,
} from '../storage/activityDatabase';
import { getActivityReminders, getWaterReminders, Reminder } from './reminders';

export const TEST_DELAY_SECONDS = 5;

let isPrepared = false;
let hasChannels = false;
let pendingRefresh: Promise<void> = Promise.resolve();

// Android shows the permission prompt only once a channel exists.
async function prepare(): Promise<void> {
  if (isPrepared) return;

  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  // Expo Go on Android can fail to create channels. Notifications then go to
  // the default channel instead of being lost.
  try {
    await setNotificationChannelAsync('activities', {
      name: 'Activities',
      importance: AndroidImportance.HIGH,
    });
    await setNotificationChannelAsync('water', {
      name: 'Water',
      importance: AndroidImportance.DEFAULT,
    });
    hasChannels = true;
  } catch (error) {
    console.warn('Notification channels unavailable, using the default one', error);
  }
  isPrepared = true;
}

function channelOf(channelId: Reminder['channelId']): { channelId?: string } {
  return hasChannels ? { channelId } : {};
}

async function hasPermission(): Promise<boolean> {
  const current = await getPermissionsAsync();
  if (current.granted) return true;

  return (await requestPermissionsAsync()).granted;
}

async function plan(activities: Activity[], now: Date): Promise<void> {
  const settings = await loadReminderSettings();
  const glassesToday = await loadWaterGlasses(toDateKey(now));
  const reminders = [
    ...getActivityReminders(activities, now, settings.activityLeadMinutes),
    ...getWaterReminders(settings, now, glassesToday),
  ];

  await cancelAllScheduledNotificationsAsync();
  if (reminders.length === 0) return;

  await prepare();
  if (!(await hasPermission())) return;

  for (const { id, date, title, body, channelId } of reminders) {
    await scheduleNotificationAsync({
      identifier: id,
      content: { title, body },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date,
        ...channelOf(channelId),
      },
    });
  }
}

export type ReminderStatus = {
  isAllowed: boolean;
  plannedCount: number;
};

export async function getReminderStatus(): Promise<ReminderStatus> {
  const permission = await getPermissionsAsync();
  const planned = await getAllScheduledNotificationsAsync();

  return { isAllowed: permission.granted, plannedCount: planned.length };
}

// Shows whether notifications reach the phone at all, apart from the planning.
export async function sendTestNotification(): Promise<boolean> {
  await prepare();
  if (!(await hasPermission())) return false;

  await scheduleNotificationAsync({
    content: { title: 'Bloomora', body: 'Notifications are working.' },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: TEST_DELAY_SECONDS,
      ...channelOf('activities'),
    },
  });

  return true;
}

// Every change plans all reminders again from scratch. Refreshes wait for each
// other, so two quick changes cannot mix their reminders.
export function refreshReminders(
  activities: Activity[],
  now = new Date(),
): Promise<void> {
  pendingRefresh = pendingRefresh
    .then(() => plan(activities, now))
    .catch(console.error);

  return pendingRefresh;
}
