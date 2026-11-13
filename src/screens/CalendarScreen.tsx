import { useCallback, useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Activity,
  getNextOccurrence,
  skipDates,
  toggleCompletedOn,
} from '../calendar/activities';
import { useHorizontalSwipe } from '../calendar/useHorizontalSwipe';
import AddActivityModal, { NewActivity } from '../components/AddActivityModal';
import CalendarGrid from '../components/CalendarGrid';
import CalendarHeader from '../components/CalendarHeader';
import NextActivityCard from '../components/NextActivityCard';
import ShortcutBar from '../components/ShortcutBar';
import { refreshReminders } from '../notifications/scheduler';
import {
  deleteActivities,
  deleteActivity,
  loadActivities,
  saveActivity,
} from '../storage/activityDatabase';
import { getActivityStats } from '../stats/stats';
import { colors } from '../theme';
import DayScreen from './DayScreen';
import SettingsScreen from './SettingsScreen';
import StatsScreen from './StatsScreen';
import WaterScreen from './WaterScreen';

type Props = {
  today?: Date;
};

export default function CalendarScreen({ today = new Date() }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWaterOpen, setIsWaterOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadActivities()
      .then((saved) => {
        setActivities(saved);
        setIsLoaded(true);
      })
      .catch(console.error);
  }, []);

  // Planning before loading would remove the reminders of saved activities.
  useEffect(() => {
    if (isLoaded) refreshReminders(activities);
  }, [activities, isLoaded]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const changeMonth = useCallback((offset: number) => {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }, []);
  const monthSwipeHandlers = useHorizontalSwipe(changeMonth);

  const openDay = useCallback((date: Date) => {
    setSelectedDate(date);
    setIsDayOpen(true);
  }, []);

  function closeDay() {
    setVisibleMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    );
    setIsDayOpen(false);
  }

  async function deleteOldActivities(oldActivities: Activity[]) {
    const oldIds = oldActivities.map(({ id }) => id);

    await deleteActivities(oldIds, getActivityStats(oldActivities, today));
    setActivities((current) =>
      current.filter(({ id }) => !oldIds.includes(id)),
    );
  }

  function addActivity(activity: NewActivity) {
    const newActivity = {
      ...activity,
      id: String(Date.now()),
      completedDates: [],
      skippedDates: [],
    };

    setActivities([...activities, newActivity]);
    saveActivity(newActivity).catch(console.error);
  }

  function editActivity(activity: Activity, changes: NewActivity) {
    const updated = { ...activity, ...changes };

    setActivities(
      activities.map((item) => (item.id === updated.id ? updated : item)),
    );
    saveActivity(updated).catch(console.error);
  }

  function toggleCompleted(activity: Activity) {
    const updated = toggleCompletedOn(activity, selectedDate);

    setActivities(
      activities.map((item) => (item.id === updated.id ? updated : item)),
    );
    saveActivity(updated).catch(console.error);
  }

  function removeActivity(activity: Activity) {
    setActivities(activities.filter((item) => item.id !== activity.id));
    deleteActivity(activity.id, getActivityStats([activity], today)).catch(
      console.error,
    );
  }

  function skipActivityDates(activity: Activity, dateKeys: string[]) {
    const updated = skipDates(activity, dateKeys);

    setActivities(
      activities.map((item) => (item.id === updated.id ? updated : item)),
    );
    saveActivity(updated).catch(console.error);
  }

  if (isSettingsOpen) {
    return (
      <SettingsScreen
        activities={activities}
        onBack={() => setIsSettingsOpen(false)}
        onDeleteOld={(oldActivities) => {
          deleteOldActivities(oldActivities).catch(console.error);
        }}
        onRemindersChange={() => refreshReminders(activities)}
        today={today}
      />
    );
  }

  if (isStatsOpen) {
    return (
      <StatsScreen
        activities={activities}
        onBack={() => setIsStatsOpen(false)}
        today={today}
      />
    );
  }

  if (isWaterOpen) {
    return (
      <WaterScreen
        onBack={() => setIsWaterOpen(false)}
        onGlassesChange={() => refreshReminders(activities)}
        today={today}
      />
    );
  }

  if (isDayOpen) {
    return (
      <DayScreen
        activities={activities}
        date={selectedDate}
        onAdd={addActivity}
        onBack={closeDay}
        onChangeDate={setSelectedDate}
        onDelete={removeActivity}
        onEdit={editActivity}
        onSkipDates={skipActivityDates}
        onToggleCompleted={toggleCompleted}
        today={today}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View {...monthSwipeHandlers}>
        <CalendarHeader
          year={year}
          month={month}
          onPreviousMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
        />

        <CalendarGrid
          year={year}
          month={month}
          today={today}
          selectedDate={selectedDate}
          activities={activities}
          onSelectDate={openDay}
        />
      </View>

      <View style={styles.nextActivity}>
        <NextActivityCard
          occurrence={getNextOccurrence(activities, today)}
          onPress={(date) => openDay(date)}
        />
      </View>

      <View style={styles.shortcuts}>
        <ShortcutBar
          shortcuts={[
            {
              label: 'My day',
              icon: 'today-outline',
              onPress: () => openDay(today),
            },
            {
              label: 'Water',
              icon: 'water-outline',
              onPress: () => setIsWaterOpen(true),
            },
            {
              label: 'Add activity',
              icon: 'add',
              isMain: true,
              onPress: () => setIsQuickAddOpen(true),
            },
            {
              label: 'Stats',
              icon: 'person-outline',
              onPress: () => setIsStatsOpen(true),
            },
            {
              label: 'Settings',
              icon: 'settings-outline',
              onPress: () => setIsSettingsOpen(true),
            },
          ]}
        />
      </View>

      {isQuickAddOpen && (
        <AddActivityModal
          date={today}
          firstSelectableDate={today}
          onAdd={(activity) => {
            addActivity(activity);
            setIsQuickAddOpen(false);
          }}
          onClose={() => setIsQuickAddOpen(false)}
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
  nextActivity: {
    flex: 1,
    justifyContent: 'center',
  },
  shortcuts: {
    marginBottom: 24,
  },
});
