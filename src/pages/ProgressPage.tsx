import { AlertTriangle, BarChart3, BookOpenCheck, CalendarClock, Flame, GraduationCap, Target, Trophy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { WordDetail } from '../components/vocabulary/WordDetail';
import { getDifficultWords, getDueWords, getProgressDashboard, getRecentReviewWords, formatReviewDate, type LevelProgress, type ProgressOverview, type ProgressWord } from '../services/progressService';
import type { VocabularyEntry } from '../types/vocabulary';

const EMPTY: ProgressOverview = { vocabularyTotal: 0, trackedTotal: 0, newTotal: 0, learningTotal: 0, reviewTotal: 0, masteredTotal: 0, dueToday: 0, difficultTotal: 0, accuracy: 0, correctAnswers: 0, wrongAnswers: 0, streakDays: 0 };

type ListMode = 'due' | 'difficult' | 'recent';

export function ProgressPage() {
  const [overview, setOverview] = useState<ProgressOverview>(EMPTY);
  const [levels, setLevels] = useState<LevelProgress[]>([]);
  const [listMode, setListMode] = useState<ListMode>('due');
  const [items, setItems] = useState<ProgressWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<VocabularyEntry>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ overview: nextOverview, levels: nextLevels }, list] = await Promise.all([
      getProgressDashboard(),
      listMode === 'due' ? getDueWords() : listMode === 'difficult' ? getDifficultWords() : getRecentReviewWords()
    ]);
    setOverview(nextOverview);
    setLevels(nextLevels);
    setItems(list);
    setLoading(false);
  }, [listMode]);

  useEffect(() => {
    void load();
    const handler = () => void load();
    window.addEventListener('hsk-data-changed', handler);
    return () => window.removeEventListener('hsk-data-changed', handler);
  }, [load]);

  return (
    <>
      <div className="space-y-6">
        <header><div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-indigo-700"><BarChart3 size={17}/> Tiến độ học</div><h1 className="mt-1 text-3xl font-black">Theo dõi quá trình ghi nhớ</h1><p className="mt-2 text-sm leading-6 text-slate-500">Tổng hợp Quiz, spaced repetition và trạng thái từng từ. Dữ liệu được lưu trên thiết bị.</p></header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<BookOpenCheck/>} label="Đã bắt đầu" value={`${overview.trackedTotal}/${overview.vocabularyTotal}`} note={`${overview.newTotal} từ chưa học`} />
          <Metric icon={<CalendarClock/>} label="Đến hạn hôm nay" value={String(overview.dueToday)} note={`${overview.reviewTotal} từ ở trạng thái Review`} accent="amber" />
          <Metric icon={<Trophy/>} label="Đã thành thạo" value={String(overview.masteredTotal)} note={`${overview.learningTotal} từ đang học`} accent="emerald" />
          <Metric icon={<Target/>} label="Độ chính xác" value={`${overview.accuracy}%`} note={`${overview.correctAnswers} đúng · ${overview.wrongAnswers} sai`} accent="rose" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.45fr_.55fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black">Tiến độ theo HSK</h2><p className="mt-1 text-sm text-slate-500">% bắt đầu và % thành thạo trên toàn bộ từ của từng cấp.</p></div><GraduationCap className="text-indigo-200"/></div><div className="space-y-4">{levels.map((row) => <LevelRow key={row.level} row={row}/>)}</div></section>
          <aside className="space-y-4"><div className="rounded-3xl bg-orange-50 p-5 ring-1 ring-orange-100"><div className="flex items-center gap-2 text-orange-800"><Flame/><span className="font-black">Chuỗi học</span></div><div className="mt-3 text-4xl font-black text-orange-950">{overview.streakDays} ngày</div><p className="mt-2 text-sm leading-6 text-orange-900/70">Được tính từ những ngày có trả lời Quiz liên tiếp.</p></div><div className="rounded-3xl bg-rose-50 p-5 ring-1 ring-rose-100"><div className="flex items-center gap-2 text-rose-800"><AlertTriangle/><span className="font-black">Từ khó</span></div><div className="mt-3 text-4xl font-black text-rose-950">{overview.difficultTotal}</div><p className="mt-2 text-sm leading-6 text-rose-900/70">Các từ sai nhiều sẽ được Quiz ưu tiên xuất hiện lại.</p></div></aside>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">Danh sách cần chú ý</h2><p className="mt-1 text-sm text-slate-500">Bấm một từ để mở chi tiết.</p></div><div className="flex gap-2 overflow-x-auto"><ModeButton active={listMode === 'due'} onClick={() => setListMode('due')}>Đến hạn</ModeButton><ModeButton active={listMode === 'difficult'} onClick={() => setListMode('difficult')}>Hay sai</ModeButton><ModeButton active={listMode === 'recent'} onClick={() => setListMode('recent')}>Vừa ôn</ModeButton></div></div>

          {loading ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100"/>)}</div> : items.length === 0 ? <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">{listMode === 'due' ? 'Hiện chưa có từ nào đến hạn ôn.' : listMode === 'difficult' ? 'Chưa có từ sai để thống kê.' : 'Chưa có lịch sử ôn tập.'}</div> : <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(({ word, progress }) => <button key={word.id} type="button" onClick={() => setSelectedWord(word)} className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50"><div className="flex items-start justify-between gap-3"><div><div className="text-3xl font-black">{word.hanzi}</div><div className="font-bold text-red-700">{word.pinyin}</div></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${progress.status === 'mastered' ? 'bg-emerald-100 text-emerald-700' : progress.status === 'review' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>{progress.status}</span></div><div className="mt-2 line-clamp-1 text-sm text-slate-600">{word.meaningVi}</div><div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-400"><span>✓ {progress.correctCount}</span><span>✗ {progress.wrongCount}</span><span>{formatReviewDate(progress.nextReview)}</span></div></button>)}</div>}
        </section>
      </div>

      {selectedWord && <WordDetail word={selectedWord} onClose={() => setSelectedWord(undefined)} onOpenWord={setSelectedWord} onChanged={() => void load()} />}
    </>
  );
}

function Metric({ icon, label, value, note, accent = 'indigo' }: { icon: React.ReactNode; label: string; value: string; note: string; accent?: 'indigo' | 'amber' | 'emerald' | 'rose' }) {
  const classes = { indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100', amber: 'bg-amber-50 text-amber-700 ring-amber-100', emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100', rose: 'bg-rose-50 text-rose-700 ring-rose-100' }[accent];
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`inline-flex rounded-2xl p-2.5 ring-1 ${classes}`}>{icon}</div><div className="mt-4 text-sm font-bold text-slate-400">{label}</div><div className="mt-1 text-3xl font-black">{value}</div><div className="mt-2 text-xs font-semibold text-slate-400">{note}</div></div>;
}

function LevelRow({ row }: { row: LevelProgress }) {
  return <div><div className="mb-2 flex items-center justify-between gap-3 text-sm"><div className="font-black">HSK {row.level}</div><div className="text-xs font-semibold text-slate-400">{row.trackedTotal}/{row.vocabularyTotal} đã bắt đầu · {row.masteredTotal} mastered · {row.dueToday} đến hạn</div></div><div className="relative h-3 overflow-hidden rounded-full bg-slate-100"><div className="absolute inset-y-0 left-0 bg-indigo-200" style={{ width: `${row.percentStarted}%` }}/><div className="absolute inset-y-0 left-0 bg-indigo-700" style={{ width: `${row.percentMastered}%` }}/></div><div className="mt-1 flex justify-between text-[11px] font-bold text-slate-400"><span>Bắt đầu {row.percentStarted}%</span><span>Thành thạo {row.percentMastered}%</span></div></div>;
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`shrink-0 rounded-xl px-3 py-2 text-sm font-black ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{children}</button>; }
