import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { DEFAULT_REMINDER_SETTINGS } from '../src/notifications/reminders';
import SettingsScreen from '../src/screens/SettingsScreen';
import {
  loadReminderSettings,
  saveReminderSettings,
} from '../src/storage/activityDatabase';

jest.mock('../src/storage/activityDatabase', () => ({
  getDatabaseSize: jest.fn(async () => 8192),
  loadReminderSettings: jest.fn(),
  saveReminderSettings: jest.fn(async () => undefined),
}));

const today = new Date(2026, 10, 16);
const onRemindersChange = jest.fn(async () => undefined);

async function renderSettings() {
  jest.mocked(loadReminderSettings).mockResolvedValue(DEFAULT_REMINDER_SETTINGS);
  await render(
    <SettingsScreen
      activities={[]}
      onBack={jest.fn()}
      onDeleteOld={jest.fn()}
      onRemindersChange={onRemindersChange}
      today={today}
    />,
  );
  await screen.findByText('Before activities');
}

function isChecked(label: string) {
  return screen.getByLabelText(label).props.accessibilityState.checked;
}

beforeEach(() => jest.clearAllMocks());

test('shows the saved reminder settings', async () => {
  // By default: 10 minutes before activities, water every 2 hours from 9 to 21.
  await renderSettings();

  expect(isChecked('Before activities: 10 min')).toBe(true);
  expect(isChecked('Drink reminders: 2 h')).toBe(true);
  expect(screen.getByLabelText('Drink reminders from').props.value).toBe('09:00');
  expect(screen.getByLabelText('Drink reminders to').props.value).toBe('21:00');
});

test('saves a new choice and plans the reminders again', async () => {
  // The reminders follow the settings as soon as they are saved.
  await renderSettings();

  await fireEvent.press(screen.getByLabelText('Before activities: 30 min'));

  expect(isChecked('Before activities: 30 min')).toBe(true);
  expect(saveReminderSettings).toHaveBeenCalledWith({
    ...DEFAULT_REMINDER_SETTINGS,
    activityLeadMinutes: 30,
  });
  expect(onRemindersChange).toHaveBeenCalledTimes(1);
});

test('hides the drink hours when the reminders are off', async () => {
  // Without reminders the hours have no use.
  await renderSettings();

  await fireEvent.press(screen.getByLabelText('Drink reminders: Off'));

  expect(screen.queryByLabelText('Drink reminders from')).toBeNull();
  expect(saveReminderSettings).toHaveBeenCalledWith({
    ...DEFAULT_REMINDER_SETTINGS,
    waterIntervalMinutes: null,
  });
});

test('saves new drink hours when the field is left', async () => {
  // A partial time is completed, as in the activity popup.
  await renderSettings();

  await fireEvent.changeText(screen.getByLabelText('Drink reminders from'), '8');
  await fireEvent(screen.getByLabelText('Drink reminders from'), 'blur');

  expect(screen.getByLabelText('Drink reminders from').props.value).toBe('08:00');
  expect(saveReminderSettings).toHaveBeenCalledWith({
    ...DEFAULT_REMINDER_SETTINGS,
    waterStartMinutes: 8 * 60,
  });
});

test('shows how many reminders are planned and sends a test', async () => {
  // The test notification shows whether notifications reach the phone at all.
  jest
    .mocked(Notifications.getAllScheduledNotificationsAsync)
    .mockResolvedValueOnce([{}, {}, {}] as never);
  await renderSettings();

  expect(await screen.findByText('3')).toBeTruthy();
  expect(screen.queryByText(/not allowed/)).toBeNull();

  await fireEvent.press(screen.getByLabelText('Send a test notification'));

  expect(
    await screen.findByText('Test sent, it arrives in 5 seconds'),
  ).toBeTruthy();
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      trigger: expect.objectContaining({ type: 'timeInterval', seconds: 5 }),
    }),
  );
});

test('explains when notifications are not allowed', async () => {
  // Without the permission, nothing can arrive whatever the settings say.
  jest
    .mocked(Notifications.getPermissionsAsync)
    .mockResolvedValueOnce({ granted: false } as never);
  await renderSettings();

  expect(await screen.findByText(/Notifications are not allowed/)).toBeTruthy();
});

test('puts back the saved hours when the end is not after the start', async () => {
  // A reversed range would give no reminders at all, so it is not kept.
  await renderSettings();

  await fireEvent.changeText(screen.getByLabelText('Drink reminders to'), '0800');
  await fireEvent(screen.getByLabelText('Drink reminders to'), 'blur');

  expect(screen.getByLabelText('Drink reminders to').props.value).toBe('21:00');
  expect(saveReminderSettings).not.toHaveBeenCalled();
});
