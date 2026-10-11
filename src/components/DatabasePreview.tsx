import { useEffect, useState } from 'react';
import { db } from '../db/database';
import type { VocabularyEntry } from '../types/vocabulary';

export function DatabasePreview() {
  const [rows, setRows] = useState<VocabularyEntry[]>([]);
  const [level, setLevel] = useState(1);

  async function load(selected: number) {
    const data = await db.vocabulary.where('hskLevel').equals(selected).sortBy('sequence');
    setRows(data.slice(0, 12));
  }

  useEffect(() => {
    void load(level);
  }, [level]);

  useEffect(() => {
    const listener = () => void load(level);
    const timer = window.setInterval(listener, 1000);
    return () => window.clearInterval(timer);
  }, [level]);

  return (
    <section className="rounded-3xl border border-orange-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Kiểm tra dữ liệu đã lưu</h2>
          <p className="mt-1 text-sm text-slate-600">Hiển thị 12 mục đầu tiên trong IndexedDB.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <button
              key={item}
              onClick={() => setLevel(item)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                level === item ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              HSK {item}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Chưa có dữ liệu. Hãy import workbook ở phía trên.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3">STT</th>
                <th className="px-3">Từ</th>
                <th className="px-3">Pinyin</th>
                <th className="px-3">Hán-Việt</th>
                <th className="px-3">Nghĩa</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="bg-orange-50/70">
                  <td className="rounded-l-xl px-3 py-3 text-slate-500">{row.sequence}</td>
                  <td className="px-3 py-3 text-2xl font-bold">{row.hanzi}</td>
                  <td className="px-3 py-3">{row.pinyin}</td>
                  <td className="px-3 py-3">{row.hanViet || '—'}</td>
                  <td className="rounded-r-xl px-3 py-3">{row.meaningVi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
