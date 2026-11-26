import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/AppText';
import { Activity, toDateKey } from '../calendar/activities';
import ActivityBreakdown from '../components/ActivityBreakdown';
import ActivityChart from '../components/ActivityChart';
import Button from '../components/Button';
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
import { Strings } from '../i18n/en';
import { useStrings } from '../i18n/LanguageContext';
import { cardShadow, colors, fontSizes, radii, SCREEN_TOP } from '../theme';
import { DAILY_GOAL_ML, formatLitres } from '../water/water';

const ACTIVITIES_RING_SIZE = 96;
const DAY_MS = 24 * 60 * 60 * 1000;
const WATER_RING_SIZE = 84;

type Chart = 'activities' | 'water';

function chartOptions(t: Strings): { value: Chart; label: string }[] {
  return [
    { value: 'activities', label: t.stats.activitiesChart },
    { value: 'water', label: t.stats.waterChart },
  ];
}

type Period = 'week' | 'month' | 'all';

// All time has no start, so its chart shows the last 30 days.
const ALL_TIME_CHART_DAYS = 30;
function periodOptions(t: Strings): { value: Period; label: string }[] {
  return [
    { value: 'week', label: t.stats.thisWeek },
    { value: 'month', label: t.stats.thisMonth },
    { value: 'all', label: t.stats.allTime },
  ];
}

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


type Props = {
  today: Date;
  activities: Activity[];
  onBack: () => void;
  onAddActivity: () => void;
  onAddWater: () => void;
};

export default function StatsScreen({
  today,
  activities,
  onBack,
  onAddActivity,
  onAddWater,
}: Props) {
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const [keptStats, setKeptStats] = useState<ActivityStats | null>(null);
  const [waterDays, setWaterDays] = useState<WaterDay[] | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [period, setPeriod] = useState<Period>('week');
  // The page scrolls only when the cards do not fit on the screen.
  const [viewHeight, setViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
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
      contentContainerStyle={[
        styles.content,
        { paddingBottom: 12 + insets.bottom },
      ]}
      // The cards stay still when dragged, without Android's stretch effect.
      bounces={false}
      onContentSizeChange={(_, height) => setContentHeight(height)}
      onLayout={(event) => setViewHeight(event.nativeEvent.layout.height)}
      overScrollMode="never"
      scrollEnabled={contentHeight > viewHeight + 1}
      style={styles.container}
    >
      <ScreenHeader
        isInfoOpen={isInfoOpen}
        onBack={onBack}
        onInfo={() => setIsInfoOpen(!isInfoOpen)}
        title={t.stats.title}
      />

      {isInfoOpen && (
        <View style={[styles.card, styles.infoCard]}>
          {t.stats.info.map((line) => (
            <Text key={line} style={styles.infoText}>
              {line}
            </Text>
          ))}
        </View>
      )}

      <SegmentedControl
        color={colors.primary}
        label={t.stats.period}
        onChange={setPeriod}
        options={periodOptions(t)}
        style={styles.periodSelector}
        trackColor={colors.surface}
        value={period}
      />

      {keptStats === null || waterDays === null || statsStart === undefined ? (
        // Loaded from the phone in a few milliseconds: no loader, so nothing flickers.
        null
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
  const t = useStrings();
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
              color={colors.onColor}
            />
          </View>
        ) : (
          <ScoreRing
            color={colors.onColor}
            score={score}
            size={ACTIVITIES_RING_SIZE}
            trackColor={colors.onPrimaryMuted}
          />
        )}
        <View style={styles.activitiesSummary}>
          <Text style={styles.eyebrow}>{t.stats.activitiesEyebrow}</Text>
          {score === null ? (
            <>
              <Text style={styles.activitiesEmpty}>{t.stats.nothingToRate}</Text>
              <View style={styles.buttonSlot}>
                <Button
                  color={colors.onColor}
                  isCompact
                  label={t.nextActivity.plan}
                  onPress={onPlan}
                  textColor={colors.primary}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.activitiesCount}>
                {t.stats.doneOf(done, done + missed)}
              </Text>
              <Text style={styles.activitiesLabel}>{t.stats.completed}</Text>
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
  const t = useStrings();
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
          <Text style={styles.waterTitle}>{t.stats.waterChart}</Text>
          {shownWaterScore === null ? (
            <>
              <Text style={styles.waterCaption}>{t.stats.notTrackedYet}</Text>
              <View style={styles.buttonSlot}>
                <Button
                  color={colors.water}
                  isCompact
                  label={t.stats.addWater}
                  onPress={onAddWater}
                />
              </View>
            </>
          ) : (
            <Text style={styles.waterCaption}>
              {isShowingToday
                ? t.stats.waterToday(formatLitres(todayMillilitres ?? 0))
                : t.stats.daysAtGoal(periodWater.goalDays, periodWater.countedDays)}
            </Text>
          )}
        </View>

        <View style={[styles.card, styles.streakCard]}>
          <View style={styles.flameCircle}>
            <Ionicons name="flame" size={26} color={colors.onColor} />
          </View>
          <Text style={styles.streakLabel}>{t.stats.waterStreak}</Text>
          <Text style={styles.streakValue}>{t.stats.days(water.currentStreak)}</Text>
          {/* The last 7 days, from the oldest on the left to today. */}
          <View
            accessibilityLabel={t.stats.lastDaysAtGoal(
              lastWeek.filter(
                ({ millilitres }) => (millilitres ?? 0) >= DAILY_GOAL_ML,
              ).length,
              RECENT_DAYS,
            )}
            accessible
            style={styles.weekDots}
          >
            {lastWeek.map(({ date, millilitres }, index) => (
              <View key={date.getTime()} style={styles.weekDay}>
                {/* Filled when recorded, a ring when not, and a tick at 2 L, so the days
                    differ by shape and not by colour alone. */}
                <View
                  style={[
                    styles.weekDot,
                    millilitres === null
                      ? styles.untrackedWeekDot
                      : {
                          backgroundColor:
                            millilitres >= DAILY_GOAL_ML
                              ? colors.streak
                              : colors.streakUntracked,
                        },
                  ]}
                >
                  {millilitres !== null && millilitres >= DAILY_GOAL_ML && (
                    <Ionicons name="checkmark" size={10} color={colors.onColor} />
                  )}
                </View>
                <Text
                  style={[
                    styles.weekDayLabel,
                    index === lastWeek.length - 1 && styles.todayWeekDay,
                  ]}
                >
                  {weekdayOf(date, t).charAt(0)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.card, styles.chartCard]}>
        <SegmentedControl
          color={chartColor}
          label={t.stats.chart}
          onChange={setChart}
          options={chartOptions(t)}
          value={chart}
        />
        <View style={styles.legendRow}>
          <UntrackedLegend
            label={chart === 'activities' ? t.charts.nothingPlanned : t.charts.notTracked}
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
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: SCREEN_TOP,
    paddingBottom: 24,
  },
  infoCard: {
    gap: 8,
    padding: 16,
  },
  infoText: {
    color: colors.text,
  },
  card: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  // The header keeps some room under its title, so the selector moves up a
  // little and leaves the same room below, sitting halfway between the two.
  periodSelector: {
    ...cardShadow,
    marginTop: -8,
    marginBottom: 4,
  },
  emptyCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSlot: {
    marginTop: 8,
  },

  activitiesCard: {
    padding: 16,
    backgroundColor: colors.primary,
  },
  activitiesTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  activitiesEmptyCircle: {
    width: ACTIVITIES_RING_SIZE,
    height: ACTIVITIES_RING_SIZE,
    borderRadius: ACTIVITIES_RING_SIZE / 2,
    borderWidth: 8,
    borderColor: colors.onPrimaryMuted,
  },
  activitiesSummary: {
    flex: 1,
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: fontSizes.caption,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: colors.onColor,
  },
  activitiesCount: {
    fontSize: fontSizes.large,
    fontWeight: 'bold',
    color: colors.onColor,
  },
  activitiesLabel: {
    fontSize: fontSizes.body,
    fontWeight: 'bold',
    color: colors.onColor,
  },
  activitiesEmpty: {
    marginTop: 4,
    fontSize: fontSizes.subtitle,
    fontWeight: 'bold',
    color: colors.onColor,
  },
  breakdown: {
    marginTop: 12,
  },

  row: {
    flexDirection: 'row',
    gap: 8,
  },
  waterCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.waterContainer,
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
    fontSize: fontSizes.body,
    fontWeight: 'bold',
    color: colors.waterDark,
  },
  waterCaption: {
    marginTop: 4,
    fontSize: fontSizes.label,
    textAlign: 'center',
    color: colors.waterDark,
  },

  streakCard: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.streakContainer,
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
    marginTop: 8,
    fontSize: fontSizes.label,
    color: colors.streakText,
  },
  streakValue: {
    fontSize: fontSizes.headline,
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
    gap: 4,
  },
  weekDot: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  untrackedWeekDot: {
    borderWidth: 2,
    borderColor: colors.streakUntracked,
  },
  weekDayLabel: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
  },
  todayWeekDay: {
    fontWeight: 'bold',
    color: colors.streakText,
  },

  chartCard: {
    gap: 8,
    padding: 16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
