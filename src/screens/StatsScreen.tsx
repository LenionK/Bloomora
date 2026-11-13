import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Activity, toDateKey } from '../calendar/activities';
import ActivityBreakdown from '../components/ActivityBreakdown';
import ActivityChart from '../components/ActivityChart';
import { weekdayOf } from '../components/ChartDayLabels';
import ScoreRing from '../components/ScoreRing';
import ScreenHeader from '../components/ScreenHeader';
import SegmentedControl from '../components/SegmentedControl';
import WaterChart, { UntrackedLegend } from '../components/WaterChart';
import {
  ActivityStats,
  addActivityStats,
  fromDateKey,
  getActivityStats,
  getPeriodStart,
  getRecentActivities,
  getRecentWater,
  getScore,
  getWaterStats,
  RECENT_DAYS,
  WaterDay,
} from '../stats/stats';
import {
  loadKeptActivityStats,
  loadStatsStart,
  loadWaterDays,
} from '../storage/activityDatabase';
import { cardShadow, colors } from '../theme';
import { DAILY_GOAL_ML, formatLitres } from '../water/water';

const ACTIVITIES_RING_SIZE = 104;
const DAY_MS = 24 * 60 * 60 * 1000;
const WATER_RING_SIZE = 84;

type Chart = 'activities' | 'water';

const CHART_OPTIONS: { value: Chart; label: string }[] = [
  { value: 'activities', label: 'Activities' },
  { value: 'water', label: 'Water' },
];

type Period = 'week' | 'month' | 'all';

// All time has no start, so its chart shows the last 30 days.
const ALL_TIME_CHART_DAYS = 30;
const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
];

// The first day counted: this week's Monday or the first of this month, as in
// the calendar. All time has none.
function getPeriodFirstDay(period: Period, today: Date): Date | null {
  const year = today.getFullYear();
  const month = today.getMonth();

  if (period === 'week') {
    return new Date(year, month, today.getDate() - ((today.getDay() + 6) % 7));
  }
  if (period === 'month') return new Date(year, month, 1);
  return null;
}

const INFO_LINES = [
  'The period at the top applies to the whole page: this week from Monday, this month from the 1st. The water streak is always the current one.',
  'Completion rate: activities done out of those due, done or missed. Cancelled days do not count.',
  'Activities done today count at once; the others count as missed once the day is over.',
  'Water counts a day once it is over, or as soon as 2 L are reached. Until then the card shows today.',
  'Deleted activities stay in the stats under All time. Their dates are not kept, so a week or a month counts only the activities still saved.',
];

type Props = {
  today: Date;
  activities: Activity[];
  onBack: () => void;
  onAddActivity: () => void;
  onAddWater: () => void;
};

function days(count: number): string {
  return `${count} ${count === 1 ? 'day' : 'days'}`;
}

export default function StatsScreen({
  today,
  activities,
  onBack,
  onAddActivity,
  onAddWater,
}: Props) {
  const [keptStats, setKeptStats] = useState<ActivityStats | null>(null);
  const [waterDays, setWaterDays] = useState<WaterDay[] | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [period, setPeriod] = useState<Period>('week');
  // Undefined while loading, null when the stats were never reset.
  const [statsStart, setStatsStart] = useState<string | null>();
  const periodFirstDay = getPeriodFirstDay(period, today);
  // Nothing before the last reset counts, whatever the period.
  const countFrom =
    statsStart && (!periodFirstDay || toDateKey(periodFirstDay) < statsStart)
      ? fromDateKey(statsStart)
      : periodFirstDay;

  useEffect(() => {
    loadKeptActivityStats().then(setKeptStats).catch(console.error);
    loadWaterDays().then(setWaterDays).catch(console.error);
    loadStatsStart().then(setStatsStart).catch(console.error);
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onBack();
        return true;
      },
    );

    return () => subscription.remove();
  }, [onBack]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={styles.container}
    >
      <ScreenHeader
        isInfoOpen={isInfoOpen}
        onBack={onBack}
        onInfo={() => setIsInfoOpen(!isInfoOpen)}
        title="Stats"
      />

      {isInfoOpen && (
        <View style={[styles.card, styles.infoCard]}>
          {INFO_LINES.map((line) => (
            <Text key={line} style={styles.infoText}>
              {line}
            </Text>
          ))}
        </View>
      )}

      <SegmentedControl
        color={colors.primary}
        label="Period"
        onChange={setPeriod}
        options={PERIOD_OPTIONS}
        style={styles.periodSelector}
        trackColor={colors.surface}
        value={period}
      />

      {keptStats === null || waterDays === null || statsStart === undefined ? (
        <Text style={styles.loading}>…</Text>
      ) : (
        <StatsContent
          activities={activities}
          activityStats={
            periodFirstDay === null
              ? addActivityStats(
                  keptStats,
                  getActivityStats(activities, today, countFrom ?? undefined),
                )
              : getActivityStats(activities, today, countFrom ?? undefined)
          }
          onAddActivity={onAddActivity}
          onAddWater={onAddWater}
          periodFirstDay={periodFirstDay}
          statsStart={statsStart}
          today={today}
          waterDays={waterDays}
        />
      )}
    </ScrollView>
  );
}

// The big card: completion ring, how many were completed and how the rest went.
function ActivitiesCard({
  stats,
  onPlan,
}: {
  stats: ActivityStats;
  onPlan: () => void;
}) {
  const { done, missed } = stats;
  const score = getScore(done, done + missed);

  return (
    <View style={[styles.card, styles.activitiesCard]}>
      <View style={styles.activitiesTop}>
        {score === null ? (
          <View style={[styles.emptyCircle, styles.activitiesEmptyCircle]}>
            <Ionicons
              name="checkmark-done-outline"
              size={36}
              color={colors.surface}
            />
          </View>
        ) : (
          <ScoreRing
            color={colors.surface}
            score={score}
            size={ACTIVITIES_RING_SIZE}
            trackColor={colors.primaryLight}
          />
        )}
        <View style={styles.activitiesSummary}>
          <Text style={styles.eyebrow}>ACTIVITIES</Text>
          {score === null ? (
            <>
              <Text style={styles.activitiesEmpty}>Nothing to rate yet</Text>
              <Pressable
                accessibilityRole="button"
                onPress={onPlan}
                style={[styles.actionButton, styles.planButton]}
              >
                <Text style={[styles.actionText, styles.planText]}>
                  Plan an activity
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.activitiesCount}>
                {done} of {done + missed}
              </Text>
              <Text style={styles.activitiesLabel}>completed</Text>
            </>
          )}
        </View>
      </View>
      {stats.done + stats.missed + stats.skipped > 0 && (
        <View style={styles.breakdown}>
          <ActivityBreakdown stats={stats} />
        </View>
      )}
    </View>
  );
}

function StatsContent({
  activities,
  activityStats,
  waterDays,
  periodFirstDay,
  statsStart,
  today,
  onAddActivity,
  onAddWater,
}: {
  activities: Activity[];
  activityStats: ActivityStats;
  waterDays: WaterDay[];
  // Null for all time.
  periodFirstDay: Date | null;
  // The day of the last reset, as a date key, or null.
  statsStart: string | null;
  today: Date;
  onAddActivity: () => void;
  onAddWater: () => void;
}) {
  const [chart, setChart] = useState<Chart>('activities');
  const chartDays =
    periodFirstDay === null
      ? ALL_TIME_CHART_DAYS
      : Math.round(
          (getPeriodStart(today, 1).getTime() - periodFirstDay.getTime()) /
            DAY_MS,
        ) + 1;
  const periodStartKey = periodFirstDay ? toDateKey(periodFirstDay) : '';
  const periodWater = getWaterStats(
    waterDays.filter(({ date }) => date >= periodStartKey),
    today,
  );
  // The streak is always the current one, whatever the period.
  const water = getWaterStats(waterDays, today);
  const lastWeek = getRecentWater(waterDays, today);
  const todayMillilitres = lastWeek[lastWeek.length - 1].millilitres;
  const waterScore = getScore(periodWater.goalDays, periodWater.countedDays);
  // Before any day is counted, the card shows today, so water added today shows up.
  const isShowingToday = waterScore === null && todayMillilitres !== null;
  const todayPercent = Math.round(
    Math.min((todayMillilitres ?? 0) / DAILY_GOAL_ML, 1) * 100,
  );
  const shownWaterScore = isShowingToday ? todayPercent : waterScore;
  const chartColor = chart === 'activities' ? colors.primary : colors.water;

  return (
    <>
      <ActivitiesCard onPlan={onAddActivity} stats={activityStats} />

      <View style={styles.row}>
        <View style={[styles.card, styles.waterCard]}>
          {shownWaterScore === null ? (
            <View style={[styles.emptyCircle, styles.waterEmptyCircle]}>
              <Ionicons name="water-outline" size={30} color={colors.water} />
            </View>
          ) : (
            <ScoreRing
              color={colors.water}
              score={shownWaterScore}
              size={WATER_RING_SIZE}
              trackColor={colors.waterTrack}
            />
          )}
          <Text style={styles.waterTitle}>Water</Text>
          {shownWaterScore === null ? (
            <>
              <Text style={styles.waterCaption}>Not tracked yet</Text>
              <Pressable
                accessibilityRole="button"
                onPress={onAddWater}
                style={[styles.actionButton, styles.waterButton]}
              >
                <Text style={styles.actionText}>Add water</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.waterCaption}>
              {isShowingToday
                ? `${formatLitres(todayMillilitres ?? 0)} of 2 L today`
                : `${periodWater.goalDays}/${periodWater.countedDays} days at 2 L`}
            </Text>
          )}
        </View>

        <View style={[styles.card, styles.streakCard]}>
          <View style={styles.flameCircle}>
            <Ionicons name="flame" size={26} color={colors.surface} />
          </View>
          <Text style={styles.streakLabel}>Water streak</Text>
          <Text style={styles.streakValue}>{days(water.currentStreak)}</Text>
          {/* The last 7 days, from the oldest on the left to today. */}
          <View
            accessibilityLabel={`${
              lastWeek.filter(
                ({ millilitres }) => (millilitres ?? 0) >= DAILY_GOAL_ML,
              ).length
            } of the last ${RECENT_DAYS} days at 2 L`}
            accessible
            style={styles.weekDots}
          >
            {lastWeek.map(({ date, millilitres }, index) => (
              <View key={date.getTime()} style={styles.weekDay}>
                <View
                  style={[
                    styles.weekDot,
                    millilitres === null
                      ? styles.untrackedWeekDot
                      : {
                          backgroundColor:
                            millilitres >= DAILY_GOAL_ML
                              ? colors.streak
                              : colors.streakSoft,
                        },
                  ]}
                />
                <Text
                  style={[
                    styles.weekDayLabel,
                    index === lastWeek.length - 1 && styles.todayWeekDay,
                  ]}
                >
                  {weekdayOf(date).charAt(0)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.card, styles.chartCard]}>
        <SegmentedControl
          color={chartColor}
          label="Chart"
          onChange={setChart}
          options={CHART_OPTIONS}
          value={chart}
        />
        <View style={styles.legendRow}>
          <UntrackedLegend
            label={chart === 'activities' ? 'Nothing planned' : 'Not tracked'}
          />
        </View>
        {chart === 'activities' ? (
          <ActivityChart
            days={getRecentActivities(activities, today, chartDays).map(
              (day) =>
                statsStart && toDateKey(day.date) < statsStart
                  ? { ...day, done: 0, planned: 0 }
                  : day,
            )}
          />
        ) : (
          <WaterChart days={getRecentWater(waterDays, today, chartDays)} />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 24,
  },
  infoCard: {
    gap: 8,
    padding: 16,
  },
  infoText: {
    color: colors.text,
  },
  loading: {
    color: colors.textSecondary,
  },
  card: {
    borderRadius: 24,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  // The header keeps some room under its title, so the selector moves up a
  // little and leaves the same room below, sitting halfway between the two.
  periodSelector: {
    ...cardShadow,
    marginTop: -6,
    marginBottom: 5,
  },
  emptyCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionText: {
    fontWeight: 'bold',
    color: colors.surface,
  },

  activitiesCard: {
    padding: 18,
    backgroundColor: colors.primary,
  },
  activitiesTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  activitiesEmptyCircle: {
    width: ACTIVITIES_RING_SIZE,
    height: ACTIVITIES_RING_SIZE,
    borderRadius: ACTIVITIES_RING_SIZE / 2,
    borderWidth: 8,
    borderColor: colors.primaryLight,
  },
  activitiesSummary: {
    flex: 1,
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: colors.surface,
  },
  activitiesCount: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.surface,
  },
  activitiesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.surface,
  },
  activitiesEmpty: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.surface,
  },
  planButton: {
    backgroundColor: colors.surface,
  },
  planText: {
    color: colors.primary,
  },
  breakdown: {
    marginTop: 16,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
  },
  waterCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.waterSoft,
  },
  waterEmptyCircle: {
    width: WATER_RING_SIZE,
    height: WATER_RING_SIZE,
    borderRadius: WATER_RING_SIZE / 2,
    borderWidth: 8,
    borderColor: colors.waterTrack,
  },
  waterTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.waterDark,
  },
  waterCaption: {
    marginTop: 2,
    fontSize: 13,
    textAlign: 'center',
    color: colors.waterDark,
  },
  waterButton: {
    backgroundColor: colors.water,
  },

  streakCard: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.streakBackground,
  },
  flameCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.streak,
  },
  streakLabel: {
    marginTop: 10,
    fontSize: 13,
    color: colors.streak,
  },
  streakValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.streak,
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  weekDay: {
    alignItems: 'center',
    gap: 3,
  },
  weekDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  untrackedWeekDot: {
    borderWidth: 2,
    borderColor: colors.streakSoft,
  },
  weekDayLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  todayWeekDay: {
    fontWeight: 'bold',
    color: colors.streak,
  },

  chartCard: {
    gap: 12,
    padding: 16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
