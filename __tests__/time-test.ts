import {
  completeTimeInput,
  formatTime,
  formatTimeInput,
  getDefaultEndText,
  parseTime,
  parseTimeRange,
} from '../src/calendar/time';

test('pads hours and minutes to two digits', () => {
  expect(formatTime(new Date(2026, 10, 2, 9, 5))).toBe('09:05');
  expect(formatTime(new Date(2026, 10, 2, 16, 30))).toBe('16:30');
});

test('adds the colon while typing and keeps digits only', () => {
  expect(formatTimeInput('16')).toBe('16');
  expect(formatTimeInput('163')).toBe('16:3');
  expect(formatTimeInput('1630')).toBe('16:30');
  expect(formatTimeInput('16305')).toBe('16:30');
  expect(formatTimeInput('a1b')).toBe('1');
});

test('adds the leading zero to an hour with one possible digit', () => {
  expect(formatTimeInput('9')).toBe('09');
  expect(formatTimeInput('930')).toBe('09:30');
  expect(formatTimeInput('09')).toBe('09');
});

test('drops digits that would make an impossible time', () => {
  expect(formatTimeInput('68')).toBe('06');
  expect(formatTimeInput('6844')).toBe('06:44');
  expect(formatTimeInput('24')).toBe('2');
  expect(formatTimeInput('2359')).toBe('23:59');
  expect(formatTimeInput('1670')).toBe('16:0');
});

test('lets the user delete everything', () => {
  expect(formatTimeInput('16:')).toBe('16');
  expect(formatTimeInput('0')).toBe('0');
  expect(formatTimeInput('')).toBe('');
});

test('parses complete times', () => {
  expect(parseTime('16:30')).toEqual({ hours: 16, minutes: 30 });
  expect(parseTime('09:05')).toEqual({ hours: 9, minutes: 5 });
  expect(parseTime('16')).toEqual({ hours: 16, minutes: 0 });
  expect(parseTime('00:00')).toEqual({ hours: 0, minutes: 0 });
  expect(parseTime('23:59')).toEqual({ hours: 23, minutes: 59 });
});

test('completes partial times', () => {
  expect(parseTime('1')).toEqual({ hours: 1, minutes: 0 });
  expect(parseTime('16:3')).toEqual({ hours: 16, minutes: 30 });
  expect(completeTimeInput('12:0')).toBe('12:00');
  expect(completeTimeInput('12:3')).toBe('12:30');
  expect(completeTimeInput('12')).toBe('12:00');
  expect(completeTimeInput('1')).toBe('01:00');
  expect(completeTimeInput('16:30')).toBe('16:30');
  expect(completeTimeInput('')).toBe('');
});

test('rejects empty and impossible times', () => {
  expect(parseTime('')).toBeNull();
  expect(parseTime('24:00')).toBeNull();
  expect(parseTime('12:60')).toBeNull();
  expect(parseTime('68:44')).toBeNull();
});

test('ends 30 minutes after the start without leaving the day', () => {
  expect(getDefaultEndText('16:30')).toBe('17:00');
  expect(getDefaultEndText('09')).toBe('09:30');
  expect(getDefaultEndText('23:45')).toBe('23:59');
  expect(getDefaultEndText('23:59')).toBe('');
  expect(getDefaultEndText('16:3')).toBe('17:00');
  expect(getDefaultEndText('')).toBe('');
});

test('accepts a range only when the end is after the start', () => {
  expect(parseTimeRange('00:00', '23:59')).toEqual({
    start: { hours: 0, minutes: 0 },
    end: { hours: 23, minutes: 59 },
  });
  expect(parseTimeRange('16:30', '16:30')).toBeNull();
  expect(parseTimeRange('16:30', '16:00')).toBeNull();
  expect(parseTimeRange('', '17:00')).toBeNull();
  expect(parseTimeRange('16:30', '')).toBeNull();
});
