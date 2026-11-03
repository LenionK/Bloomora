import { render } from '@testing-library/react-native';
import DayScreen from '../src/screens/DayScreen';

let mockSwipe: (offset: number) => void;

jest.mock('../src/calendar/useHorizontalSwipe', () => ({
  useHorizontalSwipe: (onSwipe: (offset: number) => void) => {
    mockSwipe = onSwipe;
    return {};
  },
}));

async function renderDay(date: Date, onChangeDate: (date: Date) => void) {
  await render(
    <DayScreen
      activities={[]}
      date={date}
      onAdd={jest.fn()}
      onBack={jest.fn()}
      onChangeDate={onChangeDate}
      onDelete={jest.fn()}
      onEdit={jest.fn()}
      onSkipDates={jest.fn()}
      onToggleCompleted={jest.fn()}
      today={date}
    />,
  );
}

test('swiping moves to the next and the previous day', async () => {
  // The swipe does the same as the day arrows, across the end of a month too.
  const onChangeDate = jest.fn();
  await renderDay(new Date(2026, 10, 30), onChangeDate);

  mockSwipe(1);
  expect(onChangeDate).toHaveBeenLastCalledWith(new Date(2026, 11, 1));

  mockSwipe(-1);
  expect(onChangeDate).toHaveBeenLastCalledWith(new Date(2026, 10, 29));
});
