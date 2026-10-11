import { db } from '../db/database';
import { STARTER_CHARACTERS } from '../data/starterCharacters';
import type { CharacterMetadata, EnrichmentImportReport, VocabularyEntry } from '../types/vocabulary';

export async function ensureStarterCharacters(): Promise<number> {
  const existing = await db.characters.count();
  if (existing === 0) {
    const timestamp = Date.now();
    await db.characters.bulkPut(STARTER_CHARACTERS.map((item) => ({ ...item, updatedAt: timestamp })));
  }
  await enrichVocabularyFromCharacters();
  return db.characters.count();
}

export async function enrichVocabularyFromCharacters(): Promise<number> {
  const [characters, vocabulary] = await Promise.all([
    db.characters.toArray(),
    db.vocabulary.toArray()
  ]);

  const charMap = new Map(characters.map((item) => [item.hanzi, item]));
  const changed: VocabularyEntry[] = [];

  for (const word of vocabulary) {
    let touched = false;
    const next = { ...word };

    // Compose Han-Viet only when every Han character has at least one audited reading.
    // Never overwrite explicit Han-Viet already present in Excel/imported data.
    if (!next.hanViet && next.characters.length) {
      const readings = next.characters.map((char) => charMap.get(char)?.hanViet?.[0]).filter(Boolean) as string[];
      if (readings.length === next.characters.length) {
        next.hanViet = readings.join(' ');
        touched = true;
      }
    }

    // Traditional form can also be composed when every simplified character is covered.
    if (!next.traditional && next.characters.length) {
      const traditional = next.characters.map((char) => charMap.get(char)?.traditional ?? char);
      if (traditional.some((char, index) => char !== next.characters[index])) {
        next.traditional = traditional.join('');
        touched = true;
      }
    }

    if (touched) changed.push(next);
  }

  if (changed.length) await db.vocabulary.bulkPut(changed);
  if (changed.length) window.dispatchEvent(new CustomEvent('hsk-data-changed'));
  return changed.length;
}

export async function importCharacterMetadataJson(file: File): Promise<EnrichmentImportReport> {
  const warnings: string[] = [];
  const raw = JSON.parse(await file.text()) as unknown;
  const rows = Array.isArray(raw)
    ? raw
    : typeof raw === 'object' && raw && Array.isArray((raw as { characters?: unknown[] }).characters)
      ? (raw as { characters: unknown[] }).characters
      : [];

  if (!rows.length) throw new Error('JSON không chứa mảng character metadata hợp lệ.');

  const normalized: CharacterMetadata[] = [];
  for (const [index, value] of rows.entries()) {
    if (!value || typeof value !== 'object') {
      warnings.push(`Dòng ${index + 1}: bỏ qua vì không phải object.`);
      continue;
    }

    const row = value as Record<string, unknown>;
    const hanzi = String(row.hanzi ?? '').trim();
    if (!/^\p{Script=Han}$/u.test(hanzi)) {
      warnings.push(`Dòng ${index + 1}: hanzi phải là đúng 1 chữ Hán.`);
      continue;
    }

    const toArray = (input: unknown) => Array.isArray(input)
      ? input.map((item) => String(item).trim()).filter(Boolean)
      : String(input ?? '').trim() ? [String(input).trim()] : [];

    normalized.push({
      hanzi,
      traditional: String(row.traditional ?? '').trim() || undefined,
      pinyin: toArray(row.pinyin),
      hanViet: toArray(row.hanViet),
      radical: String(row.radical ?? '').trim() || undefined,
      radicalMeaningVi: String(row.radicalMeaningVi ?? '').trim() || undefined,
      strokeCount: Number.isFinite(Number(row.strokeCount)) ? Number(row.strokeCount) : undefined,
      components: toArray(row.components),
      phoneticComponent: String(row.phoneticComponent ?? '').trim() || undefined,
      semanticComponent: String(row.semanticComponent ?? '').trim() || undefined,
      noteVi: String(row.noteVi ?? '').trim() || undefined,
      source: 'imported',
      updatedAt: Date.now()
    });
  }

  if (!normalized.length) throw new Error('Không có character metadata hợp lệ để import.');
  await db.characters.bulkPut(normalized);
  const vocabularyUpdated = await enrichVocabularyFromCharacters();
  window.dispatchEvent(new CustomEvent('hsk-data-changed'));

  return {
    charactersImported: normalized.length,
    vocabularyUpdated,
    warnings
  };
}

export function downloadCharacterMetadataTemplate() {
  const template = {
    characters: [
      {
        hanzi: '请',
        traditional: '請',
        pinyin: ['qǐng'],
        hanViet: ['thỉnh'],
        radical: '讠',
        radicalMeaningVi: 'lời nói',
        strokeCount: 10,
        components: ['讠', '青'],
        semanticComponent: '讠',
        phoneticComponent: '青',
        noteVi: '讠 gợi nghĩa; 青 gợi âm.'
      }
    ]
  };
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'character-metadata-template.json';
  anchor.click();
  URL.revokeObjectURL(url);
}
