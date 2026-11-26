import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from './AppText';
import { toDateKey } from '../calendar/activities';
import {
  completeTwoDigitInput,
  DateInputs,
  formatDayInput,
  formatMonthInput,
  formatYearInput,
  parseDateInputs,
  toDateInputs,
} from '../calendar/dateInput';
import { useStrings } from '../i18n/LanguageContext';
import { colors } from '../theme';

type Props = {
  initialDate: Date;
  firstDate: Date;
  onChange: (date: Date | null) => void;
};

export default memo(function DateInput({
  initialDate,
  firstDate,
  onChange,
}: Props) {
  const t = useStrings();
  const [inputs, setInputs] = useState(toDateInputs(initialDate));

  function changeInputs(changes: Partial<DateInputs>) {
    const next = { ...inputs, ...changes };
    const date = parseDateInputs(next);

    setInputs(next);
    onChange(date && toDateKey(date) >= toDateKey(firstDate) ? date : null);
  }

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Text style={styles.label}>{t.dateInput.day}</Text>
        <TextInput
          accessibilityLabel={t.dateInput.day}
          keyboardType="number-pad"
          onBlur={() =>
            setInputs({ ...inputs, day: completeTwoDigitInput(inputs.day) })
          }
          onChangeText={(text) => changeInputs({ day: formatDayInput(text) })}
          returnKeyType="done"
          selectTextOnFocus
          style={styles.input}
          value={inputs.day}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>{t.dateInput.month}</Text>
        <TextInput
          accessibilityLabel={t.dateInput.month}
          keyboardType="number-pad"
          onBlur={() =>
            setInputs({ ...inputs, month: completeTwoDigitInput(inputs.month) })
          }
          onChangeText={(text) =>
            changeInputs({ month: formatMonthInput(text) })
          }
          returnKeyType="done"
          selectTextOnFocus
          style={styles.input}
          value={inputs.month}
        />
      </View>
      <View style={styles.yearField}>
        <Text style={styles.label}>{t.dateInput.year}</Text>
        <TextInput
          accessibilityLabel={t.dateInput.year}
          keyboardType="number-pad"
          onChangeText={(text) => changeInputs({ year: formatYearInput(text) })}
          returnKeyType="done"
          selectTextOnFocus
          style={styles.input}
          value={inputs.year}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  field: {
    flex: 1,
  },
  yearField: {
    flex: 1.3,
  },
  label: {
    marginBottom: 4,
    fontSize: 12,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  input: {
    height: 44,
    paddingHorizontal: 8,
    borderRadius: 22,
    textAlign: 'center',
    backgroundColor: colors.background,
    color: colors.text,
  },
});
