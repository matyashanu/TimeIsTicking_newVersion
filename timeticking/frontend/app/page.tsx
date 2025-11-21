'use client';

import AnalogClock from '@/components/AnalogClock';
import FlipClockWidget from '@/components/FlipClockWidget';
import useClock from '@/lib/useClock';
import { useTheme } from '@/components/ThemeProvider';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { formattedDate } = useClock();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const textClass = theme === 'dark' ? 'text-beige' : 'text-navy';

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-10 text-center">
      <AnalogClock />
      <FlipClockWidget />
      <div className={`text-lg font-medium sm:text-xl ${textClass}`}>{formattedDate}</div>
    </section>
  );
}
