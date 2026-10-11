import { useEffect, useState } from 'react';
import { db } from '../../db/database';
import type { CharacterMetadata } from '../../types/vocabulary';
import { PronunciationButton } from './PronunciationButton';

export function CharacterBreakdown({ characters }: { characters: string[] }) {
  const [rows, setRows] = useState<Array<{ char: string; meta?: CharacterMetadata }>>([]);

  useEffect(() => {
    let alive = true;
    void Promise.all(characters.map(async (char) => ({ char, meta: await db.characters.get(char) }))).then((result) => {
      if (alive) setRows(result);
    });
    return () => { alive = false; };
  }, [characters.join('|')]);

  return (
    <div className="space-y-2">
      {rows.map(({ char, meta }) => (
        <div key={char} className="grid gap-3 rounded-2xl bg-orange-50 p-3 ring-1 ring-orange-100 sm:grid-cols-[70px_1fr_auto] sm:items-center">
          <div className="text-center text-4xl font-black">{char}</div>
          <div className="min-w-0 text-sm leading-6">
            <div><strong className="text-red-700">{meta?.pinyin.join(' / ') || 'Pinyin: chưa có metadata'}</strong>{meta?.hanViet.length ? <span className="ml-2 text-slate-600">· Hán-Việt: <strong>{meta.hanViet.join(' / ')}</strong></span> : null}</div>
            {meta ? <div className="text-slate-500">Bộ {meta.radical || '—'}{meta.radicalMeaningVi ? ` (${meta.radicalMeaningVi})` : ''} · {meta.components.length ? meta.components.join(' + ') : 'chưa có cấu tạo'}{meta.strokeCount ? ` · ${meta.strokeCount} nét` : ''}</div> : <div className="text-slate-400">Chưa có dữ liệu bộ thủ/cấu tạo cho chữ này.</div>}
          </div>
          <PronunciationButton text={char} compact />
        </div>
      ))}
    </div>
  );
}
