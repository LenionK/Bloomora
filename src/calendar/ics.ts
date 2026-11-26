import { NewActivity } from '../components/AddActivityModal';
import { Activity, toDateKey } from './activities';

// What Bloomora keeps of an .ics file (RFC 5545). Only events from today on are
// taken. A weekly or daily repeat with no end becomes a repeating activity;
// other repeats become one-time activities for each date in the next months.
// Times with a TZID are read as the phone's own time.

export type ImportedActivity = NewActivity & { skippedDates: string[] };

export type IcsImport = {
  activities: ImportedActivity[];
  // Events over before today.
  past: number;
  // Events whose dates Bloomora cannot work out, such as "the second Monday".
  unsupported: number;
};

const MAX_DESCRIPTION_LENGTH = 300;
const EXPAND_MONTHS = 3;
const DEFAULT_DURATION_MINUTES = 30;
const LAST_MINUTE = 23 * 60 + 59;
// All-day events become a short morning activity.
const ALL_DAY_START = 9 * 60;
const ALL_DAY_END = 9 * 60 + 30;
// A guard against endless rules, far above any real three months of dates.
const MAX_STEPS = 5000;
const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const SUPPORTED_RULE_PARTS = ['FREQ', 'INTERVAL', 'COUNT', 'UNTIL', 'BYDAY', 'BYMONTHDAY', 'WKST'];

type Property = {
  name: string;
  params: Record<string, string>;
  value: string;
};

type IcsTime = {
  day: Date;
  minutes: number;
  isAllDay: boolean;
  // The exact moment, to measure how long the event lasts.
  moment: Date;
};

type IcsEvent = {
  title: string;
  description: string;
  start: IcsTime;
  end: IcsTime | null;
  durationMinutes: number | null;
  rule: Record<string, string> | null;
  exceptions: string[];
};

// Long lines are folded onto the next ones, each starting with a space.
function unfold(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n')
    .filter((line) => line.trim() !== '');
}

function parseProperty(line: string): Property {
  const colon = line.indexOf(':');
  const head = colon === -1 ? line : line.slice(0, colon);
  const [name, ...params] = head.split(';');

  return {
    name: name.toUpperCase(),
    params: Object.fromEntries(
      params.map((param) => {
        const [key, ...rest] = param.split('=');
        return [key.toUpperCase(), rest.join('=')];
      }),
    ),
    value: colon === -1 ? '' : line.slice(colon + 1),
  };
}

function unescapeText(value: string): string {
  return value
    .replace(/\\[nN]/g, '\n')
    .replace(/\\([,;\\])/g, '$1')
    .trim();
}

function parseTime(property: Property): IcsTime | null {
  const value = property.value.trim();
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!match) return null;

  const [, year, month, day, hours, minutes, seconds, utc] = match;
  const isAllDay = property.params.VALUE === 'DATE' || hours === undefined;

  if (isAllDay) {
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return { day: date, minutes: 0, isAllDay: true, moment: date };
  }

  const parts = [
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds ?? 0),
  ] as const;
  const moment = utc ? new Date(Date.UTC(...parts)) : new Date(...parts);

  return {
    day: new Date(moment.getFullYear(), moment.getMonth(), moment.getDate()),
    minutes: moment.getHours() * 60 + moment.getMinutes(),
    isAllDay: false,
    moment,
  };
}

function parseDuration(value: string): number | null {
  const match = value.match(
    /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/,
  );
  if (!match) return null;

  const [, weeks, days, hours, minutes] = match.map(Number);
  return (
    (weeks || 0) * 7 * 24 * 60 +
    (days || 0) * 24 * 60 +
    (hours || 0) * 60 +
    (minutes || 0)
  );
}

function parseRule(value: string): Record<string, string> {
  return Object.fromEntries(
    value.split(';').map((part) => {
      const [key, ...rest] = part.split('=');
      return [key.toUpperCase(), rest.join('=').toUpperCase()];
    }),
  );
}

function readEvents(text: string): IcsEvent[] {
  const events: IcsEvent[] = [];
  let properties: Property[] | null = null;
  // Alarms and other parts nested in an event are left out.
  let nested = 0;

  for (const line of unfold(text)) {
    const property = parseProperty(line);

    if (property.name === 'BEGIN') {
      if (property.value.toUpperCase() === 'VEVENT') properties = [];
      else if (properties) nested++;
      continue;
    }
    if (property.name === 'END') {
      if (property.value.toUpperCase() === 'VEVENT' && properties) {
        const event = toEvent(properties);
        if (event) events.push(event);
        properties = null;
      } else if (nested > 0) {
        nested--;
      }
      continue;
    }
    if (properties && nested === 0) properties.push(property);
  }

  return events;
}

function toEvent(properties: Property[]): IcsEvent | null {
  const find = (name: string) => properties.find((p) => p.name === name);
  const status = find('STATUS')?.value.toUpperCase();
  const startProperty = find('DTSTART');
  if (status === 'CANCELLED' || !startProperty) return null;

  const start = parseTime(startProperty);
  if (!start) return null;

  const endProperty = find('DTEND');
  const durationProperty = find('DURATION');
  const ruleProperty = find('RRULE');

  return {
    title: unescapeText(find('SUMMARY')?.value ?? ''),
    description: unescapeText(find('DESCRIPTION')?.value ?? '').slice(
      0,
      MAX_DESCRIPTION_LENGTH,
    ),
    start,
    end: endProperty ? parseTime(endProperty) : null,
    durationMinutes: durationProperty ? parseDuration(durationProperty.value) : null,
    rule: ruleProperty ? parseRule(ruleProperty.value) : null,
    exceptions: properties
      .filter((p) => p.name === 'EXDATE')
      .flatMap((p) => p.value.split(',').map((value) => ({ ...p, value })))
      .map(parseTime)
      .filter((time): time is IcsTime => time !== null)
      .map(({ day }) => toDateKey(day)),
  };
}

// Bloomora activities fit in one day: an end on a later day stops at 23:59.
function getMinutes(event: IcsEvent): { start: number; end: number } {
  if (event.start.isAllDay) return { start: ALL_DAY_START, end: ALL_DAY_END };

  const start = Math.min(event.start.minutes, LAST_MINUTE - 1);
  const length = event.end
    ? Math.round((event.end.moment.getTime() - event.start.moment.getTime()) / 60000)
    : (event.durationMinutes ?? DEFAULT_DURATION_MINUTES);

  return { start, end: Math.min(start + Math.max(length, 1), LAST_MINUTE) };
}

function onDay(day: Date, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
}

function addDays(day: Date, days: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + days);
}

function weekdayIndex(day: Date): number {
  return (day.getDay() + 6) % 7;
}

// Weekdays named in BYDAY, or null when one has a position such as "2MO".
function readWeekdays(rule: Record<string, string>): number[] | null {
  if (!rule.BYDAY) return [];

  const days = rule.BYDAY.split(',').map((code) => WEEKDAYS.indexOf(code));
  return days.includes(-1) ? null : days.sort((a, b) => a - b);
}

function isSupported(rule: Record<string, string>): boolean {
  const freq = rule.FREQ;
  const parts = Object.keys(rule);

  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freq)) return false;
  if (!parts.every((part) => SUPPORTED_RULE_PARTS.includes(part))) return false;
  if (readWeekdays(rule) === null) return false;
  if (rule.BYDAY && freq !== 'WEEKLY' && freq !== 'DAILY') return false;
  if (rule.BYMONTHDAY && (freq !== 'MONTHLY' || !/^\d+$/.test(rule.BYMONTHDAY))) {
    return false;
  }
  return true;
}

// A weekly or daily repeat with no end, every week, is a Bloomora repeat.
function getRepeatDays(event: IcsEvent): number[] | null {
  const rule = event.rule;
  if (!rule || rule.COUNT || rule.UNTIL || (rule.INTERVAL && rule.INTERVAL !== '1')) {
    return null;
  }
  if ((rule.FREQ !== 'DAILY' && rule.FREQ !== 'WEEKLY') || rule.BYMONTHDAY) return null;

  const days = readWeekdays(rule);
  if (days === null) return null;
  if (days.length > 0) return days;
  return rule.FREQ === 'DAILY' ? [0, 1, 2, 3, 4, 5, 6] : [weekdayIndex(event.start.day)];
}

// The dates of a repeating event, in order, from its first one.
function* occurrences(event: IcsEvent): Generator<Date> {
  const rule = event.rule ?? {};
  const first = event.start.day;
  const interval = Math.max(Number(rule.INTERVAL ?? '1') || 1, 1);

  for (let step = 0; step < MAX_STEPS; step++) {
    if (rule.FREQ === 'DAILY') {
      const date = addDays(first, step * interval);
      const days = readWeekdays(rule) ?? [];
      if (days.length === 0 || days.includes(weekdayIndex(date))) yield date;
    } else if (rule.FREQ === 'WEEKLY') {
      const days = readWeekdays(rule) ?? [];
      const weekStart = addDays(first, -weekdayIndex(first) + step * interval * 7);
      for (const day of days.length > 0 ? days : [weekdayIndex(first)]) {
        const date = addDays(weekStart, day);
        if (date >= first) yield date;
      }
    } else if (rule.FREQ === 'MONTHLY') {
      const dayOfMonth = Number(rule.BYMONTHDAY ?? first.getDate());
      const date = new Date(
        first.getFullYear(),
        first.getMonth() + step * interval,
        dayOfMonth,
      );
      // A day that does not exist that month, such as the 31st, is left out.
      if (date.getDate() === dayOfMonth && date >= first) yield date;
    } else if (rule.FREQ === 'YEARLY') {
      const date = new Date(
        first.getFullYear() + step * interval,
        first.getMonth(),
        first.getDate(),
      );
      if (date.getDate() === first.getDate()) yield date;
    }
  }
}

function expand(event: IcsEvent, today: Date): Date[] {
  const rule = event.rule ?? {};
  const todayKey = toDateKey(today);
  const lastKey = toDateKey(
    new Date(today.getFullYear(), today.getMonth() + EXPAND_MONTHS, today.getDate()),
  );
  const untilTime = rule.UNTIL ? parseTime({ name: 'UNTIL', params: {}, value: rule.UNTIL }) : null;
  const untilKey = untilTime ? toDateKey(untilTime.day) : null;
  const count = rule.COUNT ? Number(rule.COUNT) : null;
  const dates: Date[] = [];
  let seen = 0;

  for (const date of occurrences(event)) {
    const key = toDateKey(date);
    if (key > lastKey || (untilKey && key > untilKey)) break;
    seen++;
    if (count !== null && seen > count) break;
    if (key >= todayKey && !event.exceptions.includes(key)) dates.push(date);
  }

  return dates;
}

// Events without a title get the untitled name of the app's language.
export function parseIcs(
  text: string,
  today: Date,
  color: string,
  untitled = 'Untitled activity',
): IcsImport {
  const todayKey = toDateKey(today);
  const result: IcsImport = { activities: [], past: 0, unsupported: 0 };

  for (const event of readEvents(text)) {
    const minutes = getMinutes(event);
    const base = {
      title: event.title || untitled,
      description: event.description,
      color,
    };
    const repeatDays = getRepeatDays(event);

    if (repeatDays) {
      // A series already going on starts again from its next date, so its past
      // days do not count as missed.
      let first = event.start.day;
      while (toDateKey(first) < todayKey || !repeatDays.includes(weekdayIndex(first))) {
        first = addDays(first, 1);
      }
      result.activities.push({
        ...base,
        start: onDay(first, minutes.start),
        end: onDay(first, minutes.end),
        repeatDays,
        skippedDates: event.exceptions.filter((key) => key >= todayKey),
      });
      continue;
    }

    if (event.rule && !isSupported(event.rule)) {
      result.unsupported++;
      continue;
    }

    const dates = event.rule ? expand(event, today) : [event.start.day];
    const upcoming = dates.filter((date) => toDateKey(date) >= todayKey);
    if (upcoming.length === 0) {
      result.past++;
      continue;
    }

    for (const date of upcoming) {
      result.activities.push({
        ...base,
        start: onDay(date, minutes.start),
        end: onDay(date, minutes.end),
        repeatDays: [],
        skippedDates: [],
      });
    }
  }

  return result;
}

function sameKey(activity: Pick<Activity, 'title' | 'start' | 'repeatDays'>): string {
  return `${activity.title}|${activity.start.getTime()}|${activity.repeatDays.join(',')}`;
}

// Importing the same file twice does not add its activities twice.
export function withoutDuplicates(
  imported: ImportedActivity[],
  existing: Activity[],
): { activities: ImportedActivity[]; duplicates: number } {
  const keys = new Set(existing.map(sameKey));
  const activities: ImportedActivity[] = [];

  for (const activity of imported) {
    const key = sameKey(activity);
    if (keys.has(key)) continue;
    keys.add(key);
    activities.push(activity);
  }

  return { activities, duplicates: imported.length - activities.length };
}
