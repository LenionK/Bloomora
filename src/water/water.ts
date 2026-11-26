import { getStrings } from '../i18n/language';

export const GLASS_ML = 200;
export const DAILY_GOAL_ML = 2000;

export type WaterProgress = {
  millilitres: number;
  // From 0 to 1: drinking more than the goal keeps the bottle full.
  share: number;
  glassesLeft: number;
};

export function getWaterProgress(glasses: number): WaterProgress {
  const millilitres = glasses * GLASS_ML;

  return {
    millilitres,
    share: Math.min(millilitres / DAILY_GOAL_ML, 1),
    glassesLeft: Math.max(Math.ceil((DAILY_GOAL_ML - millilitres) / GLASS_ML), 0),
  };
}

// One decimal at most, and none when it is zero: 1.4 L, 2 L, or 1,4 L in Italian.
export function formatLitres(millilitres: number): string {
  const litres = String(Number((millilitres / 1000).toFixed(1)));

  return `${litres.replace('.', getStrings().decimalSeparator)} L`;
}
