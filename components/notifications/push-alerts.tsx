'use client';
import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { isNativeDevice } from '@/lib/native/device';
import { useAuthStore } from '@/stores/auth-store';
import { bindWorker, clearBrowserPush, PUSH_STORAGE, readLocalPush } from '@/lib/notifications/push-session';
import s from './push-alerts.module.css';

type Config = { enabled: boolean; publicKey: string | null };
function browserSupport() {
  return !isNativeDevice() && window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}
function publicKeyBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
export function PushSessionRuntime() {
  const id = useAuthStore(state => state.user?.id);
  const role = useAuthStore(state => state.user?.role);
  const hydrated = useAuthStore(state => state.hasHydrated);
  useEffect(() => {
    if (!hydrated || isNativeDevice() || !('serviceWorker' in navigator)) return;
    const saved = readLocalPush();
    if (saved && (saved.ownerId !== id || saved.role !== role)) { clearBrowserPush(); return; }
    if (saved) void navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(() => navigator.serviceWorker.ready).then(() => bindWorker(saved.binding)).catch(() => {});
    const onStorage = (event: StorageEvent) => { if (event.key === PUSH_STORAGE && !event.newValue) void bindWorker(null).catch(() => {}); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [id, role, hydrated]);
  return null;
}
export function PushAlerts() {
  const user = useAuthStore(state => state.user);
  const [config, setConfig] = useState<Config | null>(null);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Checking background alerts…');
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!browserSupport()) {
        if (!cancelled) setMessage(isNativeDevice() ? 'Background alerts are not available in this app version yet. Check your inbox for updates.' : 'On iPhone, add MySureGas to your Home Screen and open it there. Other browsers may not support background alerts.');
        return;
      }
      try {
        const { data } = await api.get<{ data: Config }>('/notifications/push/config');
        if (cancelled) return;
        setConfig(data.data);
        const saved = readLocalPush();
        let enabled = false;
        if (saved && saved.ownerId === user?.id && saved.role === user?.role && Notification.permission === 'granted') {
          const reg = await navigator.serviceWorker.getRegistration('/');
          const sub = await reg?.pushManager.getSubscription();
          if (sub) enabled = (await api.get<{data:{active:boolean}}>(`/notifications/push/devices/${encodeURIComponent(saved.id)}`)).data.data.active;
        }
        if (!cancelled) { setActive(enabled); setMessage(enabled ? 'Alerts are on for this account on this device.' : data.data.enabled ? 'Get order and delivery alerts even when MySureGas is not open.' : 'Background alerts are being prepared. Your in-app inbox and email still work.'); }
      } catch { if (!cancelled) setMessage('Background alerts are unavailable right now. Your inbox and email still work.'); }
    }
    void load(); return () => { cancelled = true; };
  }, [user?.id, user?.role]);
  async function toggle() {
    if (busy || !user) return;
    const session = useAuthStore.getState(); const expectedId = user.id, expectedRole = user.role;
    setBusy(true);
    try {
      if (active) { await clearBrowserPush(session.accessToken); setActive(false); setMessage('Background alerts are off on this device.'); return; }
      if (!config?.enabled || !config.publicKey || !browserSupport()) return;
      // Permission is requested only by this explicit button click, before other awaits.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setMessage('Alerts were not enabled. You can change permission in your browser settings.'); return; }
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const registration = await navigator.serviceWorker.ready;
      const previous = readLocalPush();
      let subscription = await registration.pushManager.getSubscription();
      if (subscription && (!previous || previous.ownerId !== expectedId || previous.role !== expectedRole)) { await subscription.unsubscribe(); subscription = null; }
      subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKeyBytes(config.publicKey) });
      if (useAuthStore.getState().user?.id !== expectedId || useAuthStore.getState().sessionVersion !== session.sessionVersion) throw new Error('Your session changed. Enable alerts after signing in.');
      // Use the captured session token so a concurrent login can never enrol the wrong account.
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL!.replace(/\/$/, '')}/notifications/push/devices`, {
        method: 'POST', headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      const body = await response.json() as { data?: { id: string; binding: string }; message?: string };
      if (!response.ok || !body.data) throw new Error(body.message || 'Background alerts could not be enabled.');
      if (useAuthStore.getState().sessionVersion !== session.sessionVersion) {
        void fetch(`${process.env.NEXT_PUBLIC_API_URL!.replace(/\/$/, '')}/notifications/push/devices/${encodeURIComponent(body.data.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.accessToken}` } });
        await subscription.unsubscribe(); throw new Error('Your session changed. Enable alerts after signing in.');
      }
      localStorage.setItem(PUSH_STORAGE, JSON.stringify({ ...body.data, ownerId: expectedId, role: expectedRole }));
      await bindWorker(body.data.binding);
      setActive(true); setMessage('Alerts enabled. New updates can appear when the app is not open.');
    } catch (error) { setMessage(getApiErrorMessage(error)); }
    finally { setBusy(false); }
  }
  return <section className={s.card} aria-label="Background notification settings"><span className={s.icon}>{active ? <Bell size={21}/> : <BellOff size={21}/>}</span><div className={s.copy}><h2>Alerts on this device</h2><p role="status">{message}</p><small>Optional · Private previews</small></div><button type="button" disabled={busy || !config?.enabled} onClick={() => void toggle()} aria-pressed={active}>{busy ? 'Updating…' : active ? 'Turn off' : 'Enable alerts'}</button></section>;
}
