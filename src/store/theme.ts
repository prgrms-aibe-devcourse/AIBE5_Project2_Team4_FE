export type AppTheme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'app-theme';
export const THEME_EVENT = 'app-theme-change';

function resolveDocumentTheme(): AppTheme {
  if (typeof document === 'undefined') {
    return 'dark';
  }

  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function dispatchThemeEvent(theme: AppTheme) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent<AppTheme>(THEME_EVENT, { detail: theme }));
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function getTheme(): AppTheme {
  if (typeof window === 'undefined') {
    return resolveDocumentTheme();
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return resolveDocumentTheme();
}

export function setTheme(theme: AppTheme) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  applyTheme(theme);
  dispatchThemeEvent(theme);
}

export function toggleTheme() {
  const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
  return nextTheme;
}

export function initTheme() {
  applyTheme(getTheme());
}
