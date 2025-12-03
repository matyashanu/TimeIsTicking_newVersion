"use client";
import React, { useEffect, useState } from 'react';
import SearchUsers from '../../components/social/SearchUsers';
import FriendRequests from '../../components/social/FriendRequests';
import FriendsList from '../../components/social/FriendsList';
import Chat from '../../components/social/Chat';
import FriendCalendarView from '../../components/social/FriendCalendarView';
import { Plus, Users, Inbox, Send } from 'lucide-react';
import WeeklyLeaderboard from '@/components/social/WeeklyLeaderboard';

export default function SocialPage() {
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [users, setUsers] = useState<any[]>([]);
  const [activeChatFriend, setActiveChatFriend] = useState<string | undefined>();
  const [activeCalendarFriend, setActiveCalendarFriend] = useState<string | undefined>();
  const [tab, setTab] = useState<'friends' | 'incoming' | 'outgoing'>('friends');
  const [showAdd, setShowAdd] = useState(false);
  const [incomingCount, setIncomingCount] = useState<number>(0);

  useEffect(() => {
    async function loadUsers() {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
      if (data.users && data.users.length > 0 && !currentUserId) setCurrentUserId(data.users[0].id);
    }
    loadUsers();
  }, []);

  async function loadRequestCounts(userId?: string) {
    if (!userId) { setIncomingCount(0); return; }
    try {
      const res = await fetch('/api/socials/requests', { headers: { 'x-user-id': userId } });
      if (!res.ok) { setIncomingCount(0); return; }
      const data = await res.json();
      setIncomingCount((data.incoming && Array.isArray(data.incoming)) ? data.incoming.length : 0);
    } catch (e) { setIncomingCount(0); }
  }

  useEffect(() => {
    loadRequestCounts(currentUserId);
  }, [currentUserId]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Social</h1>
        <div className="flex items-center gap-3">
          <label className="mr-2">You:</label>
          <select value={currentUserId} onChange={(e) => setCurrentUserId(e.target.value)} className="border rounded px-2 py-1">
            {users.map((u) => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-3 p-4 rounded-lg bg-[var(--card-bg)] text-[var(--fg)]">
          <div className="mb-4">
            <div className="flex items-center gap-1">
              <button aria-pressed={tab === 'friends'} onClick={() => setTab('friends')} className={`flex items-center gap-1 px-1.5 py-1 text-xs rounded ${tab === 'friends' ? 'bg-[var(--card-bg)] text-[var(--fg)] font-semibold' : 'text-[var(--fg)]/70'}`}>
                <Users size={14} />
                <span className="whitespace-nowrap">Friends</span>
              </button>

              <button aria-pressed={tab === 'incoming'} onClick={() => setTab('incoming')} className={`flex items-center gap-1 px-1.5 py-1 text-xs rounded ${tab === 'incoming' ? 'bg-[var(--card-bg)] text-[var(--fg)] font-semibold' : 'text-[var(--fg)]/70'}`}>
                <Inbox size={14} />
                <span className="whitespace-nowrap">Incoming</span>
                {incomingCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center text-[10px] font-semibold leading-none px-2 py-0.5 rounded-full bg-red-600 text-white">{incomingCount}</span>
                )}
              </button>

              <button aria-pressed={tab === 'outgoing'} onClick={() => setTab('outgoing')} className={`flex items-center gap-1 px-1.5 py-1 text-xs rounded ${tab === 'outgoing' ? 'bg-[var(--card-bg)] text-[var(--fg)] font-semibold' : 'text-[var(--fg)]/70'}`}>
                <Send size={14} />
                <span className="whitespace-nowrap">Outgoing</span>
              </button>
            </div>

            <div className="mt-3">
              <button onClick={() => setShowAdd(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-sky-600 text-white"><Plus size={14} /> Add Friend</button>
            </div>
          </div>

          <div className="space-y-4">
            {tab === 'friends' && (
              <FriendsList currentUserId={currentUserId} onOpenChat={(id) => { setActiveChatFriend(id); setActiveCalendarFriend(undefined); }} onViewCalendar={(id) => { setActiveCalendarFriend(id); setActiveChatFriend(undefined); }} />
            )}

            {tab === 'incoming' && (
              <FriendRequests currentUserId={currentUserId} onChange={() => { loadRequestCounts(currentUserId); }} mode="incoming" />
            )}

            {tab === 'outgoing' && (
              <FriendRequests currentUserId={currentUserId} onChange={() => { loadRequestCounts(currentUserId); }} mode="outgoing" />
            )}
          </div>
        </aside>

        <main className="col-span-9">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-[520px]">
              {activeChatFriend ? <Chat currentUserId={currentUserId} friendId={activeChatFriend} /> : <div className="h-full rounded-lg bg-[var(--card-bg)] shadow-sm flex items-center justify-center text-[var(--fg)]/70">Select a friend to start chatting</div>}
            </div>
            <div className="h-[520px]">
              {activeCalendarFriend ? <FriendCalendarView currentUserId={currentUserId} friendId={activeCalendarFriend} /> : <div className="h-full rounded-lg bg-[var(--card-bg)] shadow-sm flex items-center justify-center text-[var(--fg)]/70">Select a friend to view their calendar</div>}
            </div>
          </div>
        </main>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-[var(--card-bg)] rounded-lg p-6 w-[520px] shadow-lg text-[var(--fg)]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">Add Friend</div>
              <button onClick={() => setShowAdd(false)} className="text-[var(--fg)]/70">Close</button>
            </div>
            <SearchUsers currentUserId={currentUserId} onSent={() => { setShowAdd(false); }} />
          </div>
        </div>
      )}

      {/* Weekly leaderboard displayed as its own section at the bottom of the Social page */}
      <div className="container mx-auto mt-6">
        <WeeklyLeaderboard currentUserId={currentUserId} />
      </div>
    </section>
  );
}
