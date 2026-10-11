import { Check, Headphones, RotateCcw, Settings2, Speaker, Target, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../db/database';
import { buildQuiz, getQuizStats, recordQuizAnswer, type QuizQuestion, type QuizQuestionType } from '../services/quizService';
import { speakChinese } from '../services/speechService';

const TYPE_OPTIONS: Array<{ id: QuizQuestionType; label: string; short: string }> = [
  { id: 'hanzi-meaning', label: 'Hán tự → nghĩa', short: '字 → Việt' },
  { id: 'hanzi-pinyin', label: 'Hán tự → Pinyin', short: '字 → Pinyin' },
  { id: 'meaning-hanzi', label: 'Nghĩa → Hán tự', short: 'Việt → 字' },
  { id: 'pinyin-hanzi', label: 'Pinyin → Hán tự', short: 'Pinyin → 字' },
  { id: 'audio-hanzi', label: 'Nghe → Hán tự', short: '🔊 → 字' }
];

export function QuizPage() {
  const [levels, setLevels] = useState<number[]>([1]);
  const [types, setTypes] = useState<QuizQuestionType[]>(['hanzi-meaning', 'hanzi-pinyin']);
  const [count, setCount] = useState(20);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [answered, setAnswered] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(0);
  const [stats, setStats] = useState({ total: 0, correct: 0, wrong: 0, accuracy: 0, recentAccuracy: 0 });
  const startedAt = useRef(Date.now());

  useEffect(() => {
    void refreshMeta();
    const handler = () => void refreshMeta();
    window.addEventListener('hsk-data-changed', handler);
    return () => window.removeEventListener('hsk-data-changed', handler);
  }, []);

  async function refreshMeta() {
    setAvailable(await db.vocabulary.count());
    setStats(await getQuizStats());
  }

  function toggleLevel(level: number) {
    setLevels((current) => current.includes(level) ? current.filter((item) => item !== level) : [...current, level].sort());
  }

  function toggleType(type: QuizQuestionType) {
    setTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  async function startQuiz() {
    if (!levels.length || !types.length) return;
    setLoading(true);
    const next = await buildQuiz({ levels, types, count });
    setQuestions(next);
    setIndex(0);
    setSelected(undefined);
    setAnswered(false);
    setSessionCorrect(0);
    setStarted(Boolean(next.length));
    startedAt.current = Date.now();
    setLoading(false);
  }

  async function answer(optionId: string) {
    if (answered) return;
    const question = questions[index];
    if (!question) return;
    setSelected(optionId);
    setAnswered(true);
    const correct = await recordQuizAnswer(question, optionId, Date.now() - startedAt.current);
    if (correct) setSessionCorrect((value) => value + 1);
    await refreshMeta();
  }

  function nextQuestion() {
    if (index >= questions.length - 1) {
      setIndex(questions.length);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(undefined);
    setAnswered(false);
    startedAt.current = Date.now();
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Header stats={stats} />
        {available === 0 ? <EmptyState /> : (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-red-50 p-3 text-red-700"><Settings2 /></div><div><h2 className="text-xl font-black">Tạo bài ôn tập</h2><p className="text-sm text-slate-500">Chọn cấp HSK và dạng câu hỏi.</p></div></div>

              <Label>Chọn HSK</Label>
              <div className="mb-7 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[1,2,3,4,5,6].map((level) => <button key={level} type="button" onClick={() => toggleLevel(level)} className={`rounded-2xl border px-3 py-3 text-sm font-black transition ${levels.includes(level) ? 'border-red-700 bg-red-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50'}`}>HSK {level}</button>)}
              </div>

              <Label>Dạng câu hỏi</Label>
              <div className="mb-7 grid gap-2 sm:grid-cols-2">
                {TYPE_OPTIONS.map((option) => <button key={option.id} type="button" onClick={() => toggleType(option.id)} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${types.includes(option.id) ? 'border-red-300 bg-red-50 text-red-900' : 'border-slate-200 hover:bg-slate-50'}`}><span className="font-bold">{option.label}</span>{types.includes(option.id) && <Check size={18} className="text-red-700" />}</button>)}
              </div>

              <Label>Số câu</Label>
              <div className="mb-7 flex flex-wrap gap-2">{[10,20,30,50].map((value) => <button key={value} type="button" onClick={() => setCount(value)} className={`rounded-xl px-4 py-2 text-sm font-bold ${count === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{value} câu</button>)}</div>

              <button type="button" onClick={() => void startQuiz()} disabled={!levels.length || !types.length || loading} className="w-full rounded-2xl bg-red-700 px-5 py-4 font-black text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40">{loading ? 'Đang tạo bài...' : 'Bắt đầu ôn tập'}</button>
            </section>

            <aside className="space-y-4">
              <StatCard title="Tổng câu đã làm" value={stats.total.toLocaleString('vi-VN')} />
              <StatCard title="Độ chính xác" value={`${stats.accuracy}%`} />
              <StatCard title="100 câu gần nhất" value={`${stats.recentAccuracy}%`} />
              <div className="rounded-3xl bg-amber-50 p-5 text-sm leading-6 text-amber-950 ring-1 ring-amber-100"><div className="mb-1 font-black">Quiz thông minh</div>Từ trả lời sai, chưa học hoặc lâu chưa ôn sẽ được ưu tiên. Đáp án nhiễu ưu tiên từ cùng HSK, gần Pinyin hoặc có chữ Hán chung.</div>
            </aside>
          </div>
        )}
      </div>
    );
  }

  if (index >= questions.length) {
    const percent = questions.length ? Math.round((sessionCorrect / questions.length) * 100) : 0;
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Target size={38} /></div>
        <h1 className="text-3xl font-black">Hoàn thành!</h1>
        <p className="mt-2 text-slate-500">Kết quả của lần ôn tập này</p>
        <div className="my-7 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"><div className="text-6xl font-black text-red-700">{percent}%</div><div className="mt-3 text-lg font-bold">{sessionCorrect}/{questions.length} câu đúng</div><div className="mt-1 text-sm text-slate-500">Sai {questions.length - sessionCorrect} câu — các từ này sẽ được tăng ưu tiên ở lần ôn sau.</div></div>
        <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => void startQuiz()} className="rounded-2xl bg-red-700 px-5 py-4 font-black text-white"><RotateCcw className="mr-2 inline" size={18}/>Làm lại</button><button type="button" onClick={() => setStarted(false)} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-black">Đổi thiết lập</button></div>
      </div>
    );
  }

  const question = questions[index];
  const selectedCorrect = selected === question.correctOptionId;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-4"><button type="button" onClick={() => setStarted(false)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500"><X size={19}/></button><div className="flex-1"><div className="mb-1 flex justify-between text-xs font-bold text-slate-500"><span>Câu {index + 1}/{questions.length}</span><span>{TYPE_OPTIONS.find((item) => item.id === question.type)?.short}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-red-700 transition-all" style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div></div><div className="min-w-12 text-right text-sm font-black text-emerald-700">{sessionCorrect} ✓</div></div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <QuestionPrompt question={question} />
        <div className="mt-7 grid gap-3 sm:grid-cols-2">{question.options.map((option, optionIndex) => { const isSelected = selected === option.id; const isCorrect = option.id === question.correctOptionId; const stateClass = answered ? isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : isSelected ? 'border-red-500 bg-red-50 text-red-950' : 'border-slate-200 bg-white text-slate-500' : 'border-slate-200 bg-white hover:border-red-300 hover:bg-red-50'; return <button key={option.id} type="button" onClick={() => void answer(option.id)} disabled={answered} className={`flex min-h-20 items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition ${stateClass}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black">{String.fromCharCode(65 + optionIndex)}</span><span className={`${['meaning-hanzi','pinyin-hanzi','audio-hanzi'].includes(question.type) ? 'text-2xl font-black' : 'text-base font-bold'}`}>{option.label}</span>{answered && isCorrect && <Check className="ml-auto text-emerald-600" />}{answered && isSelected && !isCorrect && <X className="ml-auto text-red-600" />}</button>; })}</div>

        {answered && (
          <div className={`mt-6 rounded-2xl p-5 ${selectedCorrect ? 'bg-emerald-50 text-emerald-950' : 'bg-red-50 text-red-950'}`}>
            <div className="mb-3 text-lg font-black">{selectedCorrect ? '✓ Chính xác' : '✗ Chưa đúng'}</div>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-1"><span className="text-3xl font-black">{question.explanation.hanzi}</span><span className="font-bold">{question.explanation.pinyin}</span>{question.explanation.hanViet && <span className="text-sm">Hán-Việt: <b>{question.explanation.hanViet}</b></span>}</div><div className="mt-2 text-sm">Nghĩa: <b>{question.explanation.meaningVi}</b></div>
            <div className="mt-4 flex gap-2"><button type="button" onClick={() => speakChinese(question.word.hanzi)} className="rounded-xl bg-white px-3 py-2 text-sm font-bold shadow-sm"><Speaker className="mr-1 inline" size={16}/>Nghe lại</button><button type="button" onClick={nextQuestion} className="ml-auto rounded-xl bg-slate-900 px-5 py-2 text-sm font-black text-white">{index === questions.length - 1 ? 'Xem kết quả' : 'Câu tiếp →'}</button></div>
          </div>
        )}
      </section>
    </div>
  );
}

function QuestionPrompt({ question }: { question: QuizQuestion }) {
  if (question.type === 'audio-hanzi') {
    return <div className="text-center"><div className="mb-2 text-sm font-bold uppercase tracking-widest text-slate-400">Nghe và chọn từ đúng</div><button type="button" onClick={() => speakChinese(question.word.hanzi)} className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-red-700 text-white shadow-lg transition hover:scale-105"><Headphones size={46}/></button><p className="mt-4 text-sm text-slate-500">Bấm vào nút để nghe lại.</p></div>;
  }
  const hanziPrompt = question.type === 'hanzi-meaning' || question.type === 'hanzi-pinyin';
  return <div className="text-center"><div className="mb-2 text-sm font-bold uppercase tracking-widest text-slate-400">{question.type === 'hanzi-meaning' ? 'Chọn nghĩa đúng' : question.type === 'hanzi-pinyin' ? 'Chọn Pinyin đúng' : question.type === 'meaning-hanzi' ? 'Chọn chữ Hán đúng' : 'Chọn chữ Hán đúng'}</div><div className={`${hanziPrompt ? 'font-["Noto_Sans_SC",sans-serif] text-6xl font-black sm:text-7xl' : 'text-3xl font-black sm:text-4xl'} leading-tight`}>{question.prompt}</div>{hanziPrompt && <button type="button" onClick={() => speakChinese(question.word.hanzi)} className="mt-3 rounded-full bg-slate-100 p-2 text-slate-600"><Speaker size={18}/></button>}</div>;
}

function Header({ stats }: { stats: { total: number; accuracy: number } }) { return <div><div className="flex items-center gap-3"><div className="rounded-2xl bg-red-700 p-3 text-white"><Target /></div><div><h1 className="text-2xl font-black sm:text-3xl">Ôn tập trắc nghiệm</h1><p className="text-sm text-slate-500">5 dạng câu hỏi · ưu tiên từ yếu · lưu tiến độ tự động</p></div></div>{stats.total > 0 && <div className="mt-3 text-xs font-semibold text-slate-400">Đã làm {stats.total} câu · chính xác {stats.accuracy}%</div>}</div>; }
function Label({ children }: { children: React.ReactNode }) { return <div className="mb-2 text-sm font-black text-slate-700">{children}</div>; }
function StatCard({ title, value }: { title: string; value: string }) { return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-sm font-bold text-slate-400">{title}</div><div className="mt-1 text-3xl font-black">{value}</div></div>; }
function EmptyState() { return <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><Target className="mx-auto mb-3 text-slate-300" size={42}/><div className="font-black">Chưa có dữ liệu từ vựng</div><p className="mt-1 text-sm text-slate-500">Hãy vào tab Nhập Excel và import file HSK trước khi tạo Quiz.</p></div>; }
