import {
  Activity,
  isCompletedOn,
  minutesOfDay,
  occursOn,
  toDateKey,
} from '../calendar/activities';
import { formatDuration, formatTime } from '../calendar/time';
import { DAILY_GOAL_ML, GLASS_ML } from '../water/water';

export type ReminderSettings = {
  // Null turns the reminders off.
  activityLeadMinutes: number | null;
  waterIntervalMinutes: number | null;
  waterStartMinutes: number;
  waterEndMinutes: number;
};

export type Reminder = {
  id: string;
  date: Date;
  title: string;
  body: string;
  channelId: 'activities' | 'water';
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  activityLeadMinutes: 10,
  waterIntervalMinutes: 120,
  waterStartMinutes: 9 * 60,
  waterEndMinutes: 21 * 60,
};

// Reminders are planned a week ahead and planned again each time the app opens,
// so a week without opening it is the longest they can run out.
export const REMINDER_DAYS = 7;
// Android limits how many alarms an app can set, so the earliest ones are kept.
const MAX_ACTIVITY_REMINDERS = 50;

function atMinutes(day: Date, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
}

function upcomingDays(now: Date): Date[] {
  return Array.from(
    { length: REMINDER_DAYS },
    (_, offset) =>
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset),
  );
}

export function getActivityReminders(
  activities: Activity[],
  now: Date,
  leadMinutes: number | null,
): Reminder[] {
  if (leadMinutes === null) return [];

  const reminders: Reminder[] = [];

  for (const day of upcomingDays(now)) {
    for (const activity of activities) {
      if (!occursOn(activity, day) || isCompletedOn(activity, day)) continue;

      const start = atMinutes(day, minutesOfDay(activity.start));
      const date = new Date(start.getTime() - leadMinutes * 60_000);
      if (date <= now) continue;

      reminders.push({
        id: `activity-${activity.id}-${toDateKey(day)}`,
        date,
        title: activity.title,
        body:
          leadMinutes === 0
            ? `Starts now, at ${formatTime(start)}`
            : `In ${formatDuration(leadMinutes)}, at ${formatTime(start)}`,
        channelId: 'activities',
      });
    }
  }

  return reminders
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_ACTIVITY_REMINDERS);
}

// Today stops once the goal is reached. Later days cannot know it yet, so they
// are planned in full and planned again when water is added.
export function getWaterReminders(
  settings: ReminderSettings,
  now: Date,
  glassesToday: number,
): Reminder[] {
  const { waterIntervalMinutes, waterStartMinutes, waterEndMinutes } = settings;
  if (waterIntervalMinutes === null) return [];

  const reminders: Reminder[] = [];
  const isGoalReachedToday = glassesToday * GLASS_ML >= DAILY_GOAL_ML;

  upcomingDays(now).forEach((day, offset) => {
    if (offset === 0 && isGoalReachedToday) return;

    for (
      let minutes = waterStartMinutes;
      minutes <= waterEndMinutes;
      minutes += waterIntervalMinutes
    ) {
      const date = atMinutes(day, minutes);
      if (date <= now) continue;

      reminders.push({
        id: `water-${toDateKey(day)}-${minutes}`,
        date,
        title: 'Time for a glass of water',
        body: 'Every glass brings you closer to 2 L today.',
        channelId: 'water',
      });
    }
  });

  return reminders;
}
