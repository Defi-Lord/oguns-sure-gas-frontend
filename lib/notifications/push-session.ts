'use client';
export const PUSH_STORAGE = 'mysuregas-browser-alerts-v1';
export type LocalPush = { id: string; ownerId: string; role: string; binding: string };
export function readLocalPush(): LocalPush | null {
  try {
    const value = JSON.parse(localStorage.getItem(PUSH_STORAGE) || 'null') as LocalPush | null;
    return value && ['id','ownerId','role','binding'].every(key => typeof value[key as keyof LocalPush] === 'string') ? value : null;
  } catch { return null; }
}
export async function bindWorker(binding: string | null) {
  const registration = await navigator.serviceWorker.getRegistration('/');
  const worker = registration?.active;
  if (!worker) return;
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); reject(new Error('Browser alerts did not respond. Try again.')); }, 5000);
    channel.port1.onmessage = () => { clearTimeout(timer); channel.port1.close(); resolve(); };
    worker.postMessage({ type: 'MYSUREGAS_PUSH_BIND', binding }, [channel.port2]);
  });
}
export async function clearBrowserPush(accessToken?: string | null) {
  if (typeof window === 'undefined') return;
  const saved = readLocalPush();
  try { localStorage.removeItem(PUSH_STORAGE); } catch { /* Browser storage unavailable. */ }
  const tasks: Promise<unknown>[] = [];
  if ('serviceWorker' in navigator) {
    tasks.push((async () => {
      await bindWorker(null).catch(() => {});
      const registration = await navigator.serviceWorker.getRegistration('/');
      await (await registration?.pushManager.getSubscription())?.unsubscribe();
      for (const item of await registration?.getNotifications() ?? []) item.close();
    })());
  }
  if (saved && accessToken && process.env.NEXT_PUBLIC_API_URL) {
    tasks.push(fetch(`${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/notifications/push/devices/${encodeURIComponent(saved.id)}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` }, keepalive: true,
    }));
  }
  await Promise.allSettled(tasks);
}
