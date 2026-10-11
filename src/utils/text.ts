export function stripDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function normalizeHeader(value: unknown): string {
  return stripDiacritics(String(value ?? ''))
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function normalizeSearchText(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/['’`´]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitChineseCharacters(text: string): string[] {
  return Array.from(text).filter((char) => /\p{Script=Han}/u.test(char));
}

export function normalizePinyin(raw: string): { pinyin: string; hanVietFromBracket?: string } {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  const bracket = trimmed.match(/\[([^\]]+)\]/);
  const withoutBracket = trimmed.replace(/\s*\[[^\]]+\]\s*/g, '').trim();

  return {
    pinyin: withoutBracket,
    hanVietFromBracket: bracket?.[1]?.trim()
  };
}

export function searchableVocabularyText(parts: Array<string | undefined>): string {
  return normalizeSearchText(parts.filter(Boolean).join(' '));
}
