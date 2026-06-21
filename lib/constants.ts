export const AI_API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY || '';
export const AI_API_BASE = process.env.EXPO_PUBLIC_AI_API_BASE || 'https://api.deepseek.com/v1';
export const AI_MODEL = process.env.EXPO_PUBLIC_AI_MODEL || 'deepseek-chat';

export const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_RC_KEY_IOS || '';
export const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_KEY_ANDROID || '';

export { IAP_PRODUCT_IDS } from './subscriptionProducts';

export const FREE_DAILY_LIMIT = 1;
export const FREE_HISTORY_DAYS = 7;

export const DAILY_PROMPTS = [
  "今天最让你感觉活着的一件小事是什么？",
  "如果可以重来，今天你想改变哪个决定？",
  "今天有什么让你感到微小的幸福？",
  "今天遇到了什么挑战？你是怎么应对的？",
  "如果给今天的自己一句话，你会说什么？",
  "今天你对什么事情感到感激？",
  "如果明天是完美的一天，你希望它是什么样的？",
  "今天有什么让你觉得自己很棒？",
  "今天你学到了什么？",
  "如果可以和未来的自己说一句话，你会说什么？",
  "今天的你，最想念谁？",
  "今天有什么事情让你觉得这就是生活？",
];

export const COLORS = {
  bg: '#0A0A0B',
  surface: '#18181B',
  border: '#27272A',
  text: '#E4E4E7',
  textMuted: '#A1A1AA',
  textDim: '#71717A',
  primary: '#F59E0B',
  primaryLight: '#FBBF24',
  success: '#22C55E',
  danger: '#EF4444',
  joy: '#F59E0B',
  sadness: '#3B82F6',
  anxiety: '#EF4444',
  energy: '#22C55E',
};
