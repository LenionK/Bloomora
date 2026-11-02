import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { formatTime } from '../calendar/time';
import AddActivityModal, { NewActivity } from '../components/AddActivityModal';
import CalendarGrid from '../components/CalendarGrid';
import CalendarHeader from '../components/CalendarHeader';
import { colors } from '../theme';

type Props = {
  today?: Date;
};

export default function CalendarScreen({ today = new Date() }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  function changeMonth(offset: number) {
    setVisibleMonth(new Date(year, month + offset, 1));
  }

  function goToToday() {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  }

  function addActivity({ title, start, end, color, repeatDays }: NewActivity) {
    console.log(
      start,
      formatTime(start),
      formatTime(end),
      title,
      color,
      repeatDays,
    );
    setIsAddOpen(false);
  }

  return (
    <View style={styles.container}>
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
        onSelectDate={setSelectedDate}
      />

      <View style={styles.addRow}>
        <Pressable
          accessibilityLabel="Add activity"
          accessibilityRole="button"
          onPress={() => setIsAddOpen(true)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={colors.surface} />
        </Pressable>
      </View>

      {isAddOpen && (
        <AddActivityModal
          date={selectedDate}
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
  addRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
