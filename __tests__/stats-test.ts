import { Activity } from '../src/calendar/activities';
import {
  addActivityStats,
  getActivityStats,
  getPeriodStart,
  getRecentActivities,
  getRecentWater,
  getScore,
  getWaterStats,
} from '../src/stats/stats';

// A Monday.
const today = new Date(2026, 10, 16, 15, 0);

function activity(changes: Partial<Activity>): Activity {
  return {
    id: '1',
    title: 'Gym',
    start: new Date(2026, 10, 2, 9, 0),
    end: new Date(2026, 10, 2, 10, 0),
    color: '#3559C7',
    repeatDays: [],
    completedDates: [],
    skippedDates: [],
    ...changes,
  };
}

test('counts a past one-time activity as done or missed', () => {
  // Each one-time activity is a single day in the stats.
  expect(
    getActivityStats([activity({ completedDates: ['2026-11-02'] })], today),
  ).toEqual({ done: 1, skipped: 0, missed: 0 });
  expect(getActivityStats([activity({})], today)).toEqual({
    done: 0,
    skipped: 0,
    missed: 1,
  });
});

test('counts an activity done today at once', () => {
  // Done is done, even before the day is over.
  const doneToday = activity({
    start: new Date(2026, 10, 16, 9, 0),
    end: new Date(2026, 10, 16, 10, 0),
    completedDates: ['2026-11-16'],
  });
  const mondays = activity({
    repeatDays: [0],
    completedDates: ['2026-11-02', '2026-11-16'],
  });

  expect(getActivityStats([doneToday], today)).toEqual({
    done: 1,
    skipped: 0,
    missed: 0,
  });
  expect(getActivityStats([mondays], today)).toEqual({
    done: 2,
    skipped: 0,
    missed: 1,
  });
});

test('does not count today as missed, nor the future', () => {
  // Today's activities not done yet can still be done, and future ones are not due.
  const todayActivity = activity({
    start: new Date(2026, 10, 16, 9, 0),
    end: new Date(2026, 10, 16, 10, 0),
  });
  const futureActivity = activity({
    start: new Date(2026, 10, 20, 9, 0),
    end: new Date(2026, 10, 20, 10, 0),
  });

  expect(getActivityStats([todayActivity, futureActivity], today)).toEqual({
    done: 0,
    skipped: 0,
    missed: 0,
  });
});

test('counts each past day of a repeating activity', () => {
  // Mondays from 2 November: the 2nd and the 9th are past, the 16th is today.
  const mondays = activity({
    repeatDays: [0],
    completedDates: ['2026-11-02'],
  });

  expect(getActivityStats([mondays], today)).toEqual({
    done: 1,
    skipped: 0,
    missed: 1,
  });
});

test('counts only the days from the start of a period', () => {
  // From 9 November: the 2nd is left out, the 9th is missed, the 16th is today.
  const mondays = activity({
    repeatDays: [0],
    completedDates: ['2026-11-02'],
    skippedDates: ['2026-11-02'],
  });

  expect(
    getActivityStats([mondays], today, getPeriodStart(today, 8)),
  ).toEqual({ done: 0, skipped: 0, missed: 1 });
  expect(getPeriodStart(today, 7)).toEqual(new Date(2026, 10, 10));
});

test('counts skipped days apart, without making them missed', () => {
  // A day removed on purpose is neither done nor missed.
  const mondays = activity({
    repeatDays: [0],
    completedDates: ['2026-11-02'],
    skippedDates: ['2026-11-09', '2026-11-23'],
  });

  expect(getActivityStats([mondays], today)).toEqual({
    done: 1,
    skipped: 1,
    missed: 0,
  });
});

test('adds the stats of deleted activities to the current ones', () => {
  // Kept totals and live counts are summed field by field.
  expect(
    addActivityStats(
      { done: 1, skipped: 2, missed: 3 },
      { done: 10, skipped: 20, missed: 30 },
    ),
  ).toEqual({ done: 11, skipped: 22, missed: 33 });
});

test('turns a count into a whole percentage, or none without data', () => {
  // With nothing to count there is no score yet, rather than zero.
  expect(getScore(3, 4)).toBe(75);
  expect(getScore(2, 3)).toBe(67);
  expect(getScore(0, 0)).toBeNull();
});

test('counts water days from the first one, today only once reached', () => {
  // Days with no row after the first one count as days below the goal.
  const stats = getWaterStats(
    [
      { date: '2026-11-12', glasses: 10 },
      { date: '2026-11-14', glasses: 10 },
      { date: '2026-11-15', glasses: 11 },
      { date: '2026-11-16', glasses: 4 },
    ],
    today,
  );

  expect(stats).toEqual({
    goalDays: 3,
    countedDays: 4,
    currentStreak: 2,
    bestStreak: 2,
  });
});

test('adds today to the streak once its goal is reached', () => {
  // Reaching 2 litres today extends the streak and counts the day.
  const stats = getWaterStats(
    [
      { date: '2026-11-15', glasses: 10 },
      { date: '2026-11-16', glasses: 10 },
    ],
    today,
  );

  expect(stats).toEqual({
    goalDays: 2,
    countedDays: 2,
    currentStreak: 2,
    bestStreak: 2,
  });
});

test('ends the current streak after a day below the goal', () => {
  // Yesterday below 2 litres resets the streak, but the best one stays.
  const stats = getWaterStats(
    [
      { date: '2026-11-12', glasses: 10 },
      { date: '2026-11-13', glasses: 10 },
      { date: '2026-11-14', glasses: 10 },
      { date: '2026-11-15', glasses: 2 },
    ],
    today,
  );

  expect(stats.currentStreak).toBe(0);
  expect(stats.bestStreak).toBe(3);
});

test('lists the water of the last 7 days, oldest first', () => {
  // Days without a row were not tracked, unlike a day recorded at zero.
  const recent = getRecentWater(
    [
      { date: '2026-11-10', glasses: 10 },
      { date: '2026-11-12', glasses: 0 },
      { date: '2026-11-16', glasses: 4 },
      { date: '2026-11-01', glasses: 10 },
    ],
    today,
  );

  expect(recent.map(({ date }) => date.getDate())).toEqual([
    10, 11, 12, 13, 14, 15, 16,
  ]);
  expect(recent.map(({ millilitres }) => millilitres)).toEqual([
    2000, null, 0, null, null, null, 800,
  ]);
});

test('lists the activities planned and done in the last days', () => {
  // A cancelled day is not planned, and today counts what is done so far.
  const mondays = activity({
    repeatDays: [0],
    completedDates: ['2026-11-16'],
    skippedDates: ['2026-11-09'],
  });

  const recent = getRecentActivities([mondays], today);

  expect(recent.map(({ date }) => date.getDate())).toEqual([
    10, 11, 12, 13, 14, 15, 16,
  ]);
  expect(recent[6]).toEqual(expect.objectContaining({ done: 1, planned: 1 }));
  expect(recent.slice(0, 6).every(({ planned }) => planned === 0)).toBe(true);
});

test('has no water stats before the first glass', () => {
  // Nothing is counted until the water screen is used.
  expect(getWaterStats([], today)).toEqual({
    goalDays: 0,
    countedDays: 0,
    currentStreak: 0,
    bestStreak: 0,
  });
});
