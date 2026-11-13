import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import CalendarScreen from './src/screens/CalendarScreen';
import LaunchScreen from './src/screens/LaunchScreen';
import { colors } from './src/theme';

const LAUNCH_SCREEN_DURATION = 1000;

export default function App() {
  const [isLaunching, setIsLaunching] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), LAUNCH_SCREEN_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // Every screen sits on the app background, down to behind the system bars.
  return (
    <View style={styles.root}>
      <CalendarScreen />
      {isLaunching && <LaunchScreen />}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
