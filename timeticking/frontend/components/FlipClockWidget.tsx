'use client';

import { useEffect, useRef } from 'react';
import 'flipclock/themes/flipclock';

export default function FlipClockWidget() {
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      <div ref={containerRef} className="flipclock-instance flip-clock-wrapper" />
    </div>
  );
}
