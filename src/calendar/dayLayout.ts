import { Activity, minutesOfDay } from './activities';
import { formatTimeOfDay } from './time';

export const HOUR_HEIGHT = 80;

const MIN_CARD_HEIGHT = 64;
const MIN_GAP_HEIGHT = 20;
const MIN_MINUTES_BETWEEN_TIME_MARKS = 12;

export type PositionedActivity = {
  activity: Activity;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
};

export type DayGap = {
  top: number;
  height: number;
  minutes: number;
};

export type TimeMark = {
  top: number;
  label: string;
  color?: string;
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

// The free time between cards, skipped when there is no room to show it.
export function getDayGaps(positioned: PositionedActivity[]): DayGap[] {
  const gaps: DayGap[] = [];
  let latestEnd: number | null = null;
  let lowestBottom = 0;

  for (const { activity, top, height } of positioned) {
    const start = minutesOfDay(activity.start);
    const end = minutesOfDay(activity.end);

    if (
      latestEnd !== null &&
      start > latestEnd &&
      top - lowestBottom >= MIN_GAP_HEIGHT
    ) {
      gaps.push({
        top: lowestBottom,
        height: top - lowestBottom,
        minutes: start - latestEnd,
      });
    }

    latestEnd = Math.max(latestEnd ?? end, end);
    lowestBottom = Math.max(lowestBottom, top + height);
  }

  return gaps;
}

// Activity times join the hours on the left. Times that would overlap on screen
// are dropped: starts win over ends, and both win over plain hours.
export function getTimeMarks(sortedActivities: Activity[]): TimeMark[] {
  const marks: { minutes: number; color?: string }[] = [];

  function addMark(minutes: number, color?: string) {
    const isTaken = marks.some(
      (mark) =>
        Math.abs(mark.minutes - minutes) < MIN_MINUTES_BETWEEN_TIME_MARKS,
    );

    if (!isTaken) marks.push({ minutes, color });
  }

  for (const { start, color } of sortedActivities) {
    addMark(minutesOfDay(start), color);
  }
  for (const { end, color } of sortedActivities) {
    addMark(minutesOfDay(end), color);
  }
  for (let hour = 0; hour < 24; hour++) addMark(hour * 60);

  return marks
    .sort((a, b) => a.minutes - b.minutes)
    .map(({ minutes, color }) => ({
      top: (minutes / 60) * HOUR_HEIGHT,
      label: formatTimeOfDay({
        hours: Math.floor(minutes / 60),
        minutes: minutes % 60,
      }),
      color,
    }));
}
