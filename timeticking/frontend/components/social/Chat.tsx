"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, Send } from 'lucide-react';

function MessageBubble({ m, mine }: { m: any; mine: boolean }) {
  return (
    <div className={`max-w-[75%] p-3 rounded-lg ${mine ? 'bg-sky-600 text-white ml-auto' : 'bg-[var(--card-bg)] text-[var(--fg)]/90 border border-[rgba(0,0,0,0.06)]'}`}>
      <div className="text-sm">{m.text}</div>
      {m.file && <div className="mt-2"><a className={`${mine ? 'text-sky-100' : 'text-sky-700'} underline`} href={m.file.url} target="_blank" rel="noreferrer">{m.file.originalname}</a></div>}
      <div className={`text-xs mt-2 ${mine ? 'text-sky-100/80' : 'text-[var(--fg)]/70'}`}>{new Date(m.createdAt).toLocaleString()}</div>
    </div>
  );
}

export default function Chat({ currentUserId, friendId }: { currentUserId?: string; friendId?: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    if (!friendId) return;
    const res = await fetch(`/api/socials/chats/${friendId}/messages`, { headers: { 'x-user-id': currentUserId || '' } });
    const data = await res.json();
    setMessages(data.messages || []);
    setTimeout(()=>{ scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
  }

  useEffect(() => { load(); const id = setInterval(load, 3000); return () => clearInterval(id); }, [friendId]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!friendId) return;
    const fd = new FormData();
    fd.append('text', text);
    if (fileRef.current?.files?.[0]) fd.append('file', fileRef.current.files[0]);
    await fetch(`/api/socials/chats/${friendId}/messages`, { method: 'POST', headers: { 'x-user-id': currentUserId || '' }, body: fd });
    setText('');
    if (fileRef.current) fileRef.current.value = '';
    load();
  }

  return (
    <div className="flex flex-col h-full rounded-lg bg-[var(--card-bg)] text-[var(--fg)] shadow-sm">
      <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center">F</div>
          <div>
            <div className="font-semibold">{friendId || 'Friend'}</div>
            <div className="text-sm text-[var(--fg)]/70">Online</div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="p-4 flex-1 overflow-y-auto space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="flex" style={{ justifyContent: m.from === currentUserId ? 'flex-end' : 'flex-start' }}>
            <MessageBubble m={m} mine={m.from === currentUserId} />
          </div>
        ))}
      </div>

      <form onSubmit={send} className="p-3 border-t border-[rgba(0,0,0,0.06)] flex items-center gap-2">
        <label className="p-2 rounded hover:bg-[var(--card-bg)] cursor-pointer">
          <Paperclip size={18} />
          <input ref={fileRef} type="file" className="hidden" />
        </label>
        <input value={text} onChange={(e)=>setText(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-[rgba(0,0,0,0.06)] bg-[var(--card-bg)] text-[var(--fg)]" placeholder="Message" />
        <button className="px-3 py-2 rounded-lg bg-sky-600 text-white flex items-center gap-2"><Send size={14}/>Send</button>
      </form>
    </div>
  );
}
