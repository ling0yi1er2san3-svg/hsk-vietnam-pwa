import { Brain, ChevronRight, Network, RotateCcw, Search, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { VocabularyEntry } from '../types/vocabulary';
import { buildMindMap, suggestMindMapCharacters, type MindMapGroup } from '../services/mindMapService';
import { speakChinese } from '../services/speechService';
import { WordDetail } from '../components/vocabulary/WordDetail';

const ALL_LEVELS = [1, 2, 3, 4, 5, 6];
const EMPTY: MindMapGroup = { startsWith: [], endsWith: [], contains: [], total: 0 };

export function MindMapPage() {
  const [query, setQuery] = useState('学');
  const [activeChar, setActiveChar] = useState('学');
  const [levels, setLevels] = useState<number[]>(ALL_LEVELS);
  const [group, setGroup] = useState<MindMapGroup>(EMPTY);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState<VocabularyEntry>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void suggestMindMapCharacters().then(setSuggestions);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void buildMindMap(activeChar, levels).then((result) => {
      if (alive) setGroup(result);
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [activeChar, levels]);

  const totalShown = group.total;
  const topWords = useMemo(() => [...group.startsWith, ...group.endsWith, ...group.contains].slice(0, 40), [group]);

  function submit() {
    const chars = [...query.trim()];
    if (!chars.length) return;
    setActiveChar(chars[0]);
    setQuery(chars[0]);
  }

  function toggleLevel(level: number) {
    setLevels((current) => current.includes(level) ? current.filter((item) => item !== level) : [...current, level].sort());
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-violet-700">
            <Brain size={15} /> Phase 8
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Mind Map từ ghép</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            Chọn một chữ Hán để tự động tìm các từ bắt đầu, kết thúc hoặc chứa chữ đó trong dữ liệu HSK đã import.
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <label className="text-sm font-black text-slate-700">Chữ trung tâm</label>
            <div className="mt-2 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') submit(); }}
                  placeholder="Ví dụ: 学, 人, 语..."
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-lg font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              </div>
              <button type="button" onClick={submit} className="rounded-2xl bg-violet-700 px-5 py-3 font-black text-white hover:bg-violet-800">Tạo</button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setQuery('学'); setActiveChar('学'); setLevels(ALL_LEVELS); }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
          >
            <RotateCcw size={17} /> Đặt lại
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ALL_LEVELS.map((level) => {
            const active = levels.includes(level);
            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleLevel(level)}
                className={`rounded-full px-3 py-1.5 text-xs font-black ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
              >HSK {level}</button>
            );
          })}
        </div>

        {suggestions.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="text-xs font-black uppercase tracking-[0.13em] text-slate-400">Gợi ý chữ xuất hiện nhiều</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => { setQuery(char); setActiveChar(char); }}
                  className={`h-10 min-w-10 rounded-xl px-3 text-xl font-black ring-1 transition ${char === activeChar ? 'bg-violet-700 text-white ring-violet-700' : 'bg-white text-slate-800 ring-slate-200 hover:bg-violet-50'}`}
                >{char}</button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-br from-white via-violet-50/50 to-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-violet-700"><Network size={17} /> Sơ đồ đang hiển thị</div>
            <div className="mt-1 text-sm text-slate-500">{loading ? 'Đang tìm từ...' : `${totalShown} từ liên quan`}</div>
          </div>
          <button type="button" onClick={() => speakChinese(activeChar)} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
            <Volume2 size={17} /> Nghe {activeChar}
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-72 place-items-center text-sm font-semibold text-slate-400">Đang tạo mind map...</div>
        ) : totalShown === 0 ? (
          <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
            <div><div className="text-5xl">🧠</div><div className="mt-3 font-black">Chưa tìm thấy từ chứa “{activeChar}”</div><div className="mt-1 text-sm text-slate-500">Hãy import file HSK hoặc thử một chữ khác.</div></div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <WordColumn title={`…${activeChar}`} subtitle="Từ kết thúc bằng chữ này" items={group.endsWith} side="left" onOpen={setSelectedWord} />

            <div className="flex items-center justify-center py-2 lg:py-12">
              <div className="relative grid h-28 w-28 place-items-center rounded-full bg-violet-700 text-white shadow-xl shadow-violet-200 sm:h-36 sm:w-36">
                <div className="text-center"><div className="text-5xl font-black sm:text-6xl">{activeChar}</div><div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-100">trung tâm</div></div>
                <span className="absolute -left-8 top-1/2 hidden h-px w-8 bg-violet-300 lg:block" />
                <span className="absolute -right-8 top-1/2 hidden h-px w-8 bg-violet-300 lg:block" />
              </div>
            </div>

            <WordColumn title={`${activeChar}…`} subtitle="Từ bắt đầu bằng chữ này" items={group.startsWith} side="right" onOpen={setSelectedWord} />
          </div>
        )}

        {group.contains.length > 0 && (
          <div className="mt-5 rounded-3xl border border-violet-100 bg-white/80 p-4 sm:p-5">
            <div className="font-black">Chữ “{activeChar}” nằm ở giữa</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.contains.slice(0, 24).map((item) => (
                <WordChip key={item.id} item={item} onOpen={setSelectedWord} />
              ))}
            </div>
          </div>
        )}
      </section>

      {topWords.length > 0 && (
        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-xl font-black">Danh sách từ trong mind map</h2>
          <p className="mt-1 text-sm text-slate-500">Bấm vào một từ để xem Pinyin, Hán-Việt, nghĩa, ví dụ và phát âm.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {topWords.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedWord(item)} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-left transition hover:border-violet-200 hover:bg-violet-50">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2"><span className="text-2xl font-black">{item.hanzi}</span><span className="text-xs font-black text-slate-400">HSK {item.hskLevel}</span></div>
                  <div className="truncate text-sm font-bold text-violet-700">{item.pinyin}</div>
                  <div className="truncate text-xs text-slate-500">{item.hanViet ? `${item.hanViet} · ` : ''}{item.meaningVi}</div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedWord && <WordDetail word={selectedWord} onClose={() => setSelectedWord(undefined)} onOpenWord={setSelectedWord} />}
    </div>
  );
}

function WordColumn({ title, subtitle, items, side, onOpen }: { title: string; subtitle: string; items: VocabularyEntry[]; side: 'left' | 'right'; onOpen: (word: VocabularyEntry) => void }) {
  return (
    <div className="rounded-3xl bg-white/80 p-4 ring-1 ring-slate-200 sm:p-5">
      <div className={side === 'left' ? 'lg:text-right' : ''}>
        <div className="text-lg font-black">{title}</div>
        <div className="text-xs text-slate-500">{subtitle} · {items.length} từ</div>
      </div>
      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">Không có từ trong nhóm này.</div>
      ) : (
        <div className="mt-4 space-y-2">
          {items.slice(0, 14).map((item) => <WordNode key={item.id} item={item} side={side} onOpen={onOpen} />)}
          {items.length > 14 && <div className="pt-1 text-center text-xs font-bold text-slate-400">+ {items.length - 14} từ khác ở danh sách bên dưới</div>}
        </div>
      )}
    </div>
  );
}

function WordNode({ item, side, onOpen }: { item: VocabularyEntry; side: 'left' | 'right'; onOpen: (word: VocabularyEntry) => void }) {
  return (
    <button type="button" onClick={() => onOpen(item)} className={`relative flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md ${side === 'left' ? 'lg:flex-row-reverse lg:text-right' : ''}`}>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-50 text-2xl font-black text-violet-900">{item.hanzi}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-black text-violet-700">{item.pinyin}</div>
        <div className="truncate text-xs text-slate-500">{item.hanViet || item.meaningVi}</div>
      </div>
      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">H{item.hskLevel}</span>
    </button>
  );
}

function WordChip({ item, onOpen }: { item: VocabularyEntry; onOpen: (word: VocabularyEntry) => void }) {
  return <button type="button" onClick={() => onOpen(item)} className="rounded-xl bg-violet-50 px-3 py-2 text-left ring-1 ring-violet-100 hover:bg-violet-100"><span className="font-black">{item.hanzi}</span><span className="ml-2 text-xs font-semibold text-violet-700">{item.pinyin}</span></button>;
}
