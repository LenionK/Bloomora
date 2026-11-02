import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Activity,
  getActivitiesForDate,
  isCompletedOn,
  toDateKey,
} from '../calendar/activities';
import { MONTH_NAMES, WEEKDAY_NAMES } from '../calendar/monthGrid';
import AddActivityModal, { NewActivity } from '../components/AddActivityModal';
import DayTimeline from '../components/DayTimeline';
import ProgressRing from '../components/ProgressRing';
import { colors } from '../theme';

const DEFAULT_FIRST_HOUR = 8;

type Props = {
  date: Date;
  today: Date;
  activities: Activity[];
  onBack: () => void;
  onChangeDate: (date: Date) => void;
  onAdd: (activity: NewActivity) => void;
  onToggleCompleted: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
};

export default function DayScreen({
  date,
  today,
  activities,
  onBack,
  onChangeDate,
  onAdd,
  onToggleCompleted,
  onDelete,
}: Props) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const dayActivities = getActivitiesForDate(activities, date);
  const completedCount = dayActivities.filter((activity) =>
    isCompletedOn(activity, date),
  ).length;
  const dateKey = toDateKey(date);
  const isToday = dateKey === toDateKey(today);
  const initialHour =
    dayActivities[0]?.start.getHours() ??
    (isToday ? today.getHours() : DEFAULT_FIRST_HOUR);

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

  function changeDay(offset: number) {
    onChangeDate(
      new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset),
    );
  }

  function confirmDelete(activity: Activity) {
    if (activity.repeatDays.length === 0) {
      onDelete(activity);
      return;
    }

    Alert.alert(
      'Delete repeating activity?',
      `This removes "${activity.title}" from all its days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(activity),
        },
      ],
    );
  }

  function addActivity(activity: NewActivity) {
    onAdd(activity);
    setIsAddOpen(false);
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
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
          <Text style={styles.backText}>{MONTH_NAMES[date.getMonth()]}</Text>
        </Pressable>
        <View style={styles.arrows}>
          <Pressable
            accessibilityLabel="Previous day"
            accessibilityRole="button"
            onPress={() => changeDay(-1)}
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityLabel="Next day"
            accessibilityRole="button"
            onPress={() => changeDay(1)}
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.titleRow}>
        <View style={styles.titles}>
          <Text style={styles.weekday}>
            {WEEKDAY_NAMES[(date.getDay() + 6) % 7]}
          </Text>
          <Text style={styles.date}>
            {date.getDate()} {MONTH_NAMES[date.getMonth()]}
            {isToday && ' · today'}
          </Text>
        </View>
        {dayActivities.length > 0 && (
          <ProgressRing
            completed={completedCount}
            total={dayActivities.length}
          />
        )}
      </View>

      <DayTimeline
        activities={dayActivities}
        date={date}
        initialHour={initialHour}
        key={dateKey}
        onDelete={confirmDelete}
        onToggleCompleted={onToggleCompleted}
      />

      <Pressable
        accessibilityLabel="Add activity"
        accessibilityRole="button"
        onPress={() => setIsAddOpen(true)}
        style={styles.addButton}
      >
        <Ionicons name="add" size={28} color={colors.surface} />
      </Pressable>

      {isAddOpen && (
        <AddActivityModal
          date={date}
          onAdd={addActivity}
          onClose={() => setIsAddOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 56,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
  },
  backText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  arrows: {
    flexDirection: 'row',
    gap: 8,
  },
  arrowButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  titles: {
    flex: 1,
  },
  weekday: {
    fontSize: 40,
    lineHeight: 44,
    includeFontPadding: false,
    fontWeight: 'bold',
    color: colors.text,
  },
  date: {
    marginTop: 4,
    color: colors.textSecondary,
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
