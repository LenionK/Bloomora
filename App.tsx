import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import CalendarScreen from './src/screens/CalendarScreen';
import { colors } from './src/theme';

// The system splash screen covers the start, then the calendar shows at once.
export default function App() {
  // Every screen sits on the app background, down to behind the system bars.
  return (
    <View style={styles.root}>
      <CalendarScreen />
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
