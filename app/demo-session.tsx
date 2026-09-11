'use client';

import { useEffect } from 'react';

export default function DemoSession() {
  useEffect(() => {
    let day = ''; let pending = false; let lastTry = 0;
    const controller = new AbortController();
    async function renew() {
      const now = Date.now();
      const today = new Date(now + 7 * 3600000).toISOString().slice(0, 10);
      if (document.visibilityState !== 'visible' || pending || day === today || now - lastTry < 30000) return;
      pending = true; lastTry = now;
      try {
        const response = await fetch('/api/telemed/auth/session', { method: 'POST', signal: controller.signal });
        if (response.ok || response.status === 401) day = today;
      } catch { /* Retry on the next interaction after a transient network failure. */ }
      finally { pending = false; }
    }
    void renew();
    window.addEventListener('focus', renew);
    document.addEventListener('visibilitychange', renew);
    document.addEventListener('pointerdown', renew);
    document.addEventListener('keydown', renew);
    return () => {
      controller.abort();
      window.removeEventListener('focus', renew);
      document.removeEventListener('visibilitychange', renew);
      document.removeEventListener('pointerdown', renew);
      document.removeEventListener('keydown', renew);
    };
  }, []);
  return null;
}
