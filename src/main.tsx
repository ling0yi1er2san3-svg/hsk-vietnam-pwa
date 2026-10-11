import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import { initializeTheme } from './services/preferencesService';
import { ensureBundledVocabulary } from './services/bundledDataService';

initializeTheme();

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new Event('pwa-update-ready'));
  },
  onOfflineReady() {
    window.dispatchEvent(new Event('pwa-offline-ready'));
  }
});
window.__updateHSKSW = updateSW;

async function bootstrap() {
  try {
    await ensureBundledVocabulary();
  } catch (error) {
    console.error('Không thể nạp dữ liệu HSK tích hợp:', error);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void bootstrap();
