"use client";
import React, { useEffect, useState } from 'react';
import { User, MessageCircle } from 'lucide-react';

function Avatar({ name }: { name?: string }) {
  const initials = (name || '').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-semibold">
      {initials || <User size={16} />}
    </div>
  );
}

export default function FriendsList({ currentUserId, onOpenChat, onViewCalendar }: { currentUserId?: string; onOpenChat?: (id:string)=>void; onViewCalendar?: (id:string)=>void }) {
  const [friends, setFriends] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/socials/friends', { headers: { 'x-user-id': currentUserId || '' } });
    const data = await res.json();
    setFriends(data.friends || []);
  }

  useEffect(() => { load(); }, [currentUserId]);

  return (
    <div className="space-y-4 text-[var(--fg)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Friends</h3>
        <span className="text-sm text-[var(--fg)]/70">{friends.length}</span>
      </div>

      <div className="space-y-2 max-h-[45vh] overflow-y-auto">
        {friends.length === 0 && <div className="text-sm text-[var(--fg)]/70">No friends yet</div>}
        {friends.map((f) => (
          <div key={f.id} className={`flex items-center gap-3 p-3 rounded-lg hover:shadow-sm transition cursor-pointer ${active===f.id? 'bg-sky-50':'bg-[transparent]'}`} onClick={() => { setActive(f.id); onOpenChat?.(f.id); }}>
            <Avatar name={f.user?.username || f.id} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-medium">{f.user?.username || f.id}</div>
                <div className="text-xs text-[var(--fg)]/70">since {new Date(f.since).toLocaleDateString()}</div>
              </div>
              <div className="text-sm text-[var(--fg)]/70">{f.user?.email}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={(e)=>{ e.stopPropagation(); onOpenChat?.(f.id); }} className="text-sky-600 hover:underline text-sm flex items-center gap-1"><MessageCircle size={14}/> Chat</button>
              <button onClick={(e)=>{ e.stopPropagation(); onViewCalendar?.(f.id); }} className="text-[var(--fg)]/70 text-sm underline">View Calendar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
