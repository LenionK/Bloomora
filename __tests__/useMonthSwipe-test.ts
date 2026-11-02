import { getMonthOffset, isHorizontalDrag } from '../src/calendar/useMonthSwipe';

test('claims only sideways drags', () => {
  expect(isHorizontalDrag(30, 5)).toBe(true);
  expect(isHorizontalDrag(-30, 5)).toBe(true);
  expect(isHorizontalDrag(5, 0)).toBe(false);
  expect(isHorizontalDrag(30, 60)).toBe(false);
});

test('drags left to the next month and right to the previous one', () => {
  expect(getMonthOffset(-80)).toBe(1);
  expect(getMonthOffset(80)).toBe(-1);
});

test('ignores short drags', () => {
  expect(getMonthOffset(-49)).toBe(0);
  expect(getMonthOffset(49)).toBe(0);
});
