import { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  BackHandler,
  StyleSheet,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import Pressable from '../components/Pressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/AppText';
import { toDateKey } from '../calendar/activities';
import Confetti from '../components/Confetti';
import GlassRow from '../components/GlassRow';
import ScreenHeader from '../components/ScreenHeader';
import { useReducedMotion } from '../components/useReducedMotion';
import WaterBottle from '../components/WaterBottle';
import {
  loadWaterGlasses,
  saveWaterGlasses,
} from '../storage/activityDatabase';
import { useStrings } from '../i18n/LanguageContext';
import { colors, durations, fontSizes, radii, SCREEN_TOP } from '../theme';
import {
  DAILY_GOAL_ML,
  formatLitres,
  getWaterProgress,
  GLASS_ML,
} from '../water/water';

// Animated, but with the app's font like every other text.
const AnimatedText = Animated.createAnimatedComponent(Text);

// Room above the phone's own navigation, whether buttons or a gesture bar.
const BOTTOM_SPACE = 24;

// The square bottle drawing follows the screen height, within limits that keep
// it readable, and never gets wider than the screen.
const BOTTLE_SHARE_OF_SCREEN = 0.38;
const MIN_BOTTLE_SIZE = 220;
const MAX_BOTTLE_SIZE = 340;
const SIDE_MARGIN = 32;
const UNDO_DURATION = 4000;
// With a screen reader the message is read first, so Undo stays longer.
const SCREEN_READER_UNDO_DURATION = 10000;
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
  const t = useStrings();
  const insets = useSafeAreaInsets();
  // Null until the saved count arrives, so an early tap cannot overwrite it.
  const [glasses, setGlasses] = useState<number | null>(null);
  const [lastChange, setLastChange] = useState<Change | null>(null);
  const [goalScale] = useState(() => new Animated.Value(1));
  // Counts the celebrations, so reaching the goal again starts new confetti.
  const [celebration, setCelebration] = useState(0);
  const endCelebration = useCallback(() => setCelebration(0), []);
  const [isScreenReaderOn, setIsScreenReaderOn] = useState(false);
  const isMotionReduced = useReducedMotion();
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

    const timer = setTimeout(
      () => setLastChange(null),
      isScreenReaderOn ? SCREEN_READER_UNDO_DURATION : UNDO_DURATION,
    );

    return () => clearTimeout(timer);
  }, [lastChange, isScreenReaderOn]);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then(setIsScreenReaderOn)
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderOn,
    );

    return () => subscription.remove();
  }, []);

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
      message: glassCount > 0 ? t.water.added(GLASS_ML) : t.water.removed(GLASS_ML),
      previousGlasses: glasses,
    });

    if (reachesGoal) {
      Vibration.vibrate(GOAL_VIBRATION);
      setCelebration((count) => count + 1);
      // Grows in without a bounce, or appears at once with reduced motion.
      goalScale.setValue(isMotionReduced ? 1 : 0.8);
      Animated.timing(goalScale, {
        toValue: 1,
        duration: isMotionReduced ? 0 : durations.slow,
        easing: Easing.out(Easing.cubic),
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
    <View style={[styles.container, { paddingBottom: BOTTOM_SPACE + insets.bottom }]}>
      <ScreenHeader onBack={onBack} title={t.water.title} />

      {/* Equal spaces above and below keep the bottle and glasses in the middle. */}
      <View style={styles.space} />
      <View style={styles.content}>
        <WaterBottle share={progress.share} size={bottleSize} />

        <Text style={styles.amount}>
          {formatLitres(progress.millilitres)}
          <Text style={styles.goal}> {t.water.of(formatLitres(DAILY_GOAL_ML))}</Text>
        </Text>
        {/* The slot keeps its height, so the message does not move the glasses. */}
        <View style={styles.goalSlot}>
          {progress.glassesLeft === 0 && (
            <AnimatedText
              style={[styles.goalReached, { transform: [{ scale: goalScale }] }]}
            >
              {t.water.goalReached}
            </AnimatedText>
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
        {t.water.note(GLASS_ML)}
      </Text>

      {lastChange && (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.undoBar, { bottom: BOTTOM_SPACE + insets.bottom }]}
        >
          <Text style={styles.undoMessage}>{lastChange.message}</Text>
          <Pressable
            accessibilityLabel={t.water.undo}
            accessibilityRole="button"
            hitSlop={12}
            onPress={undo}
          >
            <Text style={styles.undoText}>{t.water.undo}</Text>
          </Pressable>
        </View>
      )}

      {celebration > 0 && !isMotionReduced && (
        <Confetti key={celebration} onDone={endCelebration} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: SCREEN_TOP,
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
    fontSize: fontSizes.large,
    fontWeight: 'bold',
    color: colors.water,
  },
  goal: {
    fontSize: fontSizes.subtitle,
    fontWeight: 'normal',
    color: colors.textSecondary,
  },
  goalSlot: {
    height: 26,
    marginTop: 4,
    justifyContent: 'center',
  },
  goalReached: {
    fontSize: fontSizes.body,
    lineHeight: 22,
    fontWeight: 'bold',
    color: colors.water,
  },
  glasses: {
    marginTop: 12,
  },
  note: {
    marginHorizontal: 16,
    fontSize: fontSizes.label,
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
    borderRadius: radii.chip,
    backgroundColor: colors.text,
  },
  undoMessage: {
    color: colors.onColor,
  },
  undoText: {
    fontWeight: 'bold',
    color: colors.waterMuted,
  },
});
