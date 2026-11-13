import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { fontFamilyFor, Text } from '../src/components/AppText';

test('picks the font file of each weight', () => {
  // Each weight has its own file, so a bold text uses the bold one.
  expect(fontFamilyFor(undefined)).toBe('Nunito_400Regular');
  expect(fontFamilyFor('normal')).toBe('Nunito_400Regular');
  expect(fontFamilyFor('600')).toBe('Nunito_600SemiBold');
  expect(fontFamilyFor('bold')).toBe('Nunito_700Bold');
  expect(fontFamilyFor('800')).toBe('Nunito_800ExtraBold');
});

test("draws text with the app's font instead of the phone's", async () => {
  // The weight is turned into the font family, and not applied a second time.
  await render(<Text style={{ fontWeight: 'bold', color: 'red' }}>November</Text>);

  const style = StyleSheet.flatten(screen.getByText('November').props.style);
  expect(style).toEqual(
    expect.objectContaining({
      fontFamily: 'Nunito_700Bold',
      fontWeight: 'normal',
      color: 'red',
    }),
  );
});
