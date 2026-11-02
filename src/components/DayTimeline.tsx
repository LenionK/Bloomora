import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Activity, isCompletedOn } from '../calendar/activities';
import { HOUR_HEIGHT, layoutDay } from '../calendar/dayLayout';
import { colors } from '../theme';
import ActivityCard from './ActivityCard';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const CARD_GAP = 4;

type Props = {
  date: Date;
  activities: Activity[];
  initialHour: number;
  onToggleCompleted: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
};

export default function DayTimeline({
  date,
  activities,
  initialHour,
  onToggleCompleted,
  onDelete,
}: Props) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentOffset={{ x: 0, y: initialHour * HOUR_HEIGHT }}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      {HOURS.map((hour) => (
        <View key={hour} style={styles.hour}>
          <Text style={styles.hourLabel}>
            {String(hour).padStart(2, '0')}:00
          </Text>
          <View style={styles.hourLine} />
        </View>
      ))}

      <View pointerEvents="box-none" style={styles.cards}>
        {layoutDay(activities).map(
          ({ activity, top, height, lane, laneCount }) => (
            <View
              key={activity.id}
              style={[
                styles.cardSlot,
                {
                  top,
                  height: height - CARD_GAP,
                  left: `${(lane / laneCount) * 100}%`,
                  width: `${100 / laneCount}%`,
                },
              ]}
            >
              <ActivityCard
                activity={activity}
                isCompact={laneCount > 1}
                isCompleted={isCompletedOn(activity, date)}
                onDelete={() => onDelete(activity)}
                onToggleCompleted={() => onToggleCompleted(activity)}
              />
            </View>
          ),
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    marginTop: 16,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 112,
  },
  hour: {
    flexDirection: 'row',
    height: HOUR_HEIGHT,
  },
  hourLabel: {
    width: 48,
    marginTop: -8,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.textSecondary,
  },
  cards: {
    position: 'absolute',
    top: 8,
    bottom: 112,
    left: 48,
    right: 0,
  },
  cardSlot: {
    position: 'absolute',
    paddingHorizontal: 2,
  },
});
