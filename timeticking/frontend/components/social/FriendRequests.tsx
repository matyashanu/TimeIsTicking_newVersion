"use client";
import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

function RequestCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg shadow-sm bg-[var(--card-bg)] text-[var(--fg)]">
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function FriendRequests({ currentUserId, onChange, mode = 'both' }: { currentUserId?: string; onChange?: () => void; mode?: 'incoming' | 'outgoing' | 'both' }) {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);

  async function load() {
    const res = await fetch('/api/socials/requests', { headers: { 'x-user-id': currentUserId || '' } });
    const data = await res.json();
    setIncoming(data.incoming || []);
    setOutgoing(data.outgoing || []);
  }

  useEffect(() => { load(); }, [currentUserId]);

  async function respond(id: string, action: 'accept' | 'decline') {
    await fetch(`/api/socials/requests/${id}/respond`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': currentUserId || '' },
      body: JSON.stringify({ action }),
    });
    if (onChange) onChange();
    load();
  }

  return (
    <div className="space-y-3">
      {mode !== 'outgoing' && (
        <RequestCard label="Incoming Requests">
          {incoming.length === 0 && <div className="text-sm text-[var(--fg)]/70">No incoming requests</div>}
          {incoming.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 p-2 border rounded border-[rgba(0,0,0,0.06)]">
              <div className="flex-1">
                <div className="font-medium">{r.from}</div>
                <div className="text-sm text-[var(--fg)]/70">Requested {new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => respond(r.id, 'accept')} className="flex items-center gap-1 px-3 py-1 rounded bg-green-50 text-green-700 hover:shadow-sm"><Check size={14}/>Accept</button>
                <button onClick={() => respond(r.id, 'decline')} className="flex items-center gap-1 px-3 py-1 rounded bg-red-50 text-red-700 hover:shadow-sm"><X size={14}/>Decline</button>
              </div>
            </div>
          ))}
        </RequestCard>
      )}

      {mode !== 'incoming' && (
        <RequestCard label="Outgoing Requests">
          {outgoing.length === 0 && <div className="text-sm text-[var(--fg)]/70">No outgoing requests</div>}
          {outgoing.map((r) => (
            <div key={r.id} className="p-2 border rounded border-[rgba(0,0,0,0.06)]">
              <div className="font-medium">To: {r.to}</div>
              <div className="text-sm text-[var(--fg)]/70">Requested {new Date(r.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </RequestCard>
      )}
    </div>
  );
}
