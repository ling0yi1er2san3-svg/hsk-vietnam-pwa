import { DatabaseZap, GitCompareArrows, Search, Upload, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCharacterCoverage, getPhoneticGroups, getRadicalGroups, getWordsContainingCharacter, type CharacterGroup } from '../services/compareService';
import { downloadCharacterMetadataTemplate, ensureStarterCharacters, importCharacterMetadataJson } from '../services/enrichmentService';
import { speakChinese } from '../services/speechService';
import type { CharacterMetadata, VocabularyEntry } from '../types/vocabulary';
import { normalizeSearchText } from '../utils/text';

type Mode = 'radical' | 'phonetic';

export function ComparePage() {
  const [mode, setMode] = useState<Mode>('radical');
  const [groups, setGroups] = useState<CharacterGroup[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CharacterMetadata>();
  const [words, setWords] = useState<VocabularyEntry[]>([]);
  const [coverage, setCoverage] = useState({ used: 0, covered: 0, totalMetadata: 0 });
  const [status, setStatus] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    await ensureStarterCharacters();
    const [nextGroups, nextCoverage] = await Promise.all([
      mode === 'radical' ? getRadicalGroups() : getPhoneticGroups(),
      getCharacterCoverage()
    ]);
    setGroups(nextGroups);
    setCoverage(nextCoverage);
  }, [mode]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const handler = () => void load();
    window.addEventListener('hsk-data-changed', handler);
    return () => window.removeEventListener('hsk-data-changed', handler);
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setWords([]);
      return;
    }
    void getWordsContainingCharacter(selected.hanzi).then(setWords);
  }, [selected]);

  const filtered = useMemo(() => {
    const normalized = normalizeSearchText(query);
    if (!normalized) return groups;
    return groups.filter((group) => {
      const text = [group.key, group.description, ...group.characters.flatMap((item) => [item.hanzi, item.pinyin.join(' '), item.hanViet.join(' '), item.radicalMeaningVi])].filter(Boolean).join(' ');
      return normalizeSearchText(text).includes(normalized) || group.characters.some((item) => item.hanzi.includes(query.trim()));
    });
  }, [groups, query]);

  async function handleJson(file?: File) {
    if (!file) return;
    try {
      const report = await importCharacterMetadataJson(file);
      setStatus(`Đã import ${report.charactersImported} chữ; cập nhật Hán-Việt/Phồn thể cho ${report.vocabularyUpdated} mục từ.`);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Không thể import JSON.');
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-red-700"><GitCompareArrows size={17} /> Phân biệt chữ</div>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Bộ thủ & thành phần gợi âm</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Nhóm chữ theo bộ thủ hoặc thành phần gợi âm. Chỉ hiển thị metadata đã được kiểm chứng; không tự đoán cấu tạo chữ.</p>
        </div>
        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
          <div className="text-xs font-semibold text-slate-300">Độ phủ metadata</div>
          <div className="mt-0.5 text-lg font-black">{coverage.covered}/{coverage.used || 0} chữ đang dùng</div>
          <div className="mt-0.5 text-[11px] text-slate-400">Kho metadata: {coverage.totalMetadata} chữ</div>
        </div>
      </div>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <strong>Phase 6–7:</strong> bản hiện tại đi kèm một bộ dữ liệu mẫu có kiểm soát. Để phủ toàn bộ HSK, import thêm metadata JSON theo mẫu; dữ liệu bổ sung nằm riêng trong IndexedDB và không sửa file Excel gốc.
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm 女, 青, qing, thanh, tình…" className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMode('radical')} className={`rounded-2xl px-4 py-3 text-sm font-black ${mode === 'radical' ? 'bg-red-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>Chung bộ thủ</button>
          <button type="button" onClick={() => setMode('phonetic')} className={`rounded-2xl px-4 py-3 text-sm font-black ${mode === 'phonetic' ? 'bg-red-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>Chung thanh phù</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">Chưa có nhóm phù hợp trong metadata hiện tại.</div>
          ) : filtered.map((group) => (
            <article key={`${mode}-${group.key}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3"><span className="text-5xl font-black">{group.label}</span><span className="rounded-xl bg-red-50 px-3 py-1 text-xs font-black text-red-700">{group.characters.length} chữ</span></div>
                  {group.description && <p className="mt-2 text-sm text-slate-500">{group.description}</p>}
                </div>
                {mode === 'phonetic' && <div className="rounded-2xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-800">Thành phần chung: {group.key}</div>}
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-400"><tr><th className="pb-2 pr-4">Chữ</th><th className="pb-2 pr-4">Pinyin</th><th className="pb-2 pr-4">Hán-Việt</th><th className="pb-2 pr-4">Bộ</th><th className="pb-2">Cấu tạo</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {group.characters.map((item) => (
                      <tr key={item.hanzi} onClick={() => setSelected(item)} className="cursor-pointer hover:bg-red-50/60">
                        <td className="py-3 pr-4"><div className="flex items-center gap-2"><span className="text-3xl font-black">{item.hanzi}</span><button type="button" onClick={(event) => { event.stopPropagation(); speakChinese(item.hanzi); }} className="rounded-lg p-1.5 text-red-700 hover:bg-red-100"><Volume2 size={16} /></button></div></td>
                        <td className="py-3 pr-4 font-semibold text-red-700">{item.pinyin.join(' / ') || '—'}</td>
                        <td className="py-3 pr-4 font-semibold">{item.hanViet.join(' / ') || '—'}</td>
                        <td className="py-3 pr-4"><span className="text-xl font-bold">{item.radical || '—'}</span>{item.radicalMeaningVi && <div className="text-xs text-slate-400">{item.radicalMeaningVi}</div>}</td>
                        <td className="py-3">{item.components.join(' + ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-3 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 font-black"><DatabaseZap size={19} className="text-red-700" /> Bổ sung metadata</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">Import JSON chứa Hán-Việt, phồn thể, bộ thủ, số nét và thành phần. App merge theo từng chữ Hán.</p>
            <div className="mt-4 grid gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 py-3 text-sm font-black text-white"><Upload size={18} /> Import JSON</button>
              <button type="button" onClick={downloadCharacterMetadataTemplate} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">Tải file mẫu JSON</button>
              <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { void handleJson(event.target.files?.[0]); event.currentTarget.value = ''; }} />
            </div>
            {status && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{status}</div>}
          </div>

          {selected ? (
            <div className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div><div className="text-6xl font-black">{selected.hanzi}</div>{selected.traditional && selected.traditional !== selected.hanzi && <div className="mt-1 text-xl text-slate-400">繁: {selected.traditional}</div>}</div>
                <button type="button" onClick={() => speakChinese(selected.hanzi)} className="rounded-xl bg-red-50 p-3 text-red-700"><Volume2 /></button>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <Row label="Pinyin" value={selected.pinyin.join(' / ') || '—'} />
                <Row label="Hán-Việt" value={selected.hanViet.join(' / ') || '—'} />
                <Row label="Bộ thủ" value={`${selected.radical || '—'}${selected.radicalMeaningVi ? ` · ${selected.radicalMeaningVi}` : ''}`} />
                <Row label="Số nét" value={selected.strokeCount ? String(selected.strokeCount) : '—'} />
                <Row label="Cấu tạo" value={selected.components.join(' + ') || '—'} />
                <Row label="Nghĩa phù" value={selected.semanticComponent || '—'} />
                <Row label="Thanh phù" value={selected.phoneticComponent || '—'} />
              </dl>
              {selected.noteVi && <div className="mt-4 rounded-2xl bg-orange-50 p-3 text-sm leading-6 text-orange-950">{selected.noteVi}</div>}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <h3 className="font-black">Từ HSK chứa {selected.hanzi}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {words.length ? words.map((word) => <span key={word.id} className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-sm"><strong>{word.hanzi}</strong> <span className="text-slate-400">HSK{word.hskLevel}</span></span>) : <span className="text-sm text-slate-400">Chưa có trong workbook.</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-7 text-center text-sm leading-6 text-slate-500">Bấm vào một chữ trong bảng để xem bộ thủ, cấu tạo và các từ HSK liên quan.</div>
          )}
        </aside>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[90px_1fr] gap-3"><dt className="font-bold text-slate-400">{label}</dt><dd className="font-semibold text-slate-800">{value}</dd></div>;
}
