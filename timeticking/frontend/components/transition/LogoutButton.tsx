'use client';

import React, { FC } from 'react';
import { useTransition } from './TransitionContext';

const fakeLogout = () =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      // Replace with your real logout logic / API call.
      resolve();
    }, 350);
  });

const LogoutButton: FC = () => {
  const { runTransition } = useTransition();

  const handleLogout = () => {
    runTransition(async () => {
      await fakeLogout();
      console.info('Logged out (replace with your own handling)');
    });
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        border: 'none',
        background: '#ef4444',
        color: '#fff',
        cursor: 'pointer',
      }}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
