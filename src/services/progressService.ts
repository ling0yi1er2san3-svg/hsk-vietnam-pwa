import { db } from '../db/database';
import type { LearningProgress, VocabularyEntry } from '../types/vocabulary';

const DAY = 24 * 60 * 60 * 1000;

export interface ProgressOverview {
  vocabularyTotal: number;
  trackedTotal: number;
  newTotal: number;
  learningTotal: number;
  reviewTotal: number;
  masteredTotal: number;
  dueToday: number;
  difficultTotal: number;
  accuracy: number;
  correctAnswers: number;
  wrongAnswers: number;
  streakDays: number;
}

export interface LevelProgress {
  level: number;
  vocabularyTotal: number;
  trackedTotal: number;
  learningTotal: number;
  reviewTotal: number;
  masteredTotal: number;
  dueToday: number;
  percentStarted: number;
  percentMastered: number;
}

export interface ProgressWord {
  word: VocabularyEntry;
  progress: LearningProgress;
}

function isDue(item: LearningProgress, now = Date.now()): boolean {
  return item.status !== 'mastered' && !!item.nextReview && item.nextReview <= now;
}

function difficultyScore(item: LearningProgress): number {
  return (item.difficultyScore ?? 0) + item.wrongCount * 2 - item.correctCount * 0.2;
}

export async function getProgressDashboard(): Promise<{ overview: ProgressOverview; levels: LevelProgress[] }> {
  const [vocabulary, progress, history] = await Promise.all([
    db.vocabulary.toArray(),
    db.progress.toArray(),
    db.quizHistory.toArray()
  ]);

  const progressMap = new Map(progress.map((item) => [item.wordId, item]));
  const now = Date.now();
  const correctAnswers = history.filter((item) => item.correct).length;
  const wrongAnswers = history.length - correctAnswers;

  const activeDays = new Set(history.map((item) => {
    const date = new Date(item.answeredAt);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }));

  let streakDays = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date(now - offset * DAY);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (activeDays.has(key)) streakDays += 1;
    else if (offset > 0 || activeDays.size) break;
  }

  const levels: LevelProgress[] = [1, 2, 3, 4, 5, 6].map((level) => {
    const words = vocabulary.filter((word) => word.hskLevel === level);
    const rows = words.map((word) => progressMap.get(word.id)).filter((item): item is LearningProgress => !!item && item.status !== 'new');
    const masteredTotal = rows.filter((item) => item.status === 'mastered').length;
    return {
      level,
      vocabularyTotal: words.length,
      trackedTotal: rows.length,
      learningTotal: rows.filter((item) => item.status === 'learning').length,
      reviewTotal: rows.filter((item) => item.status === 'review').length,
      masteredTotal,
      dueToday: rows.filter((item) => isDue(item, now)).length,
      percentStarted: words.length ? Math.round((rows.length / words.length) * 100) : 0,
      percentMastered: words.length ? Math.round((masteredTotal / words.length) * 100) : 0
    };
  });

  const tracked = progress.filter((item) => item.status !== 'new');
  return {
    overview: {
      vocabularyTotal: vocabulary.length,
      trackedTotal: tracked.length,
      newTotal: Math.max(0, vocabulary.length - tracked.length),
      learningTotal: tracked.filter((item) => item.status === 'learning').length,
      reviewTotal: tracked.filter((item) => item.status === 'review').length,
      masteredTotal: tracked.filter((item) => item.status === 'mastered').length,
      dueToday: tracked.filter((item) => isDue(item, now)).length,
      difficultTotal: tracked.filter((item) => item.wrongCount >= 2 && item.wrongCount > item.correctCount / 2).length,
      accuracy: history.length ? Math.round((correctAnswers / history.length) * 100) : 0,
      correctAnswers,
      wrongAnswers,
      streakDays
    },
    levels
  };
}

export async function getDueWords(limit = 60): Promise<ProgressWord[]> {
  const now = Date.now();
  const progress = (await db.progress.toArray())
    .filter((item) => isDue(item, now))
    .sort((a, b) => (a.nextReview ?? 0) - (b.nextReview ?? 0))
    .slice(0, limit);
  const words = await db.vocabulary.bulkGet(progress.map((item) => item.wordId));
  return progress.flatMap((item, index) => words[index] ? [{ word: words[index]!, progress: item }] : []);
}

export async function getDifficultWords(limit = 60): Promise<ProgressWord[]> {
  const progress = (await db.progress.toArray())
    .filter((item) => item.wrongCount > 0)
    .sort((a, b) => difficultyScore(b) - difficultyScore(a))
    .slice(0, limit);
  const words = await db.vocabulary.bulkGet(progress.map((item) => item.wordId));
  return progress.flatMap((item, index) => words[index] ? [{ word: words[index]!, progress: item }] : []);
}

export async function getRecentReviewWords(limit = 30): Promise<ProgressWord[]> {
  const progress = (await db.progress.toArray())
    .filter((item) => !!item.lastReviewed)
    .sort((a, b) => (b.lastReviewed ?? 0) - (a.lastReviewed ?? 0))
    .slice(0, limit);
  const words = await db.vocabulary.bulkGet(progress.map((item) => item.wordId));
  return progress.flatMap((item, index) => words[index] ? [{ word: words[index]!, progress: item }] : []);
}

export function formatReviewDate(timestamp?: number): string {
  if (!timestamp) return 'Chưa lên lịch';
  const diff = timestamp - Date.now();
  if (diff <= 0) return 'Đến hạn';
  const days = Math.ceil(diff / DAY);
  if (days <= 1) return 'Ngày mai';
  return `${days} ngày nữa`;
}
