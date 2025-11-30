'use client';

import { useEffect, useMemo, useState } from 'react';
import { getThemeCssVariables, useTheme } from './ThemeProvider';

export default function ThemeTransitionWrapper({ children }: { children: React.ReactNode }) {
  const { theme, transition, completeTransition, mounted } = useTheme();
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

  const baseLayerStyle = useMemo(() => getThemeCssVariables(theme), [theme]);
  const shouldShowOverlay = transition.active && domReady && mounted;

  return (
    <>
      <div data-theme={theme} className="theme-layer-content" style={baseLayerStyle}>
        {children}
      </div>
      {shouldShowOverlay ? (
        <div className="theme-transition-shell" aria-live="polite">
          <div
            className="theme-transition-new-layer"
            data-theme={transition.newTheme}
            style={getThemeCssVariables(transition.newTheme)}
          >
            <div className="theme-layer-content">{children}</div>
          </div>
          <div
            className={`theme-transition-old-layer ${directionClass}`}
            data-theme={transition.oldTheme}
            style={getThemeCssVariables(transition.oldTheme)}
            onTransitionEnd={(e) => {
              if (e.propertyName !== 'clip-path') return;
              completeTransition();
            }}
          >
            <div className="theme-layer-content" aria-hidden>
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
