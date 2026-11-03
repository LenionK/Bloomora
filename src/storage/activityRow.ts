import { Activity } from '../calendar/activities';

export type ActivityRow = {
  id: string;
  title: string;
  start_at: number;
  end_at: number;
  color: string;
  repeat_days: string;
  completed_dates: string;
  skipped_dates: string;
};

export function activityToRow(activity: Activity): ActivityRow {
  return {
    id: activity.id,
    title: activity.title,
    start_at: activity.start.getTime(),
    end_at: activity.end.getTime(),
    color: activity.color,
    repeat_days: JSON.stringify(activity.repeatDays),
    completed_dates: JSON.stringify(activity.completedDates),
    skipped_dates: JSON.stringify(activity.skippedDates),
  };
}

export function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    title: row.title,
    start: new Date(row.start_at),
    end: new Date(row.end_at),
    color: row.color,
    repeatDays: JSON.parse(row.repeat_days),
    completedDates: JSON.parse(row.completed_dates),
    skippedDates: JSON.parse(row.skipped_dates),
  };
}
