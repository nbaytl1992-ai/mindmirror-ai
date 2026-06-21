import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../lib/constants';
import type { EmotionScores } from '../lib/types';

const MOOD_TAGS = [
  { emoji: '😊', label: '开心', scores: { joy: 85, sadness: 10, anxiety: 5, energy: 80 } },
  { emoji: '😌', label: '平静', scores: { joy: 50, sadness: 10, anxiety: 5, energy: 30 } },
  { emoji: '😔', label: '难过', scores: { joy: 10, sadness: 80, anxiety: 30, energy: 20 } },
  { emoji: '😰', label: '焦虑', scores: { joy: 10, sadness: 20, anxiety: 85, energy: 40 } },
  { emoji: '😤', label: '生气', scores: { joy: 10, sadness: 30, anxiety: 60, energy: 70 } },
  { emoji: '😴', label: '疲惫', scores: { joy: 20, sadness: 30, anxiety: 20, energy: 10 } },
  { emoji: '✨', label: '兴奋', scores: { joy: 90, sadness: 0, anxiety: 20, energy: 95 } },
  { emoji: '😢', label: '失落', scores: { joy: 5, sadness: 90, anxiety: 40, energy: 15 } },
];

interface Props {
  value: EmotionScores;
  onChange: (scores: EmotionScores) => void;
}

export default function EmotionPicker({ value, onChange }: Props) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const handleTagPress = useCallback((tag: typeof MOOD_TAGS[0]) => {
    setSelectedTag(tag.label);
    onChange({ ...tag.scores });
  }, [onChange]);

  const adjustScore = useCallback((key: keyof EmotionScores, delta: number) => {
    onChange({
      ...value,
      [key]: Math.max(0, Math.min(100, value[key] + delta)),
    });
    setSelectedTag(null);
  }, [value, onChange]);

  const dimensionLabels: Record<keyof EmotionScores, { label: string; color: string; emoji: string }> = {
    joy: { label: '快乐', color: COLORS.joy, emoji: '😊' },
    sadness: { label: '伤感', color: COLORS.sadness, emoji: '😢' },
    anxiety: { label: '焦虑', color: COLORS.anxiety, emoji: '😰' },
    energy: { label: '活力', color: COLORS.energy, emoji: '⚡' },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 今日心情</Text>

      {/* Mood Tags */}
      <View style={styles.tagRow}>
        {MOOD_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag.label}
            style={[
              styles.tag,
              selectedTag === tag.label && styles.tagActive,
            ]}
            onPress={() => handleTagPress(tag)}
            activeOpacity={0.7}
          >
            <Text style={styles.tagEmoji}>{tag.emoji}</Text>
            <Text style={[
              styles.tagLabel,
              selectedTag === tag.label && styles.tagLabelActive,
            ]}>
              {tag.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Dimension Sliders */}
      <View style={styles.sliders}>
        {(Object.keys(dimensionLabels) as (keyof EmotionScores)[]).map((key) => {
          const meta = dimensionLabels[key];
          const score = value[key];
          const barWidth = `${score}%`;

          return (
            <View key={key} style={styles.sliderRow}>
              <Text style={styles.sliderEmoji}>{meta.emoji}</Text>
              <View style={styles.sliderLabelBox}>
                <Text style={styles.sliderLabel}>{meta.label}</Text>
              </View>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: barWidth as any, backgroundColor: meta.color }]} />
              </View>
              <View style={styles.sliderControls}>
                <TouchableOpacity
                  style={styles.sliderBtn}
                  onPress={() => adjustScore(key, -10)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.sliderBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.sliderValue, { color: meta.color }]}>{score}</Text>
                <TouchableOpacity
                  style={styles.sliderBtn}
                  onPress={() => adjustScore(key, +10)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.sliderBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
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
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '18',
  },
  tagEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  tagLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  tagLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  sliders: {
    gap: 12,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderEmoji: {
    fontSize: 16,
    width: 24,
  },
  sliderLabelBox: {
    width: 40,
  },
  sliderLabel: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 4,
  },
  sliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 76,
    justifyContent: 'space-between',
  },
  sliderBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderBtnText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
    lineHeight: 18,
  },
  sliderValue: {
    fontSize: 13,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
});
