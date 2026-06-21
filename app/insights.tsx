import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useJournal } from '../hooks/useJournal';
import { useSubscription } from '../hooks/useSubscription';
import { COLORS } from '../lib/constants';
import EmotionChart from '../components/EmotionChart';
import type { WeeklyInsight } from '../lib/types';

function InsightCard({ insight }: { insight: WeeklyInsight }) {
  const trendEmoji =
    insight.moodTrend === 'up' ? '📈' : insight.moodTrend === 'down' ? '📉' : '➖';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          周度洞察
        </Text>
        <Text style={styles.cardTrend}>{trendEmoji}</Text>
      </View>
      <Text style={styles.cardSummary}>{insight.summary}</Text>

      <Text style={styles.sectionLabel}>趋势</Text>
      {insight.trends.map((t, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{t}</Text>
        </View>
      ))}

      <Text style={styles.sectionLabel}>建议</Text>
      {insight.suggestions.map((s, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>→</Text>
          <Text style={styles.bulletText}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

export default function InsightsScreen() {
  const { entries, insights, generateInsight, loading } = useJournal();
  const { tier } = useSubscription();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await generateInsight();
    setGenerating(false);
  };

  const hasEnoughEntries = entries.length >= 3;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>📊 洞察报告</Text>
        <Text style={styles.subtitle}>AI 分析你的情绪模式</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <EmotionChart entries={entries} days={7} title="近7天情绪趋势" />

        {tier === 'free' && (
          <View style={styles.paywallCard}>
            <Text style={styles.paywallEmoji}>🔐</Text>
            <Text style={styles.paywallTitle}>AI 深度洞察需要会员</Text>
            <Text style={styles.paywallDesc}>
              免费版可查看基础情绪图表。升级会员解锁 AI 周度洞察报告、趋势分析与个性化建议。
            </Text>
          </View>
        )}

        {tier === 'premium' && (
          <>
            {!hasEnoughEntries ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📝</Text>
                <Text style={styles.emptyText}>记录3篇以上日记后可生成洞察</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.generateBtn,
                    (loading || generating) && styles.generateBtnDisabled,
                  ]}
                  onPress={handleGenerate}
                  disabled={loading || generating}
                >
                  {generating || loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.generateBtnText}>
                      ✨ 生成新的洞察
                    </Text>
                  )}
                </TouchableOpacity>

                {insights.length === 0 && !generating && (
                  <View style={styles.empty}>
                    <Text style={styles.emptyText}>还没有洞察报告</Text>
                    <Text style={styles.emptySub}>点击上方按钮生成</Text>
                  </View>
                )}

                {insights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  generateBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTrend: {
    fontSize: 20,
  },
  cardSummary: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletDot: {
    width: 16,
    fontSize: 13,
    color: COLORS.primary,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  paywallCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paywallEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  paywallTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  paywallDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 4,
  },
});
