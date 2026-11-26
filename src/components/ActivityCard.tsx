import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Pressable from './Pressable';
import { Text } from './AppText';
import { Activity } from '../calendar/activities';
import { useStrings } from '../i18n/LanguageContext';
import { colors, fontSizes, radii } from '../theme';
import Logo from './Logo';

// The two icons reach 48 points to tap, and share the gap between them.
const DONE_TAP_SPACE = { top: 12, bottom: 12, left: 12, right: 4 };
const DELETE_TAP_SPACE = { top: 14, bottom: 14, left: 4, right: 14 };

type Props = {
  activity: Activity;
  isCompleted: boolean;
  isCompact: boolean;
  onToggleCompleted: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ActivityCard({
  activity,
  isCompleted,
  isCompact,
  onToggleCompleted,
  onEdit,
  onDelete,
}: Props) {
  const t = useStrings();
  const repeat = activity.repeatDays
    .map((day) => t.dates.weekdaysShort[day])
    .join(', ');

  return (
    <View
      style={[styles.card, { backgroundColor: activity.color }]}
      testID={`activity-${activity.id}`}
    >
      {!isCompact && (
        <Logo color={colors.onColor} size={28} />
      )}
      <Pressable
        accessibilityLabel={t.activity.edit(activity.title)}
        accessibilityRole="button"
        onPress={onEdit}
        style={styles.details}
      >
        <Text
          numberOfLines={1}
          style={[styles.title, isCompleted && styles.completedTitle]}
        >
          {activity.title}
        </Text>
        {!!activity.description && (
          <Text numberOfLines={1} style={styles.description}>
            {activity.description}
          </Text>
        )}
        {repeat !== '' && (
          <Text numberOfLines={1} style={styles.repeat}>
            {repeat}
          </Text>
        )}
      </Pressable>
      <Pressable
        accessibilityLabel={t.activity.done(activity.title)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isCompleted }}
        hitSlop={DONE_TAP_SPACE}
        onPress={onToggleCompleted}
      >
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={colors.onColor}
        />
      </Pressable>
      <Pressable
        accessibilityLabel={t.activity.delete(activity.title)}
        accessibilityRole="button"
        hitSlop={DELETE_TAP_SPACE}
        onPress={onDelete}
      >
        <Ionicons name="close" size={20} color={colors.onColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: radii.chip,
  },
  details: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: colors.onColor,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  // One line only, so even the smallest card keeps its title readable.
  description: {
    marginTop: 0,
    fontSize: fontSizes.caption,
    color: colors.onColor,
  },
  repeat: {
    marginTop: 4,
    fontSize: fontSizes.caption,
    color: colors.onColor,
  },
});
