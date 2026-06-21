import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useJournal } from '../hooks/useJournal';
import { useSubscription } from '../hooks/useSubscription';
import { COLORS, FREE_DAILY_LIMIT } from '../lib/constants';
import EmotionPicker from '../components/EmotionPicker';
import type { EmotionScores } from '../lib/types';

const DEFAULT_SCORES: EmotionScores = {
  joy: 50,
  sadness: 20,
  anxiety: 20,
  energy: 50,
};

export default function WriteScreen() {
  const router = useRouter();
  const { getTodayPrompt, addEntry, todayWritten } = useJournal();
  const { tier } = useSubscription();
  const [content, setContent] = useState('');
  const [scores, setScores] = useState<EmotionScores>(DEFAULT_SCORES);
  const [saving, setSaving] = useState(false);

  const prompt = getTodayPrompt();

  const canWrite =
    tier === 'premium' ||
    !todayWritten;

  const handleSave = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      await addEntry(content.trim(), scores);
      router.back();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!canWrite) {
    return (
      <View style={styles.container}>
        <View style={styles.limitBox}>
          <Text style={styles.limitEmoji}>🔒</Text>
          <Text style={styles.limitTitle}>今日限额已用完</Text>
          <Text style={styles.limitDesc}>
            免费版每天限{FREE_DAILY_LIMIT}篇日记。升级会员可无限记录。
          </Text>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.upgradeBtnText}>✨ 升级会员</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerBack}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>写日记</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!content.trim() || saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <Text style={[
              styles.headerSave,
              !content.trim() && styles.headerSaveDisabled,
            ]}>
              保存
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.promptBox}>
          <Text style={styles.promptLabel}>今日问题</Text>
          <Text style={styles.promptText}>{prompt}</Text>
        </View>

        <EmotionPicker value={scores} onChange={setScores} />

        <TextInput
          style={styles.input}
          multiline
          placeholder="随心写下你的想法..."
          placeholderTextColor={COLORS.textDim}
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
          maxLength={2000}
        />

        <Text style={styles.charCount}>
          {content.length} / 2000
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerSave: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    width: 50,
    textAlign: 'right',
  },
  headerSaveDisabled: {
    color: COLORS.textDim,
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  promptBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promptLabel: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  promptText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    minHeight: 160,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.textDim,
    marginTop: 8,
    marginBottom: 40,
  },
  limitBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  limitEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  limitTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  limitDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  upgradeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  upgradeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  backBtn: {
    paddingVertical: 10,
  },
  backBtnText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
