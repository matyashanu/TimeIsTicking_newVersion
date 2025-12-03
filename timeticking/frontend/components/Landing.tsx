"use client";

import { useState } from 'react';
import AnalogClock from './AnalogClock';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Landing() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen bg-[color:var(--bg)] text-[color:var(--fg)] flex items-center justify-center px-4 py-10 overflow-hidden">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 rounded-full border border-[color:var(--border)]/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] bg-[color:var(--bg)]/80 text-[color:var(--fg)] shadow-lg"
      >
        {theme === 'dark' ? 'Bright Mode' : 'Dark Mode'}
      </button>
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-5 text-center relative z-10">
          <div className="w-48 h-48 rounded-full border border-[color:var(--border)]/40 bg-[color:var(--card-bg)]/40 flex items-center justify-center shadow-[0_25px_50px_rgba(0,0,0,0.4)]">
            <AnalogClock size={220} />
          </div>
          <div>
            <p className="text-sm font-medium tracking-[0.3em] uppercase opacity-80">Time Is Ticking</p>
            <h1 className="text-3xl font-semibold mt-2">Welcome back</h1>
            <p className="text-sm mt-1 opacity-80">Enter your details to continue planning your day.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--border)]/20 bg-[color:var(--card-bg)]/60 px-6 py-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex gap-3 mb-6">
            {(['login', 'signup'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => { setMode(key); setMessage(null); }}
                className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  mode === key
                    ? 'bg-[color:var(--fg)] text-[color:var(--bg)] border-transparent'
                    : 'border-[color:var(--border)]/40 text-[color:var(--fg)]'
                }`}
              >
                {key === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {mode === 'login' ? (
            <LoginForm
              onSuccess={(token) => {
                login(token);
              }}
              setMessage={setMessage}
            />
          ) : (
            <SignupForm setMessage={setMessage} />
          )}

          {message && <div className="mt-6 text-center text-sm text-red-300">{message}</div>}
        </div>

        <p className="text-center text-xs opacity-60">
          By continuing you agree to the Time Is Ticking Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function LoginForm({ onSuccess, setMessage }: { onSuccess: (token: string)=>void; setMessage: (m:string|null)=>void }) {
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifierError, setIdentifierError] = useState<string | null>(null);

  const submit = async (e: any) => {
    e.preventDefault();
    setMessage(null);
    try {
      if (!identifier.trim()) {
        setIdentifierError('Email or username is required');
        return;
      }
      setIdentifierError(null);

      const res = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      if (data.token) {
        onSuccess(data.token);
      }
    } catch (err: any) {
      setMessage(err.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-left text-sm font-semibold">
        <label className="block mb-1">Email or Username</label>
        <input
          required
          type="text"
          value={identifier}
          onChange={(e)=>setIdentifier(e.target.value)}
          className="w-full rounded-lg border border-[color:var(--border)]/40 bg-[color:var(--bg)]/40 px-4 py-2"
        />
        {identifierError && <div className="text-xs text-red-400 mt-1">{identifierError}</div>}
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Password</label>
        <div className="relative">
          <input
            required
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--border)]/40 bg-[color:var(--bg)]/40 px-4 py-2 pr-14"
          />
          <button
            type="button"
            className="absolute right-4 top-2 text-xs font-semibold text-[color:var(--fg)]/70"
            onClick={() => setShowPassword((s) => !s)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      <div className="text-center mt-6">
        <button type="submit" className="w-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 py-3 font-semibold text-white shadow-lg shadow-blue-500/30">
          Continue
        </button>
      </div>
    </form>
  );
}

function SignupForm({ setMessage }: { setMessage: (m:string|null)=>void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const submit = async (e: any) => {
    e.preventDefault();
    setMessage(null);
    if (username.length < 3) return setMessage('Username must be at least 3 characters');
    // email validation
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if (!emailOk) {
      setEmailError('Valid email required');
      return;
    }
    setEmailError(null);

    // password strength
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@%&#$*\.,;:\?])[A-Za-z\d!@%&#$*\.,;:\?]{8,}$/;
    if (!pwdRegex.test(password)) {
      setPasswordError('Password must be at least 8 chars, include upper, lower, digit and special char');
      return;
    }
    setPasswordError(null);

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      if (data.token) {
        login(data.token);
      }
    } catch (err: any) {
      setMessage(err.message || 'Signup failed');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-left text-sm font-semibold">
        <label className="block mb-1">Username</label>
        <input required value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full rounded-lg border border-[color:var(--border)]/40 bg-[color:var(--bg)]/40 px-4 py-2" />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Email</label>
        <input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-lg border border-[color:var(--border)]/40 bg-[color:var(--bg)]/40 px-4 py-2" />
        {emailError && <div className="text-xs text-red-400 mt-1">{emailError}</div>}
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Password</label>
        <div className="relative">
          <input required type={showPassword ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-lg border border-[color:var(--border)]/40 bg-[color:var(--bg)]/40 px-4 py-2 pr-14" />
          <button type="button" className="absolute right-4 top-2 text-xs font-semibold text-[color:var(--fg)]/70" onClick={() => setShowPassword((s) => !s)}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>
        {passwordError && <div className="text-xs text-red-400 mt-1">{passwordError}</div>}
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Confirm Password</label>
        <div className="relative">
          <input required type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-[color:var(--border)]/40 bg-[color:var(--bg)]/40 px-4 py-2 pr-14" />
          <button type="button" className="absolute right-4 top-2 text-xs font-semibold text-[color:var(--fg)]/70" onClick={() => setShowConfirm((s) => !s)}>{showConfirm ? 'Hide' : 'Show'}</button>
        </div>
      </div>
      <div className="text-center mt-6">
        <button type="submit" className="w-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 py-3 font-semibold text-white shadow-lg shadow-blue-500/30">Create Account</button>
      </div>
    </form>
  );
}
