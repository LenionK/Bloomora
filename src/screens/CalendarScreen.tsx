import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Activity,
  getNextOccurrence,
  toggleCompletedOn,
} from '../calendar/activities';
import { useMonthSwipe } from '../calendar/useMonthSwipe';
import { NewActivity } from '../components/AddActivityModal';
import CalendarGrid from '../components/CalendarGrid';
import CalendarHeader from '../components/CalendarHeader';
import NextActivityCard from '../components/NextActivityCard';
import { colors } from '../theme';
import DayScreen from './DayScreen';

type Props = {
  today?: Date;
};

export default function CalendarScreen({ today = new Date() }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const changeMonth = useCallback((offset: number) => {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }, []);
  const monthSwipeHandlers = useMonthSwipe(changeMonth);

  function goToToday() {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  }

  function openDay(date: Date) {
    setSelectedDate(date);
    setIsDayOpen(true);
  }

  function closeDay() {
    setVisibleMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    );
    setIsDayOpen(false);
  }

  function addActivity(activity: NewActivity) {
    setActivities([
      ...activities,
      { ...activity, id: String(Date.now()), completedDates: [] },
    ]);
  }

  function toggleCompleted(activity: Activity) {
    setActivities(
      activities.map((item) =>
        item.id === activity.id ? toggleCompletedOn(item, selectedDate) : item,
      ),
    );
  }

  function deleteActivity(activity: Activity) {
    setActivities(activities.filter((item) => item.id !== activity.id));
  }

  if (isDayOpen) {
    return (
      <DayScreen
        activities={activities}
        date={selectedDate}
        onAdd={addActivity}
        onBack={closeDay}
        onChangeDate={setSelectedDate}
        onDelete={deleteActivity}
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
          onToday={goToToday}
        />

        <CalendarGrid
          year={year}
          month={month}
          today={today}
          selectedDate={selectedDate}
          onSelectDate={openDay}
        />
      </View>

      <View style={styles.nextActivity}>
        <NextActivityCard
          occurrence={getNextOccurrence(activities, today)}
          onPress={(date) => openDay(date)}
        />
      </View>
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
    marginTop: 'auto',
    marginBottom: 32,
  },
});
