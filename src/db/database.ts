import Dexie, { type Table } from 'dexie';
import type { CharacterMetadata, Favorite, LearningProgress, QuizHistory, VocabularyEntry } from '../types/vocabulary';

export class HskDatabase extends Dexie {
  vocabulary!: Table<VocabularyEntry, string>;
  characters!: Table<CharacterMetadata, string>;
  progress!: Table<LearningProgress, string>;
  favorites!: Table<Favorite, string>;
  quizHistory!: Table<QuizHistory, number>;

  constructor() {
    super('HskVietnamDB');

    this.version(1).stores({
      vocabulary: 'id, hanzi, hskLevel, [hskLevel+sequence], sourceSheet',
      progress: 'wordId, status, nextReview',
      favorites: 'wordId, createdAt',
      quizHistory: '++id, wordId, questionType, answeredAt, correct'
    });

    this.version(2).stores({
      vocabulary: 'id, hanzi, hskLevel, [hskLevel+sequence], sourceSheet',
      characters: 'hanzi, radical, phoneticComponent, semanticComponent, source',
      progress: 'wordId, status, nextReview',
      favorites: 'wordId, createdAt',
      quizHistory: '++id, wordId, questionType, answeredAt, correct'
    });
  }
}

export const db = new HskDatabase();
