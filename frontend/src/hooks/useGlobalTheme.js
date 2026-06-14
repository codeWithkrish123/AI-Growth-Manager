import { useState, useEffect } from 'react';

export function useGlobalTheme() {
  const [isDark, setIsDark] = useState(() => 
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark');
      setIsDark(dark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const toggleDark = () => {
    const isDarkNow = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !isDarkNow);
    localStorage.setItem('theme', !isDarkNow ? 'dark' : 'light');
    setIsDark(!isDarkNow);
  };

  return { isDark, toggleDark };
}
