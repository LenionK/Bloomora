import { formatLitres, getWaterProgress } from '../src/water/water';

test('counts the water of the glasses drunk', () => {
  // Each glass is 200 ml, so ten of them reach the daily 2 litres.
  expect(getWaterProgress(0)).toEqual({ millilitres: 0, share: 0, glassesLeft: 10 });
  expect(getWaterProgress(7)).toEqual({
    millilitres: 1400,
    share: 0.7,
    glassesLeft: 3,
  });
  expect(getWaterProgress(10)).toEqual({
    millilitres: 2000,
    share: 1,
    glassesLeft: 0,
  });
});

test('keeps counting after the goal without overfilling the bottle', () => {
  // Extra glasses still count, but the bottle cannot be more than full.
  expect(getWaterProgress(12)).toEqual({
    millilitres: 2400,
    share: 1,
    glassesLeft: 0,
  });
});

test('writes litres with one decimal at most', () => {
  // A whole number of litres needs no decimal.
  expect(formatLitres(0)).toBe('0 L');
  expect(formatLitres(1400)).toBe('1.4 L');
  expect(formatLitres(2000)).toBe('2 L');
  expect(formatLitres(2200)).toBe('2.2 L');
});
