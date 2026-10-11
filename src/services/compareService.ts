import { db } from '../db/database';
import type { CharacterMetadata, VocabularyEntry } from '../types/vocabulary';

export interface CharacterGroup {
  key: string;
  label: string;
  description?: string;
  characters: CharacterMetadata[];
}

export async function getCharacterCoverage() {
  const [metadata, vocabulary] = await Promise.all([db.characters.toArray(), db.vocabulary.toArray()]);
  const used = new Set(vocabulary.flatMap((word) => word.characters));
  const covered = metadata.filter((item) => used.has(item.hanzi));
  return { used: used.size, covered: covered.length, totalMetadata: metadata.length };
}

export async function getRadicalGroups(): Promise<CharacterGroup[]> {
  const [metadata, vocabulary] = await Promise.all([db.characters.toArray(), db.vocabulary.toArray()]);
  const used = new Set(vocabulary.flatMap((word) => word.characters));
  const relevant = metadata.filter((item) => used.has(item.hanzi) && item.radical);
  const map = new Map<string, CharacterMetadata[]>();

  for (const item of relevant) {
    const key = item.radical!;
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }

  return Array.from(map.entries())
    .filter(([, items]) => items.length >= 2)
    .map(([key, items]) => ({
      key,
      label: key,
      description: items.find((item) => item.radicalMeaningVi)?.radicalMeaningVi,
      characters: items.sort((a, b) => a.hanzi.localeCompare(b.hanzi, 'zh-CN'))
    }))
    .sort((a, b) => b.characters.length - a.characters.length || a.key.localeCompare(b.key, 'zh-CN'));
}

export async function getPhoneticGroups(): Promise<CharacterGroup[]> {
  const [metadata, vocabulary] = await Promise.all([db.characters.toArray(), db.vocabulary.toArray()]);
  const used = new Set(vocabulary.flatMap((word) => word.characters));
  const relevant = metadata.filter((item) => used.has(item.hanzi) && item.phoneticComponent);
  const map = new Map<string, CharacterMetadata[]>();

  for (const item of relevant) {
    const key = item.phoneticComponent!;
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }

  return Array.from(map.entries())
    .filter(([, items]) => items.length >= 2)
    .map(([key, items]) => ({
      key,
      label: key,
      description: `Thành phần gợi âm chung: ${key}`,
      characters: items.sort((a, b) => a.hanzi.localeCompare(b.hanzi, 'zh-CN'))
    }))
    .sort((a, b) => b.characters.length - a.characters.length || a.key.localeCompare(b.key, 'zh-CN'));
}

export async function getWordsContainingCharacter(char: string, limit = 16): Promise<VocabularyEntry[]> {
  const all = await db.vocabulary.toArray();
  return all
    .filter((word) => word.characters.includes(char))
    .sort((a, b) => a.hskLevel - b.hskLevel || a.sequence - b.sequence)
    .slice(0, limit);
}
