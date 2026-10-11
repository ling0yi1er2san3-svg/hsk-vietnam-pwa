import { Volume2 } from 'lucide-react';
import { speakChinese } from '../../services/speechService';

interface Props {
  text: string;
  rate?: number;
  compact?: boolean;
}

export function PronunciationButton({ text, rate, compact = false }: Props) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        speakChinese(text, rate);
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 font-semibold text-red-700 transition hover:bg-red-100 ${
        compact ? 'h-10 w-10 p-0' : 'px-3 py-2'
      }`}
      aria-label={`Phát âm ${text}`}
      title="Phát âm tiếng Trung"
    >
      <Volume2 size={18} />
      {!compact && <span>Phát âm</span>}
    </button>
  );
}
