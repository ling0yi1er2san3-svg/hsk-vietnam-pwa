import { Database, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { ImportExcel } from '../components/ImportExcel';
import { DatabasePreview } from '../components/DatabasePreview';

export function ImportPage() {
  return (
    <section className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-red-700">
          <FileSpreadsheet size={17} /> Nhập dữ liệu
        </div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Excel → IndexedDB</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">App đã có sẵn dữ liệu HSK1–HSK6. Trang này chỉ dùng khi bạn muốn cập nhật/thay dữ liệu từ một file Excel mới; yêu thích, tiến độ và lịch sử quiz vẫn được giữ nguyên.</p>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <Database size={18} className="text-red-700" />
        Từ vựng HSK được tích hợp sẵn trong app và tự nạp ở lần mở đầu tiên. Dữ liệu học cá nhân được lưu cục bộ bằng IndexedDB và có thể dùng offline.
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        <ShieldCheck size={19} className="mt-0.5 shrink-0" />
        <div><strong>Dữ liệu bổ sung Phase 6:</strong> Hán-Việt, phồn thể, bộ thủ và cấu tạo chữ được lưu ở bảng metadata riêng. Muốn import bộ metadata lớn hơn, vào tab <strong>Phân biệt</strong> → <strong>Import JSON</strong>.</div>
      </div>
      <ImportExcel />
      <DatabasePreview />
    </section>
  );
}
