import { AI_API_KEY, AI_API_BASE, AI_MODEL } from './constants';
import type { EmotionScores, WeeklyInsight } from './types';

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

async function callAI(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${AI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

const EMOTION_SYSTEM_PROMPT = `你是一个专业的情绪分析师。请分析用户的日记内容，返回一个JSON对象，不要任何markdown标记。

返回格式：
{
  "emotion": "主要情绪标签（如平静、开心、焦虑、兴奋等）",
  "emotions": {
    "joy": 0-100,
    "sadness": 0-100,
    "anxiety": 0-100,
    "energy": 0-100
  },
  "response": "对用户日记的温暖回复（一句话，50字以内，像朋友一样说话）"
}

规则：
1. 检测日记的语言，用同样的语言回复
2. joy: 快乐/满足感的强度
3. sadness: 伤感/失落的强度
4. anxiety: 焦虑/压力的强度
5. energy: 活力/动力的强度
6. 四个分数之和不必等于100，是独立维度
7. response 要真诚、温暖、不说教`;

const INSIGHT_SYSTEM_PROMPT = `你是一个智能生活助理。根据用户近期的日记和情绪数据，生成一份周度洞察报告。

返回JSON格式，不要markdown标记：
{
  "summary": "本周整体心情概况（2-3句话）",
  "trends": ["趋势1", "趋势2", "趋势3"],
  "suggestions": ["建议1", "建议2", "建议3"],
  "moodTrend": "up | down | stable"
}

规则：
1. 检测用户语言，用同样语言返回
2. 总结要有共鸣感，不是冷冰冰的数据分析
3. 趋势要具体，不要空泛
4. 建议要可操作，不要太虚
5. moodTrend 根据整体趋势判断`;

function fallbackEmotion(content: string, userScores?: EmotionScores): {
  emotion: string;
  emotions: EmotionScores;
  response: string;
} {
  const scores = userScores || { joy: 50, sadness: 20, anxiety: 20, energy: 50 };

  // Pick dominant emotion based on highest score
  const entries = Object.entries(scores) as [keyof EmotionScores, number][];
  const dominant = entries.reduce((a, b) => (a[1] > b[1] ? a : b));

  const emotionMap: Record<keyof EmotionScores, string> = {
    joy: scores.joy > 70 ? '开心' : scores.joy > 40 ? '平静' : '淡然',
    sadness: scores.sadness > 70 ? '难过' : scores.sadness > 40 ? '低落' : '略感伤感',
    anxiety: scores.anxiety > 70 ? '焦虑' : scores.anxiety > 40 ? '紧张' : '轻微不安',
    energy: scores.energy > 70 ? '充满活力' : scores.energy > 40 ? '正常' : '缺乏活力',
  };

  const responses = [
    '感谢你分享，记录下来已经是很好的开始。',
    '每一次记录都是了解自己的一步，你做得很好。',
    '我听到你了，这些感受都很重要。',
    '愿今天的记录能带给你一些清晰和安定。',
    '你的真诚值得被看见，谢谢你的信任。',
  ];
  const response = responses[Math.floor(Math.random() * responses.length)];

  return {
    emotion: emotionMap[dominant[0]],
    emotions: scores,
    response,
  };
}

export async function analyzeEmotion(
  content: string,
  userScores?: EmotionScores
): Promise<{
  emotion: string;
  emotions: EmotionScores;
  response: string;
}> {
  // If no API key configured, skip the network call entirely
  if (!AI_API_KEY || AI_API_KEY.length < 10) {
    console.warn('[AI] No API key, using local fallback');
    return fallbackEmotion(content, userScores);
  }

  try {
    const result = await callAI([
      { role: 'system', content: EMOTION_SYSTEM_PROMPT },
      { role: 'user', content: content },
    ]);
    return JSON.parse(result);
  } catch (err) {
    console.error('[AI] analyzeEmotion failed, using fallback:', err);
    return fallbackEmotion(content, userScores);
  }
}

function fallbackInsight(entries: { content: string; date: string; emotion: string; emotions: EmotionScores }[]): WeeklyInsight {
  const avgJoy = Math.round(entries.reduce((s, e) => s + e.emotions.joy, 0) / entries.length);
  const avgAnxiety = Math.round(entries.reduce((s, e) => s + e.emotions.anxiety, 0) / entries.length);
  const avgEnergy = Math.round(entries.reduce((s, e) => s + e.emotions.energy, 0) / entries.length);

  const moodTrend: 'up' | 'down' | 'stable' =
    avgJoy > 60 ? 'up' : avgAnxiety > 60 ? 'down' : 'stable';

  return {
    weekStart: entries[entries.length - 1]?.date || new Date().toISOString(),
    summary: `近期记录了${entries.length}篇日记，整体心情${avgJoy > 50 ? '偏积极' : avgAnxiety > 50 ? '偏负面' : '较为平稳'}。继续保持记录习惯，会看到更多模式。`,
    trends: [
      `快乐指数平均值为 ${avgJoy}`,
      `焦虑指数平均值为 ${avgAnxiety}`,
      `活力指数平均值为 ${avgEnergy}`,
    ],
    suggestions: [
      '继续每日记录，积累更多数据以获得深度洞察。',
      '关注情绪起伏，试着在焦虑时做几次深呼吸。',
      '感谢自己坚持记录，这是关爱自己的方式。',
    ],
    moodTrend,
  };
}

export async function generateWeeklyInsight(
  entries: { content: string; date: string; emotion: string; emotions: EmotionScores }[]
): Promise<WeeklyInsight> {
  if (!AI_API_KEY || AI_API_KEY.length < 10) {
    console.warn('[AI] No API key, using local fallback insight');
    return fallbackInsight(entries);
  }

  const entriesText = entries
    .map(
      (e) =>
        `日期: ${e.date}\n内容: ${e.content}\n情绪: ${e.emotion}\n快乐:${e.emotions.joy} 伤感:${e.emotions.sadness} 焦虑:${e.emotions.anxiety} 活力:${e.emotions.energy}`
    )
    .join('\n---\n');

  try {
    const result = await callAI([
      { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
      { role: 'user', content: `近期日记记录:\n${entriesText}` },
    ]);
    return JSON.parse(result);
  } catch (err) {
    console.error('[AI] generateWeeklyInsight failed, using fallback:', err);
    return fallbackInsight(entries);
  }
}
