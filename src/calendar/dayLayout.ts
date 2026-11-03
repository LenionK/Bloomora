import { Activity, minutesOfDay } from './activities';
import { formatTime, formatTimeOfDay } from './time';

// At this scale a 30 minute activity, the default one, is exactly as tall as the
// smallest card, so its end time matches the scale of the hours.
export const HOUR_HEIGHT = 128;
export const COMPACT_HOUR_HEIGHT = 32;
export const CARD_GAP = 4;

const HOURS_IN_DAY = 24;
const MIN_CARD_HEIGHT = 64;
const MIN_GAP_HEIGHT = 20;
const MIN_PIXELS_BETWEEN_TIME_MARKS = 16;

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

// Hours with no activity take less space, so the busy ones are closer together.
export function getHourHeights(activities: Activity[]): number[] {
  return Array.from({ length: HOURS_IN_DAY }, (_, hour) => {
    const isBusy = activities.some(
      ({ start, end }) =>
        minutesOfDay(start) < (hour + 1) * 60 && minutesOfDay(end) > hour * 60,
    );

    return isBusy ? HOUR_HEIGHT : COMPACT_HOUR_HEIGHT;
  });
}

export function getTimelinePosition(
  hourHeights: number[],
  minutes: number,
): number {
  const hour = Math.floor(minutes / 60);
  const previousHours = hourHeights
    .slice(0, hour)
    .reduce((total, height) => total + height, 0);

  return previousHours + (hourHeights[hour] * (minutes % 60)) / 60;
}

// Cards that would overlap on the timeline are placed side by side in lanes.
export function layoutDay(sortedActivities: Activity[]): PositionedActivity[] {
  const hourHeights = getHourHeights(sortedActivities);
  const positioned: PositionedActivity[] = [];
  let group: PositionedActivity[] = [];
  let laneBottoms: number[] = [];

  function closeGroup() {
    for (const item of group) item.laneCount = laneBottoms.length;
    group = [];
    laneBottoms = [];
  }

  for (const activity of sortedActivities) {
    const top = getTimelinePosition(hourHeights, minutesOfDay(activity.start));
    const bottom = getTimelinePosition(hourHeights, minutesOfDay(activity.end));
    const height = Math.max(bottom - top, MIN_CARD_HEIGHT);

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

// Activity times join the hours on the left, each end time level with the bottom
// of its card. Times that would overlap on screen are dropped: starts win over
// ends, and both win over plain hours.
export function getTimeMarks(positioned: PositionedActivity[]): TimeMark[] {
  const marks: TimeMark[] = [];
  const hourHeights = getHourHeights(
    positioned.map(({ activity }) => activity),
  );

  function addMark(top: number, label: string, color?: string) {
    const isTaken = marks.some(
      (mark) =>
        mark.label === label ||
        Math.abs(mark.top - top) < MIN_PIXELS_BETWEEN_TIME_MARKS,
    );

    if (!isTaken) marks.push({ top, label, color });
  }

  for (const { activity, top } of positioned) {
    addMark(top, formatTime(activity.start), activity.color);
  }
  for (const { activity, top, height } of positioned) {
    addMark(top + height - CARD_GAP, formatTime(activity.end), activity.color);
  }
  for (let hour = 0; hour < HOURS_IN_DAY; hour++) {
    addMark(
      getTimelinePosition(hourHeights, hour * 60),
      formatTimeOfDay({ hours: hour, minutes: 0 }),
    );
  }

  return marks.sort((a, b) => a.top - b.top);
}
