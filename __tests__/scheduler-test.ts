import * as Notifications from 'expo-notifications';
import { Activity } from '../src/calendar/activities';
import { DEFAULT_REMINDER_SETTINGS } from '../src/notifications/reminders';
import { refreshReminders } from '../src/notifications/scheduler';
import {
  loadReminderSettings,
  loadWaterGlasses,
} from '../src/storage/activityDatabase';

jest.mock('../src/storage/activityDatabase', () => ({
  loadReminderSettings: jest.fn(),
  loadWaterGlasses: jest.fn(),
}));

const now = new Date(2026, 10, 16, 15, 0);
const gym: Activity = {
  id: '1',
  title: 'Gym',
  start: new Date(2026, 10, 16, 16, 30),
  end: new Date(2026, 10, 16, 17, 30),
  color: '#3559C7',
  repeatDays: [],
  completedDates: [],
  skippedDates: [],
};
const noWater = { ...DEFAULT_REMINDER_SETTINGS, waterIntervalMinutes: null };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(loadWaterGlasses).mockResolvedValue(0);
});

test('replaces every planned reminder with the new ones', async () => {
  // Old reminders go first, so a deleted or moved activity is not announced.
  jest.mocked(loadReminderSettings).mockResolvedValue(noWater);

  await refreshReminders([gym], now);

  expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
    identifier: 'activity-1-2026-11-16',
    content: { title: 'Gym', body: 'In 10 min, at 16:30' },
    trigger: {
      type: 'date',
      date: new Date(2026, 10, 16, 16, 20),
      channelId: 'activities',
    },
  });
});

test('reads the glasses of today to stop the drink reminders', async () => {
  // With 2 litres already drunk, today gets no more drink reminders.
  jest.mocked(loadReminderSettings).mockResolvedValue(DEFAULT_REMINDER_SETTINGS);
  jest.mocked(loadWaterGlasses).mockResolvedValue(10);

  await refreshReminders([], now);

  expect(loadWaterGlasses).toHaveBeenCalledWith('2026-11-16');
  const ids = jest
    .mocked(Notifications.scheduleNotificationAsync)
    .mock.calls.map(([request]) => request.identifier);
  expect(ids.some((id) => id?.startsWith('water-2026-11-16'))).toBe(false);
  expect(ids).toHaveLength(6 * 7);
});

test('uses the default channel when channels cannot be created', async () => {
  // Expo Go on Android can reject the channels; reminders must still be planned.
  jest.mocked(loadReminderSettings).mockResolvedValue(noWater);
  jest
    .mocked(Notifications.setNotificationChannelAsync)
    .mockRejectedValueOnce(new Error('NullPointerException'));
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  let refresh: typeof refreshReminders = refreshReminders;

  jest.isolateModules(() => {
    refresh = jest.requireActual('../src/notifications/scheduler').refreshReminders;
  });
  await refresh([gym], now);

  expect(warn).toHaveBeenCalled();
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      trigger: { type: 'date', date: new Date(2026, 10, 16, 16, 20) },
    }),
  );
  warn.mockRestore();
});

test('asks for permission only when there is something to plan', async () => {
  // With everything off, the old reminders are removed without any prompt.
  jest.mocked(loadReminderSettings).mockResolvedValue({
    ...noWater,
    activityLeadMinutes: null,
  });

  await refreshReminders([gym], now);

  expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test('plans nothing when notifications are not allowed', async () => {
  // The prompt is shown once; a refusal is respected without errors.
  jest.mocked(loadReminderSettings).mockResolvedValue(noWater);
  jest
    .mocked(Notifications.getPermissionsAsync)
    .mockResolvedValueOnce({ granted: false } as never);
  jest
    .mocked(Notifications.requestPermissionsAsync)
    .mockResolvedValueOnce({ granted: false } as never);

  await refreshReminders([gym], now);

  expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});
