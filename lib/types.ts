export interface EmotionScores {
  joy: number;
  sadness: number;
  anxiety: number;
  energy: number;
}

export interface JournalEntry {
  id: string;
  content: string;
  date: string; // ISO string
  emotion: string; // primary emotion label
  emotions: EmotionScores;
  aiPrompt: string; // the question AI asked
  aiResponse?: string; // AI's insight/response to this entry
}

export interface WeeklyInsight {
  weekStart: string;
  summary: string;
  trends: string[];
  suggestions: string[];
  moodTrend: 'up' | 'down' | 'stable';
}

export type SubscriptionTier = 'free' | 'premium';
