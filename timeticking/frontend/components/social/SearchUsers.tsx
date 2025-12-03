"use client";
import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';

function AvatarSmall({ name }: { name?: string }) {
  const initials = (name || '').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center font-semibold">
      {initials}
    </div>
  );
}

export default function SearchUsers({ currentUserId, onSent }: { currentUserId?: string; onSent?: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/socials/search?q=${encodeURIComponent(q)}`, { headers: { 'x-user-id': currentUserId || '' } });
    const data = await res.json();
    setResults(data.users || []);
    setLoading(false);
  }

  async function sendRequest(to: string) {
    await fetch('/api/socials/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': currentUserId || '' },
      body: JSON.stringify({ to }),
    });
    if (onSent) onSent();
    // update UI state
    setResults((r) => r.filter((u) => u.id !== to));
  }

  return (
    <div className="p-4 rounded-lg shadow-sm bg-[var(--card-bg)] text-[var(--fg)]">
      <form onSubmit={doSearch} className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--card-bg)] rounded-lg flex-1 border border-[rgba(0,0,0,0.06)]">
          <Search size={16} className="text-[var(--fg)]/50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="bg-transparent outline-none w-full" placeholder="Find by username or email" />
        </div>
        <button type="submit" className="px-3 py-2 rounded-lg bg-sky-600 text-white">Search</button>
      </form>

      <div className="mt-3 space-y-2">
        {loading && <div className="text-sm text-[var(--fg)]/70">Searching…</div>}
        {!loading && results.length === 0 && q && <div className="text-sm text-[var(--fg)]/70">No users found</div>}
        {results.map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition bg-[transparent]">
            <AvatarSmall name={u.username} />
            <div className="flex-1">
              <div className="font-medium">{u.username}</div>
              <div className="text-sm text-[var(--fg)]/70">{u.email}</div>
            </div>
            <button onClick={() => sendRequest(u.id)} className="flex items-center gap-2 px-3 py-1 rounded bg-sky-50 text-sky-700 hover:shadow-sm"><UserPlus size={14}/> Add</button>
          </div>
        ))}
      </div>
    </div>
  );
}
