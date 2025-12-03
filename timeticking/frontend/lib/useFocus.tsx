"use client";

import { useEffect, useState, useRef, useCallback } from "react";

type FocusSession = {
  id?: string;
  start: number; // epoch ms
};

// key used to persist active focus session
const STORAGE_KEY = "focusSession";

export default function useFocus() {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const sessionRef = useRef<FocusSession | null>(null);

  const getCurrentUser = () => {
    try {
      const id = localStorage.getItem("currentUserId");
      return id || "user1";
    } catch (e) {
      return "user1";
    }
  };

  const saveSession = (s: FocusSession | null) => {
    sessionRef.current = s;
    try {
      if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  const start = useCallback(async () => {
    if (isActive) return;
    // request backend to start (or return existing) session and use its authoritative start time
    try {
      const resp = await fetch(`/api/focus/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": getCurrentUser(),
        },
        body: JSON.stringify({}),
      });
      const data = await resp.json().catch(() => null);
      let startTs = Date.now();
      if (data && data.session && data.session.start) {
        startTs = new Date(data.session.start).getTime();
        // persist id if provided
        saveSession({ id: data.session.id, start: startTs });
      } else {
        saveSession({ start: startTs });
      }
      setIsActive(true);
      setSeconds(Math.floor((Date.now() - startTs) / 1000));
    } catch (err) {
      // network error: fallback to local start
      const startTs = Date.now();
      saveSession({ start: startTs });
      setIsActive(true);
      setSeconds(0);
    }
  }, [isActive]);

  const stop = useCallback(async () => {
    if (!isActive) return;
    const endedAt = Date.now();
    // compute seconds from stored session
    const session = sessionRef.current;
    if (session) {
      const elapsed = Math.floor((endedAt - session.start) / 1000);
      setSeconds(elapsed);
    }

    // clear local session
    saveSession(null);
    setIsActive(false);

    // notify backend
    try {
      await fetch(`/api/focus/stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": getCurrentUser(),
        },
        body: JSON.stringify({ end: endedAt }),
      });
    } catch (err) {
      // ignore
    }
  }, [isActive]);

  const toggle = useCallback(() => {
    if (isActive) stop();
    else start();
  }, [isActive, start, stop]);

  // resume session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s: FocusSession = JSON.parse(raw);
        if (s && s.start) {
          sessionRef.current = s;
          setIsActive(true);
          const elapsed = Math.floor((Date.now() - s.start) / 1000);
          setSeconds(elapsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // stop session when page is hidden/unloaded so we don't leave stale open sessions
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden && isActive) {
        // visibilitychange: try to stop normally
        stop();
      }
    }

    function handleBeforeUnload(e: Event) {
      if (!isActive) return;
      const endedAt = Date.now();
      // best-effort notify backend using keepalive fetch so it records the end
      try {
        fetch(`/api/focus/stop`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": getCurrentUser(),
          },
          body: JSON.stringify({ end: endedAt }),
          keepalive: true,
        });
      } catch (err) {
        // ignore
      }
      // also clear local session immediately to keep UI consistent
      saveSession(null);
      setIsActive(false);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActive, stop]);

  // interval to tick seconds while active
  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        const s = sessionRef.current ? Math.floor((Date.now() - sessionRef.current.start) / 1000) : 0;
        setSeconds(s);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]);

  return { isActive, seconds, toggle, start, stop } as const;
}
