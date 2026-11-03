export type DateInputs = {
  day: string;
  month: string;
  year: string;
};

const MAX_DAY = 31;
const MAX_MONTH = 12;
const YEAR_DIGITS = 4;

// Digits that would make an impossible value are dropped while typing, and a
// value that can only have one digit gets its leading zero: 5 becomes 05.
function formatTwoDigitInput(text: string, max: number): string {
  let digits = '';

  for (const digit of text.replace(/\D/g, '')) {
    if (digits.length === 0) {
      digits = Number(digit) > Math.floor(max / 10) ? `0${digit}` : digit;
    } else if (digits.length === 1) {
      const value = Number(digits + digit);
      if (value > 0 && value <= max) digits += digit;
    }
  }

  return digits;
}

export function formatDayInput(text: string): string {
  return formatTwoDigitInput(text, MAX_DAY);
}

export function formatMonthInput(text: string): string {
  return formatTwoDigitInput(text, MAX_MONTH);
}

export function formatYearInput(text: string): string {
  return text.replace(/\D/g, '').slice(0, YEAR_DIGITS);
}

export function completeTwoDigitInput(text: string): string {
  return text === '' ? '' : text.padStart(2, '0');
}

export function toDateInputs(date: Date): DateInputs {
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    year: String(date.getFullYear()),
  };
}

// A date that does not exist, such as 31 February, moves to another month when
// built, so comparing it with what was typed finds it.
export function parseDateInputs({ day, month, year }: DateInputs): Date | null {
  if (year.length !== YEAR_DIGITS) return null;

  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const isSameDate =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);

  return isSameDate ? date : null;
}
