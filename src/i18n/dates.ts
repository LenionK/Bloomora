import { Strings } from './en';

// Weeks start on Monday: 0 is Monday and 6 is Sunday.
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function shortWeekday(date: Date, t: Strings): string {
  return t.dates.weekdaysShort[weekdayIndex(date)];
}

// "15 November" in English, "15 novembre" in Italian.
export function formatDayMonth(date: Date, t: Strings): string {
  return `${date.getDate()} ${t.dates.monthsInDate[date.getMonth()]}`;
}
