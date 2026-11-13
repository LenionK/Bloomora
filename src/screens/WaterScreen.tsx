import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { toDateKey } from '../calendar/activities';
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

const BOTTLE_HEIGHT = 280;

type Props = {
  today: Date;
  onBack: () => void;
  onGlassesChange: () => void;
};

export default function WaterScreen({ today, onBack, onGlassesChange }: Props) {
  // Null until the saved count arrives, so an early tap cannot overwrite it.
  const [glasses, setGlasses] = useState<number | null>(null);
  const dateKey = toDateKey(today);
  const progress = getWaterProgress(glasses ?? 0);
  const isLoading = glasses === null;

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

  function changeGlasses(newGlasses: number) {
    setGlasses(newGlasses);
    saveWaterGlasses(dateKey, newGlasses)
      .then(onGlassesChange)
      .catch(console.error);
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Back to calendar"
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={18} color={colors.water} />
          <Text style={styles.backText}>Calendar</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Water</Text>

      <View style={styles.content}>
        <WaterBottle height={BOTTLE_HEIGHT} share={progress.share} />

        <Text style={styles.amount}>
          {formatLitres(progress.millilitres)}
          <Text style={styles.goal}> of {formatLitres(DAILY_GOAL_ML)}</Text>
        </Text>
        <Text style={styles.status}>
          {progress.glassesLeft === 0
            ? 'Goal reached'
            : `${progress.glassesLeft} ${
                progress.glassesLeft === 1 ? 'glass' : 'glasses'
              } to go`}
        </Text>

        <Pressable
          accessibilityLabel="Add a glass"
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoading }}
          disabled={isLoading}
          onPress={() => changeGlasses((glasses ?? 0) + 1)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={colors.surface} />
          <Text style={styles.addText}>{GLASS_ML} ml</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Remove a glass"
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoading || glasses === 0 }}
          disabled={isLoading || glasses === 0}
          hitSlop={8}
          onPress={() => changeGlasses((glasses ?? 0) - 1)}
        >
          <Text
            style={[
              styles.removeText,
              (isLoading || glasses === 0) && styles.disabledText,
            ]}
          >
            Remove a glass
          </Text>
        </Pressable>
      </View>

      <Text style={styles.note}>
        A glass is {GLASS_ML} ml. The count starts again every day.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: 22,
    backgroundColor: colors.waterSoft,
  },
  backText: {
    fontWeight: 'bold',
    color: colors.water,
  },
  title: {
    marginTop: 16,
    fontSize: 40,
    lineHeight: 44,
    includeFontPadding: false,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    marginTop: 24,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.water,
  },
  goal: {
    fontSize: 18,
    fontWeight: 'normal',
    color: colors.textSecondary,
  },
  status: {
    marginTop: 4,
    color: colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 56,
    marginTop: 24,
    paddingLeft: 20,
    paddingRight: 24,
    borderRadius: 28,
    backgroundColor: colors.water,
  },
  addText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.surface,
  },
  removeText: {
    marginTop: 16,
    color: colors.water,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  note: {
    marginHorizontal: 16,
    fontSize: 12,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
