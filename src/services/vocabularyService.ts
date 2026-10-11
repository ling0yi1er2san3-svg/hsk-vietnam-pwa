import { db } from '../db/database';
import type { Favorite, LearningProgress, VocabularyEntry } from '../types/vocabulary';
import { normalizeSearchText, searchableVocabularyText } from '../utils/text';

export interface VocabularyQuery {
  level: number;
  search?: string;
  filter?: 'all' | 'favorites' | 'learned' | 'unlearned';
  page?: number;
  pageSize?: number;
}

export interface VocabularyQueryResult {
  items: VocabularyEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function queryVocabulary(query: VocabularyQuery): Promise<VocabularyQueryResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(12, query.pageSize ?? 60);
  let items = await db.vocabulary.where('hskLevel').equals(query.level).sortBy('sequence');

  const search = normalizeSearchText(query.search ?? '');
  if (search) {
    items = items.filter((item) => {
      const haystack = searchableVocabularyText([
        item.hanzi,
        item.traditional,
        item.pinyin,
        item.pinyinOriginal,
        item.hanViet,
        ...(item.hanVietAlternatives ?? []),
        item.meaningVi,
        item.meaningOriginal,
        item.exampleHanzi,
        item.examplePinyin,
        item.exampleMeaning
      ]);
      return haystack.includes(search) || item.hanzi.includes(query.search?.trim() ?? '');
    });
  }

  if (query.filter === 'favorites') {
    const favoriteIds = new Set((await db.favorites.toArray()).map((item) => item.wordId));
    items = items.filter((item) => favoriteIds.has(item.id));
  }

  if (query.filter === 'learned' || query.filter === 'unlearned') {
    const progress = await db.progress.toArray();
    const progressMap = new Map(progress.map((item) => [item.wordId, item]));
    items = items.filter((item) => {
      const status = progressMap.get(item.id)?.status ?? 'new';
      const learned = status !== 'new';
      return query.filter === 'learned' ? learned : !learned;
    });
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages
  };
}

export async function getVocabularyById(id: string) {
  return db.vocabulary.get(id);
}

export async function getRelatedWords(word: VocabularyEntry, limit = 18): Promise<VocabularyEntry[]> {
  const chars = new Set(word.characters);
  if (!chars.size) return [];

  const all = await db.vocabulary.toArray();
  return all
    .filter((candidate) => candidate.id !== word.id && candidate.characters.some((char) => chars.has(char)))
    .sort((a, b) => {
      const aShared = a.characters.filter((char) => chars.has(char)).length;
      const bShared = b.characters.filter((char) => chars.has(char)).length;
      if (aShared !== bShared) return bShared - aShared;
      if (a.hskLevel !== b.hskLevel) return a.hskLevel - b.hskLevel;
      return a.sequence - b.sequence;
    })
    .slice(0, limit);
}

export async function toggleFavorite(wordId: string): Promise<boolean> {
  const existing = await db.favorites.get(wordId);
  if (existing) {
    await db.favorites.delete(wordId);
    window.dispatchEvent(new CustomEvent('hsk-data-changed'));
    return false;
  }

  const favorite: Favorite = { wordId, createdAt: Date.now() };
  await db.favorites.put(favorite);
  window.dispatchEvent(new CustomEvent('hsk-data-changed'));
  return true;
}

export async function isFavorite(wordId: string): Promise<boolean> {
  return Boolean(await db.favorites.get(wordId));
}

export async function markWordLearned(wordId: string, learned: boolean): Promise<LearningProgress> {
  const existing = await db.progress.get(wordId);
  const next: LearningProgress = learned
    ? {
        wordId,
        status: existing?.status === 'mastered' ? 'mastered' : 'learning',
        correctCount: existing?.correctCount ?? 0,
        wrongCount: existing?.wrongCount ?? 0,
        streak: existing?.streak ?? 0,
        lastReviewed: existing?.lastReviewed,
        nextReview: existing?.nextReview,
        easeFactor: existing?.easeFactor,
        interval: existing?.interval,
        difficultyScore: existing?.difficultyScore
      }
    : {
        wordId,
        status: 'new',
        correctCount: existing?.correctCount ?? 0,
        wrongCount: existing?.wrongCount ?? 0,
        streak: existing?.streak ?? 0
      };

  await db.progress.put(next);
  window.dispatchEvent(new CustomEvent('hsk-data-changed'));
  return next;
}

export async function getLearningProgress(wordId: string): Promise<LearningProgress | undefined> {
  return db.progress.get(wordId);
}
