import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      // Check localStorage first
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      
      // If no saved theme, check system preference
      let initialTheme: Theme = 'light';
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        initialTheme = savedTheme;
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        initialTheme = prefersDark ? 'dark' : 'light';
      }
      
      setThemeState(initialTheme);
      
      // Apply theme immediately before React renders
      const root = document.documentElement;
      if (initialTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark');
      } else {
        root.setAttribute('data-theme', 'light');
        root.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error initializing theme:', error);
    } finally {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    try {
      // Apply theme to document root immediately
      const root = document.documentElement;
      if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark');
      } else {
        root.setAttribute('data-theme', 'light');
        root.classList.remove('dark');
      }
      
      // Save to localStorage
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      // Apply immediately for better UX
      try {
        const root = document.documentElement;
        if (newTheme === 'dark') {
          root.setAttribute('data-theme', 'dark');
          root.classList.add('dark');
        } else {
          root.setAttribute('data-theme', 'light');
          root.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
      } catch (error) {
        console.error('Error toggling theme:', error);
      }
      return newTheme;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Apply immediately
    try {
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark');
      } else {
        root.setAttribute('data-theme', 'light');
        root.classList.remove('dark');
      }
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
