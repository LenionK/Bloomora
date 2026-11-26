import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
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
import { colors, fontSizes } from '../theme';
import ColorPicker from './ColorPicker';
import DateInput from './DateInput';
import {
  clearActivityDraft,
  loadActivityDraft,
  saveActivityDraft,
} from './activityDraft';
import Button from './Button';
import ModalShell from './ModalShell';
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
  // A new activity starts from what was left unsaved last time, if anything.
  const [draft] = useState(() => (activityToEdit ? null : loadActivityDraft()));
  const [date, setDate] = useState<Date | null>(initialDate);
  const [hasDateError, setHasDateError] = useState(false);
  const [title, setTitle] = useState(activityToEdit?.title ?? draft?.title ?? '');
  const [description, setDescription] = useState(
    activityToEdit?.description ?? draft?.description ?? '',
  );
  const [startText, setStartText] = useState(
    activityToEdit ? formatTime(activityToEdit.start) : (draft?.startText ?? ''),
  );
  const [typedEndText, setTypedEndText] = useState<string | null>(
    activityToEdit ? formatTime(activityToEdit.end) : (draft?.typedEndText ?? null),
  );
  const [color, setColor] = useState(
    activityToEdit?.color ?? draft?.color ?? colors.primary,
  );
  const [repeatDays, setRepeatDays] = useState<number[]>(
    activityToEdit?.repeatDays ?? draft?.repeatDays ?? [],
  );
  const [hasTimeError, setHasTimeError] = useState(false);
  const startInputRef = useRef<TextInputRef>(null);

  // Every change of a new activity is kept, so closing by mistake loses nothing.
  useEffect(() => {
    if (activityToEdit) return;
    const isEmpty =
      title === '' &&
      description === '' &&
      startText === '' &&
      typedEndText === null &&
      repeatDays.length === 0 &&
      color === colors.primary;

    saveActivityDraft(
      isEmpty
        ? null
        : { title, description, startText, typedEndText, color, repeatDays },
    );
  }, [activityToEdit, color, description, repeatDays, startText, title, typedEndText]);

  function cancel() {
    if (!activityToEdit) clearActivityDraft();
    onClose();
  }

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

  // Times are checked once a field is left, never while typing.
  function checkTimes(start: string, end: string) {
    if (start !== '' && end !== '' && !parseTimeRange(start, end)) {
      setHasTimeError(true);
    }
  }

  function completeStart() {
    const completed = completeTimeInput(startText);

    setStartText(completed);
    if (typedEndText !== null) checkTimes(completed, completeTimeInput(typedEndText));
  }

  function completeEnd() {
    if (typedEndText === null) return;

    const completed = completeTimeInput(typedEndText);
    setTypedEndText(completed);
    checkTimes(completeTimeInput(startText), completed);
  }

  // A date left wrong or incomplete shows its error at once.
  const checkDate = useCallback(() => {
    if (!date) setHasDateError(true);
  }, [date]);

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

    if (!activityToEdit) clearActivityDraft();
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
    <ModalShell
      actions={
        <>
          <Button label={t.common.cancel} onPress={cancel} variant="text" />
          <Button
            label={activityToEdit ? t.common.save : t.common.add}
            onPress={submit}
          />
        </>
      }
      // A tap outside the fields closes the keyboard, on the card or around it.
      backgroundTestID="add-activity-backdrop"
      color={color}
      onBackgroundPress={Keyboard.dismiss}
      onClose={onClose}
      subtitle={`${activityToEdit && repeatDays.length > 0 ? t.addActivity.from : ''}${dateLabel}`}
      title={activityToEdit ? t.addActivity.editTitle : t.addActivity.newTitle}
    >
      {firstSelectableDate && (
        <DateInput
          firstDate={firstSelectableDate}
          initialDate={initialDate}
          onBlur={checkDate}
          onChange={changeDate}
        />
      )}
      {firstSelectableDate && hasDateError && (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[styles.errorText, styles.dateErrorText]}
        >
          {t.addActivity.dateError(firstSelectableDate)}
        </Text>
      )}
      {/* Visible labels: the placeholders only show an example. */}
      <Text style={[styles.label, styles.firstLabel]}>{t.addActivity.titleField}</Text>
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
      <Text style={styles.label}>{t.addActivity.descriptionField}</Text>
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
            onBlur={completeStart}
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
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={styles.errorText}
        >
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
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  // At least 44 high, and taller when the phone uses a larger text.
  input: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.background,
    color: colors.text,
  },
  // Grows with the text up to about three lines, then scrolls inside.
  descriptionInput: {
    minHeight: 44,
    maxHeight: 88,
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
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  firstLabel: {
    marginTop: 0,
  },
  timeLabel: {
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    marginHorizontal: 16,
    fontSize: fontSizes.caption,
    color: colors.primary,
  },
  dateErrorText: {
    marginTop: 0,
    marginBottom: 12,
  },
});
