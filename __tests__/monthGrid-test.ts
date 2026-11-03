import { buildMonthGrid } from '../src/calendar/monthGrid';

test('starts on the right weekday and fills the last week', () => {
  // November 2026 starts on a Sunday, so 6 empty cells come first and 42 cells make 6 weeks.
  const cells = buildMonthGrid(2026, 10);

  expect(cells.slice(0, 7)).toEqual([null, null, null, null, null, null, 1]);
  expect(cells).toContain(30);
  expect(cells).not.toContain(31);
  expect(cells).toHaveLength(42);
});

test('adds no empty cells when the month fits exactly', () => {
  // February 2027 starts on a Monday and has 28 days, so it fills exactly 4 weeks.
  const cells = buildMonthGrid(2027, 1);

  expect(cells[0]).toBe(1);
  expect(cells).toHaveLength(28);
});

test('handles leap years', () => {
  // February 2028 has 29 days.
  expect(buildMonthGrid(2028, 1)).toContain(29);
});
