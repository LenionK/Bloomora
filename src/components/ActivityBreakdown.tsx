import { StyleSheet, View } from 'react-native';
import { useStrings } from '../i18n/LanguageContext';
import { Text } from './AppText';
import { ActivityStats, getScore } from '../stats/stats';
import { colors, fontSizes, radii } from '../theme';

// Drawn on the primary colour of the activities card.
const PARTS = [
  { key: 'done', color: colors.onColor },
  { key: 'missed', color: colors.onPrimaryMuted },
  { key: 'skipped', color: colors.onPrimaryStrong },
] as const;

type Props = {
  stats: ActivityStats;
};

// One bar split by how the past days of the activities went. Each part also
// gets its count and share in the legend, so the colours are not needed to read it.
export default function ActivityBreakdown({ stats }: Props) {
  const t = useStrings();
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
        {PARTS.map(({ key, color }) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>
              {t.stats.parts[key]} {stats[key]} · {getScore(stats[key], total) ?? 0}%
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
    borderRadius: radii.small,
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
    gap: 4,
  },
  // A white outline keeps the darker and lighter dots visible on the primary.
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.onColor,
  },
  legendText: {
    fontSize: fontSizes.label,
    fontWeight: 'bold',
    color: colors.onColor,
  },
});
