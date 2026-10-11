export interface VocabularyEntry {
  id: string;
  sourceSheet: string;
  sourceRow: number;
  hskLevel: number;
  sequence: number;
  hanzi: string;
  traditional?: string;
  pinyinOriginal: string;
  pinyin: string;
  pinyinNumber?: string;
  meaningOriginal: string;
  meaningVi: string;
  hanViet?: string;
  hanVietAlternatives?: string[];
  partOfSpeech?: string[];
  exampleHanzi: string;
  examplePinyin: string;
  exampleMeaning: string;
  characters: string[];
  dataVersion: number;
  importedAt: number;
}

export interface CharacterMetadata {
  hanzi: string;
  traditional?: string;
  pinyin: string[];
  hanViet: string[];
  radical?: string;
  radicalMeaningVi?: string;
  strokeCount?: number;
  components: string[];
  phoneticComponent?: string;
  semanticComponent?: string;
  noteVi?: string;
  source: 'starter' | 'imported' | 'manual';
  updatedAt: number;
}

export interface LearningProgress {
  wordId: string;
  status: 'new' | 'learning' | 'review' | 'mastered';
  correctCount: number;
  wrongCount: number;
  streak: number;
  lastReviewed?: number;
  nextReview?: number;
  easeFactor?: number;
  interval?: number;
  difficultyScore?: number;
}

export interface Favorite {
  wordId: string;
  createdAt: number;
}

export interface QuizHistory {
  id?: number;
  wordId: string;
  questionType: 'hanzi-meaning' | 'hanzi-pinyin' | 'meaning-hanzi' | 'pinyin-hanzi' | 'audio-hanzi';
  selectedAnswer: string;
  correctAnswer: string;
  correct: boolean;
  answeredAt: number;
  responseTimeMs?: number;
}

export interface ImportReport {
  fileName: string;
  totalImported: number;
  perLevel: Record<number, number>;
  skippedRows: number;
  warnings: string[];
}

export interface EnrichmentImportReport {
  charactersImported: number;
  vocabularyUpdated: number;
  warnings: string[];
}
