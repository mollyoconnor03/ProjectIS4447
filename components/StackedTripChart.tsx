import { Category } from '@/app/_layout';
import { Palette } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

export type DayBar = {
  date: string;
  label: string;
  total: number;
  segments: { color: string; count: number }[];
};

const CHART_HEIGHT = 160;

export default function StackedTripChart({ days, categories }: { days: DayBar[]; categories: Category[] }) {
  const maxVal = Math.max(...days.map(d => d.total), 1);

  return (
    <View>
      <View style={{ height: CHART_HEIGHT, position: 'relative' }}>
        {[0.25, 0.5, 0.75, 1].map(frac => (
          <View
            key={frac}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: CHART_HEIGHT * (1 - frac),
              height: 0.5,
              backgroundColor: Palette.border,
            }}
          />
        ))}
        <View style={styles.barsRow}>
          {days.map((day, i) => {
            const totalH = Math.max((day.total / maxVal) * CHART_HEIGHT, day.total > 0 ? 4 : 0);
            return (
              <View key={i} style={styles.col}>
                {day.total > 0 && <Text style={styles.valueLabel}>{day.total}</Text>}
                <View style={[styles.barWrap, { height: totalH }]}>
                  {day.segments.map((seg, j) => {
                    const segH = (seg.count / day.total) * totalH;
                    return <View key={j} style={{ height: segH, backgroundColor: seg.color, width: '100%' }} />;
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.axis} />
      <View style={styles.labelsRow}>
        {days.map((day, i) => (
          <Text key={i} style={styles.label}>{day.label}</Text>
        ))}
      </View>
      {categories.length > 0 && (
        <View style={styles.legend}>
          {categories.map((cat, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
              <Text style={styles.legendText}>{cat.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  barsRow: {
    alignItems: 'flex-end',
    bottom: 0,
    flexDirection: 'row',
    gap: 4,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  col: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  barWrap: {
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '80%',
  },
  valueLabel: {
    color: Palette.inkSecondary,
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
  },
  axis: {
    backgroundColor: Palette.inkHint,
    height: 1,
    marginBottom: 6,
  },
  labelsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  label: {
    color: Palette.inkSecondary,
    flex: 1,
    fontSize: 8,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  legendDot: {
    height: 8,
    width: 8,
  },
  legendText: {
    color: Palette.inkSecondary,
    fontSize: 10,
  },
});
