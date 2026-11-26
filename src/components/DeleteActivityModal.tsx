import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Pressable from './Pressable';
import { Text } from './AppText';
import { Activity, getUpcomingDates, toDateKey } from '../calendar/activities';
import { Strings } from '../i18n/en';
import { shortWeekday } from '../i18n/dates';
import { useStrings } from '../i18n/LanguageContext';
import { colors, fontSizes, MIN_TOUCH_SIZE } from '../theme';
import Button from './Button';
import ModalShell from './ModalShell';

const UPCOMING_DATES = 8;
const OPTIONS = ['day', 'someDays', 'all'] as const;
const DATE_CHIP_HEIGHT = 40;

type DeleteOption = (typeof OPTIONS)[number];

type Props = {
  activity: Activity;
  date: Date;
  onDeleteAll: () => void;
  onSkipDates: (dateKeys: string[]) => void;
  onClose: () => void;
};

function formatShortDate(date: Date, t: Strings) {
  const month = t.dates.monthsShort[date.getMonth()];

  return `${shortWeekday(date, t)} ${date.getDate()} ${month}`;
}

export default function DeleteActivityModal({
  activity,
  date,
  onDeleteAll,
  onSkipDates,
  onClose,
}: Props) {
  const t = useStrings();
  const dateKey = toDateKey(date);
  const isRepeating = activity.repeatDays.length > 0;
  const [option, setOption] = useState<DeleteOption>('day');
  const [selectedKeys, setSelectedKeys] = useState([dateKey]);
  const [hasNoDaysError, setHasNoDaysError] = useState(false);

  const canConfirm = option !== 'someDays' || selectedKeys.length > 0;

  function toggleKey(key: string) {
    setHasNoDaysError(false);
    setSelectedKeys(
      selectedKeys.includes(key)
        ? selectedKeys.filter((selectedKey) => selectedKey !== key)
        : [...selectedKeys, key],
    );
  }

  // Delete stays pressable: with no day chosen it says what is missing.
  function confirm() {
    if (!canConfirm) {
      setHasNoDaysError(true);
      return;
    }

    if (!isRepeating || option === 'all') onDeleteAll();
    else onSkipDates(option === 'day' ? [dateKey] : selectedKeys);
  }

  return (
    <ModalShell
      actions={
        <>
          <Button
            color={activity.color}
            label={t.common.cancel}
            onPress={onClose}
            variant="text"
          />
          <Button
            color={colors.danger}
            label={t.common.delete}
            onPress={confirm}
          />
        </>
      }
      color={activity.color}
      onClose={onClose}
      subtitle={formatShortDate(date, t)}
      title={t.deleteActivity.title(activity.title)}
      titleLines={2}
    >
      {isRepeating &&
        OPTIONS.map((value) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: option === value }}
            key={value}
            onPress={() => setOption(value)}
            style={styles.option}
          >
            <Ionicons
              name={option === value ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={activity.color}
            />
            <Text style={styles.optionText}>{t.deleteActivity.options[value]}</Text>
          </Pressable>
        ))}

      {isRepeating && option === 'someDays' && (
        <View style={styles.dates}>
          {getUpcomingDates(activity, date, UPCOMING_DATES).map((upcomingDate) => {
            const key = toDateKey(upcomingDate);
            const isSelected = selectedKeys.includes(key);

            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                hitSlop={(MIN_TOUCH_SIZE - DATE_CHIP_HEIGHT) / 2}
                key={key}
                onPress={() => toggleKey(key)}
                style={[
                  styles.dateChip,
                  isSelected && { backgroundColor: activity.color },
                ]}
              >
                <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>
                  {formatShortDate(upcomingDate, t)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {hasNoDaysError && (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={styles.errorText}
        >
          {t.deleteActivity.noDaysError}
        </Text>
      )}
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: MIN_TOUCH_SIZE,
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
    height: DATE_CHIP_HEIGHT,
    borderRadius: DATE_CHIP_HEIGHT / 2,
    backgroundColor: colors.background,
  },
  errorText: {
    marginTop: 8,
    fontSize: fontSizes.caption,
    color: colors.danger,
  },
  dateText: {
    color: colors.text,
  },
  selectedDateText: {
    fontWeight: 'bold',
    color: colors.onColor,
  },
});
