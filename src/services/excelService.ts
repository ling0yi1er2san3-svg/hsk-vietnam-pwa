import * as XLSX from 'xlsx';
import { db } from '../db/database';
import type { ImportReport, VocabularyEntry } from '../types/vocabulary';
import { normalizeHeader, normalizePinyin, splitChineseCharacters } from '../utils/text';

const EXPECTED_SHEETS = [1, 2, 3, 4, 5, 6] as const;
const DATA_VERSION = 1;

type RowObject = Record<string, unknown>;

const headerAliases = {
  sequence: ['stt', 'so thu tu', 'số thứ tự'],
  hanzi: ['tu moi', 'từ mới', 'hanzi', 'chu han', 'chữ hán'],
  pinyin: ['pinyin', 'phien am tu', 'phiên âm từ'],
  meaning: ['giai thich', 'giải thích', 'nghia', 'nghĩa'],
  exampleHanzi: ['vi du', 'ví dụ', 'cau vi du', 'câu ví dụ'],
  examplePinyin: ['phien am', 'phiên âm', 'pinyin vi du', 'pinyin ví dụ'],
  exampleMeaning: ['dich', 'dịch', 'dich vi du', 'dịch ví dụ']
} as const;

function findField(row: RowObject, aliases: readonly string[]): unknown {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeHeader(key), value] as const);
  for (const alias of aliases) {
    const match = normalizedEntries.find(([key]) => key === normalizeHeader(alias));
    if (match) return match[1];
  }
  return undefined;
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function sheetNameForLevel(workbook: XLSX.WorkBook, level: number): string | undefined {
  const candidates = [`HSK${level}`, `HSK ${level}`];
  return workbook.SheetNames.find((name) => candidates.includes(name.trim().toUpperCase()));
}

function parseSheet(workbook: XLSX.WorkBook, sheetName: string, level: number, importedAt: number) {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RowObject>(sheet, { defval: '', raw: false });
  const entries: VocabularyEntry[] = [];
  const warnings: string[] = [];
  let skippedRows = 0;

  rows.forEach((row, index) => {
    const sourceRow = index + 2;
    const hanzi = asString(findField(row, headerAliases.hanzi));
    if (!hanzi) {
      skippedRows += 1;
      return;
    }

    const sequenceRaw = asString(findField(row, headerAliases.sequence));
    const sequenceNumber = Number(sequenceRaw);
    const sequence = Number.isFinite(sequenceNumber) && sequenceNumber > 0 ? sequenceNumber : index + 1;

    const pinyinOriginal = asString(findField(row, headerAliases.pinyin));
    const pinyinParsed = normalizePinyin(pinyinOriginal);
    const meaningOriginal = asString(findField(row, headerAliases.meaning));
    const exampleHanzi = asString(findField(row, headerAliases.exampleHanzi));
    const examplePinyin = asString(findField(row, headerAliases.examplePinyin));
    const exampleMeaning = asString(findField(row, headerAliases.exampleMeaning));

    if (!pinyinOriginal) warnings.push(`${sheetName}!C${sourceRow}: thiếu Pinyin cho “${hanzi}”.`);
    if (!meaningOriginal) warnings.push(`${sheetName}!D${sourceRow}: thiếu nghĩa cho “${hanzi}”.`);
    if (!exampleMeaning && exampleHanzi) warnings.push(`${sheetName}!G${sourceRow}: có ví dụ nhưng thiếu bản dịch cho “${hanzi}”.`);

    const id = `hsk${level}_${String(sequence).padStart(4, '0')}`;

    entries.push({
      id,
      sourceSheet: sheetName,
      sourceRow,
      hskLevel: level,
      sequence,
      hanzi,
      pinyinOriginal,
      pinyin: pinyinParsed.pinyin,
      meaningOriginal,
      meaningVi: meaningOriginal,
      hanViet: pinyinParsed.hanVietFromBracket,
      hanVietAlternatives: [],
      exampleHanzi,
      examplePinyin,
      exampleMeaning,
      characters: splitChineseCharacters(hanzi),
      dataVersion: DATA_VERSION,
      importedAt
    });
  });

  return { entries, warnings, skippedRows };
}

export async function importHskWorkbook(file: File): Promise<ImportReport> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, {
    type: 'array',
    cellDates: false,
    cellFormula: false,
    cellHTML: false,
    dense: true
  });

  const importedAt = Date.now();
  const allEntries: VocabularyEntry[] = [];
  const warnings: string[] = [];
  const perLevel: Record<number, number> = {};
  let skippedRows = 0;

  for (const level of EXPECTED_SHEETS) {
    const sheetName = sheetNameForLevel(workbook, level);
    if (!sheetName) {
      warnings.push(`Không tìm thấy sheet HSK${level} hoặc HSK ${level}.`);
      perLevel[level] = 0;
      continue;
    }

    const parsed = parseSheet(workbook, sheetName, level, importedAt);
    allEntries.push(...parsed.entries);
    warnings.push(...parsed.warnings);
    skippedRows += parsed.skippedRows;
    perLevel[level] = parsed.entries.length;
  }

  if (allEntries.length === 0) {
    throw new Error('Không tìm thấy dữ liệu HSK hợp lệ trong workbook.');
  }

  // Chỉ đồng bộ bảng vocabulary. Không đụng đến progress/favorites/quizHistory.
  await db.transaction('rw', db.vocabulary, async () => {
    const sourceSheets = new Set(allEntries.map((item) => item.sourceSheet));
    for (const sheetName of sourceSheets) {
      const currentIds = new Set(allEntries.filter((e) => e.sourceSheet === sheetName).map((e) => e.id));
      const existingKeys = await db.vocabulary.where('sourceSheet').equals(sheetName).primaryKeys();
      const staleKeys = existingKeys.filter((key) => !currentIds.has(String(key)));
      if (staleKeys.length) await db.vocabulary.bulkDelete(staleKeys as string[]);
    }
    await db.vocabulary.bulkPut(allEntries);
  });

  return {
    fileName: file.name,
    totalImported: allEntries.length,
    perLevel,
    skippedRows,
    warnings
  };
}

export async function countVocabularyByLevel(): Promise<Record<number, number>> {
  const result: Record<number, number> = {};
  for (const level of EXPECTED_SHEETS) {
    result[level] = await db.vocabulary.where('hskLevel').equals(level).count();
  }
  return result;
}
