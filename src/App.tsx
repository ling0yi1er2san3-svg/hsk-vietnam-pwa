import { BarChart3, BookOpen, Brain, DatabaseBackup, FileSpreadsheet, GitCompareArrows, Heart, Languages, Menu, Target, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { VocabularyPage } from './pages/VocabularyPage';
import { ImportPage } from './pages/ImportPage';
import { ComparePage } from './pages/ComparePage';
import { MindMapPage } from './pages/MindMapPage';
import { QuizPage } from './pages/QuizPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ProgressPage } from './pages/ProgressPage';
import { BackupPage } from './pages/BackupPage';
import { ensureStarterCharacters } from './services/enrichmentService';
import { InstallAppButton, NetworkStatus, PWAUpdateBanner, ThemeControl } from './components/pwa/PWAControls';

type TabId = 'vocabulary' | 'compare' | 'mindmap' | 'quiz' | 'favorites' | 'progress' | 'backup' | 'import';

const navigation = [
  { id: 'vocabulary' as const, label: 'Từ vựng', icon: BookOpen },
  { id: 'compare' as const, label: 'Phân biệt', icon: GitCompareArrows },
  { id: 'mindmap' as const, label: 'Mind Map', icon: Brain },
  { id: 'quiz' as const, label: 'Ôn tập', icon: Target },
  { id: 'favorites' as const, label: 'Yêu thích', icon: Heart },
  { id: 'progress' as const, label: 'Tiến độ', icon: BarChart3 },
  { id: 'backup' as const, label: 'Sao lưu', icon: DatabaseBackup },
  { id: 'import' as const, label: 'Nhập Excel', icon: FileSpreadsheet }
];

export default function App() {
  useEffect(() => { void ensureStarterCharacters(); }, []);

  const [tab, setTab] = useState<TabId>(() => {
    const candidate = new URLSearchParams(window.location.search).get('tab');
    return navigation.some((item) => item.id === candidate) ? candidate as TabId : 'vocabulary';
  });
  const [menuOpen, setMenuOpen] = useState(false);

  function navigate(next: TabId) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    window.history.replaceState({}, '', url);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app-shell min-h-screen bg-[#f8fafc] text-slate-900">
      <header className="mobile-header sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between gap-2 px-4 pt-[env(safe-area-inset-top)]">
          <button type="button" onClick={() => setMenuOpen(true)} className="rounded-xl p-2 hover:bg-slate-100" aria-label="Mở menu"><Menu /></button>
          <div className="flex min-w-0 items-center gap-2 font-black"><Languages className="shrink-0 text-red-700" size={22} /><span className="truncate">HSK Việt Nam</span></div>
          <div className="flex items-center gap-1">
            <ThemeControl compact />
            <button type="button" onClick={() => navigate('import')} className="rounded-xl p-2 text-red-700 hover:bg-red-50" aria-label="Nhập Excel"><FileSpreadsheet /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
          <Brand />
          <nav className="mt-8 space-y-1.5">
            {navigation.map((item) => <NavButton key={item.id} active={tab === item.id} item={item} onClick={() => navigate(item.id)} />)}
          </nav>

          <div className="absolute bottom-5 left-4 right-4 space-y-3">
            <div className="flex items-center justify-between"><NetworkStatus /><InstallAppButton compact /></div>
            <ThemeControl />
            <div className="rounded-2xl bg-orange-50 p-4 text-xs leading-5 text-slate-600 ring-1 ring-orange-100">
              <div className="font-black text-orange-800">Phase 13</div>
              Production · backup/restore · deploy miễn phí.
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {tab === 'vocabulary' && <VocabularyPage />}
          {tab === 'import' && <ImportPage />}
          {tab === 'compare' && <ComparePage />}
          {tab === 'mindmap' && <MindMapPage />}
          {tab === 'quiz' && <QuizPage />}
          {tab === 'favorites' && <FavoritesPage />}
          {tab === 'progress' && <ProgressPage />}
          {tab === 'backup' && <BackupPage />}
        </main>
      </div>

      <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white px-1 pb-[calc(.375rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] lg:hidden">
        {navigation.slice(0, 4).map((item) => <BottomNavButton key={item.id} active={tab === item.id} item={item} onClick={() => navigate(item.id)} />)}
        <BottomNavButton active={tab === 'progress'} item={navigation[5]} onClick={() => navigate('progress')} />
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden" onMouseDown={() => setMenuOpen(false)}>
          <aside className="drawer-panel h-full w-[86%] max-w-sm overflow-y-auto bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between"><Brand /><button type="button" onClick={() => setMenuOpen(false)} className="rounded-xl p-2 hover:bg-slate-100" aria-label="Đóng menu"><X /></button></div>
            <nav className="mt-8 space-y-1.5">{navigation.map((item) => <NavButton key={item.id} active={tab === item.id} item={item} onClick={() => navigate(item.id)} />)}</nav>
            <div className="mt-8 space-y-3 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between"><NetworkStatus /><InstallAppButton /></div>
              <ThemeControl />
              <p className="text-xs leading-5 text-slate-500">Khi đã mở app một lần và dữ liệu HSK đã được import, các màn hình chính tiếp tục hoạt động khi mất Internet.</p>
            </div>
          </aside>
        </div>
      )}

      <PWAUpdateBanner />
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-red-700 p-2.5 text-white"><Languages size={24} /></div>
      <div><div className="font-black leading-5">HSK Việt Nam</div><div className="text-xs font-semibold text-slate-400">Chinese Vocabulary PWA</div></div>
    </div>
  );
}

function NavButton({ item, active, onClick }: { item: typeof navigation[number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition ${active ? 'bg-red-700 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}><Icon size={19} />{item.label}</button>;
}

function BottomNavButton({ item, active, onClick }: { item: typeof navigation[number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <button type="button" onClick={onClick} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold ${active ? 'text-red-700' : 'text-slate-500'}`}><Icon size={20} strokeWidth={active ? 2.6 : 2} />{item.label}</button>;
}
