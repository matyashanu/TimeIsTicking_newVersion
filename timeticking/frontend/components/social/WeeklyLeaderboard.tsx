"use client";

import React, { useEffect, useState } from "react";

type Entry = {
	userId: string;
	username: string;
	seconds: number;
};

export default function WeeklyLeaderboard({ currentUserId }: { currentUserId?: string }) {
	const [entries, setEntries] = useState<Entry[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const id = currentUserId || (typeof window !== 'undefined' ? localStorage.getItem('currentUserId') || undefined : undefined);
		if (!id) return;
		let mounted = true;
		setLoading(true);
		fetch('/api/focus/leaderboard', { headers: { 'x-user-id': id } })
			.then(async (res) => {
				if (!res.ok) throw new Error('fetch failed');
				const data = await res.json();
				if (!mounted) return;
				// backend returns { ok: true, leaderboard: [{ user: { id, username }, totalSeconds }] }
				const rows = data.leaderboard || [];
				const mapped = rows.map((r: any) => ({ userId: r.user?.id || r.userId, username: r.user?.username || r.username || (r.userId || 'unknown'), seconds: r.totalSeconds || 0 }));
				setEntries(mapped);
			})
			.catch(() => setEntries([]))
			.finally(() => setLoading(false));

		return () => { mounted = false; };
	}, [currentUserId]);

	function fmtHours(s: number) {
		// format seconds to H:MM:SS
		const hh = Math.floor(s / 3600);
		const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
		const ss = Math.floor(s % 60).toString().padStart(2, '0');
		return `${hh}:${mm}:${ss}`;
	}

	return (
		<section className="mt-6 p-4 rounded-lg bg-[var(--card-bg)] text-[var(--fg)]">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-lg font-semibold">Weekly Focus Leaderboard</h3>
				<span className="text-xs text-[var(--fg)]/70">Resets weekly</span>
			</div>

			<div className="space-y-2">
				{loading && <div className="text-sm text-[var(--fg)]/70">Loading...</div>}
				{!loading && entries.length === 0 && <div className="text-sm text-[var(--fg)]/70">No focus data yet</div>}
				{!loading && entries.map((e, i) => (
					<div key={e.userId} className={`flex items-center justify-between p-2 rounded ${i < 3 ? 'bg-yellow-50/10' : ''}`}>
						<div className="flex items-center gap-3">
							<div className="w-8 text-sm font-semibold">#{i + 1}</div>
							<div className="text-sm">{e.username}</div>
						</div>
						<div className="text-sm font-semibold">{fmtHours(e.seconds)}</div>
					</div>
				))}
			</div>
		</section>
	);
}
