import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import AddActivityModal from '../src/components/AddActivityModal';
import { activityColors, colors } from '../src/theme';

jest.mock('../src/components/Logo', () => {
  const { Text } = jest.requireActual('react-native');

  return {
    __esModule: true,
    default: ({ color }: { color: string }) => <Text>{`logo ${color}`}</Text>,
  };
});

const date = new Date(2026, 10, 15);
const blue = activityColors.find((color) => color.name === 'Blue')!.value;
const errorMessage = 'Enter a start time and an end time later than it';

async function renderModal(onAdd = jest.fn(), onClose = jest.fn()) {
  await render(<AddActivityModal date={date} onAdd={onAdd} onClose={onClose} />);
}

async function type(label: string, text: string) {
  await fireEvent.changeText(screen.getByLabelText(label), text);
}

function valueOf(label: string) {
  return screen.getByLabelText(label).props.value;
}

test('shows the selected day', async () => {
  // The popup shows the day the activity will be added to.
  await renderModal();

  expect(screen.getByText('15 November')).toBeTruthy();
});

test('ends 30 minutes after the start by default', async () => {
  // Only a title and a start are needed: the end is calculated and the title is trimmed.
  const onAdd = jest.fn();
  await renderModal(onAdd);
  expect(screen.queryByLabelText('Duration in minutes')).toBeNull();
  expect(valueOf('End time')).toBe('');

  await type('Activity title', '  Deliver the parcel  ');
  await type('Start time', '1630');
  expect(valueOf('End time')).toBe('17:00');

  await fireEvent.press(screen.getByText('Add'));

  expect(onAdd).toHaveBeenCalledTimes(1);
  expect(onAdd).toHaveBeenCalledWith({
    title: 'Deliver the parcel',
    start: new Date(2026, 10, 15, 16, 30),
    end: new Date(2026, 10, 15, 17, 0),
    color: colors.primary,
    repeatDays: [],
  });
});

test('happens once by default and repeats on the selected days', async () => {
  // Days can be toggled, and they are saved in order from Monday whatever the tap order.
  const onAdd = jest.fn();
  await renderModal(onAdd);
  expect(screen.getByText('Repeat: Once')).toBeTruthy();

  await fireEvent.press(screen.getByRole('checkbox', { name: 'Wed' }));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Sun' }));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Mon' }));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Sun' }));

  expect(screen.getByText('Repeat: Mon, Wed')).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: 'Mon', checked: true })).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: 'Sun', checked: false })).toBeTruthy();

  await type('Activity title', 'Gym');
  await type('Start time', '1630');
  await fireEvent.press(screen.getByText('Add'));

  expect(onAdd.mock.calls[0][0].repeatDays).toEqual([0, 2]);
});

test('keeps a typed end when the start changes', async () => {
  // An end written by the user is never overwritten by the calculated one.
  const onAdd = jest.fn();
  await renderModal(onAdd);

  await type('Activity title', 'Call');
  await type('Start time', '1630');
  await type('End time', '1800');
  await type('Start time', '1700');
  expect(valueOf('End time')).toBe('18:00');

  await fireEvent.press(screen.getByText('Add'));

  expect(onAdd).toHaveBeenCalledWith(
    expect.objectContaining({
      start: new Date(2026, 10, 15, 17, 0),
      end: new Date(2026, 10, 15, 18, 0),
    }),
  );
});

test('moves the calculated end when the start changes', async () => {
  // While the end is untouched, it follows the start.
  await renderModal();

  await type('Start time', '1630');
  await type('Start time', '1700');

  expect(valueOf('End time')).toBe('17:30');
});

test('completes a partial time when leaving the field', async () => {
  // Leaving a field turns 12:0 into 12:00 and 13:3 into 13:30.
  await renderModal();

  await type('Start time', '120');
  await fireEvent(screen.getByLabelText('Start time'), 'blur');
  expect(valueOf('Start time')).toBe('12:00');
  expect(valueOf('End time')).toBe('12:30');

  await type('End time', '133');
  await fireEvent(screen.getByLabelText('End time'), 'blur');
  expect(valueOf('End time')).toBe('13:30');
});

test('keeps calculating the end after leaving it untouched', async () => {
  // Tapping End without writing must not stop the automatic calculation.
  await renderModal();

  await fireEvent(screen.getByLabelText('End time'), 'blur');
  await type('Start time', '1630');
  expect(valueOf('End time')).toBe('17:00');

  await fireEvent(screen.getByLabelText('End time'), 'blur');
  await type('Start time', '1700');
  expect(valueOf('End time')).toBe('17:30');
});

test('uses a partial time when adding without leaving the field', async () => {
  // Add can be pressed while the cursor is still in a partial time.
  const onAdd = jest.fn();
  await renderModal(onAdd);

  await type('Activity title', 'Call');
  await type('Start time', '120');
  await fireEvent.press(screen.getByText('Add'));

  expect(onAdd).toHaveBeenCalledWith(
    expect.objectContaining({
      start: new Date(2026, 10, 15, 12, 0),
      end: new Date(2026, 10, 15, 12, 30),
    }),
  );
});

test('does not accept an impossible time', async () => {
  // Digits that would make a time like 68:44 or 25:00 are dropped while typing.
  await renderModal();

  await type('Start time', '6844');
  expect(valueOf('Start time')).toBe('06:44');

  await type('End time', '2500');
  expect(valueOf('End time')).toBe('20:0');
});

test('colours the logo and title and saves the selected colour', async () => {
  // The selected colour changes the logo and the title, and is saved with the activity.
  const onAdd = jest.fn();
  await renderModal(onAdd);
  expect(activityColors).toHaveLength(7);
  expect(screen.getByRole('radio', { name: 'Pink', checked: true })).toBeTruthy();

  await fireEvent.press(screen.getByRole('radio', { name: 'Blue' }));

  expect(screen.getByRole('radio', { name: 'Blue', checked: true })).toBeTruthy();
  expect(screen.getByText(`logo ${blue}`)).toBeTruthy();
  expect(
    StyleSheet.flatten(screen.getByText('New activity').props.style).color,
  ).toBe(blue);

  await type('Activity title', 'Call');
  await type('Start time', '1630');
  await fireEvent.press(screen.getByText('Add'));

  expect(onAdd.mock.calls[0][0].color).toBe(blue);
});

test('does not add a blank title', async () => {
  // A title made only of spaces does not create an activity.
  const onAdd = jest.fn();
  await renderModal(onAdd);

  await type('Activity title', '   ');
  await type('Start time', '1630');
  await fireEvent.press(screen.getByText('Add'));

  expect(onAdd).not.toHaveBeenCalled();
});

test.each([
  ['no times', '', ''],
  ['no end', '1630', ''],
  ['an end before the start', '1630', '1600'],
])('shows an error with %s', async (_case, start, end) => {
  // Add shows an error for a wrong time range, and the error goes away when the time changes.
  const onAdd = jest.fn();
  await renderModal(onAdd);

  await type('Activity title', 'Call');
  await type('Start time', start);
  await type('End time', end);
  await fireEvent.press(screen.getByText('Add'));

  expect(screen.getByText(errorMessage)).toBeTruthy();
  expect(onAdd).not.toHaveBeenCalled();

  await type('End time', '1700');
  expect(screen.queryByText(errorMessage)).toBeNull();
});

test('closes without adding when cancelled', async () => {
  // Cancel closes the popup and creates nothing.
  const onAdd = jest.fn();
  const onClose = jest.fn();
  await renderModal(onAdd, onClose);

  await fireEvent.press(screen.getByText('Cancel'));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onAdd).not.toHaveBeenCalled();
});
