"use client";

import { useState } from 'react';
import AnalogClock from './AnalogClock';
import FlipClockWidget from './FlipClockWidget';
import { useAuth } from './AuthProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Landing() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'none'>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full p-8 rounded-2xl backdrop-blur-md" style={{background: 'transparent'}}>
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center">
            <AnalogClock />
            <FlipClockWidget />
          </div>

          <h2 className="text-lg font-semibold">Welcome to Time Is Ticking. Please log in or sign up to start tracking your goals.</h2>

          <div className="w-full max-w-md">
            <div className="flex gap-3 justify-center mb-4">
              <button className={`px-4 py-2 rounded-full ${mode === 'login' ? 'bg-blue-500 text-white' : 'bg-transparent border'}`} onClick={() => { setMode('login'); setMessage(null); }}>Log In</button>
              <button className={`px-4 py-2 rounded-full ${mode === 'signup' ? 'bg-blue-500 text-white' : 'bg-transparent border'}`} onClick={() => { setMode('signup'); setMessage(null); }}>Sign Up</button>
            </div>

            {mode === 'login' && (
              <LoginForm onSuccess={(token) => { login(token); }} setLoading={setLoading} setMessage={setMessage} />
            )}

            {mode === 'signup' && (
              <SignupForm setLoading={setLoading} setMessage={setMessage} />
            )}

            {message && <div className="mt-4 text-center text-sm">{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSuccess, setLoading, setMessage }: { onSuccess: (token: string)=>void; setLoading: (v:boolean)=>void; setMessage: (m:string|null)=>void }) {
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifierError, setIdentifierError] = useState<string | null>(null);

  const submit = async (e: any) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      if (!identifier.trim()) {
        setIdentifierError('Email or username is required');
        setLoading(false);
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
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3 bg-transparent p-4 rounded">
      <div>
        <label className="block text-sm">Email or Username</label>
        <input required type="text" value={identifier} onChange={(e)=>setIdentifier(e.target.value)} className="w-full px-3 py-2 rounded" />
        {identifierError && <div className="text-xs text-red-400 mt-1">{identifierError}</div>}
      </div>
      <div>
        <label className="block text-sm">Password</label>
        <div className="relative">
          <input required type={showPassword ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full px-3 py-2 rounded" />
          <button type="button" className="absolute right-2 top-2 text-sm text-blue-400" onClick={() => setShowPassword((s) => !s)}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>
      </div>
      <div className="text-center">
        <button type="submit" className="px-6 py-2 rounded bg-blue-600 text-white">Log In</button>
      </div>
    </form>
  );
}

function SignupForm({ setLoading, setMessage }: { setLoading: (v:boolean)=>void; setMessage: (m:string|null)=>void }) {
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
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      if (data.token) {
        login(data.token);
      }
    } catch (err: any) {
      setMessage(err.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3 bg-transparent p-4 rounded">
      <div>
        <label className="block text-sm">Username</label>
        <input required value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full px-3 py-2 rounded" />
      </div>
      <div>
        <label className="block text-sm">Email</label>
        <input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full px-3 py-2 rounded" />
        {emailError && <div className="text-xs text-red-400 mt-1">{emailError}</div>}
      </div>
      <div>
        <label className="block text-sm">Password</label>
        <div className="relative">
          <input required type={showPassword ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full px-3 py-2 rounded" />
          <button type="button" className="absolute right-2 top-2 text-sm text-blue-400" onClick={() => setShowPassword((s) => !s)}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>
        {passwordError && <div className="text-xs text-red-400 mt-1">{passwordError}</div>}
      </div>
      <div>
        <label className="block text-sm">Confirm Password</label>
        <div className="relative">
          <input required type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="w-full px-3 py-2 rounded" />
          <button type="button" className="absolute right-2 top-2 text-sm text-blue-400" onClick={() => setShowConfirm((s) => !s)}>{showConfirm ? 'Hide' : 'Show'}</button>
        </div>
      </div>
      <div className="text-center">
        <button type="submit" className="px-6 py-2 rounded bg-blue-600 text-white">Sign Up</button>
      </div>
    </form>
  );
}
