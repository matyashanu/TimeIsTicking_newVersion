"use client";

import { useEffect, useRef, useState } from 'react';
import 'flipclock/themes/flipclock';
import { useTheme } from './ThemeProvider';
import MotivationalQuoteRotator from '@/components/MotivationalQuoteRotator';

export default function FlipClockWidget() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [yearPct, setYearPct] = useState('0.0%');
  const [yearPctNum, setYearPctNum] = useState(0);
  const { theme } = useTheme();

  // Update date string and year percentage every second
  useEffect(() => {
    const update = () => {
      const now = new Date();

      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      const end = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);
      const pct = ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
      setYearPct(`${pct.toFixed(1)}%`);
      setYearPctNum(pct);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let clockInstance: { unmount?: () => void } | undefined;
    let cancelled = false;
    (async () => {
      const { FlipClock, Clock, theme } = await import('flipclock');
      if (cancelled || !containerRef.current) return;
      containerRef.current.innerHTML = '';
      const face = new Clock({ format: 'HH:mm:ss' });
      const clock = new FlipClock({
        autoStart: true,
        face,
        theme: theme(),
      });
      clock.mount(containerRef.current);
      clockInstance = clock;
    })();

    return () => {
      cancelled = true;
      clockInstance?.unmount?.();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  const progressWidth = `${Math.max(0, Math.min(100, yearPctNum))}%`;
  const darkTheme = theme === 'dark';
  const trackClass = darkTheme
    ? 'bg-gradient-to-r from-blue-950/70 via-blue-900/20 to-blue-950/70 border border-blue-400/20'
    : 'bg-gradient-to-r from-white/80 via-blue-100/40 to-white/80 border border-blue-500/20';
  const fillClass = darkTheme
    ? 'bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-200 shadow-[0_0_15px_rgba(79,195,247,0.45)]'
    : 'bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-300 shadow-[0_0_12px_rgba(37,99,235,0.4)]';

  return (
    <div className="flipclock-shell w-full flex flex-col items-center justify-center gap-4 py-6">
      <div className="digital-clock-container flex flex-col items-center gap-4 text-center">
        <div ref={containerRef} className="flipclock-instance flip-clock-wrapper" />
        <div className="digital-clock-motivation w-full">
          <MotivationalQuoteRotator />
        </div>
        <div className="year-progress text-sm uppercase tracking-[0.3em] opacity-80">
          {yearPct} of the year completed
        </div>
        <div className="w-full max-w-md px-6">
          <div className={`relative h-3 rounded-full overflow-hidden ${trackClass}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${fillClass}`}
              style={{ width: progressWidth }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border border-white/50 shadow-lg"
              style={{ left: `calc(${progressWidth} - 0.5rem)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
