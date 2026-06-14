// Global theme management
const listeners = new Set();

export function initTheme() {
  const saved = localStorage.getItem('theme');
  const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  applyTheme(isDark);
  return isDark;
}

export function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  notifyListeners(isDark);
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(!isDark);
  return !isDark;
}

export function isDarkMode() {
  return document.documentElement.classList.contains('dark');
}

export function subscribeToThemeChanges(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners(isDark) {
  listeners.forEach(callback => callback(isDark));
}
