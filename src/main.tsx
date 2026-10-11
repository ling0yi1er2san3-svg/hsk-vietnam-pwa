import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import { initializeTheme } from './services/preferencesService';

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
