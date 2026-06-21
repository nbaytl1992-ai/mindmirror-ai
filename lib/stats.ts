import type { JournalEntry } from './types';

export function getStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;

  const uniqueDates = [...new Set(entries.map((e) => new Date(e.date).toDateString()))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(uniqueDates[0] === todayStr ? Date.now() : Date.now() - 86400000);

  for (const dateStr of uniqueDates) {
    if (dateStr === checkDate.toDateString()) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getWeeklyAverages(entries: JournalEntry[]) {
  const recent = entries.slice(0, 7);
  if (recent.length === 0) return null;

  const avg = (key: keyof typeof recent[0]['emotions']) =>
    Math.round(recent.reduce((s, e) => s + e.emotions[key], 0) / recent.length);

  return {
    joy: avg('joy'),
    sadness: avg('sadness'),
    anxiety: avg('anxiety'),
    energy: avg('energy'),
    count: recent.length,
  };
}

export function getMonthlyAverages(entries: JournalEntry[]) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const recent = entries.filter((e) => new Date(e.date) >= cutoff);
  if (recent.length === 0) return null;

  const avg = (key: keyof typeof recent[0]['emotions']) =>
    Math.round(recent.reduce((s, e) => s + e.emotions[key], 0) / recent.length);

  return {
    joy: avg('joy'),
    sadness: avg('sadness'),
    anxiety: avg('anxiety'),
    energy: avg('energy'),
    count: recent.length,
  };
}
