export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_KEY = 'hsk-vn-theme';

export function getThemePreference(): ThemePreference {
  const value = localStorage.getItem(THEME_KEY);
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function setThemePreference(theme: ThemePreference) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent('hsk-theme-changed', { detail: theme }));
}

export function applyTheme(theme = getThemePreference()) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = dark ? '#020617' : '#b91c1c';
}

export function initializeTheme() {
  applyTheme();
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (getThemePreference() === 'system') applyTheme('system');
  };
  media.addEventListener?.('change', onChange);
}
