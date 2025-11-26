'use client';

import { useEffect, useRef, useState } from 'react';
import 'flipclock/themes/flipclock';

export default function FlipClockWidget() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dateStr, setDateStr] = useState('');
  const [yearPct, setYearPct] = useState('0.0%');
  const [yearPctNum, setYearPctNum] = useState(0);

  // Update date string and year percentage every second
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      );

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

  return (
    <div className="flipclock-shell w-full flex items-center justify-center py-6">
      <div className="digital-clock-container">
        <div ref={containerRef} className="flipclock-instance" />
        <div className="digital-clock-meta text-center">
          <div className="digital-clock-date">{dateStr}</div>
            <div className="w-full px-3">
              <div className="h-3 rounded-full bg-slate-200 dark:bg-blue-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, yearPctNum))}%` }}
                />
              </div>
            </div>
            <div className="year-progress">{yearPct} of the year completed</div>
        </div>
      </div>
    </div>
  );
}
