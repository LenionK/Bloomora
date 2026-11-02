import { ComponentRef, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MONTH_NAMES, WEEKDAY_LABELS } from '../calendar/monthGrid';
import {
  formatTimeInput,
  getDefaultEndText,
  parseTimeRange,
  TimeOfDay,
} from '../calendar/time';
import { colors } from '../theme';
import ColorPicker from './ColorPicker';
import Logo from './Logo';
import RepeatPicker from './RepeatPicker';

export type NewActivity = {
  title: string;
  start: Date;
  end: Date;
  color: string;
  repeatDays: number[];
};

type Props = {
  date: Date;
  onAdd: (activity: NewActivity) => void;
  onClose: () => void;
};

export default function AddActivityModal({ date, onAdd, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [startText, setStartText] = useState('');
  const [typedEndText, setTypedEndText] = useState<string | null>(null);
  const [color, setColor] = useState(colors.primary);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [hasTimeError, setHasTimeError] = useState(false);
  const startInputRef = useRef<ComponentRef<typeof TextInput>>(null);

  const endText = typedEndText ?? getDefaultEndText(startText);

  function changeStart(text: string) {
    setStartText(formatTimeInput(text));
    setHasTimeError(false);
  }

  function changeEnd(text: string) {
    setTypedEndText(formatTimeInput(text));
    setHasTimeError(false);
  }

  function toDate(time: TimeOfDay) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.hours,
      time.minutes,
    );
  }

  function submit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const timeRange = parseTimeRange(startText, endText);
    if (!timeRange) {
      setHasTimeError(true);
      return;
    }

    onAdd({
      title: trimmedTitle,
      start: toDate(timeRange.start),
      end: toDate(timeRange.end),
      color,
      repeatDays,
    });
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color }]}>New activity</Text>
              <Text style={styles.date}>
                {date.getDate()} {MONTH_NAMES[date.getMonth()]}
              </Text>
            </View>
            <Logo color={color} size={44} />
          </View>
          <TextInput
            accessibilityLabel="Activity title"
            autoFocus
            onChangeText={setTitle}
            onSubmitEditing={() => startInputRef.current?.focus()}
            placeholder="Activity title"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="next"
            style={styles.input}
            submitBehavior="submit"
            value={title}
          />
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={[styles.label, styles.timeLabel]}>Start</Text>
              <TextInput
                accessibilityLabel="Start time"
                keyboardType="number-pad"
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
              <Text style={[styles.label, styles.timeLabel]}>End</Text>
              <TextInput
                accessibilityLabel="End time"
                keyboardType="number-pad"
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
              Enter a start time and an end time later than it
            </Text>
          )}
          <Text style={styles.label}>
            Repeat:{' '}
            {repeatDays.length === 0
              ? 'Once'
              : repeatDays.map((day) => WEEKDAY_LABELS[day]).join(', ')}
          </Text>
          <RepeatPicker
            color={color}
            onChange={setRepeatDays}
            value={repeatDays}
          />
          <Text style={styles.label}>Color</Text>
          <ColorPicker value={color} onChange={setColor} />
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.button}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={submit}
              style={[styles.button, styles.confirmButton]}
            >
              <Text style={styles.confirmText}>Add</Text>
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
