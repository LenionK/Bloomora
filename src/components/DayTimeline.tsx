import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { Activity, isCompletedOn } from '../calendar/activities';
import {
  CARD_GAP,
  getDayGaps,
  getHourHeights,
  getTimelinePosition,
  getTimeMarks,
  HOUR_HEIGHT,
  layoutDay,
} from '../calendar/dayLayout';
import { formatDuration } from '../calendar/time';
import { colors } from '../theme';
import ActivityCard from './ActivityCard';
import GapLine from './GapLine';

const TIME_LABEL_HEIGHT = 16;
type Props = {
  date: Date;
  activities: Activity[];
  initialHour: number;
  onToggleCompleted: (activity: Activity) => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
};

export default function DayTimeline({
  date,
  activities,
  initialHour,
  onToggleCompleted,
  onEdit,
  onDelete,
}: Props) {
  const positioned = layoutDay(activities);
  const hourHeights = getHourHeights(activities);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentOffset={{
        x: 0,
        y: getTimelinePosition(hourHeights, initialHour * 60),
      }}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      {hourHeights.map((height, hour) => (
        <View key={hour} style={[styles.hour, { height }]}>
          <View style={styles.hourLine} />
          {height === HOUR_HEIGHT && (
            <View
              style={[styles.hourLine, styles.halfHourLine]}
              testID={`half-hour-line-${hour}`}
            />
          )}
        </View>
      ))}

      <View style={styles.timeMarks}>
        {getTimeMarks(positioned).map(({ top, label, color }) => (
          <Text
            key={label}
            style={[
              styles.timeMark,
              { top: top - TIME_LABEL_HEIGHT / 2 },
              color ? { color, fontWeight: 'bold' } : undefined,
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View pointerEvents="box-none" style={styles.cards}>
        {getDayGaps(positioned).map(
          ({ top, height, minutes, topColor, bottomColor }) => (
            <View key={top} style={[styles.gap, { top, height }]}>
              <GapLine
                bottomColor={bottomColor}
                height={height}
                topColor={topColor}
              />
              <View style={styles.gapLabel}>
                <Text style={styles.gapText}>{formatDuration(minutes)}</Text>
              </View>
            </View>
          ),
        )}

        {positioned.map(({ activity, top, height, lane, laneCount }) => (
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
              onEdit={() => onEdit(activity)}
              onToggleCompleted={() => onToggleCompleted(activity)}
            />
          </View>
        ))}
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
    marginLeft: 48,
  },
  hourLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.textSecondary,
  },
  halfHourLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    opacity: 0.4,
  },
  timeMarks: {
    position: 'absolute',
    top: 8,
    left: 0,
    width: 48,
  },
  timeMark: {
    position: 'absolute',
    fontSize: 12,
    lineHeight: TIME_LABEL_HEIGHT,
    color: colors.textSecondary,
  },
  cards: {
    position: 'absolute',
    top: 8,
    bottom: 112,
    left: 48,
    right: 0,
  },
  gap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gapLabel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 11,
    borderColor: colors.text,
    backgroundColor: colors.background,
  },
  gapText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  cardSlot: {
    position: 'absolute',
    paddingHorizontal: 2,
  },
});
