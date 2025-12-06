'use client';

import React, {
  FC,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type TransitionCallback = () => void | Promise<void>;

interface TransitionContextValue {
  isTransitionActive: boolean;
  runTransition: (callback: TransitionCallback) => void;
  duration: number;
}

interface TransitionProviderProps {
  children: ReactNode;
  soundSrc?: string;
  duration?: number;
  volume?: number;
}

const TransitionContext = createContext<TransitionContextValue | undefined>(undefined);

export const TransitionProvider: FC<TransitionProviderProps> = ({
  children,
  soundSrc = '/assets/bat-transition.mp3',
  duration = 700,
  volume = 1,
}) => {
  const [isTransitionActive, setIsTransitionActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const audio = new Audio(soundSrc);
    audio.preload = 'auto';
    audio.volume = Math.min(Math.max(volume, 0), 1);
    audio.load();
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [soundSrc, volume]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const runTransition = useCallback(
    (callback: TransitionCallback) => {
      if (isTransitionActive) {
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsTransitionActive(true);

      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        void audio.play().catch(() => {
          // Ignore autoplay restrictions; the overlay still runs without sound.
        });
      }

      timeoutRef.current = setTimeout(() => {
        setIsTransitionActive(false);
        Promise.resolve(callback()).catch((error) => {
          console.error('Transition callback failed:', error);
        });
      }, duration);
    },
    [duration, isTransitionActive],
  );

  const value = useMemo(
    () => ({
      isTransitionActive,
      runTransition,
      duration,
    }),
    [isTransitionActive, runTransition, duration],
  );

  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
};

export const useTransition = (): TransitionContextValue => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
};
