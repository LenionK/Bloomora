import { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import { toDateKey } from '../calendar/activities';
import Confetti from '../components/Confetti';
import GlassRow from '../components/GlassRow';
import ScreenHeader from '../components/ScreenHeader';
import WaterBottle from '../components/WaterBottle';
import {
  loadWaterGlasses,
  saveWaterGlasses,
} from '../storage/activityDatabase';
import { colors } from '../theme';
import {
  DAILY_GOAL_ML,
  formatLitres,
  getWaterProgress,
  GLASS_ML,
} from '../water/water';

// The square bottle drawing follows the screen height, within limits that keep
// it readable, and never gets wider than the screen.
const BOTTLE_SHARE_OF_SCREEN = 0.38;
const MIN_BOTTLE_SIZE = 220;
const MAX_BOTTLE_SIZE = 340;
const SIDE_MARGIN = 32;
const UNDO_DURATION = 4000;
const TAP_VIBRATION = 15;
const GOAL_VIBRATION = [0, 40, 60, 40];
const GOAL_GLASSES = DAILY_GOAL_ML / GLASS_ML;

type Change = {
  message: string;
  previousGlasses: number;
};

type Props = {
  today: Date;
  onBack: () => void;
  onGlassesChange: () => void;
};

export default function WaterScreen({ today, onBack, onGlassesChange }: Props) {
  // Null until the saved count arrives, so an early tap cannot overwrite it.
  const [glasses, setGlasses] = useState<number | null>(null);
  const [lastChange, setLastChange] = useState<Change | null>(null);
  const [goalScale] = useState(() => new Animated.Value(1));
  // Counts the celebrations, so reaching the goal again starts new confetti.
  const [celebration, setCelebration] = useState(0);
  const endCelebration = useCallback(() => setCelebration(0), []);
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const dateKey = toDateKey(today);
  const progress = getWaterProgress(glasses ?? 0);
  const isLoading = glasses === null;
  const bottleSize = Math.min(
    Math.max(screenHeight * BOTTLE_SHARE_OF_SCREEN, MIN_BOTTLE_SIZE),
    MAX_BOTTLE_SIZE,
    screenWidth - SIDE_MARGIN,
  );

  useEffect(() => {
    loadWaterGlasses(dateKey).then(setGlasses).catch(console.error);
  }, [dateKey]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onBack();
        return true;
      },
    );

    return () => subscription.remove();
  }, [onBack]);

  useEffect(() => {
    if (!lastChange) return;

    const timer = setTimeout(() => setLastChange(null), UNDO_DURATION);

    return () => clearTimeout(timer);
  }, [lastChange]);

  function saveGlasses(newGlasses: number) {
    setGlasses(newGlasses);
    saveWaterGlasses(dateKey, newGlasses)
      .then(onGlassesChange)
      .catch(console.error);
  }

  function changeBy(glassCount: number) {
    if (glasses === null) return;

    // The count stops at the goal. A day saved past it, before this rule, can
    // still go down.
    const newGlasses = Math.min(
      Math.max(glasses + glassCount, 0),
      Math.max(glasses, GOAL_GLASSES),
    );
    if (newGlasses === glasses) return;

    const reachesGoal =
      getWaterProgress(newGlasses).glassesLeft === 0 &&
      progress.glassesLeft > 0;

    saveGlasses(newGlasses);
    setLastChange({
      message: `${glassCount > 0 ? 'Added' : 'Removed'} ${GLASS_ML} ml`,
      previousGlasses: glasses,
    });

    if (reachesGoal) {
      Vibration.vibrate(GOAL_VIBRATION);
      setCelebration((count) => count + 1);
      goalScale.setValue(0.6);
      Animated.spring(goalScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    } else {
      Vibration.vibrate(TAP_VIBRATION);
    }
  }

  function undo() {
    if (!lastChange) return;

    saveGlasses(lastChange.previousGlasses);
    setLastChange(null);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader onBack={onBack} title="Water" />

      {/* Equal spaces above and below keep the bottle and glasses in the middle. */}
      <View style={styles.space} />
      <View style={styles.content}>
        <WaterBottle share={progress.share} size={bottleSize} />

        <Text style={styles.amount}>
          {formatLitres(progress.millilitres)}
          <Text style={styles.goal}> of {formatLitres(DAILY_GOAL_ML)}</Text>
        </Text>
        {/* The slot keeps its height, so the message does not move the glasses. */}
        <View style={styles.goalSlot}>
          {progress.glassesLeft === 0 && (
            <Animated.Text
              style={[styles.goalReached, { transform: [{ scale: goalScale }] }]}
            >
              Goal reached 🎉
            </Animated.Text>
          )}
        </View>

        <View style={styles.glasses}>
          <GlassRow
            glasses={glasses ?? 0}
            isDisabled={isLoading}
            onAdd={() => changeBy(1)}
            onRemove={() => changeBy(-1)}
          />
        </View>
      </View>

      <View style={styles.space} />

      <Text style={styles.note}>
        Tap a glass to add or remove {GLASS_ML} ml. The count starts again every
        day.
      </Text>

      {lastChange && (
        <View accessibilityLiveRegion="polite" style={styles.undoBar}>
          <Text style={styles.undoMessage}>{lastChange.message}</Text>
          <Pressable
            accessibilityLabel="Undo"
            accessibilityRole="button"
            hitSlop={12}
            onPress={undo}
          >
            <Text style={styles.undoText}>Undo</Text>
          </Pressable>
        </View>
      )}

      {celebration > 0 && (
        <Confetti key={celebration} onDone={endCelebration} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  space: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  amount: {
    marginTop: 16,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.water,
  },
  goal: {
    fontSize: 18,
    fontWeight: 'normal',
    color: colors.textSecondary,
  },
  goalSlot: {
    height: 26,
    marginTop: 4,
    justifyContent: 'center',
  },
  goalReached: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 'bold',
    color: colors.water,
  },
  glasses: {
    marginTop: 12,
  },
  note: {
    marginHorizontal: 16,
    fontSize: 13,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  undoBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: colors.text,
  },
  undoMessage: {
    color: colors.surface,
  },
  undoText: {
    fontWeight: 'bold',
    color: colors.waterMuted,
  },
});
