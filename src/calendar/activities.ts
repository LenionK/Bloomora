import { NewActivity } from '../components/AddActivityModal';

export type Activity = NewActivity & {
  id: string;
  completedDates: string[];
};

export type Occurrence = {
  activity: Activity;
  start: Date;
  end: Date;
};

// Far enough to find the next repetition when the closest ones are completed.
const NEXT_OCCURRENCE_SEARCH_DAYS = 14;

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

export function occursOn(activity: Activity, date: Date): boolean {
  const day = startOfDay(date);
  const firstDay = startOfDay(activity.start);

  if (activity.repeatDays.length === 0) return day === firstDay;

  const weekday = (date.getDay() + 6) % 7;

  return activity.repeatDays.includes(weekday) && day >= firstDay;
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

  for (let offset = 0; offset < NEXT_OCCURRENCE_SEARCH_DAYS; offset++) {
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
