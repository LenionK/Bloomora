import {
  Activity,
  getActivitiesForDate,
  getNextOccurrence,
  isCompletedOn,
  occursOn,
  toDateKey,
  toggleCompletedOn,
} from '../src/calendar/activities';

function activity(start: Date, repeatDays: number[] = []): Activity {
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  return {
    id: '1',
    title: 'Gym',
    start,
    end,
    color: '#000000',
    repeatDays,
    completedDates: [],
  };
}

// 2 November 2026 is a Monday.
const monday = new Date(2026, 10, 2, 16, 30);

test('a one-time activity happens only on its day', () => {
  expect(occursOn(activity(monday), new Date(2026, 10, 2))).toBe(true);
  expect(occursOn(activity(monday), new Date(2026, 10, 9))).toBe(false);
});

test('a repeating activity happens on its weekdays from its first day', () => {
  const gym = activity(monday, [0]);

  expect(occursOn(gym, new Date(2026, 10, 2))).toBe(true);
  expect(occursOn(gym, new Date(2026, 10, 9))).toBe(true);
  expect(occursOn(gym, new Date(2026, 10, 3))).toBe(false);
  expect(occursOn(gym, new Date(2026, 9, 26))).toBe(false);
});

test('keeps the activities of a day and sorts them by start time', () => {
  const late = { ...activity(new Date(2026, 10, 2, 18, 0), [0]), id: 'late' };
  const early = { ...activity(new Date(2026, 10, 9, 9, 0)), id: 'early' };
  const other = { ...activity(new Date(2026, 10, 10, 9, 0)), id: 'other' };
  const ids = getActivitiesForDate(
    [late, other, early],
    new Date(2026, 10, 9),
  ).map(({ id }) => id);

  expect(ids).toEqual(['early', 'late']);
});

test('builds a date key from the local date', () => {
  expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
});

test('completes each date of an activity on its own', () => {
  const gym = activity(monday, [0]);
  const firstDay = new Date(2026, 10, 2);
  const secondDay = new Date(2026, 10, 9);
  const completed = toggleCompletedOn(gym, firstDay);

  expect(isCompletedOn(completed, firstDay)).toBe(true);
  expect(isCompletedOn(completed, secondDay)).toBe(false);
  expect(isCompletedOn(toggleCompletedOn(completed, firstDay), firstDay)).toBe(
    false,
  );
});

test('finds the closest occurrence that has not ended', () => {
  const soon = { ...activity(new Date(2026, 10, 2, 17, 0)), id: 'soon' };
  const later = { ...activity(new Date(2026, 10, 3, 9, 0)), id: 'later' };

  const next = getNextOccurrence(
    [later, soon],
    new Date(2026, 10, 2, 16, 0),
  );
  expect(next?.activity.id).toBe('soon');

  const afterSoon = getNextOccurrence(
    [later, soon],
    new Date(2026, 10, 2, 17, 30),
  );
  expect(afterSoon?.activity.id).toBe('later');
});

test('counts an activity in progress as the next one', () => {
  const next = getNextOccurrence(
    [activity(monday)],
    new Date(2026, 10, 2, 16, 45),
  );

  expect(next?.start).toEqual(monday);
});

test('finds a far future one-time activity', () => {
  const start = new Date(2027, 5, 1, 9, 0);

  expect(getNextOccurrence([activity(start)], monday)?.start).toEqual(start);
});

test('skips completed repetitions and uses the date of the occurrence', () => {
  const gym = toggleCompletedOn(activity(monday, [0]), new Date(2026, 10, 2));
  const next = getNextOccurrence([gym], new Date(2026, 10, 2, 8, 0));

  expect(next?.start).toEqual(new Date(2026, 10, 9, 16, 30));
  expect(next?.end).toEqual(new Date(2026, 10, 9, 17, 0));
});

test('has no next occurrence when everything is over', () => {
  expect(getNextOccurrence([], monday)).toBeNull();
  expect(
    getNextOccurrence([activity(monday)], new Date(2026, 10, 3)),
  ).toBeNull();
});
