'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
      // Check if user has manually set a theme preference
      const isManualTheme = localStorage.getItem('theme-manual') === 'true';
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      
      let initialTheme: Theme = 'light';
      
      // If user has manually set theme, always use saved theme (ignore system preference)
      if (isManualTheme && savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        initialTheme = savedTheme;
      } else if (!isManualTheme) {
        // Only use system preference if user hasn't manually set theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        initialTheme = prefersDark ? 'dark' : 'light';
        // Save system preference to localStorage (but don't mark as manual)
        localStorage.setItem('theme', initialTheme);
      } else {
        // Fallback to saved theme if exists
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          initialTheme = savedTheme;
        }
      }
      
      setThemeState(initialTheme);
      
      // Apply theme immediately before React renders
      const root = document.documentElement;
      if (initialTheme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
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
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
      
      // Save to localStorage (only if already marked as manual, don't override)
      // This effect runs when theme changes, but we don't want to mark as manual here
      // because it might be from system preference sync
      if (localStorage.getItem('theme-manual') === 'true') {
        localStorage.setItem('theme', theme);
      }
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
          root.classList.add('dark');
          root.style.colorScheme = 'dark';
        } else {
          root.classList.remove('dark');
          root.style.colorScheme = 'light';
        }
        // Mark as manually set and save theme
        localStorage.setItem('theme', newTheme);
        localStorage.setItem('theme-manual', 'true');
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
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
      // Mark as manually set and save theme
      localStorage.setItem('theme', newTheme);
      localStorage.setItem('theme-manual', 'true');
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
