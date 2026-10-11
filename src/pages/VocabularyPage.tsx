import { BookOpen, ChevronLeft, ChevronRight, Filter, Search, Star, CheckCircle2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { db } from '../db/database';
import { countVocabularyByLevel } from '../services/excelService';
import { markWordLearned, queryVocabulary, toggleFavorite } from '../services/vocabularyService';
import type { VocabularyEntry } from '../types/vocabulary';
import { HSKSelector } from '../components/vocabulary/HSKSelector';
import { WordCard } from '../components/vocabulary/WordCard';
import { WordDetail } from '../components/vocabulary/WordDetail';

const PAGE_SIZE = 60;
type FilterValue = 'all' | 'favorites' | 'learned' | 'unlearned';

export function VocabularyPage() {
  const [level, setLevel] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<VocabularyEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const [selectedWord, setSelectedWord] = useState<VocabularyEntry>();
  const [loading, setLoading] = useState(true);

  const loadMeta = useCallback(async () => {
    const [nextCounts, favorites, progress] = await Promise.all([
      countVocabularyByLevel(),
      db.favorites.toArray(),
      db.progress.toArray()
    ]);
    setCounts(nextCounts);
    setFavoriteIds(new Set(favorites.map((item) => item.wordId)));
    setLearnedIds(new Set(progress.filter((item) => item.status !== 'new').map((item) => item.wordId)));
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const result = await queryVocabulary({ level, search, filter, page, pageSize: PAGE_SIZE });
    setRows(result.items);
    setTotal(result.total);
    setTotalPages(result.totalPages);
    if (result.page !== page) setPage(result.page);
    setLoading(false);
  }, [filter, level, page, search]);

  useEffect(() => {
    const handle = window.setTimeout(() => void loadRows(), 180);
    return () => window.clearTimeout(handle);
  }, [loadRows]);

  useEffect(() => {
    void loadMeta();
    const handler = () => {
      void loadMeta();
      void loadRows();
    };
    window.addEventListener('hsk-data-changed', handler);
    return () => window.removeEventListener('hsk-data-changed', handler);
  }, [loadMeta, loadRows]);

  useEffect(() => {
    setPage(1);
  }, [level, search, filter]);

  const rangeText = useMemo(() => {
    if (!total) return '0 từ';
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);
    return `${start.toLocaleString('vi-VN')}–${end.toLocaleString('vi-VN')} / ${total.toLocaleString('vi-VN')} từ`;
  }, [page, total]);

  async function handleFavorite(wordId: string) {
    const next = await toggleFavorite(wordId);
    setFavoriteIds((current) => {
      const copy = new Set(current);
      next ? copy.add(wordId) : copy.delete(wordId);
      return copy;
    });
    if (filter === 'favorites') void loadRows();
  }

  async function handleLearned(wordId: string, learned: boolean) {
    await markWordLearned(wordId, learned);
    setLearnedIds((current) => {
      const copy = new Set(current);
      learned ? copy.add(wordId) : copy.delete(wordId);
      return copy;
    });
    if (filter === 'learned' || filter === 'unlearned') void loadRows();
  }

  const noDatabase = Object.values(counts).reduce((sum, value) => sum + value, 0) === 0;

  return (
    <>
      <section className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-red-700">
              <BookOpen size={17} /> Từ vựng
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">HSK 1 → HSK 6</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Chọn cấp độ, tìm theo chữ Hán, Pinyin, nghĩa tiếng Việt hoặc Hán-Việt. Nhấn một từ để mở trang chi tiết.</p>
          </div>
          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-right text-white">
            <div className="text-xs font-semibold text-slate-300">Đang hiển thị</div>
            <div className="mt-0.5 font-black">{rangeText}</div>
          </div>
        </div>

        <HSKSelector
          value={level}
          counts={counts}
          onChange={(next) => {
            setLevel(next);
            setPage(1);
          }}
        />

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm 学习, xuexi, học tập, hoc tap…"
              className="h-13 w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} icon={<Filter size={16} />}>Tất cả</FilterButton>
            <FilterButton active={filter === 'favorites'} onClick={() => setFilter('favorites')} icon={<Star size={16} />}>Yêu thích</FilterButton>
            <FilterButton active={filter === 'learned'} onClick={() => setFilter('learned')} icon={<CheckCircle2 size={16} />}>Đã học</FilterButton>
            <FilterButton active={filter === 'unlearned'} onClick={() => setFilter('unlearned')}>Chưa học</FilterButton>
          </div>
        </div>

        {noDatabase ? (
          <div className="rounded-3xl border border-dashed border-orange-300 bg-orange-50 p-10 text-center">
            <div className="text-5xl">📚</div>
            <h2 className="mt-4 text-xl font-black">Chưa có dữ liệu HSK</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Vào mục <strong>Nhập Excel</strong> và chọn file <strong>FULL TỪ VỰNG HSK1- HSK6.xlsm</strong>. Sau khi import, toàn bộ danh sách sẽ xuất hiện tại đây và vẫn dùng được offline.</p>
          </div>
        ) : loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-3xl bg-slate-100" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">Không tìm thấy từ phù hợp với điều kiện hiện tại.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((word) => (
              <WordCard
                key={word.id}
                word={word}
                favorite={favoriteIds.has(word.id)}
                learned={learnedIds.has(word.id)}
                onOpen={setSelectedWord}
                onToggleFavorite={handleFavorite}
                onToggleLearned={handleLearned}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronLeft size={18} /> Trước
            </button>
            <div className="min-w-24 text-center text-sm font-bold text-slate-600">Trang {page} / {totalPages}</div>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30"
            >
              Sau <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>

      {selectedWord && (
        <WordDetail
          word={selectedWord}
          onClose={() => setSelectedWord(undefined)}
          onOpenWord={setSelectedWord}
          onChanged={() => {
            void loadMeta();
            void loadRows();
          }}
        />
      )}
    </>
  );
}

function FilterButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon?: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-3 text-sm font-bold transition ${active ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
    >
      {icon}{children}
    </button>
  );
}
