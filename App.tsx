import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import CalendarScreen from './src/screens/CalendarScreen';
import LaunchScreen from './src/screens/LaunchScreen';

const LAUNCH_SCREEN_DURATION = 1000;

export default function App() {
  const [isLaunching, setIsLaunching] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), LAUNCH_SCREEN_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <CalendarScreen />
      {isLaunching && <LaunchScreen />}
      <StatusBar style="auto" />
    </>
  );
}
