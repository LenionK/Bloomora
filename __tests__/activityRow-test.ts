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
