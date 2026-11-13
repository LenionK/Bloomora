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
import { Activity } from '../calendar/activities';
import {
  ActivityStats,
  addActivityStats,
  getActivityStats,
  getScore,
  getWaterStats,
  WaterDay,
} from '../stats/stats';
import {
  loadKeptActivityStats,
  loadWaterDays,
} from '../storage/activityDatabase';
import { colors } from '../theme';

type Props = {
  today: Date;
  activities: Activity[];
  onBack: () => void;
};

type Row = {
  label: string;
  value: string;
};

function days(count: number): string {
  return `${count} ${count === 1 ? 'day' : 'days'}`;
}

function ScoreCard({
  label,
  score,
  color,
  rows,
}: {
  label: string;
  score: number | null;
  color: string;
  rows: Row[];
}) {
  return (
    <View style={styles.card}>
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color }]}>
          {score === null ? '–' : `${score}%`}
        </Text>
        <Text style={styles.scoreLabel}>{label}</Text>
      </View>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.rowText}>{row.label}</Text>
          <Text style={[styles.rowValue, { color }]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function StatsScreen({ today, activities, onBack }: Props) {
  const [keptStats, setKeptStats] = useState<ActivityStats | null>(null);
  const [waterDays, setWaterDays] = useState<WaterDay[] | null>(null);

  useEffect(() => {
    loadKeptActivityStats().then(setKeptStats).catch(console.error);
    loadWaterDays().then(setWaterDays).catch(console.error);
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
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Back to calendar"
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
          <Text style={styles.backText}>Calendar</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Stats</Text>

      {keptStats === null || waterDays === null ? (
        <Text style={styles.loading}>…</Text>
      ) : (
        <StatsCards
          activityStats={addActivityStats(
            keptStats,
            getActivityStats(activities, today),
          )}
          today={today}
          waterDays={waterDays}
        />
      )}

      <Text style={styles.note}>
        Today counts once it is over, or as soon as 2 L are reached. Deleted
        activities stay in the stats.
      </Text>
    </ScrollView>
  );
}

function StatsCards({
  activityStats,
  waterDays,
  today,
}: {
  activityStats: ActivityStats;
  waterDays: WaterDay[];
  today: Date;
}) {
  const { done, skipped, missed } = activityStats;
  const water = getWaterStats(waterDays, today);

  return (
    <>
      <Text style={styles.sectionTitle}>Activities</Text>
      <ScoreCard
        color={colors.primary}
        label="done on their day"
        rows={[
          { label: 'Done', value: String(done) },
          { label: 'Missed', value: String(missed) },
          { label: 'Skipped', value: String(skipped) },
        ]}
        score={getScore(done, done + missed)}
      />

      <Text style={styles.sectionTitle}>Water</Text>
      <ScoreCard
        color={colors.water}
        label="of days at 2 L"
        rows={[
          { label: 'Current streak', value: days(water.currentStreak) },
          { label: 'Best streak', value: days(water.bestStreak) },
          {
            label: 'Days at 2 L',
            value: `${water.goalDays} of ${water.countedDays}`,
          },
        ]}
        score={getScore(water.goalDays, water.countedDays)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
  },
  backText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  title: {
    marginTop: 16,
    fontSize: 40,
    lineHeight: 44,
    includeFontPadding: false,
    fontWeight: 'bold',
    color: colors.text,
  },
  loading: {
    marginTop: 24,
    color: colors.textSecondary,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  card: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  score: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  rowText: {
    color: colors.text,
  },
  rowValue: {
    fontWeight: 'bold',
  },
  note: {
    marginTop: 16,
    marginHorizontal: 16,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
