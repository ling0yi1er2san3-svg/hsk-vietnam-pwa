import { db } from '../db/database';
import type { VocabularyEntry } from '../types/vocabulary';

export interface MindMapGroup {
  startsWith: VocabularyEntry[];
  endsWith: VocabularyEntry[];
  contains: VocabularyEntry[];
  total: number;
}

function uniqueByHanzi(items: VocabularyEntry[]): VocabularyEntry[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.hanzi}|${item.hskLevel}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function buildMindMap(character: string, levels?: number[]): Promise<MindMapGroup> {
  const target = character.trim();
  if (!target) return { startsWith: [], endsWith: [], contains: [], total: 0 };

  let items = await db.vocabulary.toArray();
  if (levels?.length) {
    const allowed = new Set(levels);
    items = items.filter((item) => allowed.has(item.hskLevel));
  }

  items = items.filter((item) => item.hanzi.includes(target));

  const startsWith = uniqueByHanzi(
    items
      .filter((item) => item.hanzi.startsWith(target) && item.hanzi !== target)
      .sort(sortWord)
  );

  const endsWith = uniqueByHanzi(
    items
      .filter((item) => item.hanzi.endsWith(target) && !item.hanzi.startsWith(target) && item.hanzi !== target)
      .sort(sortWord)
  );

  const contains = uniqueByHanzi(
    items
      .filter((item) => !item.hanzi.startsWith(target) && !item.hanzi.endsWith(target) && item.hanzi !== target)
      .sort(sortWord)
  );

  return {
    startsWith,
    endsWith,
    contains,
    total: startsWith.length + endsWith.length + contains.length
  };
}

export async function suggestMindMapCharacters(limit = 16): Promise<string[]> {
  const items = await db.vocabulary.toArray();
  const counts = new Map<string, number>();

  for (const item of items) {
    for (const char of new Set(item.characters)) {
      if (!char.trim()) continue;
      counts.set(char, (counts.get(char) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([char]) => char);
}

function sortWord(a: VocabularyEntry, b: VocabularyEntry) {
  if (a.hskLevel !== b.hskLevel) return a.hskLevel - b.hskLevel;
  if (a.hanzi.length !== b.hanzi.length) return a.hanzi.length - b.hanzi.length;
  return a.sequence - b.sequence;
}
