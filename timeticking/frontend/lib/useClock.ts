import { useEffect, useState } from 'react';

function pad(unit: number) {
  return unit.toString().padStart(2, '0');
}

export default function useClock() {
  const [now, setNow] = useState<Date>(new Date(0));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const interval = setInterval(() => {
      setNow(new Date());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const formattedTime = `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
  const formattedDate = hydrated
    ? now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Friday, November 21, 2025';

  return {
    now,
    hours,
    minutes,
    seconds,
    formattedTime,
    formattedDate,
  };
}
