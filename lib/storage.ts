import AsyncStorage from '@react-native-async-storage/async-storage';
import type { JournalEntry, WeeklyInsight } from './types';

const ENTRIES_KEY = '@mindmirror_entries';
const INSIGHTS_KEY = '@mindmirror_insights';
const LAST_WRITE_KEY = '@mindmirror_last_write';

export async function getEntries(): Promise<JournalEntry[]> {
  const data = await AsyncStorage.getItem(ENTRIES_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveEntry(entry: JournalEntry): Promise<void> {
  const entries = await getEntries();
  entries.unshift(entry);
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  await AsyncStorage.setItem(LAST_WRITE_KEY, entry.date);
}

export async function deleteEntry(id: string): Promise<void> {
  const entries = await getEntries();
  const filtered = entries.filter((e) => e.id !== id);
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
}

export async function getInsights(): Promise<WeeklyInsight[]> {
  const data = await AsyncStorage.getItem(INSIGHTS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveInsight(insight: WeeklyInsight): Promise<void> {
  const insights = await getInsights();
  insights.unshift(insight);
  await AsyncStorage.setItem(INSIGHTS_KEY, JSON.stringify(insights));
}

export async function getLastWriteDate(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_WRITE_KEY);
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeItem(ENTRIES_KEY);
  await AsyncStorage.removeItem(INSIGHTS_KEY);
  await AsyncStorage.removeItem(LAST_WRITE_KEY);
}
