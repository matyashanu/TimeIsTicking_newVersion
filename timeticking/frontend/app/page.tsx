'use client';

import AnalogClock from '@/components/AnalogClock';
import FlipClockWidget from '@/components/FlipClockWidget';
import useClock from '@/lib/useClock';
import { useTheme } from '@/components/ThemeProvider';
import MotivationalQuoteRotator from '@/components/MotivationalQuoteRotator';
import { useAuth } from '@/components/AuthProvider';

export default function HomePage() {
  const { formattedDate } = useClock();
  const { theme } = useTheme();
  const { user } = useAuth();
  const username = user?.username || 'there';

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-8 text-center -mt-10 lg:-mt-16">
      <div className="mt-2 text-center text-[color:var(--fg)]">
        <div className="text-2xl sm:text-3xl font-semibold tracking-[0.2em] uppercase">
          {`Hello ${username}`}
        </div>
      </div>
      <AnalogClock />
      <FlipClockWidget />
      <MotivationalQuoteRotator />
    </section>
  );
}
