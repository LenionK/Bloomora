import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
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
import DeleteActivityModal from '../components/DeleteActivityModal';
import ProgressRing from '../components/ProgressRing';
import { colors } from '../theme';

const DEFAULT_FIRST_HOUR = 8;
const ARROW_SIZE = 44;
const ARROW_GAP = 8;

type Props = {
  date: Date;
  today: Date;
  activities: Activity[];
  onBack: () => void;
  onChangeDate: (date: Date) => void;
  onAdd: (activity: NewActivity) => void;
  onToggleCompleted: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onSkipDates: (activity: Activity, dateKeys: string[]) => void;
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
  onSkipDates,
}: Props) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(
    null,
  );

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
          <View style={styles.ringSlot}>
            <ProgressRing
              completed={completedCount}
              total={dayActivities.length}
            />
          </View>
        )}
      </View>

      <DayTimeline
        activities={dayActivities}
        date={date}
        initialHour={initialHour}
        key={dateKey}
        onDelete={setActivityToDelete}
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

      {activityToDelete && (
        <DeleteActivityModal
          activity={activityToDelete}
          date={date}
          onClose={() => setActivityToDelete(null)}
          onDeleteAll={() => {
            onDelete(activityToDelete);
            setActivityToDelete(null);
          }}
          onSkipDates={(dateKeys) => {
            onSkipDates(activityToDelete, dateKeys);
            setActivityToDelete(null);
          }}
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
    gap: ARROW_GAP,
  },
  arrowButton: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
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
  ringSlot: {
    width: ARROW_SIZE * 2 + ARROW_GAP,
    alignItems: 'center',
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
