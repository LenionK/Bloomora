import { fireEvent, render, screen } from '@testing-library/react-native';
import { getLocales } from 'expo-localization';
import { Activity } from '../src/calendar/activities';
import { parseIcs } from '../src/calendar/ics';
import { en } from '../src/i18n/en';
import { it as italian } from '../src/i18n/it';
import {
  getPhoneLanguage,
  resolveLanguage,
  setCurrentLanguage,
} from '../src/i18n/language';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import { getActivityReminders } from '../src/notifications/reminders';
import CalendarScreen from '../src/screens/CalendarScreen';
import { formatLitres } from '../src/water/water';

// Monday 2 November 2026.
const today = new Date(2026, 10, 2, 9, 0);

afterEach(() => setCurrentLanguage('en'));

test('follows the phone: Italian when it is Italian, English otherwise', () => {
  // Any language other than Italian falls back to English.
  jest.mocked(getLocales).mockReturnValueOnce([{ languageCode: 'it' }] as never);
  expect(getPhoneLanguage()).toBe('it');

  jest.mocked(getLocales).mockReturnValueOnce([{ languageCode: 'fr' }] as never);
  expect(resolveLanguage('system')).toBe('en');

  expect(resolveLanguage('it')).toBe('it');
  expect(resolveLanguage('en')).toBe('en');
});

test('has every English text in Italian too', () => {
  // The same keys, and the same number of months and weekdays.
  const keysOf = (value: object): string[] =>
    Object.entries(value).flatMap(([key, item]) =>
      item && typeof item === 'object' && !Array.isArray(item)
        ? keysOf(item).map((inner) => `${key}.${inner}`)
        : [key],
    );

  expect(keysOf(italian).sort()).toEqual(keysOf(en).sort());
  expect(italian.dates.months).toHaveLength(12);
  expect(italian.dates.weekdays).toHaveLength(7);
  expect(italian.stats.info).toHaveLength(en.stats.info.length);
});

test('shows the calendar and the day in Italian', async () => {
  // Month and weekday names, and the dates inside the texts, are translated.
  await render(
    <LanguageProvider initialSetting="it">
      <CalendarScreen today={today} />
    </LanguageProvider>,
  );

  expect(screen.getByText('Novembre')).toBeTruthy();
  expect(screen.getByText('Lun')).toBeTruthy();
  expect(screen.getByText('Nessuna attività in arrivo')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('La mia giornata'));

  expect(screen.getByText('Lunedì')).toBeTruthy();
  expect(screen.getByText('2 novembre · oggi')).toBeTruthy();
});

test('writes litres and notifications in Italian', () => {
  // Italian uses a decimal comma.
  setCurrentLanguage('it');
  const activity: Activity = {
    id: '1',
    title: 'Dentista',
    start: new Date(2026, 10, 2, 16, 30),
    end: new Date(2026, 10, 2, 17, 0),
    color: '#B5305E',
    repeatDays: [],
    completedDates: [],
    skippedDates: [],
  };

  expect(formatLitres(1400)).toBe('1,4 L');
  expect(getActivityReminders([activity], today, 10)[0].body).toBe(
    'Tra 10 min, alle 16:30',
  );
});

test('names an imported event without a title in the chosen language', () => {
  // The untitled name comes from the screen that imports the file.
  const { activities } = parseIcs(
    'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20261105T100000\r\nEND:VEVENT\r\nEND:VCALENDAR',
    today,
    '#B5305E',
    italian.activity.untitled,
  );

  expect(activities[0].title).toBe('Attività senza titolo');
});
