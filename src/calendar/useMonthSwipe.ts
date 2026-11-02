import { useMemo } from 'react';
import { PanResponder } from 'react-native';

const MIN_DRAG_TO_CLAIM = 10;
const MIN_DRAG_TO_CHANGE_MONTH = 50;

export function isHorizontalDrag(dx: number, dy: number): boolean {
  return Math.abs(dx) > MIN_DRAG_TO_CLAIM && Math.abs(dx) > Math.abs(dy);
}

export function getMonthOffset(dx: number): number {
  if (dx <= -MIN_DRAG_TO_CHANGE_MONTH) return 1;
  if (dx >= MIN_DRAG_TO_CHANGE_MONTH) return -1;

  return 0;
}

// Tapping still reaches the days: the gesture is claimed only once the finger moves sideways.
export function useMonthSwipe(onChangeMonth: (offset: number) => void) {
  return useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_event, { dx, dy }) =>
          isHorizontalDrag(dx, dy),
        onPanResponderRelease: (_event, { dx }) => {
          const offset = getMonthOffset(dx);

          if (offset !== 0) onChangeMonth(offset);
        },
      }).panHandlers,
    [onChangeMonth],
  );
}
