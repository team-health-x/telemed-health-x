'use client';
import { useEffect, useState } from 'react';

export function useChatUnread(bookingIds: string[]) {
  const key = [...bookingIds].sort().join(',');
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    const controller = new AbortController();
    const cleanups = key.split(',').filter(Boolean).map(id => {
      let socket: WebSocket | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let delay = 1000;
      const retry = () => {
        if (controller.signal.aborted) return;
        timer = setTimeout(connect, delay);
        delay = Math.min(delay * 2, 30000);
      };
      async function connect() {
        try {
          const response = await fetch(`/api/telemed/bookings/${encodeURIComponent(id)}/chat/socket`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: controller.signal,
          });
          if ([401, 403, 404].includes(response.status)) {
            setCounts(old => ({ ...old, [id]: 0 })); return;
          }
          if (!response.ok) throw new Error('Socket unavailable');
          const result = await response.json();
          if (controller.signal.aborted) return;
          socket = new WebSocket(result.url);
          socket.onopen = () => socket?.send(JSON.stringify({ ticket: result.ticket }));
          socket.onmessage = event => {
            try {
              const state = JSON.parse(event.data);
              if (state.bookingId !== id || !Number.isSafeInteger(state.unread) || state.unread < 0) return;
              delay = 1000;
              setCounts(old => ({ ...old, [id]: state.unread }));
              window.dispatchEvent(new CustomEvent('telemed-chat-update', { detail: { bookingId: id } }));
            } catch { /* Ignore malformed frames without losing the connection. */ }
          };
          socket.onclose = retry;
          socket.onerror = () => socket?.close();
        } catch { retry(); }
      }
      void connect();
      return () => { clearTimeout(timer); if (socket) { socket.onclose = null; socket.close(); } };
    });
    return () => { controller.abort(); cleanups.forEach(cleanup => cleanup()); };
  }, [key]);
  return Object.fromEntries(bookingIds.map(id => [id, counts[id] || 0]));
}
