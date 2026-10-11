import { Heart, Search, Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '../db/database';
import { toggleFavorite } from '../services/vocabularyService';
import type { VocabularyEntry } from '../types/vocabulary';
import { normalizeSearchText } from '../utils/text';
import { PronunciationButton } from '../components/vocabulary/PronunciationButton';
import { WordDetail } from '../components/vocabulary/WordDetail';

export function FavoritesPage() {
  const [words, setWords] = useState<VocabularyEntry[]>([]);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<number | 'all'>('all');
  const [selectedWord, setSelectedWord] = useState<VocabularyEntry>();

  const load = useCallback(async () => {
    const favorites = await db.favorites.orderBy('createdAt').reverse().toArray();
    const vocabulary = await db.vocabulary.bulkGet(favorites.map((item) => item.wordId));
    setWords(vocabulary.filter((item): item is VocabularyEntry => !!item));
  }, []);

  useEffect(() => {
    void load();
    const handler = () => void load();
    window.addEventListener('hsk-data-changed', handler);
    return () => window.removeEventListener('hsk-data-changed', handler);
  }, [load]);

  const filtered = useMemo(() => {
    const q = normalizeSearchText(search);
    return words.filter((word) => {
      if (level !== 'all' && word.hskLevel !== level) return false;
      if (!q) return true;
      const haystack = normalizeSearchText(`${word.hanzi} ${word.pinyin} ${word.meaningVi} ${word.hanViet ?? ''}`);
      return haystack.includes(q);
    });
  }, [level, search, words]);

  async function remove(wordId: string) {
    await toggleFavorite(wordId);
    await load();
  }

  return (
    <>
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-rose-700"><Heart size={17}/> Yêu thích</div>
            <h1 className="mt-1 text-3xl font-black">Từ đã lưu</h1>
            <p className="mt-2 text-sm text-slate-500">Danh sách được lưu offline trong IndexedDB trên thiết bị này.</p>
          </div>
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-rose-900 ring-1 ring-rose-100"><div className="text-xs font-bold text-rose-500">Tổng số</div><div className="text-2xl font-black">{words.length}</div></div>
        </header>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative block"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm chữ Hán, Pinyin, nghĩa, Hán-Việt…" className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50"/></label>
          <div className="flex gap-2 overflow-x-auto">{(['all',1,2,3,4,5,6] as const).map((item) => <button key={item} type="button" onClick={() => setLevel(item)} className={`shrink-0 rounded-xl px-3 py-3 text-sm font-black ${level === item ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item === 'all' ? 'Tất cả' : `HSK ${item}`}</button>)}</div>
        </div>

        {words.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-rose-200 bg-white p-12 text-center"><Star className="mx-auto text-rose-200" size={52}/><h2 className="mt-4 text-xl font-black">Chưa có từ yêu thích</h2><p className="mt-2 text-sm text-slate-500">Mở một từ trong tab Từ vựng rồi bấm ⭐ Yêu thích.</p></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">Không có từ phù hợp với bộ lọc hiện tại.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((word) => <article key={word.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><button type="button" onClick={() => setSelectedWord(word)} className="min-w-0 flex-1 text-left"><div className="text-4xl font-black">{word.hanzi}</div><div className="mt-1 font-bold text-red-700">{word.pinyin}</div><div className="mt-2 line-clamp-2 text-sm text-slate-600">{word.meaningVi}</div><div className="mt-2 text-xs text-slate-400">HSK {word.hskLevel}{word.hanViet ? ` · Hán-Việt: ${word.hanViet}` : ''}</div></button><div className="flex flex-col gap-2"><PronunciationButton text={word.hanzi} compact/><button type="button" onClick={() => void remove(word.id)} className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700" aria-label="Bỏ yêu thích"><Trash2 size={17}/></button></div></div></article>)}</div>
        )}
      </div>

      {selectedWord && <WordDetail word={selectedWord} onClose={() => setSelectedWord(undefined)} onOpenWord={setSelectedWord} onChanged={() => void load()} />}
    </>
  );
}
