interface Props {
  value: number;
  onChange: (level: number) => void;
  counts?: Record<number, number>;
}

export function HSKSelector({ value, onChange, counts }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {[1, 2, 3, 4, 5, 6].map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
            value === level
              ? 'bg-red-700 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50'
          }`}
        >
          HSK {level}
          {counts && <span className={`ml-2 text-xs ${value === level ? 'text-red-100' : 'text-slate-400'}`}>{counts[level] ?? 0}</span>}
        </button>
      ))}
    </div>
  );
}
