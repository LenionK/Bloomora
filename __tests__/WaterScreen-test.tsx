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

async function renderWater() {
  await render(
    <WaterScreen
      onBack={jest.fn()}
      onGlassesChange={onGlassesChange}
      today={today}
    />,
  );
}

async function renderWithGlasses(glasses: number) {
  mockLoad.mockResolvedValue(glasses);
  await renderWater();
  await screen.findByLabelText(`Bottle ${Math.min(glasses * 10, 100)}% full`);
}

function isDisabled(label: string) {
  return screen.getByLabelText(label).props.accessibilityState.disabled;
}

// Any empty glass adds one, so the first is enough.
async function addGlass() {
  await fireEvent.press(screen.getAllByLabelText(/, empty$/)[0]);
}

test("shows today's water, read for today's date", async () => {
  // The count belongs to the day, so tomorrow will start again from zero.
  await renderWithGlasses(3);

  expect(screen.getByText('0.6 L of 2 L')).toBeTruthy();
  expect(screen.getByLabelText('Glass 3 of 10, full')).toBeTruthy();
  expect(screen.getByLabelText('Glass 4 of 10, empty')).toBeTruthy();
  expect(screen.queryByText(/to go/)).toBeNull();
  expect(mockLoad).toHaveBeenCalledWith('2026-11-13');
});

test('adds with an empty glass and removes with a full one', async () => {
  // Every tap is saved at once, so closing the app loses nothing.
  await renderWithGlasses(3);

  await fireEvent.press(screen.getByLabelText('Glass 7 of 10, empty'));
  expect(screen.getByText('0.8 L of 2 L')).toBeTruthy();
  expect(mockSave).toHaveBeenLastCalledWith('2026-11-13', 4);

  await fireEvent.press(screen.getByLabelText('Glass 1 of 10, full'));
  expect(screen.getByText('0.6 L of 2 L')).toBeTruthy();
  expect(mockSave).toHaveBeenLastCalledWith('2026-11-13', 3);
});

test('undoes the last change from the bar shown after it', async () => {
  // Undo replaces a small remove button that was easy to press by mistake.
  await renderWithGlasses(3);

  await addGlass();
  expect(screen.getByText('Added 200 ml')).toBeTruthy();

  await fireEvent.press(screen.getByLabelText('Undo'));
  expect(screen.getByText('0.6 L of 2 L')).toBeTruthy();
  expect(mockSave).toHaveBeenLastCalledWith('2026-11-13', 3);
  expect(screen.queryByText('Added 200 ml')).toBeNull();
});

test('tells about each change once it is saved', async () => {
  // The drink reminders are planned again only after the new count is stored.
  onGlassesChange.mockClear();
  await renderWithGlasses(3);

  await addGlass();

  expect(onGlassesChange).toHaveBeenCalledTimes(1);
});

test('starts with every glass empty', async () => {
  // With nothing drunk there is nothing to remove.
  await renderWithGlasses(0);

  expect(screen.getAllByLabelText(/, empty$/)).toHaveLength(10);
  expect(screen.queryAllByLabelText(/, full$/)).toHaveLength(0);
});

test('celebrates the goal with confetti and stops counting there', async () => {
  // At 2 litres every glass is full, so there is nothing left to add.
  await renderWithGlasses(9);
  expect(screen.queryByText('Goal reached 🎉')).toBeNull();
  expect(screen.queryByTestId('confetti')).toBeNull();

  await addGlass();

  expect(screen.getByText('Goal reached 🎉')).toBeTruthy();
  expect(screen.getByTestId('confetti')).toBeTruthy();
  expect(screen.getByLabelText('Bottle 100% full')).toBeTruthy();
  expect(screen.queryAllByLabelText(/, empty$/)).toHaveLength(0);
  expect(mockSave).toHaveBeenLastCalledWith('2026-11-13', 10);
});

test('can still go down from a day saved past the goal', async () => {
  // Days saved past 2 litres before the limit show full and can be lowered.
  await renderWithGlasses(12);

  await fireEvent.press(screen.getByLabelText('Glass 1 of 10, full'));

  expect(mockSave).toHaveBeenLastCalledWith('2026-11-13', 11);
});

test('waits for the saved count before allowing changes', async () => {
  // A tap before loading would save over the glasses already drunk today.
  mockLoad.mockReturnValue(new Promise(() => {}));
  await renderWater();

  expect(isDisabled('Glass 1 of 10, empty')).toBe(true);
});
