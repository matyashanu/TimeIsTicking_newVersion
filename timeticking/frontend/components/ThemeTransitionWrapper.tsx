'use client';

import { useEffect, useMemo, useState } from 'react';
import { ThemeContext, useTheme } from './ThemeProvider';

export default function ThemeTransitionWrapper({ children }: { children: React.ReactNode }) {
  const { theme, transition, toggleTheme, completeTransition, mounted } = useTheme();
  const [domReady, setDomReady] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => setDomReady(true), []);

  useEffect(() => {
    if (transition.active) {
      setAnimate(false);
      requestAnimationFrame(() => setAnimate(true));
    } else {
      setAnimate(false);
    }
  }, [transition.active]);

  const directionClass = useMemo(() => {
    if (!transition.active || !animate) return '';
    return transition.direction === 'ltr' ? 'transition-left-to-right' : 'transition-right-to-left';
  }, [transition.active, transition.direction, animate]);

  if (!transition.active || !domReady || !mounted) {
    return (
      <div data-theme={theme}>
        <ThemeContext.Provider value={{ theme, toggleTheme, transition, completeTransition, mounted }}>
          {children}
        </ThemeContext.Provider>
      </div>
    );
  }

  return (
    <div className="theme-transition-shell" aria-live="polite">
      <div className="theme-transition-new-layer" data-theme={transition.newTheme}>
        <ThemeContext.Provider
          value={{ theme: transition.newTheme, toggleTheme, transition, completeTransition, mounted }}
        >
          <div className="theme-layer-content">{children}</div>
        </ThemeContext.Provider>
      </div>
      <div
        className={`theme-transition-old-layer ${directionClass}`}
        data-theme={transition.oldTheme}
        onTransitionEnd={(e) => {
          if (e.propertyName !== 'clip-path') return;
          completeTransition();
        }}
      >
        <ThemeContext.Provider
          value={{ theme: transition.oldTheme, toggleTheme, transition, completeTransition, mounted }}
        >
          <div className="theme-layer-content" aria-hidden>
            {children}
          </div>
        </ThemeContext.Provider>
      </div>
    </div>
  );
}
