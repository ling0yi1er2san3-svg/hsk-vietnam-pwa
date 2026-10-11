import { db } from '../db/database';
import type { CharacterMetadata, Favorite, LearningProgress, QuizHistory, VocabularyEntry } from '../types/vocabulary';

export interface HskBackupPayload {
  format: 'hsk-vietnam-backup';
  schemaVersion: 1;
  appVersion: string;
  exportedAt: number;
  counts: {
    vocabulary: number;
    characters: number;
    progress: number;
    favorites: number;
    quizHistory: number;
  };
  data: {
    vocabulary: VocabularyEntry[];
    characters: CharacterMetadata[];
    progress: LearningProgress[];
    favorites: Favorite[];
    quizHistory: QuizHistory[];
  };
}

export interface RestoreReport {
  vocabulary: number;
  characters: number;
  progress: number;
  favorites: number;
  quizHistory: number;
}

const APP_VERSION = '0.13.0';

export async function createFullBackup(): Promise<HskBackupPayload> {
  const [vocabulary, characters, progress, favorites, quizHistory] = await Promise.all([
    db.vocabulary.toArray(),
    db.characters.toArray(),
    db.progress.toArray(),
    db.favorites.toArray(),
    db.quizHistory.toArray()
  ]);

  return {
    format: 'hsk-vietnam-backup',
    schemaVersion: 1,
    appVersion: APP_VERSION,
    exportedAt: Date.now(),
    counts: {
      vocabulary: vocabulary.length,
      characters: characters.length,
      progress: progress.length,
      favorites: favorites.length,
      quizHistory: quizHistory.length
    },
    data: { vocabulary, characters, progress, favorites, quizHistory }
  };
}

export async function createLearningBackup(): Promise<HskBackupPayload> {
  const [progress, favorites, quizHistory] = await Promise.all([
    db.progress.toArray(),
    db.favorites.toArray(),
    db.quizHistory.toArray()
  ]);

  return {
    format: 'hsk-vietnam-backup',
    schemaVersion: 1,
    appVersion: APP_VERSION,
    exportedAt: Date.now(),
    counts: {
      vocabulary: 0,
      characters: 0,
      progress: progress.length,
      favorites: favorites.length,
      quizHistory: quizHistory.length
    },
    data: { vocabulary: [], characters: [], progress, favorites, quizHistory }
  };
}

export function downloadBackup(payload: HskBackupPayload, prefix = 'hsk-vietnam-backup') {
  const stamp = new Date(payload.exportedAt).toISOString().replace(/[:.]/g, '-');
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${prefix}-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file: File): Promise<HskBackupPayload> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<HskBackupPayload>;
  if (parsed.format !== 'hsk-vietnam-backup' || parsed.schemaVersion !== 1 || !parsed.data) {
    throw new Error('File không phải bản sao lưu HSK Việt Nam hợp lệ.');
  }

  const data = parsed.data as HskBackupPayload['data'];
  return {
    format: 'hsk-vietnam-backup',
    schemaVersion: 1,
    appVersion: parsed.appVersion ?? 'unknown',
    exportedAt: parsed.exportedAt ?? Date.now(),
    counts: parsed.counts ?? {
      vocabulary: data.vocabulary?.length ?? 0,
      characters: data.characters?.length ?? 0,
      progress: data.progress?.length ?? 0,
      favorites: data.favorites?.length ?? 0,
      quizHistory: data.quizHistory?.length ?? 0
    },
    data: {
      vocabulary: Array.isArray(data.vocabulary) ? data.vocabulary : [],
      characters: Array.isArray(data.characters) ? data.characters : [],
      progress: Array.isArray(data.progress) ? data.progress : [],
      favorites: Array.isArray(data.favorites) ? data.favorites : [],
      quizHistory: Array.isArray(data.quizHistory) ? data.quizHistory : []
    }
  };
}

export async function restoreBackup(payload: HskBackupPayload, mode: 'merge' | 'replace'): Promise<RestoreReport> {
  const { vocabulary, characters, progress, favorites, quizHistory } = payload.data;

  await db.transaction('rw', db.vocabulary, db.characters, db.progress, db.favorites, db.quizHistory, async () => {
    if (mode === 'replace') {
      await Promise.all([
        db.vocabulary.clear(),
        db.characters.clear(),
        db.progress.clear(),
        db.favorites.clear(),
        db.quizHistory.clear()
      ]);
    }

    if (vocabulary.length) await db.vocabulary.bulkPut(vocabulary);
    if (characters.length) await db.characters.bulkPut(characters);
    if (progress.length) await db.progress.bulkPut(progress);
    if (favorites.length) await db.favorites.bulkPut(favorites);

    if (quizHistory.length) {
      if (mode === 'replace') {
        const withoutIds = quizHistory.map(({ id: _id, ...item }) => item);
        await db.quizHistory.bulkAdd(withoutIds);
      } else {
        const withoutIds = quizHistory.map(({ id: _id, ...item }) => item);
        await db.quizHistory.bulkAdd(withoutIds);
      }
    }
  });

  return {
    vocabulary: vocabulary.length,
    characters: characters.length,
    progress: progress.length,
    favorites: favorites.length,
    quizHistory: quizHistory.length
  };
}

export async function clearLearningData() {
  await db.transaction('rw', db.progress, db.favorites, db.quizHistory, async () => {
    await Promise.all([db.progress.clear(), db.favorites.clear(), db.quizHistory.clear()]);
  });
}
