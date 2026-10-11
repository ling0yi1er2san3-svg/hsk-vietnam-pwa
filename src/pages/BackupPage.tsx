import { DatabaseBackup, Download, FileUp, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import {
  clearLearningData,
  createFullBackup,
  createLearningBackup,
  downloadBackup,
  readBackupFile,
  restoreBackup,
  type HskBackupPayload,
  type RestoreReport
} from '../services/backupService';

export function BackupPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [candidate, setCandidate] = useState<HskBackupPayload | null>(null);
  const [report, setReport] = useState<RestoreReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function exportFull() {
    setBusy(true); setMessage('');
    try {
      const payload = await createFullBackup();
      downloadBackup(payload, 'hsk-vietnam-full');
      setMessage(`Đã tạo bản sao lưu đầy đủ: ${payload.counts.vocabulary} từ, ${payload.counts.progress} tiến độ, ${payload.counts.quizHistory} lượt quiz.`);
    } finally { setBusy(false); }
  }

  async function exportLearning() {
    setBusy(true); setMessage('');
    try {
      const payload = await createLearningBackup();
      downloadBackup(payload, 'hsk-vietnam-learning');
      setMessage(`Đã sao lưu tiến độ học: ${payload.counts.progress} từ, ${payload.counts.favorites} yêu thích, ${payload.counts.quizHistory} lượt quiz.`);
    } finally { setBusy(false); }
  }

  async function chooseFile(file?: File) {
    if (!file) return;
    setReport(null); setMessage('');
    try {
      setCandidate(await readBackupFile(file));
    } catch (error) {
      setCandidate(null);
      setMessage(error instanceof Error ? error.message : 'Không đọc được file backup.');
    }
  }

  async function doRestore(mode: 'merge' | 'replace') {
    if (!candidate) return;
    const warning = mode === 'replace'
      ? 'Khôi phục thay thế sẽ xóa dữ liệu hiện có trong app trước khi nhập bản backup. Tiếp tục?'
      : 'Khôi phục gộp sẽ giữ dữ liệu hiện tại và cập nhật/thêm dữ liệu từ backup. Tiếp tục?';
    if (!window.confirm(warning)) return;

    setBusy(true); setMessage('');
    try {
      const result = await restoreBackup(candidate, mode);
      setReport(result);
      setMessage('Khôi phục hoàn tất. Bạn có thể mở lại các tab để xem dữ liệu.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Khôi phục thất bại.');
    } finally { setBusy(false); }
  }

  async function clearLearning() {
    if (!window.confirm('Xóa toàn bộ tiến độ, yêu thích và lịch sử quiz? Dữ liệu từ vựng HSK sẽ được giữ nguyên.')) return;
    setBusy(true);
    try {
      await clearLearningData();
      setCandidate(null); setReport(null);
      setMessage('Đã xóa dữ liệu học. Từ vựng HSK vẫn được giữ nguyên.');
    } finally { setBusy(false); }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-3"><DatabaseBackup className="text-red-700" /><h1 className="text-2xl font-black sm:text-3xl">Sao lưu & khôi phục</h1></div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Dữ liệu PWA nằm trên thiết bị. Hãy sao lưu định kỳ để không mất tiến độ nếu xóa dữ liệu trình duyệt, đổi máy hoặc gỡ ứng dụng.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard icon={<ShieldCheck />} title="Backup đầy đủ" text="Bao gồm từ vựng, metadata chữ Hán, tiến độ, yêu thích và lịch sử quiz." button="Tải backup đầy đủ" disabled={busy} onClick={exportFull} />
        <ActionCard icon={<Download />} title="Backup tiến độ học" text="Nhẹ hơn: chỉ tiến độ, yêu thích và lịch sử quiz. Phù hợp để chuyển tiến độ sang thiết bị khác." button="Tải backup tiến độ" disabled={busy} onClick={exportLearning} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3"><FileUp className="text-red-700" /><div><h2 className="font-black">Khôi phục từ file JSON</h2><p className="text-sm text-slate-500">Chỉ nhận file backup do HSK Việt Nam tạo.</p></div></div>
        <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void chooseFile(e.target.files?.[0])} />
        <button type="button" onClick={() => fileInput.current?.click()} className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-700">Chọn file backup</button>

        {candidate && (
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="font-black">Backup ngày {new Date(candidate.exportedAt).toLocaleString('vi-VN')}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
              <Count label="Từ" value={candidate.counts.vocabulary} /><Count label="Chữ" value={candidate.counts.characters} /><Count label="Tiến độ" value={candidate.counts.progress} /><Count label="Yêu thích" value={candidate.counts.favorites} /><Count label="Quiz" value={candidate.counts.quizHistory} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => void doRestore('merge')} className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">Gộp với dữ liệu hiện tại</button>
              <button disabled={busy} onClick={() => void doRestore('replace')} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-800 disabled:opacity-50">Thay thế toàn bộ dữ liệu</button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-start gap-3"><RotateCcw className="mt-0.5 shrink-0 text-amber-700" /><div><h2 className="font-black text-amber-900">Đổi máy / đổi điện thoại</h2><p className="mt-1 text-sm leading-6 text-slate-600">Ở máy cũ: tải “Backup tiến độ học”. Ở máy mới: import Excel HSK trước, sau đó vào đây chọn file backup và chọn “Gộp với dữ liệu hiện tại”.</p></div></div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4"><div><h2 className="font-black">Đặt lại dữ liệu học</h2><p className="mt-1 text-sm text-slate-500">Xóa tiến độ/yêu thích/quiz nhưng không xóa danh sách HSK đã import.</p></div><button disabled={busy} onClick={() => void clearLearning()} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-black text-red-700 hover:bg-red-50"><Trash2 size={17} />Xóa</button></div>
      </div>

      {message && <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100">{message}</div>}
      {report && <div className="text-sm text-slate-500">Đã khôi phục: {report.vocabulary} từ · {report.progress} tiến độ · {report.favorites} yêu thích · {report.quizHistory} lượt quiz.</div>}
    </section>
  );
}

function ActionCard({ icon, title, text, button, onClick, disabled }: { icon: ReactNode; title: string; text: string; button: string; onClick: () => void; disabled: boolean }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-700">{icon}</div><h2 className="mt-4 text-lg font-black">{title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{text}</p><button disabled={disabled} onClick={onClick} className="mt-4 rounded-2xl bg-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-800 disabled:opacity-50">{button}</button></div>;
}
function Count({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-white p-2 text-center ring-1 ring-slate-200"><div className="font-black">{value}</div><div className="text-[11px] font-bold text-slate-400">{label}</div></div>; }
