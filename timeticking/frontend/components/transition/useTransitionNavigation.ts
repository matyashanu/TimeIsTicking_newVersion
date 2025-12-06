'use client';

import { NavigateOptions, To, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useTransition } from './TransitionContext';

type NavigationTarget = To;

export const useTransitionNavigation = () => {
  const navigate = useNavigate();
  const { runTransition } = useTransition();

  return useCallback(
    (path: NavigationTarget, options?: NavigateOptions) => {
      runTransition(() => navigate(path, options));
    },
    [navigate, runTransition],
  );
};
