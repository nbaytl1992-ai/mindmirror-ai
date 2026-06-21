import { useState, useEffect, useCallback } from 'react';
import { getEntries, saveEntry, deleteEntry, getLastWriteDate, getInsights, saveInsight } from '../lib/storage';
import { analyzeEmotion, generateWeeklyInsight } from '../lib/ai';
import type { JournalEntry, WeeklyInsight, EmotionScores } from '../lib/types';
import { DAILY_PROMPTS } from '../lib/constants';

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<WeeklyInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayWritten, setTodayWritten] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [e, i, last] = await Promise.all([
      getEntries(),
      getInsights(),
      getLastWriteDate(),
    ]);
    setEntries(e);
    setInsights(i);
    if (last) {
      const lastDate = new Date(last).toDateString();
      const today = new Date().toDateString();
      setTodayWritten(lastDate === today);
    }
  };

  const getTodayPrompt = useCallback(() => {
    const dayIndex = new Date().getDate() % DAILY_PROMPTS.length;
    return DAILY_PROMPTS[dayIndex];
  }, []);

  const addEntry = async (content: string, userScores?: EmotionScores) => {
    setLoading(true);
    try {
      // Always call AI for response and to cross-check emotion
      const aiResult = await analyzeEmotion(content);
      
      // Merge: user scores take priority if provided, otherwise use AI
      const emotions: EmotionScores = userScores || aiResult.emotions;
      
      const entry: JournalEntry = {
        id: Date.now().toString(),
        content,
        date: new Date().toISOString(),
        emotion: aiResult.emotion,
        emotions,
        aiPrompt: getTodayPrompt(),
        aiResponse: aiResult.response,
      };
      await saveEntry(entry);
      setEntries((prev) => [entry, ...prev]);
      setTodayWritten(true);
      return entry;
    } finally {
      setLoading(false);
    }
  };

  const removeEntry = async (id: string) => {
    await deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const generateInsight = async () => {
    if (entries.length < 3) return null;
    setLoading(true);
    try {
      const recent = entries.slice(0, 7);
      const insight = await generateWeeklyInsight(recent);
      await saveInsight(insight);
      setInsights((prev) => [insight, ...prev]);
      return insight;
    } finally {
      setLoading(false);
    }
  };

  const getEntriesForDateRange = useCallback((days: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return entries.filter((e) => new Date(e.date) >= cutoff);
  }, [entries]);

  return {
    entries,
    insights,
    loading,
    todayWritten,
    getTodayPrompt,
    addEntry,
    removeEntry,
    generateInsight,
    getEntriesForDateRange,
  };
}
