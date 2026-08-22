import { useEffect, useState } from 'react';
import { ThemeContext } from './theme-context';

export function ThemeProvider({ children }) {
  // On first load: use saved preference if it exists, otherwise
  // auto-detect from the OS. After that, it's a manual light/dark
  // toggle only — no visible "system" button.
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = (value) => {
    setThemeState(value);
    localStorage.setItem('theme', value);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}