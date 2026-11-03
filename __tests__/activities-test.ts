import {
  Activity,
  getActivitiesForDate,
  getCleanupCutoff,
  getDaysWithActivities,
  getNextOccurrence,
  getOldActivities,
  getUpcomingDates,
  isCompletedOn,
  occursOn,
  skipDates,
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
    skippedDates: [],
  };
}

// 2 November 2026 is a Monday.
const monday = new Date(2026, 10, 2, 16, 30);

test('a one-time activity happens only on its day', () => {
  // Without repeat days, the activity exists only on its start date.
  expect(occursOn(activity(monday), new Date(2026, 10, 2))).toBe(true);
  expect(occursOn(activity(monday), new Date(2026, 10, 9))).toBe(false);
});

test('a repeating activity happens on its weekdays from its first day', () => {
  // It appears on the chosen weekdays, but never before its first day.
  const gym = activity(monday, [0]);

  expect(occursOn(gym, new Date(2026, 10, 2))).toBe(true);
  expect(occursOn(gym, new Date(2026, 10, 9))).toBe(true);
  expect(occursOn(gym, new Date(2026, 10, 3))).toBe(false);
  expect(occursOn(gym, new Date(2026, 9, 26))).toBe(false);
});

test('a skipped date removes only that repetition', () => {
  // The series goes on: the other weeks are not touched.
  const gym = skipDates(activity(monday, [0]), ['2026-11-09']);

  expect(occursOn(gym, new Date(2026, 10, 9))).toBe(false);
  expect(occursOn(gym, new Date(2026, 10, 2))).toBe(true);
  expect(occursOn(gym, new Date(2026, 10, 16))).toBe(true);
});

test('lists the upcoming dates without the skipped ones', () => {
  // These are the dates offered when choosing which days to delete.
  const gym = skipDates(activity(monday, [0, 2]), ['2026-11-04']);
  const dates = getUpcomingDates(gym, new Date(2026, 10, 2), 3);

  expect(dates).toEqual([
    new Date(2026, 10, 2),
    new Date(2026, 10, 9),
    new Date(2026, 10, 11),
  ]);
});

test('keeps the activities of a day and sorts them by start time', () => {
  // Sorting uses the time of day, because a repeating activity keeps its first date.
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
  // A late evening must stay on the same local day, with padded month and day.
  expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
});

test('completes each date of an activity on its own', () => {
  // Completing a repetition does not complete the others, and a second toggle undoes it.
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
  // Once the closest activity has ended, the next one takes its place.
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
  // An activity already started but not finished is still the next one.
  const next = getNextOccurrence(
    [activity(monday)],
    new Date(2026, 10, 2, 16, 45),
  );

  expect(next?.start).toEqual(monday);
});

test('finds a far future one-time activity', () => {
  // The next activity can be months away, beyond the search limit for repetitions.
  const start = new Date(2027, 5, 1, 9, 0);

  expect(getNextOccurrence([activity(start)], monday)?.start).toEqual(start);
});

test('skips completed repetitions and uses the date of the occurrence', () => {
  // The result has the date of the repetition, not the first date of the activity.
  const gym = toggleCompletedOn(activity(monday, [0]), new Date(2026, 10, 2));
  const next = getNextOccurrence([gym], new Date(2026, 10, 2, 8, 0));

  expect(next?.start).toEqual(new Date(2026, 10, 9, 16, 30));
  expect(next?.end).toEqual(new Date(2026, 10, 9, 17, 0));
});

test('finds the days of a month that have activities', () => {
  // These days get the dot, including repetitions and without the skipped ones.
  const once = activity(new Date(2026, 10, 5, 9, 0));
  const otherMonth = activity(new Date(2026, 9, 5, 9, 0));
  const gym = skipDates(activity(monday, [0]), ['2026-11-09']);
  const days = getDaysWithActivities([once, otherMonth, gym], 2026, 10);

  expect([...days].sort((a, b) => a - b)).toEqual([2, 5, 16, 23, 30]);
});

test('calculates how far back the old activities start', () => {
  // A shorter previous month must not push the date forward.
  const now = new Date(2026, 2, 31, 12, 0);

  expect(getCleanupCutoff('week', now)).toEqual(new Date(2026, 2, 24));
  expect(getCleanupCutoff('month', now)).toEqual(new Date(2026, 1, 28));
  expect(getCleanupCutoff('year', now)).toEqual(new Date(2025, 2, 31));
});

test('considers old only finished one-time activities', () => {
  // A repeating activity goes on, so it is never old even if it started long ago.
  const old = { ...activity(new Date(2026, 0, 1, 9, 0)), id: 'old' };
  const recent = { ...activity(new Date(2026, 10, 1, 9, 0)), id: 'recent' };
  const series = { ...activity(new Date(2026, 0, 1, 9, 0), [0]), id: 'series' };
  const ids = getOldActivities(
    [old, recent, series],
    new Date(2026, 5, 1),
  ).map(({ id }) => id);

  expect(ids).toEqual(['old']);
});

test('skips many deleted repetitions to find the next one', () => {
  // Removing several weeks must not make the activity disappear from the calendar.
  const gym = skipDates(activity(monday, [0]), [
    '2026-11-02',
    '2026-11-09',
    '2026-11-16',
    '2026-11-23',
  ]);
  const next = getNextOccurrence([gym], new Date(2026, 10, 2, 8, 0));

  expect(next?.start).toEqual(new Date(2026, 10, 30, 16, 30));
});

test('has no next occurrence when everything is over', () => {
  // There is no next activity with an empty list or with only past activities.
  expect(getNextOccurrence([], monday)).toBeNull();
  expect(
    getNextOccurrence([activity(monday)], new Date(2026, 10, 3)),
  ).toBeNull();
});
