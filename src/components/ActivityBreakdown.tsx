import { StyleSheet, Text, View } from 'react-native';
import { ActivityStats, getScore } from '../stats/stats';
import { colors } from '../theme';

// Drawn on the primary colour of the activities card.
const PARTS = [
  { key: 'done', label: 'Done', color: colors.surface },
  { key: 'missed', label: 'Missed', color: colors.primaryLight },
  { key: 'skipped', label: 'Cancelled', color: colors.primaryDark },
] as const;

type Props = {
  stats: ActivityStats;
};

// One bar split by how the past days of the activities went. Each part also
// gets its count and share in the legend, so the colours are not needed to read it.
export default function ActivityBreakdown({ stats }: Props) {
  const total = stats.done + stats.missed + stats.skipped;

  return (
    <View>
      <View style={styles.bar}>
        {PARTS.map(({ key, color }) =>
          stats[key] > 0 ? (
            <View
              key={key}
              style={[styles.part, { flex: stats[key], backgroundColor: color }]}
            />
          ) : null,
        )}
      </View>
      <View style={styles.legend}>
        {PARTS.map(({ key, label, color }) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>
              {label} {stats[key]} · {getScore(stats[key], total) ?? 0}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 4,
    height: 12,
  },
  part: {
    borderRadius: 6,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 6,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.surface,
  },
});
