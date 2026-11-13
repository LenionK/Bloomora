import {
  Activity,
  isCompletedOn,
  occursOn,
  toDateKey,
} from '../calendar/activities';
import { DAILY_GOAL_ML, GLASS_ML } from '../water/water';

export type ActivityStats = {
  done: number;
  skipped: number;
  missed: number;
};

export type WaterDay = {
  date: string;
  glasses: number;
};

export type WaterStats = {
  goalDays: number;
  countedDays: number;
  currentStreak: number;
  bestStreak: number;
};

export const NO_ACTIVITY_STATS: ActivityStats = {
  done: 0,
  skipped: 0,
  missed: 0,
};

function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);

  return new Date(year, month - 1, day);
}

function nextDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

export function addActivityStats(
  a: ActivityStats,
  b: ActivityStats,
): ActivityStats {
  return {
    done: a.done + b.done,
    skipped: a.skipped + b.skipped,
    missed: a.missed + b.missed,
  };
}

// Activities done today count at once. The others of today are not missed yet,
// since there is still time to do them. Without `since`, every past day counts.
export function getActivityStats(
  activities: Activity[],
  today: Date,
  since?: Date,
): ActivityStats {
  const todayKey = toDateKey(today);
  const sinceKey = since ? toDateKey(since) : '';
  const stats = { ...NO_ACTIVITY_STATS };

  for (const activity of activities) {
    stats.skipped += activity.skippedDates.filter(
      (key) => key < todayKey && key >= sinceKey,
    ).length;

    const lastDay =
      activity.repeatDays.length > 0 ? nextDay(today) : nextDay(activity.start);
    const startKey = toDateKey(activity.start);
    const firstKey = sinceKey > startKey ? sinceKey : startKey;

    for (
      let date = fromDateKey(firstKey);
      toDateKey(date) <= todayKey && date < lastDay;
      date = nextDay(date)
    ) {
      if (!occursOn(activity, date)) continue;

      if (isCompletedOn(activity, date)) stats.done++;
      else if (toDateKey(date) < todayKey) stats.missed++;
    }
  }

  return stats;
}

// Days count from the first one with water. Today counts only once it reaches
// the goal, since it is not over yet.
export function getWaterStats(days: WaterDay[], today: Date): WaterStats {
  const todayKey = toDateKey(today);
  const pastDays = days.filter(({ date }) => date <= todayKey);
  const reached = new Set(
    pastDays
      .filter(({ glasses }) => glasses * GLASS_ML >= DAILY_GOAL_ML)
      .map(({ date }) => date),
  );
  const stats = { goalDays: 0, countedDays: 0, currentStreak: 0, bestStreak: 0 };

  if (pastDays.length === 0) return stats;

  const firstKey = pastDays.reduce(
    (first, { date }) => (date < first ? date : first),
    todayKey,
  );
  let streak = 0;

  for (
    let date = fromDateKey(firstKey);
    toDateKey(date) <= todayKey;
    date = nextDay(date)
  ) {
    const key = toDateKey(date);
    const isReached = reached.has(key);

    if (isReached || key < todayKey) stats.countedDays++;
    if (isReached) {
      stats.goalDays++;
      streak++;
      stats.bestStreak = Math.max(stats.bestStreak, streak);
    } else if (key < todayKey) {
      streak = 0;
    }
  }

  // A streak still counts today, before today's goal is reached.
  stats.currentStreak = streak;

  return stats;
}

// The first of the last `count` days, today included.
export function getPeriodStart(today: Date, count: number): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - count + 1);
}

export type DayWater = {
  date: Date;
  // Null for a day with nothing recorded, apart from one recorded at zero.
  millilitres: number | null;
};

export const RECENT_DAYS = 7;

// The last days up to today, oldest first.
export function getRecentWater(
  days: WaterDay[],
  today: Date,
  count = RECENT_DAYS,
): DayWater[] {
  const glassesByDate = new Map(days.map(({ date, glasses }) => [date, glasses]));

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (count - 1 - index),
    );

    const glasses = glassesByDate.get(toDateKey(date));

    return {
      date,
      millilitres: glasses === undefined ? null : glasses * GLASS_ML,
    };
  });
}

export type DayActivities = {
  date: Date;
  done: number;
  // Activities planned that day, not counting cancelled days.
  planned: number;
};

// The last days up to today, oldest first, with how many activities were done.
export function getRecentActivities(
  activities: Activity[],
  today: Date,
  count = RECENT_DAYS,
): DayActivities[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (count - 1 - index),
    );
    const planned = activities.filter((activity) => occursOn(activity, date));

    return {
      date,
      done: planned.filter((activity) => isCompletedOn(activity, date)).length,
      planned: planned.length,
    };
  });
}

export function getScore(successes: number, total: number): number | null {
  return total === 0 ? null : Math.round((successes / total) * 100);
}
