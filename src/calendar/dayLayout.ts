import { Activity, minutesOfDay } from './activities';

export const HOUR_HEIGHT = 80;

const MIN_CARD_HEIGHT = 64;

export type PositionedActivity = {
  activity: Activity;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
};

// Cards that would overlap on the timeline are placed side by side in lanes.
export function layoutDay(sortedActivities: Activity[]): PositionedActivity[] {
  const positioned: PositionedActivity[] = [];
  let group: PositionedActivity[] = [];
  let laneBottoms: number[] = [];

  function closeGroup() {
    for (const item of group) item.laneCount = laneBottoms.length;
    group = [];
    laneBottoms = [];
  }

  for (const activity of sortedActivities) {
    const top = (minutesOfDay(activity.start) / 60) * HOUR_HEIGHT;
    const duration = minutesOfDay(activity.end) - minutesOfDay(activity.start);
    const height = Math.max((duration / 60) * HOUR_HEIGHT, MIN_CARD_HEIGHT);

    if (laneBottoms.length > 0 && top >= Math.max(...laneBottoms)) closeGroup();

    const freeLane = laneBottoms.findIndex((bottom) => bottom <= top);
    const lane = freeLane === -1 ? laneBottoms.length : freeLane;
    laneBottoms[lane] = top + height;

    const item = { activity, top, height, lane, laneCount: 1 };
    group.push(item);
    positioned.push(item);
  }

  closeGroup();

  return positioned;
}
