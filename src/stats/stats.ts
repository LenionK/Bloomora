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

// Only days before today count, because today's activities can still be done.
export function getActivityStats(
  activities: Activity[],
  today: Date,
): ActivityStats {
  const todayKey = toDateKey(today);
  const stats = { ...NO_ACTIVITY_STATS };

  for (const activity of activities) {
    stats.skipped += activity.skippedDates.filter((key) => key < todayKey).length;

    const lastDay =
      activity.repeatDays.length > 0 ? today : nextDay(activity.start);

    for (
      let date = fromDateKey(toDateKey(activity.start));
      toDateKey(date) < todayKey && date < lastDay;
      date = nextDay(date)
    ) {
      if (!occursOn(activity, date)) continue;

      if (isCompletedOn(activity, date)) stats.done++;
      else stats.missed++;
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

export function getScore(successes: number, total: number): number | null {
  return total === 0 ? null : Math.round((successes / total) * 100);
}
