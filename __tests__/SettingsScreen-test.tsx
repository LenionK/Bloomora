import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { DEFAULT_REMINDER_SETTINGS } from '../src/notifications/reminders';
import { pickCalendarFile } from '../src/calendar/icsFile';
import { setCurrentLanguage } from '../src/i18n/language';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import SettingsScreen from '../src/screens/SettingsScreen';
import {
  loadReminderSettings,
  resetStats,
  saveLanguageSetting,
  saveReminderSettings,
} from '../src/storage/activityDatabase';

jest.mock('../src/storage/activityDatabase', () => ({
  getDatabaseSize: jest.fn(async () => 8192),
  loadReminderSettings: jest.fn(),
  resetStats: jest.fn(async () => undefined),
  saveLanguageSetting: jest.fn(async () => undefined),
  saveReminderSettings: jest.fn(async () => undefined),
}));

jest.mock('../src/calendar/icsFile', () => ({
  ...jest.requireActual('../src/calendar/icsFile'),
  pickCalendarFile: jest.fn(),
}));

const today = new Date(2026, 10, 16);
const onRemindersChange = jest.fn(async () => undefined);
const onImport = jest.fn();

async function renderSettings() {
  jest.mocked(loadReminderSettings).mockResolvedValue(DEFAULT_REMINDER_SETTINGS);
  await render(
    <SettingsScreen
      activities={[]}
      onBack={jest.fn()}
      onDeleteOld={jest.fn()}
      onImport={onImport}
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
afterEach(() => setCurrentLanguage('en'));

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

test('resets the stats only after confirming', async () => {
  // A reset cannot be undone, so it asks first and starts from today.
  await renderSettings();

  await fireEvent.press(screen.getByLabelText('Reset stats'));
  expect(resetStats).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByText('Reset'));

  expect(resetStats).toHaveBeenCalledWith('2026-11-16');
  expect(await screen.findByText('Reset today')).toBeTruthy();
});

test('puts back the saved hours when the end is not after the start', async () => {
  // A reversed range would give no reminders at all, so it is not kept.
  await renderSettings();

  await fireEvent.changeText(screen.getByLabelText('Drink reminders to'), '0800');
  await fireEvent(screen.getByLabelText('Drink reminders to'), 'blur');

  expect(screen.getByLabelText('Drink reminders to').props.value).toBe('21:00');
  expect(saveReminderSettings).not.toHaveBeenCalled();
});

const icsFile = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  'SUMMARY:Dentist',
  'DTSTART:20261120T100000',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'SUMMARY:Yoga',
  'DTSTART:20261116T180000',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'SUMMARY:Old',
  'DTSTART:20261101T180000',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

test('imports the events of a file after confirming', async () => {
  // The popup counts what is added and says what is left out.
  jest.mocked(pickCalendarFile).mockResolvedValueOnce(icsFile);
  await renderSettings();

  await fireEvent.press(screen.getByLabelText('Import from an .ics file'));

  expect(await screen.findByText('Import 2 activities?')).toBeTruthy();
  expect(screen.getByText(/Left out: 1 past event\./)).toBeTruthy();
  expect(onImport).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByRole('button', { name: 'Import' }));

  expect(onImport.mock.calls[0][0].map(({ title }: { title: string }) => title)).toEqual([
    'Dentist',
    'Yoga',
  ]);
  expect(screen.getByText('Imported 2 activities')).toBeTruthy();
});

test('adds nothing when the file is cancelled', async () => {
  // Cancelling the import popup leaves the calendar as it was.
  jest.mocked(pickCalendarFile).mockResolvedValueOnce(icsFile);
  await renderSettings();

  await fireEvent.press(screen.getByLabelText('Import from an .ics file'));
  await fireEvent.press(await screen.findByText('Cancel'));

  expect(onImport).not.toHaveBeenCalled();
  expect(screen.queryByText('Import 2 activities?')).toBeNull();
});

test.each([
  ['a file that is not a calendar', 'Hello', 'Not an .ics calendar file'],
  [
    'a file with only past events',
    'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20261101T180000\r\nEND:VEVENT\r\nEND:VCALENDAR',
    'Nothing new to import. Left out: 1 past event.',
  ],
])('explains why nothing is imported from %s', async (_, text, message) => {
  // No popup opens when there is nothing to add.
  jest.mocked(pickCalendarFile).mockResolvedValueOnce(text);
  await renderSettings();

  await fireEvent.press(screen.getByLabelText('Import from an .ics file'));

  expect(await screen.findByText(message)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Import' })).toBeNull();
});

test('does nothing when no file is chosen', async () => {
  // Closing the file picker is not an error.
  jest.mocked(pickCalendarFile).mockResolvedValueOnce(null);
  await renderSettings();

  await fireEvent.press(screen.getByLabelText('Import from an .ics file'));

  expect(pickCalendarFile).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/Not an .ics|Nothing new|could not be read/)).toBeNull();
});
test('switches the whole screen to Italian and back to the phone', async () => {
  // The choice is saved, and the reminders are planned again in the new language.
  jest.mocked(loadReminderSettings).mockResolvedValue(DEFAULT_REMINDER_SETTINGS);
  await render(
    <LanguageProvider initialSetting="system">
      <SettingsScreen
        activities={[]}
        onBack={jest.fn()}
        onDeleteOld={jest.fn()}
        onImport={onImport}
        onRemindersChange={onRemindersChange}
        today={today}
      />
    </LanguageProvider>,
  );
  await screen.findByText('Before activities');
  expect(isChecked('Language: Phone')).toBe(true);

  await fireEvent.press(screen.getByLabelText('Language: Italiano'));

  expect(screen.getByText('Impostazioni')).toBeTruthy();
  expect(screen.getByText('Prima delle attività')).toBeTruthy();
  expect(isChecked('Lingua: Italiano')).toBe(true);
  expect(saveLanguageSetting).toHaveBeenCalledWith('it');
  expect(onRemindersChange).toHaveBeenCalledTimes(1);

  await fireEvent.press(screen.getByLabelText('Lingua: Telefono'));

  expect(screen.getByText('Settings')).toBeTruthy();
  expect(saveLanguageSetting).toHaveBeenLastCalledWith('system');
});