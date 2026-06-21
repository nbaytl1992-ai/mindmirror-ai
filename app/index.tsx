import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useJournal } from '../hooks/useJournal';
import { useSubscription } from '../hooks/useSubscription';
import { COLORS, FREE_HISTORY_DAYS } from '../lib/constants';
import { getStreak } from '../lib/stats';
import EmotionChart from '../components/EmotionChart';
import type { JournalEntry } from '../lib/types';

const { width } = Dimensions.get('window');

function EntryCard({ entry }: { entry: JournalEntry }) {
  const router = useRouter();
  const d = new Date(entry.date);
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/entry/${entry.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{dateStr}</Text>
        <Text style={styles.cardEmotion}>{entry.emotion}</Text>
      </View>
      <Text style={styles.cardContent} numberOfLines={2}>
        {entry.content}
      </Text>
      {entry.aiResponse && (
        <Text style={styles.cardResponse}>
          🤖 {entry.aiResponse}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { entries, todayWritten, getEntriesForDateRange } = useJournal();
  const { tier } = useSubscription();
  const streak = getStreak(entries);

  const visibleEntries =
    tier === 'premium'
      ? entries
      : getEntriesForDateRange(FREE_HISTORY_DAYS);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🧠 MindMirror</Text>
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>每日一问，探索内心</Text>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak} 天</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <EmotionChart entries={entries} days={tier === 'premium' ? 30 : 7} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            日记记录 ({visibleEntries.length})
          </Text>
          {tier === 'free' && (
            <Text style={styles.limitBadge}>
              免费版 {FREE_HISTORY_DAYS}天</Text>
          )}
        </View>

        {visibleEntries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>还没有日记</Text>
            <Text style={styles.emptySub}>点击下方按钮开始第一篇</Text>
          </View>
        ) : (
          visibleEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.writeBtn,
          todayWritten && styles.writeBtnDone,
        ]}
        onPress={() => router.push('/write')}
        activeOpacity={0.8}
      >
        <Text style={styles.writeBtnText}>
          {todayWritten ? '✅ 今日已记录' : '✏️ 写日记'}
        </Text>
      </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textDim,
  },
  streakBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  limitBadge: {
    fontSize: 11,
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
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
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.textDim,
    fontWeight: '600',
  },
  cardEmotion: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  cardContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  cardResponse: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
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
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 4,
  },
  writeBtn: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  writeBtnDone: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },
  writeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
