import { db } from '../db/database';
import type { VocabularyEntry } from '../types/vocabulary';

interface BundledVocabularyPayload {
  dataVersion: number;
  source: string;
  total: number;
  perLevel: Record<number, number>;
  entries: VocabularyEntry[];
}

export interface BundledDataResult {
  loaded: boolean;
  total: number;
  source?: string;
}

/**
 * Nạp bộ HSK đóng sẵn chỉ khi database từ vựng đang rỗng.
 * Nếu người dùng đã import Excel riêng, dữ liệu đó được giữ nguyên.
 */
export async function ensureBundledVocabulary(): Promise<BundledDataResult> {
  const existingCount = await db.vocabulary.count();
  if (existingCount > 0) return { loaded: false, total: existingCount };

  const dataUrl = `${import.meta.env.BASE_URL}data/hsk-vocabulary.json`;
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`Không tải được dữ liệu HSK tích hợp (${response.status}).`);

  const payload = await response.json() as BundledVocabularyPayload;
  if (!Array.isArray(payload.entries) || payload.entries.length === 0) {
    throw new Error('Bộ dữ liệu HSK tích hợp không hợp lệ.');
  }

  await db.transaction('rw', db.vocabulary, async () => {
    await db.vocabulary.bulkPut(payload.entries);
  });

  window.dispatchEvent(new CustomEvent('hsk-data-changed'));
  return { loaded: true, total: payload.entries.length, source: payload.source };
}
