import { useCallback, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput, TextInputRef } from './AppText';
import { formatDayMonth, shortWeekday } from '../i18n/dates';
import { useStrings } from '../i18n/LanguageContext';
import {
  completeTimeInput,
  formatTime,
  formatTimeInput,
  getDefaultEndText,
  parseTimeRange,
  TimeOfDay,
} from '../calendar/time';
import { colors } from '../theme';
import ColorPicker from './ColorPicker';
import DateInput from './DateInput';
import Logo from './Logo';
import RepeatPicker from './RepeatPicker';

export type NewActivity = {
  title: string;
  start: Date;
  end: Date;
  color: string;
  repeatDays: number[];
  // Optional notes; empty when there are none.
  description?: string;
};

const MAX_DESCRIPTION_LENGTH = 300;

type Props = {
  date: Date;
  activityToEdit?: NewActivity;
  firstSelectableDate?: Date;
  onAdd: (activity: NewActivity) => void;
  onClose: () => void;
};

export default function AddActivityModal({
  date: initialDate,
  activityToEdit,
  firstSelectableDate,
  onAdd,
  onClose,
}: Props) {
  const t = useStrings();
  const [date, setDate] = useState<Date | null>(initialDate);
  const [hasDateError, setHasDateError] = useState(false);
  const [title, setTitle] = useState(activityToEdit?.title ?? '');
  const [description, setDescription] = useState(
    activityToEdit?.description ?? '',
  );
  const [startText, setStartText] = useState(
    activityToEdit ? formatTime(activityToEdit.start) : '',
  );
  const [typedEndText, setTypedEndText] = useState<string | null>(
    activityToEdit ? formatTime(activityToEdit.end) : null,
  );
  const [color, setColor] = useState(activityToEdit?.color ?? colors.primary);
  const [repeatDays, setRepeatDays] = useState<number[]>(
    activityToEdit?.repeatDays ?? [],
  );
  const [hasTimeError, setHasTimeError] = useState(false);
  const startInputRef = useRef<TextInputRef>(null);

  const endText = typedEndText ?? getDefaultEndText(startText);
  // The weekday helps only when the day is being chosen here.
  const weekday =
    date && firstSelectableDate
      ? `${shortWeekday(date, t)} `
      : '';
  const dateLabel = date
    ? `${weekday}${formatDayMonth(date, t)}`
    : t.addActivity.invalidDate;

  const changeDate = useCallback((newDate: Date | null) => {
    setDate(newDate);
    setHasDateError(false);
  }, []);

  function changeStart(text: string) {
    setStartText(formatTimeInput(text));
    setHasTimeError(false);
  }

  function changeEnd(text: string) {
    setTypedEndText(formatTimeInput(text));
    setHasTimeError(false);
  }

  function completeEnd() {
    if (typedEndText !== null) setTypedEndText(completeTimeInput(typedEndText));
  }

  function toDate(day: Date, time: TimeOfDay) {
    return new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      time.hours,
      time.minutes,
    );
  }

  function submit() {
    // A title is optional, so a quick activity needs only its time.
    const trimmedTitle = title.trim() || t.activity.untitled;

    if (!date) {
      setHasDateError(true);
      return;
    }

    const timeRange = parseTimeRange(startText, endText);
    if (!timeRange) {
      setHasTimeError(true);
      return;
    }

    onAdd({
      title: trimmedTitle,
      start: toDate(date, timeRange.start),
      end: toDate(date, timeRange.end),
      color,
      repeatDays,
      description: description.trim(),
    });
  }

  return (
    <Modal onRequestClose={onClose} transparent>
      {/* A tap outside the fields closes the keyboard, on the card or around it. */}
      <Pressable
        accessible={false}
        onPress={Keyboard.dismiss}
        style={styles.backdrop}
        testID="add-activity-backdrop"
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color }]}>
                {activityToEdit ? t.addActivity.editTitle : t.addActivity.newTitle}
              </Text>
              <Text style={styles.date}>
                {activityToEdit && repeatDays.length > 0 && t.addActivity.from}
                {dateLabel}
              </Text>
            </View>
            <Logo color={color} size={44} />
          </View>
          {firstSelectableDate && (
            <DateInput
              firstDate={firstSelectableDate}
              initialDate={initialDate}
              onChange={changeDate}
            />
          )}
          {firstSelectableDate && hasDateError && (
            <Text style={[styles.errorText, styles.dateErrorText]}>
              {t.addActivity.dateError(firstSelectableDate)}
            </Text>
          )}
          <TextInput
            accessibilityLabel={t.addActivity.titleLabel}
            autoFocus={!activityToEdit}
            onChangeText={setTitle}
            onSubmitEditing={() => startInputRef.current?.focus()}
            placeholder={t.addActivity.titlePlaceholder}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="next"
            style={styles.input}
            submitBehavior="submit"
            value={title}
          />
          <TextInput
            accessibilityLabel={t.addActivity.descriptionLabel}
            maxLength={MAX_DESCRIPTION_LENGTH}
            multiline
            onChangeText={setDescription}
            placeholder={t.addActivity.descriptionPlaceholder}
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, styles.descriptionInput]}
            value={description}
          />
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={[styles.label, styles.timeLabel]}>{t.addActivity.start}</Text>
              <TextInput
                accessibilityLabel={t.addActivity.startLabel}
                keyboardType="number-pad"
                onBlur={() => setStartText(completeTimeInput(startText))}
                onChangeText={changeStart}
                placeholder="HH:MM"
                placeholderTextColor={colors.textSecondary}
                ref={startInputRef}
                returnKeyType="done"
                style={[styles.input, styles.timeInput]}
                value={startText}
              />
            </View>
            <View style={styles.timeField}>
              <Text style={[styles.label, styles.timeLabel]}>{t.addActivity.end}</Text>
              <TextInput
                accessibilityLabel={t.addActivity.endLabel}
                keyboardType="number-pad"
                onBlur={completeEnd}
                onChangeText={changeEnd}
                placeholder="HH:MM"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="done"
                style={[styles.input, styles.timeInput]}
                value={endText}
              />
            </View>
          </View>
          {hasTimeError && (
            <Text style={styles.errorText}>
              {t.addActivity.timeError}
            </Text>
          )}
          <Text style={styles.label}>
            {t.addActivity.repeat}{' '}
            {repeatDays.length === 0
              ? t.addActivity.once
              : repeatDays.map((day) => t.dates.weekdaysShort[day]).join(', ')}
          </Text>
          <RepeatPicker
            color={color}
            onChange={setRepeatDays}
            value={repeatDays}
          />
          <Text style={styles.label}>{t.addActivity.color}</Text>
          <ColorPicker value={color} onChange={setColor} />
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.button}
            >
              <Text style={styles.cancelText}>{t.common.cancel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={submit}
              style={[styles.button, styles.confirmButton]}
            >
              <Text style={styles.confirmText}>
                {activityToEdit ? t.common.save : t.common.add}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  date: {
    marginTop: 4,
    color: colors.textSecondary,
  },
  input: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.background,
    color: colors.text,
  },
  // Grows with the text up to about three lines, then scrolls inside.
  descriptionInput: {
    height: undefined,
    minHeight: 44,
    maxHeight: 88,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 18,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeField: {
    flex: 1,
  },
  timeInput: {
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  timeLabel: {
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    marginHorizontal: 16,
    fontSize: 12,
    color: colors.primary,
  },
  dateErrorText: {
    marginTop: 0,
    marginBottom: 12,
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
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelText: {
    color: colors.primary,
  },
  confirmText: {
    fontWeight: 'bold',
    color: colors.surface,
  },
});
