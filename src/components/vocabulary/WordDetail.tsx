import { Check, ChevronRight, Heart, Star, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { LearningProgress, VocabularyEntry } from '../../types/vocabulary';
import { getLearningProgress, getRelatedWords, isFavorite, markWordLearned, toggleFavorite } from '../../services/vocabularyService';
import { PronunciationButton } from './PronunciationButton';
import { CharacterBreakdown } from './CharacterBreakdown';

interface Props {
  word: VocabularyEntry;
  onClose: () => void;
  onOpenWord: (word: VocabularyEntry) => void;
  onChanged?: () => void;
}

export function WordDetail({ word, onClose, onOpenWord, onChanged }: Props) {
  const [favorite, setFavorite] = useState(false);
  const [progress, setProgress] = useState<LearningProgress>();
  const [related, setRelated] = useState<VocabularyEntry[]>([]);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    let alive = true;
    void Promise.all([isFavorite(word.id), getLearningProgress(word.id), getRelatedWords(word)]).then(([fav, prog, rel]) => {
      if (!alive) return;
      setFavorite(fav);
      setProgress(prog);
      setRelated(rel);
    });
    return () => { alive = false; };
  }, [word.id]);

  const learned = progress?.status !== undefined && progress.status !== 'new';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={onClose}>
      <section
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-[32px] bg-white shadow-2xl sm:max-w-4xl sm:rounded-[32px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="text-sm font-bold text-red-700">HSK {word.hskLevel} · Từ #{word.sequence}</div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng">
            <X size={22} />
          </button>
        </div>

        <div className="p-5 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <div className="rounded-[28px] bg-gradient-to-br from-red-50 via-orange-50 to-white p-6 text-center ring-1 ring-red-100 sm:p-8">
                <div className="text-7xl font-black leading-none tracking-tight text-slate-950 sm:text-8xl">{word.hanzi}</div>
                {word.traditional && word.traditional !== word.hanzi && <div className="mt-3 text-2xl text-slate-500">{word.traditional}</div>}
                <div className="mt-5 text-2xl font-bold text-red-700">{word.pinyin || '—'}</div>
                <div className="mt-2 text-sm text-slate-500">Hán-Việt: <span className="font-bold text-slate-700">{word.hanViet || 'chưa bổ sung'}</span></div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <PronunciationButton text={word.hanzi} rate={rate} />
                  {[0.7, 0.8, 1, 1.2].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRate(item)}
                      className={`rounded-lg px-2.5 py-2 text-xs font-bold ${rate === item ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
                    >
                      {item.toFixed(1)}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const next = await toggleFavorite(word.id);
                    setFavorite(next);
                    onChanged?.();
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold ${favorite ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}
                >
                  <Star size={19} fill={favorite ? 'currentColor' : 'none'} />
                  {favorite ? 'Đã yêu thích' : 'Yêu thích'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const next = await markWordLearned(word.id, !learned);
                    setProgress(next);
                    onChanged?.();
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold ${learned ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}
                >
                  <Check size={19} />
                  {learned ? 'Đã học' : 'Đánh dấu đã học'}
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <InfoBlock title="Nghĩa tiếng Việt">
                <p className="text-lg font-semibold leading-8 text-slate-900">{word.meaningVi || 'Chưa có dữ liệu'}</p>
                {word.meaningOriginal && word.meaningOriginal !== word.meaningVi && <p className="mt-2 text-sm text-slate-500">Dữ liệu gốc: {word.meaningOriginal}</p>}
              </InfoBlock>

              <InfoBlock title="Ví dụ">
                {word.exampleHanzi ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-2xl font-bold leading-9 text-slate-950">{word.exampleHanzi}</p>
                      <PronunciationButton text={word.exampleHanzi} compact />
                    </div>
                    {word.examplePinyin && <p className="mt-2 font-semibold text-red-700">{word.examplePinyin}</p>}
                    {word.exampleMeaning && <p className="mt-2 leading-7 text-slate-700">{word.exampleMeaning}</p>}
                  </>
                ) : <p className="text-slate-500">Chưa có ví dụ.</p>}
              </InfoBlock>

              <InfoBlock title="Phân tích chữ">
                <CharacterBreakdown characters={word.characters} />
                <p className="mt-3 text-xs leading-5 text-slate-400">Chỉ hiển thị Hán-Việt/bộ thủ từ metadata đã được bổ sung; ứng dụng không tự đoán dữ liệu còn thiếu.</p>
              </InfoBlock>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black">Từ liên quan</h3>
                <p className="mt-1 text-sm text-slate-500">Các từ trong HSK có ít nhất một chữ Hán chung.</p>
              </div>
              <Heart className="text-red-200" />
            </div>

            {related.length === 0 ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Chưa tìm thấy từ liên quan trong dữ liệu đã import.</div>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenWord(item)}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-left transition hover:border-red-200 hover:bg-red-50"
                  >
                    <div className="min-w-0">
                      <div className="text-2xl font-black">{item.hanzi}</div>
                      <div className="truncate text-sm font-semibold text-red-700">{item.pinyin}</div>
                      <div className="truncate text-xs text-slate-500">{item.meaningVi}</div>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-400">{title}</h3>
      {children}
    </section>
  );
}
