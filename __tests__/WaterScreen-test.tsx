import { fireEvent, render, screen } from '@testing-library/react-native';
import WaterScreen from '../src/screens/WaterScreen';
import {
  loadWaterGlasses,
  saveWaterGlasses,
} from '../src/storage/activityDatabase';

jest.mock('../src/storage/activityDatabase', () => ({
  loadWaterGlasses: jest.fn(),
  saveWaterGlasses: jest.fn(async () => undefined),
}));

const today = new Date(2026, 10, 13, 15, 30);
const mockLoad = jest.mocked(loadWaterGlasses);
const mockSave = jest.mocked(saveWaterGlasses);
const onGlassesChange = jest.fn();

async function renderWithGlasses(glasses: number) {
  mockLoad.mockResolvedValue(glasses);
  await render(<WaterScreen
      onBack={jest.fn()}
      onGlassesChange={onGlassesChange}
      today={today}
    />);
}

function isDisabled(label: string) {
  return screen.getByLabelText(label).props.accessibilityState.disabled;
}

test("shows today's water, read for today's date", async () => {
  // The count belongs to the day, so tomorrow will start again from zero.
  await renderWithGlasses(3);

  expect(await screen.findByText('0.6 L of 2 L')).toBeTruthy();
  expect(screen.getByText('7 glasses to go')).toBeTruthy();
  expect(screen.getByLabelText('Bottle 30% full')).toBeTruthy();
  expect(mockLoad).toHaveBeenCalledWith('2026-11-13');
});

test('adds and removes a glass, saving each change', async () => {
  // Every tap is saved at once, so closing the app loses nothing.
  await renderWithGlasses(3);
  await screen.findByText('0.6 L of 2 L');

  await fireEvent.press(screen.getByLabelText('Add a glass'));
  expect(screen.getByText('0.8 L of 2 L')).toBeTruthy();
  expect(mockSave).toHaveBeenLastCalledWith('2026-11-13', 4);

  await fireEvent.press(screen.getByLabelText('Remove a glass'));
  expect(screen.getByText('0.6 L of 2 L')).toBeTruthy();
  expect(mockSave).toHaveBeenLastCalledWith('2026-11-13', 3);
});

test('tells about each change once it is saved', async () => {
  // The drink reminders are planned again only after the new count is stored.
  onGlassesChange.mockClear();
  await renderWithGlasses(3);
  await screen.findByText('0.6 L of 2 L');

  await fireEvent.press(screen.getByLabelText('Add a glass'));

  expect(onGlassesChange).toHaveBeenCalledTimes(1);
});

test('cannot remove a glass when none was drunk', async () => {
  // The count never goes below zero.
  await renderWithGlasses(0);
  await screen.findByText('0 L of 2 L');

  expect(isDisabled('Remove a glass')).toBe(true);
  expect(isDisabled('Add a glass')).toBe(false);
});

test('celebrates the goal and keeps counting after it', async () => {
  // Drinking more than 2 litres is still recorded, with the bottle full.
  await renderWithGlasses(9);
  await screen.findByText('1.8 L of 2 L');

  await fireEvent.press(screen.getByLabelText('Add a glass'));
  expect(screen.getByText('Goal reached')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Add a glass'));
  expect(screen.getByText('2.2 L of 2 L')).toBeTruthy();
  expect(screen.getByLabelText('Bottle 100% full')).toBeTruthy();
});

test('waits for the saved count before allowing changes', async () => {
  // A tap before loading would save over the glasses already drunk today.
  mockLoad.mockReturnValue(new Promise(() => {}));
  await render(<WaterScreen
      onBack={jest.fn()}
      onGlassesChange={onGlassesChange}
      today={today}
    />);

  expect(isDisabled('Add a glass')).toBe(true);
  expect(isDisabled('Remove a glass')).toBe(true);
});
