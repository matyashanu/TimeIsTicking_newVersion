'use client';

import React, { FC } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { TransitionProvider } from './TransitionContext';
import TransitionOverlay from './TransitionOverlay';
import Navbar from './Navbar';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';

const Page: FC<{ title: string; description: string }> = ({ title, description }) => (
  <section style={{ padding: '2rem', maxWidth: '768px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{title}</h1>
    <p style={{ fontSize: '1rem', opacity: 0.85 }}>{description}</p>
  </section>
);

const App: FC = () => (
  <TransitionProvider>
    <BrowserRouter>
      <TransitionOverlay logoSrc="/assets/transition-logo.png" />
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={<Page title="Home" description="Dashboard overview of your Gotham-inspired planner." />}
        />
        <Route
          path="/planner"
          element={<Page title="Planner" description="Plan tasks and focus sessions with heroic precision." />}
        />
        <Route
          path="/settings"
          element={<Page title="Settings" description="Toggle bat-gadgets, themes, and personal preferences." />}
        />
        <Route
          path="/friends"
          element={<Page title="Friends" description="Coordinate missions with your trusted allies." />}
        />
      </Routes>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
        }}
      >
        <LoginButton />
        <LogoutButton />
      </div>
    </BrowserRouter>
  </TransitionProvider>
);

export default App;
