'use client';

import React, { FC } from 'react';
import { useTransition } from './TransitionContext';
import './transition.css';

interface TransitionOverlayProps {
  logoSrc?: string;
  ariaLabel?: string;
}

const TransitionOverlay: FC<TransitionOverlayProps> = ({
  logoSrc = '/assets/transition-logo.png',
  ariaLabel = 'Batman-style transition',
}) => {
  const { isTransitionActive } = useTransition();

  return (
    <div
      className={`transition-overlay${isTransitionActive ? ' active' : ''}`}
      role="presentation"
      aria-hidden={!isTransitionActive}
    >
      <img className="transition-logo" src={logoSrc} alt={ariaLabel} />
    </div>
  );
};

export default TransitionOverlay;
