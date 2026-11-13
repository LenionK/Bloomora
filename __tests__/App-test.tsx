import { render, screen } from '@testing-library/react-native';
import App from '../App';

test('opens straight on the calendar', async () => {
  // No opening screen of its own: the calendar shows at once, with its name once.
  await render(<App />);

  expect(screen.getByLabelText('My day')).toBeTruthy();
  expect(screen.getAllByText('Bloomora')).toHaveLength(1);
});
