'use client';

import { useEffect, useMemo, useState } from 'react';
import { ThemeContext, getThemeCssVariables, type Theme, useTheme } from './ThemeProvider';
import { AuthProvider, useAuth } from './AuthProvider';
import Landing from './Landing';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Landing />;
  return <>{children}</>;
}

export default function ThemeTransitionWrapper({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme, transition, completeTransition, mounted } = useTheme();
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

  const renderContent = (overrideTheme?: Theme) => (
    <ThemeContext.Provider
      value={{
        theme: overrideTheme ?? theme,
        toggleTheme,
        transition,
        completeTransition,
        mounted,
      }}
    >
      <AuthProvider>
        <AuthGate>{children}</AuthGate>
      </AuthProvider>
    </ThemeContext.Provider>
  );

  return (
    <>
      <div data-theme={theme} className="theme-layer-content" style={baseLayerStyle}>
        {renderContent()}
      </div>
      {shouldShowOverlay ? (
        <div className="theme-transition-shell" aria-live="polite">
          <div
            className="theme-transition-new-layer"
            data-theme={transition.newTheme}
            style={getThemeCssVariables(transition.newTheme)}
          >
            <div className="theme-layer-content">{renderContent(transition.newTheme)}</div>
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
              {renderContent(transition.oldTheme)}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
