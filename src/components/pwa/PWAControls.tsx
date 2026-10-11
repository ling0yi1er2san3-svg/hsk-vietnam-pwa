import { Download, Laptop, Moon, RefreshCw, Smartphone, Sun, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getThemePreference, setThemePreference, type ThemePreference } from '../../services/preferencesService';

type DeferredPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

declare global {
  interface Window {
    __updateHSKSW?: (reloadPage?: boolean) => Promise<void>;
  }
}

export function ThemeControl({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemePreference>(() => getThemePreference());

  useEffect(() => {
    const handler = (event: Event) => setTheme((event as CustomEvent<ThemePreference>).detail ?? getThemePreference());
    window.addEventListener('hsk-theme-changed', handler);
    return () => window.removeEventListener('hsk-theme-changed', handler);
  }, []);

  const options: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
    { value: 'light', label: 'Sáng', icon: Sun },
    { value: 'dark', label: 'Tối', icon: Moon },
    { value: 'system', label: 'Hệ thống', icon: Laptop }
  ];

  return (
    <div className={`flex items-center rounded-xl border border-slate-200 bg-white p-1 ${compact ? 'gap-0' : 'gap-1'}`} aria-label="Chế độ hiển thị">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            title={option.label}
            aria-label={`Giao diện ${option.label}`}
            onClick={() => { setTheme(option.value); setThemePreference(option.value); }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition ${theme === option.value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Icon size={15} />{compact ? null : option.label}
          </button>
        );
      })}
    </div>
  );
}

export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [promptEvent, setPromptEvent] = useState<DeferredPrompt>();
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(standalone);

    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as DeferredPrompt);
    };
    const installedHandler = () => { setInstalled(true); setPromptEvent(undefined); };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  if (installed || !promptEvent) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await promptEvent.prompt();
        await promptEvent.userChoice;
        setPromptEvent(undefined);
      }}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-3 py-2 text-sm font-black text-white shadow-sm transition hover:bg-red-800"
    >
      <Download size={17} />{compact ? 'Cài' : 'Cài ứng dụng'}
    </button>
  );
}

export function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold ${online ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      {online ? <Wifi size={13} /> : <WifiOff size={13} />}{online ? 'Online' : 'Offline'}
    </span>
  );
}

export function PWAUpdateBanner() {
  const [updateReady, setUpdateReady] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    const onUpdate = () => setUpdateReady(true);
    const onOffline = () => {
      setOfflineReady(true);
      window.setTimeout(() => setOfflineReady(false), 5000);
    };
    window.addEventListener('pwa-update-ready', onUpdate);
    window.addEventListener('pwa-offline-ready', onOffline);
    return () => {
      window.removeEventListener('pwa-update-ready', onUpdate);
      window.removeEventListener('pwa-offline-ready', onOffline);
    };
  }, []);

  if (!updateReady && !offlineReady) return null;
  return (
    <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl lg:bottom-6">
      {updateReady ? (
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1"><div className="font-black">Có phiên bản mới</div><div className="text-xs text-slate-500">Cập nhật để dùng bản mới nhất.</div></div>
          <button type="button" onClick={() => void window.__updateHSKSW?.(true)} className="inline-flex items-center gap-1 rounded-xl bg-red-700 px-3 py-2 text-xs font-black text-white"><RefreshCw size={14} /> Cập nhật</button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-700"><Smartphone size={18} /> Ứng dụng đã sẵn sàng dùng offline.</div>
      )}
    </div>
  );
}
