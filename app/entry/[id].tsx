import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useJournal } from '../../hooks/useJournal';
import { COLORS } from '../../lib/constants';

const DIMENSION_META: Record<string, { label: string; color: string; emoji: string }> = {
  joy: { label: '快乐', color: COLORS.joy, emoji: '😊' },
  sadness: { label: '伤感', color: COLORS.sadness, emoji: '😢' },
  anxiety: { label: '焦虑', color: COLORS.anxiety, emoji: '😰' },
  energy: { label: '活力', color: COLORS.energy, emoji: '⚡' },
};

export default function EntryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, removeEntry } = useJournal();

  const entry = entries.find((e) => e.id === id);

  if (!entry) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.headerBack}>← 返回</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>日记不存在</Text>
        </View>
      </View>
    );
  }

  const d = new Date(entry.date);
  const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

  const handleDelete = () => {
    Alert.alert(
      '删除日记',
      '确定要删除这篇日记吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await removeEntry(entry.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerBack}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>日记详情</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.headerDelete}>删除</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.metaCard}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <View style={styles.tagRow}>
            <View style={styles.emotionTag}>
              <Text style={styles.emotionTagText}>{entry.emotion}</Text>
            </View>
            {entry.aiPrompt && (
              <View style={styles.promptTag}>
                <Text style={styles.promptTagText} numberOfLines={1}>
                  问题: {entry.aiPrompt}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Emotion Scores */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>📊 情绪维度</Text>
          <View style={styles.scores}>
            {Object.entries(entry.emotions).map(([key, val]) => {
              const meta = DIMENSION_META[key];
              if (!meta) return null;
              const pct = Math.max(0, Math.min(100, val));
              return (
                <View key={key} style={styles.scoreRow}>
                  <Text style={styles.scoreEmoji}>{meta.emoji}</Text>
                  <Text style={styles.scoreLabel}>{meta.label}</Text>
                  <View style={styles.scoreTrack}>
                    <View style={[styles.scoreFill, { width: `${pct}%` as any, backgroundColor: meta.color }]} />
                  </View>
                  <Text style={[styles.scoreValue, { color: meta.color }]}>{pct}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentCard}>
          <Text style={styles.contentTitle}>📝 内容</Text>
          <Text style={styles.contentText}>{entry.content}</Text>
        </View>

        {/* AI Response */}
        {entry.aiResponse && (
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>🤖 AI 回复</Text>
            <Text style={styles.aiText}>{entry.aiResponse}</Text>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBack: {
    fontSize: 15,
    color: COLORS.textMuted,
    width: 50,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerDelete: {
    fontSize: 15,
    color: COLORS.danger,
    width: 50,
    textAlign: 'right',
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textDim,
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  metaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textDim,
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionTag: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  emotionTagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  promptTag: {
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 1,
  },
  promptTagText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  scores: {
    gap: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreEmoji: {
    fontSize: 16,
    width: 24,
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.textDim,
    width: 36,
  },
  scoreTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '700',
    width: 28,
    textAlign: 'right',
  },
  contentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  contentText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
  },
  aiCard: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 10,
  },
  aiText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
