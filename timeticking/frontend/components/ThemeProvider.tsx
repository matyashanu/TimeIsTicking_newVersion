'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'dark' | 'light';

type TransitionState = {
  active: boolean;
  direction: 'ltr' | 'rtl';
  oldTheme: Theme;
  newTheme: Theme;
};

export type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  completeTransition: () => void;
  transition: TransitionState;
  mounted: boolean;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [transition, setTransition] = useState<TransitionState>({
    active: false,
    direction: 'ltr',
    oldTheme: 'dark',
    newTheme: 'light',
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!transition.active) {
      applyTheme(theme);
    }
  }, [theme, transition.active]);

  useEffect(() => {
    if (mounted) applyTheme(theme);
  }, [mounted]);

  const toggleTheme = () => {
    if (transition.active) return;
    const next = theme === 'dark' ? 'light' : 'dark';
    const direction: 'ltr' | 'rtl' = next === 'light' ? 'ltr' : 'rtl';
    setTransition({ active: true, direction, oldTheme: theme, newTheme: next });
  };

  const completeTransition = () => {
    setTheme(transition.newTheme);
    setTransition((prev) => ({
      ...prev,
      active: false,
      oldTheme: prev.newTheme,
    }));
  };

  const value = useMemo(
    () => ({ theme, toggleTheme, transition, completeTransition, mounted }),
    [theme, transition, mounted],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
