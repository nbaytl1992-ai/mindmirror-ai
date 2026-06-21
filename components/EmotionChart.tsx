import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../lib/constants';
import type { JournalEntry } from '../lib/types';

interface Props {
  entries: JournalEntry[];
  days?: number;
  title?: string;
}

export default function EmotionChart({ entries, days = 7, title }: Props) {
  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>记录日记后查看情绪趋势</Text>
      </View>
    );
  }

  const recent = entries.slice(0, days).reverse();
  const maxVal = 100;
  const chartTitle = title || `近${days}天情绪趋势`;

  const dimensions = [
    { key: 'joy', label: '快乐', color: COLORS.joy },
    { key: 'sadness', label: '伤感', color: COLORS.sadness },
    { key: 'anxiety', label: '焦虑', color: COLORS.anxiety },
    { key: 'energy', label: '活力', color: COLORS.energy },
  ] as const;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{chartTitle}</Text>
      <View style={styles.chart}>
        {recent.map((e, i) => {
          const d = new Date(e.date);
          const label = `${d.getMonth() + 1}/${d.getDate()}`;

          return (
            <View key={i} style={styles.col}>
              <View style={styles.bars}>
                {dimensions.map((dim) => {
                  const h = ((e.emotions as any)[dim.key] / maxVal) * 70;
                  return (
                    <View
                      key={dim.key}
                      style={[styles.bar, { height: Math.max(2, h) as any, backgroundColor: dim.color }]}
                    />
                  );
                })}
              </View>
              <Text style={styles.label}>{label}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        {dimensions.map((dim) => (
          <View key={dim.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: dim.color }]} />
            <Text style={styles.legendText}>{dim.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
    paddingBottom: 8,
  },
  col: {
    alignItems: 'center',
    flex: 1,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 90,
  },
  bar: {
    width: 8,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    color: COLORS.textDim,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  empty: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.textDim,
    fontSize: 14,
  },
});
