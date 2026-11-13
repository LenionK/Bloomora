import { ComponentRef, Ref } from 'react';
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  StyleSheet,
  TextInputProps,
  TextProps,
  TextStyle,
} from 'react-native';

// The app's own font, loaded in App.tsx. Phones that change the system font
// otherwise draw text wider than it was measured, which cuts its last letters.
export const FONTS = {
  regular: 'Nunito_400Regular',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
};

// Each weight has its own font file, so the weight picks the family and is
// not applied again on top of it.
export function fontFamilyFor(weight: TextStyle['fontWeight']): string {
  switch (String(weight ?? 'normal')) {
    case '500':
    case '600':
      return FONTS.semiBold;
    case 'bold':
    case '700':
      return FONTS.bold;
    case '800':
    case '900':
      return FONTS.extraBold;
    default:
      return FONTS.regular;
  }
}

function withAppFont(style: TextProps['style']) {
  const { fontWeight } = StyleSheet.flatten(style) ?? {};

  return [style, { fontFamily: fontFamilyFor(fontWeight), fontWeight: 'normal' as const }];
}

export type TextInputRef = ComponentRef<typeof NativeTextInput>;

// The ref is passed on, so callers can focus a field or animate a text.
export function Text({
  style,
  ref,
  ...props
}: TextProps & { ref?: Ref<ComponentRef<typeof NativeText>> }) {
  return <NativeText {...props} ref={ref} style={withAppFont(style)} />;
}

export function TextInput({
  style,
  ref,
  ...props
}: TextInputProps & { ref?: Ref<TextInputRef> }) {
  return <NativeTextInput {...props} ref={ref} style={withAppFont(style)} />;
}
