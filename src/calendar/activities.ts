import { NewActivity } from '../components/AddActivityModal';

export type Activity = NewActivity & {
  id: string;
  completedDates: string[];
  skippedDates: string[];
};

export type Occurrence = {
  activity: Activity;
  start: Date;
  end: Date;
};

export type CleanupPeriod = 'week' | 'month' | 'year';

// Far enough to find the next repetition when the closest ones are completed or skipped.
const OCCURRENCE_SEARCH_DAYS = 366;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

function isRepeating(activity: Activity): boolean {
  return activity.repeatDays.length > 0;
}

export function occursOn(activity: Activity, date: Date): boolean {
  const day = startOfDay(date);
  const firstDay = startOfDay(activity.start);
  const isScheduled = isRepeating(activity)
    ? activity.repeatDays.includes((date.getDay() + 6) % 7) && day >= firstDay
    : day === firstDay;

  return isScheduled && !activity.skippedDates.includes(toDateKey(date));
}

export function getDaysWithActivities(
  activities: Activity[],
  year: number,
  month: number,
): Set<number> {
  const days = new Set<number>();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (const activity of activities) {
    if (isRepeating(activity)) {
      for (let day = 1; day <= daysInMonth; day++) {
        if (!days.has(day) && occursOn(activity, new Date(year, month, day))) {
          days.add(day);
        }
      }
    } else if (
      activity.start.getFullYear() === year &&
      activity.start.getMonth() === month &&
      occursOn(activity, activity.start)
    ) {
      days.add(activity.start.getDate());
    }
  }

  return days;
}

export function getActivitiesForDate(activities: Activity[], date: Date): Activity[] {
  return activities
    .filter((activity) => occursOn(activity, date))
    .sort((a, b) => minutesOfDay(a.start) - minutesOfDay(b.start));
}

export function isCompletedOn(activity: Activity, date: Date): boolean {
  return activity.completedDates.includes(toDateKey(date));
}

export function toggleCompletedOn(activity: Activity, date: Date): Activity {
  const dateKey = toDateKey(date);

  return {
    ...activity,
    completedDates: isCompletedOn(activity, date)
      ? activity.completedDates.filter((key) => key !== dateKey)
      : [...activity.completedDates, dateKey],
  };
}

export function skipDates(activity: Activity, dateKeys: string[]): Activity {
  return {
    ...activity,
    skippedDates: [...activity.skippedDates, ...dateKeys],
  };
}

export function getUpcomingDates(
  activity: Activity,
  from: Date,
  count: number,
): Date[] {
  const dates: Date[] = [];

  for (let offset = 0; offset < OCCURRENCE_SEARCH_DAYS; offset++) {
    const date = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate() + offset,
    );

    if (occursOn(activity, date)) dates.push(date);
    if (dates.length === count) break;
  }

  return dates;
}

function withTimeOf(date: Date, time: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
  );
}

function findNextOccurrence(activity: Activity, now: Date): Occurrence | null {
  const from = activity.start > now ? activity.start : now;
  const searchDays = isRepeating(activity) ? OCCURRENCE_SEARCH_DAYS : 1;

  for (let offset = 0; offset < searchDays; offset++) {
    const date = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate() + offset,
    );
    const end = withTimeOf(date, activity.end);

    if (occursOn(activity, date) && !isCompletedOn(activity, date) && end > now) {
      return { activity, start: withTimeOf(date, activity.start), end };
    }
  }

  return null;
}

export function getCleanupCutoff(period: CleanupPeriod, now: Date): Date {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  if (period === 'week') return new Date(year, month, day - 7);
  if (period === 'year') return new Date(year - 1, month, day);

  const lastDayOfPreviousMonth = new Date(year, month, 0).getDate();

  return new Date(year, month - 1, Math.min(day, lastDayOfPreviousMonth));
}

// Repeating activities have no end, so they are never considered old.
export function getOldActivities(
  activities: Activity[],
  cutoff: Date,
): Activity[] {
  return activities.filter(
    (activity) => !isRepeating(activity) && activity.end < cutoff,
  );
}

export function getNextOccurrence(
  activities: Activity[],
  now: Date,
): Occurrence | null {
  let next: Occurrence | null = null;

  for (const activity of activities) {
    const occurrence = findNextOccurrence(activity, now);

    if (occurrence && (!next || occurrence.start < next.start)) {
      next = occurrence;
    }
  }

  return next;
}
