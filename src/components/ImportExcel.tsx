import { FileSpreadsheet, LoaderCircle, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useImportStore } from '../stores/importStore';

export function ImportExcel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { importing, report, error, importFile } = useImportStore();

  return (
    <section className="rounded-3xl border border-orange-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-red-50 p-3 text-red-700">
          <FileSpreadsheet size={26} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">Import dữ liệu HSK</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Đây là chức năng <strong>tùy chọn</strong>. App đã có sẵn HSK1–HSK6; chỉ chọn file <strong>.xlsx hoặc .xlsm</strong> khi muốn cập nhật nguồn từ vựng. Tiến độ học, yêu thích và lịch sử quiz được giữ nguyên trong IndexedDB.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xlsm,.xls"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
              event.currentTarget.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={importing}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? <LoaderCircle className="animate-spin" size={19} /> : <Upload size={19} />}
            {importing ? 'Đang đọc workbook…' : 'Chọn file Excel'}
          </button>

          {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>}

          {report && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="text-sm text-slate-500">File: {report.fileName}</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">
                {report.totalImported.toLocaleString('vi-VN')} từ đã import
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <div key={level} className="rounded-xl bg-orange-50 p-3 text-center">
                    <div className="text-xs font-semibold text-slate-500">HSK {level}</div>
                    <div className="mt-1 text-lg font-bold">{report.perLevel[level] ?? 0}</div>
                  </div>
                ))}
              </div>
              {report.warnings.length > 0 && (
                <details className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  <summary className="cursor-pointer font-semibold">
                    {report.warnings.length} cảnh báo dữ liệu
                  </summary>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {report.warnings.slice(0, 30).map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                  {report.warnings.length > 30 && <p className="mt-2">Chỉ hiển thị 30 cảnh báo đầu tiên.</p>}
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
