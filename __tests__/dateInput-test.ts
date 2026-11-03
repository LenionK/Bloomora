import {
  completeTwoDigitInput,
  formatDayInput,
  formatMonthInput,
  formatYearInput,
  parseDateInputs,
  toDateInputs,
} from '../src/calendar/dateInput';

test('keeps only possible days while typing', () => {
  // A day that can only have one digit gets its zero, and 32 cannot be written.
  expect(formatDayInput('3')).toBe('3');
  expect(formatDayInput('5')).toBe('05');
  expect(formatDayInput('31')).toBe('31');
  expect(formatDayInput('35')).toBe('3');
  expect(formatDayInput('00')).toBe('0');
  expect(formatDayInput('1a2')).toBe('12');
  expect(formatDayInput('123')).toBe('12');
});

test('keeps only possible months while typing', () => {
  // A month that can only have one digit gets its zero, and 13 cannot be written.
  expect(formatMonthInput('1')).toBe('1');
  expect(formatMonthInput('2')).toBe('02');
  expect(formatMonthInput('12')).toBe('12');
  expect(formatMonthInput('13')).toBe('1');
  expect(formatMonthInput('00')).toBe('0');
});

test('keeps at most four digits in the year', () => {
  // Letters are dropped and the fifth digit is ignored.
  expect(formatYearInput('20a26')).toBe('2026');
  expect(formatYearInput('20267')).toBe('2026');
});

test('adds the missing zero when a field is left', () => {
  // An empty field stays empty, so it can be seen as missing.
  expect(completeTwoDigitInput('3')).toBe('03');
  expect(completeTwoDigitInput('12')).toBe('12');
  expect(completeTwoDigitInput('')).toBe('');
});

test('shows a date in the fields', () => {
  // Day and month always have two digits.
  expect(toDateInputs(new Date(2026, 0, 5))).toEqual({
    day: '05',
    month: '01',
    year: '2026',
  });
});

test('reads a date from the fields', () => {
  // A one-digit day is enough while the field is still being typed.
  expect(parseDateInputs({ day: '09', month: '11', year: '2026' })).toEqual(
    new Date(2026, 10, 9),
  );
  expect(parseDateInputs({ day: '9', month: '11', year: '2026' })).toEqual(
    new Date(2026, 10, 9),
  );
  expect(parseDateInputs({ day: '29', month: '02', year: '2028' })).toEqual(
    new Date(2028, 1, 29),
  );
});

test('refuses dates that do not exist or are incomplete', () => {
  // These would otherwise silently become a different date.
  expect(parseDateInputs({ day: '31', month: '02', year: '2026' })).toBeNull();
  expect(parseDateInputs({ day: '29', month: '02', year: '2026' })).toBeNull();
  expect(parseDateInputs({ day: '31', month: '11', year: '2026' })).toBeNull();
  expect(parseDateInputs({ day: '0', month: '11', year: '2026' })).toBeNull();
  expect(parseDateInputs({ day: '', month: '11', year: '2026' })).toBeNull();
  expect(parseDateInputs({ day: '10', month: '', year: '2026' })).toBeNull();
  expect(parseDateInputs({ day: '10', month: '11', year: '26' })).toBeNull();
  expect(parseDateInputs({ day: '10', month: '11', year: '0026' })).toBeNull();
});
