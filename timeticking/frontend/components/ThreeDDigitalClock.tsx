'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from './ThemeProvider';

const zfill = (num: number | string) => num.toString().padStart(2, '0');

export default function ThreeDDigitalClock() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const colors = useMemo(
    () => ({
      bg: theme === 'dark' ? '#2F4156' : '#fff0db',
      accent: theme === 'dark' ? '#fff0db' : '#2F4156',
      border: theme === 'dark' ? '#fff0db66' : '#2F415666',
    }),
    [theme],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = containerRef.current;
    if (!root) return;

    const getEl = (key: string) => root.querySelector<HTMLElement>(`[data-clock="${key}"]`);

    const nextMap = {
      hour: getEl('hour-next'),
      minute: getEl('minute-next'),
      second: getEl('second-next'),
    } as const;

    const bottomMap = {
      hour: getEl('hour-bottom'),
      minute: getEl('minute-bottom'),
      second: getEl('second-bottom'),
    } as const;

    const panelMap = {
      hour: getEl('hour-panel'),
      minute: getEl('minute-panel'),
      second: getEl('second-panel'),
    } as const;

    if (
      Object.values(nextMap).some((el) => !el) ||
      Object.values(bottomMap).some((el) => !el) ||
      Object.values(panelMap).some((el) => !el)
    ) {
      return undefined;
    }

    const date = new Date();
    const time = {
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
    };

    const setInitial = () => {
      const hourValue = time.hour > 12 ? time.hour - 12 : time.hour || 12;
      nextMap.hour!.innerText = zfill(hourValue);
      bottomMap.hour!.innerText = zfill(hourValue);
      nextMap.minute!.innerText = zfill(time.minute);
      bottomMap.minute!.innerText = zfill(time.minute);
      nextMap.second!.innerText = zfill(time.second);
      bottomMap.second!.innerText = zfill(time.second);
    };

    const flip = (target: keyof typeof time, newVal: string) => {
      const nextEl = nextMap[target]!;
      const bottomEl = bottomMap[target]!;
      const panelEl = panelMap[target]!;

      nextEl.textContent = newVal;
      const prevVal = bottomEl.textContent || '00';
      panelEl.innerHTML = `
        <div class="parts parts-front">${prevVal}</div>
        <div class="parts parts-back">${newVal}</div>
      `;
      panelEl.classList.add('flip');
      const timeout = window.setTimeout(() => {
        panelEl.classList.remove('flip');
        bottomEl.textContent = newVal;
        panelEl.innerHTML = '';
      }, 600);
      return timeout;
    };

    setInitial();

    const interval = window.setInterval(() => {
      const clears: number[] = [];
      time.second += 1;
      if (time.second > 59) {
        time.second = 0;
        time.minute += 1;
        const nextMinute = zfill(time.minute <= 59 ? time.minute : 0);
        clears.push(flip('minute', nextMinute));
      }
      if (time.minute > 59) {
        time.minute = 0;
        time.hour += 1;
        const hr = time.hour > 12 ? time.hour - 12 : time.hour || 12;
        clears.push(flip('hour', zfill(hr)));
      }
      if (time.hour > 12) {
        time.hour = 1;
      }
      clears.push(flip('second', zfill(time.second)));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [mounted, colors]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="three-d-clock"
      style={{
        ['--clock-bg' as string]: colors.bg,
        ['--clock-fg' as string]: colors.accent,
        ['--clock-border' as string]: colors.border,
      }}
    >
      <div className="clock-container">
        {['hour', 'minute', 'second'].map((key) => (
          <div className="clock-section" key={key}>
            <div className="parts parts-next" data-clock={`${key}-next`}>
              00
            </div>
            <div className="panel" data-clock={`${key}-panel`} />
            <div className="parts parts-bottom" data-clock={`${key}-bottom`}>
              00
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
