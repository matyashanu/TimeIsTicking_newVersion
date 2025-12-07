'use client';

import React, { FC } from 'react';
import { useTransition } from './TransitionContext';

const fakeLogin = () =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      // Replace with your real login logic / API call.
      resolve();
    }, 400);
  });

const LoginButton: FC = () => {
  const { runTransition } = useTransition();

  const handleLogin = () => {
    runTransition(async () => {
      await fakeLogin();
      console.info('Logged in (replace with your own handling)');
    });
  };

  return (
    <button
      onClick={handleLogin}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        border: 'none',
        background: '#10b981',
        color: '#fff',
        cursor: 'pointer',
      }}
    >
      Login
    </button>
  );
};

export default LoginButton;
