'use client';

import AnalogClock from '@/components/AnalogClock';
import FlipClockWidget from '@/components/FlipClockWidget';
import useClock from '@/lib/useClock';
import { useTheme } from '@/components/ThemeProvider';
import MotivationalQuoteRotator from '@/components/MotivationalQuoteRotator';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function HomePage() {
  const { formattedDate } = useClock();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const { user } = useAuth();
  const username = user?.username || 'there';

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-8 text-center">
      <div className="mt-2 text-center">
        <div className={`text-2xl sm:text-3xl font-bold tracking-wide greeting-accent ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
          {`Hello ${username}`}
        </div>
      </div>
      <AnalogClock />
      <FlipClockWidget />
      <MotivationalQuoteRotator />
    </section>
  );
}
