"use client";

import { useEffect, useState } from "react";
import { useTheme } from '@/components/ThemeProvider';

export default function MotivationalQuoteRotator() {
  const quotes = [
    "Small steps every day add up.",
    "Discipline beats motivation.",
    "Your future self is watching.",
    "Progress, not perfection.",
    "Build the habit, then the freedom.",
    "Start where you are. Use what you have.",
    "Consistency compounds over time.",
    "Focus on what you can control.",
    "Done is better than perfect.",
    "Make today productive, not perfect.",
  ];

  const { theme } = useTheme();
  const textClass = theme === 'dark' ? 'text-blue-100/90' : 'text-slate-700';

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // fade out, then change text, then fade in
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % quotes.length);
        setVisible(true);
      }, 300);
    }, 3500); // 3.5 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full flex items-center justify-center mt-6">
      <div
        className={`max-w-3xl px-4 sm:px-6 text-center transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        <p className={`text-lg sm:text-xl quote-serif ${textClass}`}>
          {quotes[index]}
        </p>
      </div>
    </div>
  );
}
