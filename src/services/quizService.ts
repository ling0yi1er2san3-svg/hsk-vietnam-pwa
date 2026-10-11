import { db } from '../db/database';
import type { LearningProgress, QuizHistory, VocabularyEntry } from '../types/vocabulary';
import { normalizeSearchText } from '../utils/text';

export type QuizQuestionType = QuizHistory['questionType'];

export interface QuizOption {
  id: string;
  label: string;
  wordId: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  word: VocabularyEntry;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: {
    hanzi: string;
    pinyin: string;
    hanViet?: string;
    meaningVi: string;
  };
}

export interface QuizBuildOptions {
  levels: number[];
  types: QuizQuestionType[];
  count: number;
}

const DAY = 24 * 60 * 60 * 1000;

function uniqueByHanzi(entries: VocabularyEntry[]): VocabularyEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.hanzi)) return false;
    seen.add(entry.hanzi);
    return true;
  });
}

function commonHanCount(a: string, b: string): number {
  const chars = new Set(Array.from(a));
  return Array.from(b).filter((char) => chars.has(char)).length;
}

function bigrams(value: string): Set<string> {
  const normalized = normalizeSearchText(value).replace(/\s+/g, '');
  const result = new Set<string>();
  if (normalized.length < 2) {
    if (normalized) result.add(normalized);
    return result;
  }
  for (let i = 0; i < normalized.length - 1; i += 1) result.add(normalized.slice(i, i + 2));
  return result;
}

function diceSimilarity(a: string, b: string): number {
  const aa = bigrams(a);
  const bb = bigrams(b);
  if (!aa.size || !bb.size) return 0;
  let overlap = 0;
  aa.forEach((item) => { if (bb.has(item)) overlap += 1; });
  return (2 * overlap) / (aa.size + bb.size);
}

function distractorScore(target: VocabularyEntry, candidate: VocabularyEntry, type: QuizQuestionType): number {
  if (target.id === candidate.id || target.hanzi === candidate.hanzi) return -999;

  let score = 0;
  if (target.hskLevel === candidate.hskLevel) score += 5;
  score += commonHanCount(target.hanzi, candidate.hanzi) * 8;
  score += diceSimilarity(target.pinyin, candidate.pinyin) * 7;
  score += diceSimilarity(target.meaningVi, candidate.meaningVi) * 4;
  if (target.hanzi.length === candidate.hanzi.length) score += 2;

  if (type === 'hanzi-pinyin') score += diceSimilarity(target.pinyin, candidate.pinyin) * 7;
  if (type === 'meaning-hanzi') score += diceSimilarity(target.meaningVi, candidate.meaningVi) * 4;
  if (type === 'pinyin-hanzi' || type === 'audio-hanzi') score += commonHanCount(target.hanzi, candidate.hanzi) * 3;

  return score + Math.random() * 1.5;
}

function optionLabel(word: VocabularyEntry, type: QuizQuestionType): string {
  switch (type) {
    case 'hanzi-meaning': return word.meaningVi || word.meaningOriginal;
    case 'hanzi-pinyin': return word.pinyin;
    case 'meaning-hanzi':
    case 'pinyin-hanzi':
    case 'audio-hanzi': return word.hanzi;
  }
}

function promptFor(word: VocabularyEntry, type: QuizQuestionType): string {
  switch (type) {
    case 'hanzi-meaning': return word.hanzi;
    case 'hanzi-pinyin': return word.hanzi;
    case 'meaning-hanzi': return word.meaningVi || word.meaningOriginal;
    case 'pinyin-hanzi': return word.pinyin;
    case 'audio-hanzi': return '🔊 Nghe và chọn từ đúng';
  }
}

function reviewScore(progress: LearningProgress | undefined): number {
  if (!progress) return 16 + Math.random() * 4;
  const days = progress.lastReviewed ? Math.min(30, Math.max(0, (Date.now() - progress.lastReviewed) / DAY)) : 10;
  const statusScore = progress.status === 'new' ? 10 : progress.status === 'learning' ? 8 : progress.status === 'review' ? 5 : 1;
  return progress.wrongCount * 5 - progress.correctCount * 0.4 + days + statusScore + (progress.difficultyScore ?? 0) + Math.random() * 3;
}

function weightedPick(pool: VocabularyEntry[], progressMap: Map<string, LearningProgress>, used: Set<string>): VocabularyEntry | undefined {
  const candidates = pool.filter((word) => !used.has(word.id));
  if (!candidates.length) return undefined;
  const ranked = candidates
    .map((word) => ({ word, score: reviewScore(progressMap.get(word.id)) }))
    .sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, Math.max(8, Math.ceil(ranked.length * 0.25)));
  return top[Math.floor(Math.random() * top.length)]?.word;
}

function buildQuestion(word: VocabularyEntry, type: QuizQuestionType, pool: VocabularyEntry[], serial: number): QuizQuestion {
  const distractors = uniqueByHanzi(pool)
    .filter((candidate) => candidate.id !== word.id && optionLabel(candidate, type).trim() && optionLabel(candidate, type) !== optionLabel(word, type))
    .map((candidate) => ({ candidate, score: distractorScore(word, candidate, type) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 18);

  const chosen: VocabularyEntry[] = [];
  while (chosen.length < 3 && distractors.length) {
    const windowSize = Math.min(6, distractors.length);
    const index = Math.floor(Math.random() * windowSize);
    const [item] = distractors.splice(index, 1);
    if (item && !chosen.some((entry) => optionLabel(entry, type) === optionLabel(item.candidate, type))) chosen.push(item.candidate);
  }

  const fallback = pool.filter((candidate) => candidate.id !== word.id && !chosen.some((item) => item.id === candidate.id));
  while (chosen.length < 3 && fallback.length) {
    const index = Math.floor(Math.random() * fallback.length);
    const [candidate] = fallback.splice(index, 1);
    if (candidate && optionLabel(candidate, type).trim() && !chosen.some((entry) => optionLabel(entry, type) === optionLabel(candidate, type))) chosen.push(candidate);
  }

  const correctId = `q${serial}-correct`;
  const options: QuizOption[] = [
    { id: correctId, label: optionLabel(word, type), wordId: word.id },
    ...chosen.map((candidate, index) => ({ id: `q${serial}-d${index}`, label: optionLabel(candidate, type), wordId: candidate.id }))
  ].sort(() => Math.random() - 0.5);

  return {
    id: `quiz-${Date.now()}-${serial}-${word.id}`,
    type,
    word,
    prompt: promptFor(word, type),
    options,
    correctOptionId: correctId,
    explanation: {
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      hanViet: word.hanViet,
      meaningVi: word.meaningVi || word.meaningOriginal
    }
  };
}

export async function buildQuiz(options: QuizBuildOptions): Promise<QuizQuestion[]> {
  const levels = options.levels.length ? options.levels : [1, 2, 3, 4, 5, 6];
  const types: QuizQuestionType[] =
  options.types.length ? options.types : ['hanzi-meaning'];
  const all = await db.vocabulary.toArray();
  const pool = all.filter((word) => levels.includes(word.hskLevel) && word.hanzi && word.pinyin && word.meaningVi);
  const progress = await db.progress.toArray();
  const progressMap = new Map(progress.map((item) => [item.wordId, item]));
  const used = new Set<string>();
  const result: QuizQuestion[] = [];

  for (let i = 0; i < Math.min(options.count, pool.length); i += 1) {
    const word = weightedPick(pool, progressMap, used);
    if (!word) break;
    used.add(word.id);
    const type = types[i % types.length] ?? types[0];
    result.push(buildQuestion(word, type, pool, i));
  }

  return result;
}

function nextProgress(existing: LearningProgress | undefined, correct: boolean): LearningProgress {
  const now = Date.now();
  const previousInterval = existing?.interval ?? 0;
  const correctCount = (existing?.correctCount ?? 0) + (correct ? 1 : 0);
  const wrongCount = (existing?.wrongCount ?? 0) + (correct ? 0 : 1);
  const streak = correct ? (existing?.streak ?? 0) + 1 : 0;

  let status: LearningProgress['status'] = existing?.status ?? 'new';
  let interval = previousInterval;
  if (!correct) {
    status = 'learning';
    interval = 1;
  } else if (streak >= 6 || correctCount >= 10) {
    status = 'mastered';
    interval = Math.max(14, previousInterval * 2 || 14);
  } else if (streak >= 3) {
    status = 'review';
    interval = Math.max(4, previousInterval * 2 || 4);
  } else {
    status = 'learning';
    interval = Math.max(1, previousInterval + 1);
  }

  return {
    wordId: existing?.wordId ?? '',
    status,
    correctCount,
    wrongCount,
    streak,
    lastReviewed: now,
    nextReview: now + interval * DAY,
    easeFactor: Math.max(1.3, (existing?.easeFactor ?? 2.5) + (correct ? 0.05 : -0.2)),
    interval,
    difficultyScore: Math.max(0, wrongCount * 2 - correctCount * 0.35)
  };
}

export async function recordQuizAnswer(question: QuizQuestion, selectedOptionId: string, responseTimeMs: number): Promise<boolean> {
  const correct = selectedOptionId === question.correctOptionId;
  const selected = question.options.find((option) => option.id === selectedOptionId);
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);

  await db.transaction('rw', db.progress, db.quizHistory, async () => {
    const existing = await db.progress.get(question.word.id);
    const updated = nextProgress(existing, correct);
    updated.wordId = question.word.id;
    await db.progress.put(updated);
    await db.quizHistory.add({
      wordId: question.word.id,
      questionType: question.type,
      selectedAnswer: selected?.label ?? '',
      correctAnswer: correctOption?.label ?? '',
      correct,
      answeredAt: Date.now(),
      responseTimeMs
    });
  });

  window.dispatchEvent(new CustomEvent('hsk-data-changed'));
  return correct;
}

export async function getQuizStats() {
  const history = await db.quizHistory.toArray();
  const correct = history.filter((item) => item.correct).length;
  const recent = history.sort((a, b) => b.answeredAt - a.answeredAt).slice(0, 100);
  return {
    total: history.length,
    correct,
    wrong: history.length - correct,
    accuracy: history.length ? Math.round((correct / history.length) * 100) : 0,
    recentAccuracy: recent.length ? Math.round((recent.filter((item) => item.correct).length / recent.length) * 100) : 0
  };
}
