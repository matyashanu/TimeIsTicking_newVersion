"use client";
import React, { useEffect, useState } from 'react';

export default function FriendCalendarView({ currentUserId, friendId }: { currentUserId?: string; friendId?: string }) {
  const [events, setEvents] = useState<any[]>([]);

  async function load() {
    if (!friendId) return;
    const res = await fetch(`/api/socials/friends/${friendId}/calendar`, { headers: { 'x-user-id': currentUserId || '' } });
    if (!res.ok) { setEvents([]); return; }
    const data = await res.json();
    setEvents(data.events || []);
  }

  useEffect(() => { load(); }, [friendId]);

  return (
    <div className="p-4 rounded-lg shadow-sm bg-[var(--card-bg)] text-[var(--fg)]">
      <div className="mb-3">
        <div className="text-sm text-[var(--fg)]/70">Viewing</div>
        <div className="text-lg font-semibold">{friendId ? `${friendId}'s Calendar` : 'No friend selected'}</div>
      </div>

      <div className="space-y-3">
        {events.length === 0 && <div className="text-sm text-[var(--fg)]/70">No events or you cannot view this calendar</div>}
        {events.map((e) => (
          <div key={e.id} className="p-3 border rounded-lg border-[rgba(0,0,0,0.06)]">
            <div className="font-medium">{e.title}</div>
            <div className="text-sm text-[var(--fg)]/70">{new Date(e.start).toLocaleString()} — {new Date(e.end).toLocaleString()}</div>
            {e.description && <div className="text-sm mt-2">{e.description}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
