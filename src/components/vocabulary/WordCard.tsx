import { Check, Star } from 'lucide-react';
import type { VocabularyEntry } from '../../types/vocabulary';
import { PronunciationButton } from './PronunciationButton';

interface Props {
  word: VocabularyEntry;
  favorite: boolean;
  learned: boolean;
  onOpen: (word: VocabularyEntry) => void;
  onToggleFavorite: (wordId: string) => void;
  onToggleLearned: (wordId: string, learned: boolean) => void;
}

export function WordCard({ word, favorite, learned, onOpen, onToggleFavorite, onToggleLearned }: Props) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(word)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen(word);
      }}
      className="group cursor-pointer rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-4xl font-black leading-tight text-slate-950 sm:text-[42px]">{word.hanzi}</div>
          <div className="mt-1 text-base font-semibold text-red-700">{word.pinyin || '—'}</div>
        </div>
        <PronunciationButton text={word.hanzi} compact />
      </div>

      <div className="mt-3 line-clamp-2 min-h-[44px] text-sm font-medium leading-6 text-slate-700">{word.meaningVi || 'Chưa có nghĩa'}</div>
      <div className="mt-2 min-h-5 text-xs text-slate-500">Hán-Việt: <span className="font-semibold text-slate-700">{word.hanViet || 'chưa bổ sung'}</span></div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">HSK {word.hskLevel} · #{word.sequence}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleLearned(word.id, !learned);
            }}
            className={`rounded-lg p-2 transition ${learned ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100'}`}
            aria-label={learned ? 'Bỏ đánh dấu đã học' : 'Đánh dấu đã học'}
          >
            <Check size={18} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(word.id);
            }}
            className={`rounded-lg p-2 transition ${favorite ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`}
            aria-label={favorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
          >
            <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
}
