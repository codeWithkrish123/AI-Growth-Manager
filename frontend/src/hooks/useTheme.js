import { useState, useEffect } from 'react';
import { isDarkMode, subscribeToThemeChanges, toggleTheme } from '../utils/theme';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => isDarkMode());

  useEffect(() => {
    return subscribeToThemeChanges((isDark) => setIsDark(isDark));
  }, []);

  return {
    isDark,
    toggleDark: () => {
      const newDark = toggleTheme();
      setIsDark(newDark);
    }
  };
}
