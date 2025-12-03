"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const search = useSearchParams();
  const token = search.get('token');
  const [status, setStatus] = useState<'idle'|'verifying'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    (async () => {
      setStatus('verifying');
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Verification failed');
        if (!mounted) return;
        setStatus('success');
        setMessage('Email verified. You may now log in.');
      } catch (e: any) {
        setStatus('error');
        setMessage(e.message || 'Verification failed');
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl w-full p-8 rounded-2xl">
        <h1 className="text-xl font-semibold">Email Verification</h1>
        <p className="mt-4">{status === 'verifying' ? 'Verifying…' : message}</p>
        {status === 'success' && (
          <div className="mt-6">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => router.push('/')}>Go to Login</button>
          </div>
        )}
      </div>
    </div>
  );
}
