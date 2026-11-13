import { Activity } from '../src/calendar/activities';
import {
  DEFAULT_REMINDER_SETTINGS,
  getActivityReminders,
  getWaterReminders,
} from '../src/notifications/reminders';

// A Monday afternoon.
const now = new Date(2026, 10, 16, 15, 0);

function activity(changes: Partial<Activity>): Activity {
  return {
    id: '1',
    title: 'Gym',
    start: new Date(2026, 10, 16, 16, 30),
    end: new Date(2026, 10, 16, 17, 30),
    color: '#3559C7',
    repeatDays: [],
    completedDates: [],
    skippedDates: [],
    ...changes,
  };
}

test('reminds of an activity the chosen minutes before it starts', () => {
  // The reminder carries the title and when the activity starts.
  expect(getActivityReminders([activity({})], now, 10)).toEqual([
    {
      id: 'activity-1-2026-11-16',
      date: new Date(2026, 10, 16, 16, 20),
      title: 'Gym',
      body: 'In 10 min, at 16:30',
      channelId: 'activities',
    },
  ]);
  expect(getActivityReminders([activity({})], now, 0)[0]).toEqual(
    expect.objectContaining({
      date: new Date(2026, 10, 16, 16, 30),
      body: 'Starts now, at 16:30',
    }),
  );
  expect(getActivityReminders([activity({})], now, 60)[0].body).toBe(
    'In 1 h, at 16:30',
  );
});

test('does not remind of past, done or switched off activities', () => {
  // A reminder time already gone, a done activity and the Off choice give nothing.
  expect(getActivityReminders([activity({})], now, 120)).toEqual([]);
  expect(
    getActivityReminders(
      [activity({ completedDates: ['2026-11-16'] })],
      now,
      10,
    ),
  ).toEqual([]);
  expect(getActivityReminders([activity({})], now, null)).toEqual([]);
});

test('plans a repeating activity for the coming week only', () => {
  // Mondays and Wednesdays: today and Wednesday, while next Monday is 7 days away.
  const reminders = getActivityReminders(
    [activity({ repeatDays: [0, 2] })],
    now,
    10,
  );

  expect(reminders.map(({ id }) => id)).toEqual([
    'activity-1-2026-11-16',
    'activity-1-2026-11-18',
  ]);
});

test('reminds to drink from start to end at each interval', () => {
  // From 9:00 to 21:00 every 2 hours, at 15:00 only 17:00, 19:00 and 21:00 are ahead.
  const reminders = getWaterReminders(DEFAULT_REMINDER_SETTINGS, now, 3);
  const today = reminders.filter(({ id }) => id.startsWith('water-2026-11-16'));

  expect(today.map(({ date }) => date.getHours())).toEqual([17, 19, 21]);
  expect(today[0]).toEqual(
    expect.objectContaining({
      id: 'water-2026-11-16-1020',
      title: 'Time for a glass of water',
      channelId: 'water',
    }),
  );
});

test('plans a full week of drink reminders', () => {
  // Seven reminders a day from 9:00 to 21:00 every 2 hours, three left today.
  expect(getWaterReminders(DEFAULT_REMINDER_SETTINGS, now, 0)).toHaveLength(
    3 + 6 * 7,
  );
});

test('stops the drink reminders of today once 2 litres are reached', () => {
  // The following days still get theirs, since their water is not known yet.
  const reminders = getWaterReminders(DEFAULT_REMINDER_SETTINGS, now, 10);

  expect(reminders.some(({ id }) => id.startsWith('water-2026-11-16'))).toBe(
    false,
  );
  expect(reminders).toHaveLength(6 * 7);
});

test('follows the chosen hours and interval, or none when off', () => {
  // Every hour from 10:00 to 12:00 gives three reminders a day.
  const hourly = {
    ...DEFAULT_REMINDER_SETTINGS,
    waterIntervalMinutes: 60,
    waterStartMinutes: 10 * 60,
    waterEndMinutes: 12 * 60,
  };
  const tomorrow = getWaterReminders(hourly, now, 0).filter(({ id }) =>
    id.startsWith('water-2026-11-17'),
  );

  expect(tomorrow.map(({ date }) => date.getHours())).toEqual([10, 11, 12]);
  expect(
    getWaterReminders(
      { ...DEFAULT_REMINDER_SETTINGS, waterIntervalMinutes: null },
      now,
      0,
    ),
  ).toEqual([]);
});
