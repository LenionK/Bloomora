import { buildMonthGrid } from '../src/calendar/monthGrid';

test('starts on the right weekday and fills the last week', () => {
  const cells = buildMonthGrid(2026, 10);

  expect(cells.slice(0, 7)).toEqual([null, null, null, null, null, null, 1]);
  expect(cells).toContain(30);
  expect(cells).not.toContain(31);
  expect(cells).toHaveLength(42);
});

test('adds no empty cells when the month fits exactly', () => {
  const cells = buildMonthGrid(2027, 1);

  expect(cells[0]).toBe(1);
  expect(cells).toHaveLength(28);
});

test('handles leap years', () => {
  expect(buildMonthGrid(2028, 1)).toContain(29);
});
