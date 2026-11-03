import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import CalendarScreen from '../src/screens/CalendarScreen';
import { colors } from '../src/theme';

const today = new Date(2026, 10, 2);

function dotColor(day: string) {
  return StyleSheet.flatten(screen.getByTestId(`activity-dot-${day}`).props.style)
    .backgroundColor;
}

async function openDay(day: string) {
  await fireEvent.press(screen.getByRole('button', { name: day }));
}

async function addActivity(title: string, start: string, repeatDay?: string) {
  await fireEvent.press(screen.getByLabelText('Add activity'));
  await fireEvent.changeText(screen.getByLabelText('Activity title'), title);
  await fireEvent.changeText(screen.getByLabelText('Start time'), start);
  if (repeatDay) {
    await fireEvent.press(screen.getByRole('checkbox', { name: repeatDay }));
  }
  await fireEvent.press(screen.getByText('Add'));
}

test('shows the current month', async () => {
  // The calendar opens on the month of today, with no activity to show yet.
  await render(<CalendarScreen today={today} />);

  expect(screen.getByText('November')).toBeTruthy();
  expect(screen.getByText('2026')).toBeTruthy();
  expect(screen.getByText('30')).toBeTruthy();
  expect(screen.queryByText('31')).toBeNull();
  expect(screen.getByText('No upcoming activities')).toBeTruthy();
});

test('moves between months, across the year, and back to today', async () => {
  // The arrows cross the year correctly and My day leads back to the current month.
  await render(<CalendarScreen today={today} />);

  await fireEvent.press(screen.getByLabelText('Next month'));
  await fireEvent.press(screen.getByLabelText('Next month'));
  expect(screen.getByText('January')).toBeTruthy();
  expect(screen.getByText('2027')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Previous month'));
  expect(screen.getByText('December')).toBeTruthy();
  expect(screen.getByText('2026')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('My day'));
  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  expect(screen.getByText('November')).toBeTruthy();
});

test('opens the pressed day and keeps it selected when going back', async () => {
  // Pressing a day opens its screen, and that day is still selected on the way back.
  await render(<CalendarScreen today={today} />);
  expect(screen.getByRole('button', { name: '2', selected: true })).toBeTruthy();

  await openDay('15');
  expect(screen.getByText('Sunday')).toBeTruthy();
  expect(screen.getByText('15 November')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  expect(screen.getByRole('button', { name: '15', selected: true })).toBeTruthy();
  expect(screen.queryByRole('button', { name: '2', selected: true })).toBeNull();

  await fireEvent.press(screen.getByLabelText('My day'));
  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  expect(screen.getByRole('button', { name: '2', selected: true })).toBeTruthy();
});

test('marks today in the day screen', async () => {
  // The day screen says when the open day is today.
  await render(<CalendarScreen today={today} />);

  await openDay('2');

  expect(screen.getByText('Monday')).toBeTruthy();
  expect(screen.getByText('2 November · today')).toBeTruthy();
});

test('changes day across months and returns to that month', async () => {
  // Day arrows can change month, and going back shows the month of the open day.
  await render(<CalendarScreen today={today} />);

  await openDay('30');
  await fireEvent.press(screen.getByLabelText('Next day'));
  expect(screen.getByText('1 December')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  expect(screen.getByText('December')).toBeTruthy();
  expect(screen.getByRole('button', { name: '1', selected: true })).toBeTruthy();

  await openDay('1');
  await fireEvent.press(screen.getByLabelText('Previous day'));
  expect(screen.getByText('30 November')).toBeTruthy();
});

test('opens the add activity popup and starts empty after cancelling', async () => {
  // The + opens the popup for the open day, and a cancelled text is not kept.
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  expect(screen.queryByText('New activity')).toBeNull();

  await fireEvent.press(screen.getByLabelText('Add activity'));
  expect(screen.getByText('2 November')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Activity title'), 'Call');

  await fireEvent.press(screen.getByText('Cancel'));
  expect(screen.queryByText('New activity')).toBeNull();

  await fireEvent.press(screen.getByLabelText('Add activity'));
  expect(screen.getByLabelText('Activity title').props.value).toBe('');
});

test('shows the activities of the day by start time', async () => {
  // Activities are ordered by time whatever the order they were added in, and stay on their day.
  await render(<CalendarScreen today={today} />);
  await openDay('2');

  await addActivity('Evening call', '1800');
  await addActivity('Morning run', '0900');

  expect(screen.queryByText('New activity')).toBeNull();
  expect(screen.getByText('18:00')).toBeTruthy();
  expect(screen.getByText('18:30')).toBeTruthy();
  expect(screen.queryByText('18:00–18:30')).toBeNull();
  expect(
    screen
      .getAllByText(/Morning run|Evening call/)
      .map((title) => title.props.children),
  ).toEqual(['Morning run', 'Evening call']);

  await fireEvent.press(screen.getByLabelText('Next day'));
  expect(screen.queryByText('Morning run')).toBeNull();
});

test('shows the next activity on the calendar and opens its day', async () => {
  // The calendar shows only the closest activity, and pressing it opens its day.
  await render(<CalendarScreen today={today} />);
  await openDay('20');
  await addActivity('Later', '1000');
  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  await openDay('9');
  await addActivity('Sooner', '1630');
  await fireEvent.press(screen.getByLabelText('Back to calendar'));

  expect(screen.getByText('Next · Mon 9 November')).toBeTruthy();
  expect(screen.getByText('Sooner')).toBeTruthy();
  expect(screen.getByText('16:30–17:00')).toBeTruthy();
  expect(screen.queryByText('Later')).toBeNull();

  await fireEvent.press(screen.getByText('Sooner'));
  expect(screen.getByText('9 November')).toBeTruthy();
});

test('completes an activity only on the selected day', async () => {
  // A completed repetition updates the progress of its day and leaves the next week to do.
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Gym', '1630', 'Mon');
  expect(screen.getByText('0/1')).toBeTruthy();

  await fireEvent.press(screen.getByRole('checkbox', { name: 'Gym done' }));
  expect(screen.getByText('1/1')).toBeTruthy();
  expect(
    screen.getByRole('checkbox', { name: 'Gym done', checked: true }),
  ).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  expect(screen.getByText('Next · Mon 9 November')).toBeTruthy();

  await openDay('9');
  expect(screen.getByText('0/1')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  await openDay('2');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Gym done' }));
  expect(screen.getByText('0/1')).toBeTruthy();
});

test('opens the popup filled with the activity to edit', async () => {
  // Every saved value is shown, and Cancel leaves the activity as it was.
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Call', '1630');

  await fireEvent.press(screen.getByLabelText('Edit Call'));

  expect(screen.getByText('Edit activity')).toBeTruthy();
  expect(screen.getByLabelText('Activity title').props.value).toBe('Call');
  expect(screen.getByLabelText('Start time').props.value).toBe('16:30');
  expect(screen.getByLabelText('End time').props.value).toBe('17:00');

  await fireEvent.changeText(screen.getByLabelText('Activity title'), 'Other');
  await fireEvent.press(screen.getByText('Cancel'));

  expect(screen.getByText('Call')).toBeTruthy();
  expect(screen.queryByText('Other')).toBeNull();
});

test('saves the changes to an activity', async () => {
  // The title and times change, and the activity keeps its completed state.
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Call', '1630');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Call done' }));

  await fireEvent.press(screen.getByLabelText('Edit Call'));
  await fireEvent.changeText(screen.getByLabelText('Activity title'), 'Long call');
  await fireEvent.changeText(screen.getByLabelText('End time'), '1800');
  await fireEvent.press(screen.getByText('Save'));

  expect(screen.queryByText('Edit activity')).toBeNull();
  expect(screen.queryByText('Call')).toBeNull();
  expect(screen.getByText('Long call')).toBeTruthy();
  expect(screen.getByText('18:00')).toBeTruthy();
  expect(
    screen.getByRole('checkbox', { name: 'Long call done', checked: true }),
  ).toBeTruthy();
});

test('moves a one-time activity to another day', async () => {
  // The activity leaves the open day and appears on the chosen one.
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Call', '1630');

  await fireEvent.press(screen.getByLabelText('Edit Call'));
  await fireEvent.changeText(screen.getByLabelText('Day'), '09');
  await fireEvent.press(screen.getByText('Save'));

  expect(screen.queryByText('Call')).toBeNull();

  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  expect(screen.getByText('Next · Mon 9 November')).toBeTruthy();
});

test('edits all the repetitions of an activity from any of its days', async () => {
  // A series is one activity: it starts from its first day whichever day is open.
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Gym', '1630', 'Mon');
  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  await openDay('9');

  await fireEvent.press(screen.getByLabelText('Edit Gym'));
  expect(screen.getByText('From 2 November')).toBeTruthy();
  expect(screen.queryByLabelText('Day')).toBeNull();

  await fireEvent.changeText(screen.getByLabelText('Activity title'), 'Run');
  await fireEvent.press(screen.getByText('Save'));
  expect(screen.getByText('Run')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  await openDay('16');
  expect(screen.getByText('Run')).toBeTruthy();
});

test('asks before deleting a one-time activity', async () => {
  // Nothing is removed until the popup is confirmed, and Cancel keeps the activity.
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Call', '1630');

  await fireEvent.press(screen.getByLabelText('Delete Call'));
  expect(screen.getByText('Delete “Call”?')).toBeTruthy();
  expect(screen.queryByRole('radio', { name: 'Only this day' })).toBeNull();

  await fireEvent.press(screen.getByText('Cancel'));
  expect(screen.getByText('Call')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Delete Call'));
  await fireEvent.press(screen.getByText('Delete'));
  expect(screen.queryByText('Call')).toBeNull();
  expect(screen.queryByLabelText('0 of 1 completed')).toBeNull();
});

test('deletes a repeating activity only on this day', async () => {
  // This is the default choice, and the following weeks keep the activity.
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Gym', '1630', 'Mon');

  await fireEvent.press(screen.getByLabelText('Delete Gym'));
  expect(
    screen.getByRole('radio', { name: 'Only this day', checked: true }),
  ).toBeTruthy();
  await fireEvent.press(screen.getByText('Delete'));
  expect(screen.queryByText('Gym')).toBeNull();

  await fireEvent.press(screen.getByLabelText('Next day'));
  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  expect(screen.getByText('Next · Mon 9 November')).toBeTruthy();
});

test('deletes a repeating activity on the chosen days', async () => {
  // This day starts selected, and the other dates can be added to it.
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Gym', '1630', 'Mon');

  await fireEvent.press(screen.getByLabelText('Delete Gym'));
  await fireEvent.press(screen.getByRole('radio', { name: 'Some days' }));
  expect(
    screen.getByRole('checkbox', { name: 'Mon 2 Nov', checked: true }),
  ).toBeTruthy();
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Mon 9 Nov' }));
  await fireEvent.press(screen.getByText('Delete'));

  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  expect(screen.getByText('Next · Mon 16 November')).toBeTruthy();
});

test('cannot confirm without any chosen day', async () => {
  // Deselecting every date must not delete anything.
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Gym', '1630', 'Mon');

  await fireEvent.press(screen.getByLabelText('Delete Gym'));
  await fireEvent.press(screen.getByRole('radio', { name: 'Some days' }));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Mon 2 Nov' }));
  await fireEvent.press(screen.getByText('Delete'));

  expect(screen.getByText('Delete “Gym”?')).toBeTruthy();
  expect(screen.getByText('Gym')).toBeTruthy();
});

test('deletes all the repetitions of an activity', async () => {
  // Delete all removes the whole series, so the calendar has nothing coming up.
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  await addActivity('Gym', '1630', 'Mon');

  await fireEvent.press(screen.getByLabelText('Delete Gym'));
  await fireEvent.press(screen.getByRole('radio', { name: 'Delete all' }));
  await fireEvent.press(screen.getByText('Delete'));

  await fireEvent.press(screen.getByLabelText('Back to calendar'));
  expect(screen.getByText('No upcoming activities')).toBeTruthy();
});

test('shows the time between two activities of a day', async () => {
  // The free time is written between the cards, in hours or in minutes.
  await render(<CalendarScreen today={today} />);
  await openDay('2');

  await addActivity('Morning run', '0900');
  await addActivity('Call', '1100');

  expect(screen.getByText('1 h 30 min')).toBeTruthy();
});

test('opens today from the shortcuts wherever the selection is', async () => {
  // My day always goes to today, and the day screen opens without the popup.
  await render(<CalendarScreen today={today} />);
  await openDay('15');
  await fireEvent.press(screen.getByLabelText('Back to calendar'));

  await fireEvent.press(screen.getByLabelText('My day'));

  expect(screen.getByText('2 November · today')).toBeTruthy();
  expect(screen.queryByText('New activity')).toBeNull();
});

test('adds an activity on a day chosen in the bar popup', async () => {
  // The main button lets the day be chosen in the popup, without opening it first.
  await render(<CalendarScreen today={today} />);

  await fireEvent.press(screen.getByLabelText('Add activity'));
  expect(screen.getByLabelText('Day').props.value).toBe('02');
  expect(screen.getByText('Mon 2 November')).toBeTruthy();

  await fireEvent.changeText(screen.getByLabelText('Day'), '09');
  expect(screen.getByText('Mon 9 November')).toBeTruthy();

  await fireEvent.changeText(screen.getByLabelText('Activity title'), 'Call');
  await fireEvent.changeText(screen.getByLabelText('Start time'), '1630');
  await fireEvent.press(screen.getByText('Add'));

  expect(screen.queryByText('New activity')).toBeNull();
  expect(screen.getByText('Next · Mon 9 November')).toBeTruthy();
  expect(screen.getByTestId('activity-dot-9')).toBeTruthy();
});

test('draws the half hour line only in the busy hours', async () => {
  // Empty hours are compact, so a second line there would only add noise.
  await render(<CalendarScreen today={today} />);
  await openDay('2');
  expect(screen.queryByTestId('half-hour-line-16')).toBeNull();

  await addActivity('Call', '1630');

  expect(screen.getByTestId('half-hour-line-16')).toBeTruthy();
  expect(screen.queryByTestId('half-hour-line-10')).toBeNull();
});

test('connects the activities of a day with a line through the free time', async () => {
  // The line shows that the number is the time between the two activities.
  await render(<CalendarScreen today={today} />);
  await openDay('2');

  await addActivity('Call', '0900');
  expect(screen.queryByTestId('day-gap-line')).toBeNull();

  await addActivity('Gym', '1200');
  expect(screen.getByTestId('day-gap-line')).toBeTruthy();
  expect(screen.getByText('2 h 30 min')).toBeTruthy();
});

test('does not offer the day choice in the popup of a day', async () => {
  // In the day screen the day is already chosen, so the popup stays shorter.
  await render(<CalendarScreen today={today} />);
  await openDay('2');

  await fireEvent.press(screen.getByLabelText('Add activity'));

  expect(screen.getByText('New activity')).toBeTruthy();
  expect(screen.queryByLabelText('Day')).toBeNull();
});

test('shows the storage and deletes old activities from the settings', async () => {
  // Only the activities older than the chosen period are removed, after a confirmation.
  await render(<CalendarScreen today={today} />);
  await fireEvent.press(screen.getByLabelText('Previous month'));
  await fireEvent.press(screen.getByLabelText('Previous month'));
  await openDay('1');
  await addActivity('Old call', '1630');
  await fireEvent.press(screen.getByLabelText('Back to calendar'));

  await fireEvent.press(screen.getByLabelText('Settings'));
  expect(await screen.findByText('8 KB')).toBeTruthy();
  expect(screen.getByLabelText('Older than a year')).toBeDisabled();

  await fireEvent.press(screen.getByLabelText('Older than a month'));
  expect(screen.getByText('Delete 1 old activity?')).toBeTruthy();
  await fireEvent.press(screen.getByText('Cancel'));
  expect(screen.queryByText('Delete 1 old activity?')).toBeNull();

  await fireEvent.press(screen.getByLabelText('Older than a month'));
  await fireEvent.press(screen.getByText('Delete'));
  expect(await screen.findByText('0 saved')).toBeTruthy();
});

test('marks the days with activities with a dot', async () => {
  // A repeating activity marks all its days, white on today, and a deleted day loses its dot.
  await render(<CalendarScreen today={today} />);
  expect(screen.queryByTestId('activity-dot-2')).toBeNull();

  await openDay('2');
  await addActivity('Gym', '1630', 'Mon');
  await fireEvent.press(screen.getByLabelText('Back to calendar'));

  expect(dotColor('2')).toBe(colors.surface);
  expect(dotColor('9')).toBe(colors.primary);
  expect(screen.queryByTestId('activity-dot-3')).toBeNull();

  await openDay('9');
  await fireEvent.press(screen.getByLabelText('Delete Gym'));
  await fireEvent.press(screen.getByText('Delete'));
  await fireEvent.press(screen.getByLabelText('Back to calendar'));

  expect(screen.queryByTestId('activity-dot-9')).toBeNull();
  expect(screen.getByTestId('activity-dot-16')).toBeTruthy();
});
