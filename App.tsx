import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CalendarScreen from './src/screens/CalendarScreen';
import { colors } from './src/theme';

// The splash screen stays until the app's font is ready, so no text is ever
// drawn with the phone's own font first.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [areFontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  // Without the font the app still opens, with the phone's own font.
  const isReady = areFontsLoaded || fontError !== null;

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync().catch(() => {});
  }, [isReady]);

  if (!isReady) return null;

  // Every screen sits on the app background, down to behind the system bars.
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <CalendarScreen />
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
