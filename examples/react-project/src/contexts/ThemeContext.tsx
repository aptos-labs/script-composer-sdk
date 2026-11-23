import { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
  } else {
    root.setAttribute('data-theme', 'light');
    root.classList.remove('dark');
  }
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  try {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch (error) {
    console.error('Error initializing theme:', error);
    return 'light';
  }
}

const subscribe = () => () => {};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const storedTheme = useSyncExternalStore(subscribe, getInitialTheme, () => 'light' as Theme);
  const [themeOverride, setThemeState] = useState<Theme | null>(null);
  const theme = themeOverride ?? storedTheme;

  useEffect(() => {
    if (!mounted) return;

    try {
      applyTheme(theme);
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    try {
      applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
