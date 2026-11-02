export type TimeOfDay = {
  hours: number;
  minutes: number;
};

const DEFAULT_DURATION_MINUTES = 30;
const LAST_MINUTE_OF_DAY = 23 * 60 + 59;

export function formatTime(time: Date): string {
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

// Digits that would make an impossible time are dropped while typing, and an
// hour that can only have one digit gets its leading zero: 9 becomes 09.
export function formatTimeInput(text: string): string {
  let digits = '';

  for (const digit of text.replace(/\D/g, '')) {
    const value = Number(digit);

    if (digits.length === 0) {
      digits = value > 2 ? `0${digit}` : digit;
    } else if (digits.length === 1) {
      if (digits === '2' && value > 3) continue;
      digits += digit;
    } else if (digits.length === 2) {
      if (value > 5) continue;
      digits += digit;
    } else if (digits.length === 3) {
      digits += digit;
    }
  }

  if (digits.length < 3) return digits;

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

// A partial time counts as complete: 9 is 09:00 and 12:3 is 12:30.
export function parseTime(text: string): TimeOfDay | null {
  const digits = text.replace(/\D/g, '');
  if (digits.length === 0 || digits.length > 4) return null;

  const hours = Number(digits.slice(0, 2));
  const minutes = Number(digits.slice(2).padEnd(2, '0'));
  if (hours > 23 || minutes > 59) return null;

  return { hours, minutes };
}

function formatTimeOfDay(time: TimeOfDay): string {
  const hours = String(time.hours).padStart(2, '0');
  const minutes = String(time.minutes).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function completeTimeInput(text: string): string {
  const time = parseTime(text);

  return time ? formatTimeOfDay(time) : text;
}

function toMinutes(time: TimeOfDay): number {
  return time.hours * 60 + time.minutes;
}

export function getDefaultEndText(startText: string): string {
  const start = parseTime(startText);
  if (!start) return '';

  const startMinutes = toMinutes(start);
  const endMinutes = Math.min(
    startMinutes + DEFAULT_DURATION_MINUTES,
    LAST_MINUTE_OF_DAY,
  );
  if (endMinutes === startMinutes) return '';

  return formatTimeOfDay({
    hours: Math.floor(endMinutes / 60),
    minutes: endMinutes % 60,
  });
}

export function parseTimeRange(
  startText: string,
  endText: string,
): { start: TimeOfDay; end: TimeOfDay } | null {
  const start = parseTime(startText);
  const end = parseTime(endText);
  if (!start || !end || toMinutes(end) <= toMinutes(start)) return null;

  return { start, end };
}
