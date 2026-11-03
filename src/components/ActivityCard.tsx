import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Activity } from '../calendar/activities';
import { WEEKDAY_LABELS } from '../calendar/monthGrid';
import { colors } from '../theme';
import Logo from './Logo';

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
  const repeat = activity.repeatDays
    .map((day) => WEEKDAY_LABELS[day])
    .join(', ');

  return (
    <View
      style={[styles.card, { backgroundColor: activity.color }]}
      testID={`activity-${activity.id}`}
    >
      {!isCompact && (
        <Logo color={colors.surface} size={28} />
      )}
      <Pressable
        accessibilityLabel={`Edit ${activity.title}`}
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
        {repeat !== '' && (
          <Text numberOfLines={1} style={styles.repeat}>
            {repeat}
          </Text>
        )}
      </Pressable>
      <Pressable
        accessibilityLabel={`${activity.title} done`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isCompleted }}
        hitSlop={8}
        onPress={onToggleCompleted}
      >
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={colors.surface}
        />
      </Pressable>
      <Pressable
        accessibilityLabel={`Delete ${activity.title}`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onDelete}
      >
        <Ionicons name="close" size={20} color={colors.surface} />
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
    borderRadius: 16,
  },
  details: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: colors.surface,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  repeat: {
    marginTop: 2,
    fontSize: 12,
    color: colors.surface,
  },
});
