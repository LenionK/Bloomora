import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Activity, getUpcomingDates, toDateKey } from '../calendar/activities';
import { MONTH_NAMES, WEEKDAY_LABELS } from '../calendar/monthGrid';
import { colors } from '../theme';
import Logo from './Logo';

const UPCOMING_DATES = 8;
const OPTIONS = [
  { value: 'day', label: 'Only this day' },
  { value: 'someDays', label: 'Some days' },
  { value: 'all', label: 'Delete all' },
] as const;

type DeleteOption = (typeof OPTIONS)[number]['value'];

type Props = {
  activity: Activity;
  date: Date;
  onDeleteAll: () => void;
  onSkipDates: (dateKeys: string[]) => void;
  onClose: () => void;
};

function formatShortDate(date: Date) {
  const weekday = WEEKDAY_LABELS[(date.getDay() + 6) % 7];
  const month = MONTH_NAMES[date.getMonth()].slice(0, 3);

  return `${weekday} ${date.getDate()} ${month}`;
}

export default function DeleteActivityModal({
  activity,
  date,
  onDeleteAll,
  onSkipDates,
  onClose,
}: Props) {
  const dateKey = toDateKey(date);
  const isRepeating = activity.repeatDays.length > 0;
  const [option, setOption] = useState<DeleteOption>('day');
  const [selectedKeys, setSelectedKeys] = useState([dateKey]);

  const canConfirm = option !== 'someDays' || selectedKeys.length > 0;

  function toggleKey(key: string) {
    setSelectedKeys(
      selectedKeys.includes(key)
        ? selectedKeys.filter((selectedKey) => selectedKey !== key)
        : [...selectedKeys, key],
    );
  }

  function confirm() {
    if (!canConfirm) return;

    if (!isRepeating || option === 'all') onDeleteAll();
    else onSkipDates(option === 'day' ? [dateKey] : selectedKeys);
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titles}>
              <Text
                numberOfLines={2}
                style={[styles.title, { color: activity.color }]}
              >
                Delete “{activity.title}”?
              </Text>
              <Text style={styles.date}>{formatShortDate(date)}</Text>
            </View>
            <Logo color={activity.color} size={44} />
          </View>

          {isRepeating &&
            OPTIONS.map(({ value, label }) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: option === value }}
                key={value}
                onPress={() => setOption(value)}
                style={styles.option}
              >
                <Ionicons
                  name={
                    option === value
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={22}
                  color={activity.color}
                />
                <Text style={styles.optionText}>{label}</Text>
              </Pressable>
            ))}

          {isRepeating && option === 'someDays' && (
            <View style={styles.dates}>
              {getUpcomingDates(activity, date, UPCOMING_DATES).map(
                (upcomingDate) => {
                  const key = toDateKey(upcomingDate);
                  const isSelected = selectedKeys.includes(key);

                  return (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      key={key}
                      onPress={() => toggleKey(key)}
                      style={[
                        styles.dateChip,
                        isSelected && { backgroundColor: activity.color },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateText,
                          isSelected && styles.selectedDateText,
                        ]}
                      >
                        {formatShortDate(upcomingDate)}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.button}
            >
              <Text style={{ color: activity.color }}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canConfirm }}
              onPress={confirm}
              style={[
                styles.button,
                { backgroundColor: activity.color },
                !canConfirm && styles.disabledButton,
              ]}
            >
              <Text style={styles.confirmText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: 16,
    backgroundColor: colors.backdrop,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  titles: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  date: {
    marginTop: 4,
    color: colors.textSecondary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 44,
  },
  optionText: {
    color: colors.text,
  },
  dates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  dateChip: {
    flexGrow: 1,
    flexBasis: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  dateText: {
    color: colors.text,
  },
  selectedDateText: {
    fontWeight: 'bold',
    color: colors.surface,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  disabledButton: {
    opacity: 0.4,
  },
  confirmText: {
    fontWeight: 'bold',
    color: colors.surface,
  },
});
