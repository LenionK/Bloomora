import { Activity } from '../src/calendar/activities';
import { activityToRow, rowToActivity } from '../src/storage/activityRow';

const activity: Activity = {
  id: '1',
  title: 'Gym',
  start: new Date(2026, 10, 2, 16, 30),
  end: new Date(2026, 10, 2, 17, 0),
  color: '#3559C7',
  repeatDays: [0, 2],
  completedDates: ['2026-11-02'],
  skippedDates: ['2026-11-09'],
  description: 'Leg day',
};

test('stores dates as numbers and lists as text', () => {
  // A database row holds only numbers and text, so dates and lists are converted.
  const row = activityToRow(activity);

  expect(row.start_at).toBe(activity.start.getTime());
  expect(row.repeat_days).toBe('[0,2]');
});

test('gets back the same activity from its row', () => {
  // An activity saved and read back must stay identical.
  expect(rowToActivity(activityToRow(activity))).toEqual(activity);
});

test('saves an empty description for an activity without one', () => {
  // Activities created before descriptions existed have none.
  const { description, ...withoutDescription } = activity;

  expect(description).toBe('Leg day');
  expect(activityToRow(withoutDescription).description).toBe('');
});

test('shows an activity saved in the old orange in the new one', () => {
  // The orange was made darker for readability, and saved activities follow it.
  const row = { ...activityToRow(activity), color: '#C2570C' };

  expect(rowToActivity(row).color).toBe('#B9520B');
});
