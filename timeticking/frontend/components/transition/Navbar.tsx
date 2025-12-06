'use client';

import React, { FC } from 'react';
import { useTransitionNavigation } from './useTransitionNavigation';

const routes = [
  { label: 'Home', path: '/' },
  { label: 'Planner', path: '/planner' },
  { label: 'Settings', path: '/settings' },
  { label: 'Friends', path: '/friends' },
];

const Navbar: FC = () => {
  const navigateWithTransition = useTransitionNavigation();

  return (
    <nav
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem',
        background: '#111',
        color: '#fff',
        justifyContent: 'center',
      }}
    >
      {routes.map((route) => (
        <button
          key={route.path}
          onClick={() => navigateWithTransition(route.path)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#fff',
            padding: '0.35rem 0.75rem',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {route.label}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;
