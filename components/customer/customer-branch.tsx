'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, ArrowUpRight, Check, RefreshCw, LocateFixed } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { bagFingerprint, useCustomerCart } from '@/stores/customer-cart-store';
import type { PublicBranch, PublicBranchListResponse } from '@/types/branch';
import s from './customer-experience.module.css';
type Preference = { branch: { id: string; name: string; city: string } | null; unavailable: boolean };
type Envelope<T> = { data: T };
const useGuestBranch = create<{ id: string | null; ready: boolean; setReady: () => void; set: (id: string) => void }>()(persist(set => ({ id: null, ready: false, setReady: () => set({ready:true}), set: id => set({ id }) }), { name: 'mysuregas-guest-branch', storage: createJSONStorage(() => localStorage), partialize: v => ({ id: v.id }), onRehydrateStorage: () => state => state?.setReady() }));
export function useShoppingBranch() {
  const { user, hasHydrated, sessionVersion } = useAuthStore();
  const guest = useGuestBranch();
  const customer = hasHydrated && user?.role === 'CUSTOMER' && user.status === 'ACTIVE';
  const branches = useQuery({ queryKey: ['customer', 'public-branches'], queryFn: async ({ signal }) => (await api.get<PublicBranchListResponse>('/branches', { signal })).data.data.branches.filter(b => b.isActive), retry: false });
  const preference = useQuery({ queryKey: ['customer', 'branch-preference', user?.id, sessionVersion], queryFn: async ({ signal }) => (await api.get<Envelope<Preference>>('/users/me/branch', { signal })).data.data, enabled: Boolean(customer), retry: false, staleTime: 0 });
  const id = customer ? preference.data?.branch?.id : guest.id;
  const branch = branches.data?.find(b => b.id === id);
  return { branch, branches, preference, guest, customer, owner: customer ? user.id : null, version: sessionVersion, loading: !hasHydrated || (!customer && !guest.ready) || branches.isPending || (customer && preference.isPending), error: branches.error || (customer ? preference.error : null), unavailable: customer ? preference.data?.unavailable || Boolean(id && branches.isSuccess && !branch) : Boolean(id && branches.isSuccess && !branch) };
}
export function CustomerBranchSettings({ initial = false }: { initial?: boolean }) {
  const state = useShoppingBranch(), client = useQueryClient();
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [candidate, setCandidate] = useState<PublicBranch | null>(null), [locating, setLocating] = useState(false);
  const lock = useRef(false);
  async function save(branch: PublicBranch, replace = false) {
    if (lock.current) return;
    const bag = useCustomerCart.getState(), auth = useAuthStore.getState();
    if (!bag.hydrated || bag.reserving || (auth.user && (bag.checkouts[auth.user.id] || (bag.uncertain[auth.user.id] ?? 0) > Date.now()))) { setError('Finish or cancel your reserved checkout before changing branches.'); return; }
    if (bag.items.length && bag.branch?.id !== branch.id && !replace) { setCandidate(branch); return; }
    const fingerprint = bagFingerprint(bag), owner = state.owner, version = state.version;
    const sameSession = () => { const a = useAuthStore.getState(); return a.sessionVersion === version && (owner ? a.user?.id === owner && a.user.role === 'CUSTOMER' : !a.user || a.user.role !== 'CUSTOMER'); };
    lock.current = true; setBusy(true); setError(''); setNotice(''); bag.setReserving(true);
    try {
      if (owner) {
        const result = (await api.put<Envelope<Preference>>('/users/me/branch', { branchId: branch.id })).data.data;
        if (!sameSession()) return;
        client.setQueryData(['customer', 'branch-preference', owner, version], result);
      } else { if (!sameSession()) return; state.guest.set(branch.id); }
      if (replace && bag.items.length > 0 && bag.branch?.id !== branch.id && bagFingerprint(useCustomerCart.getState()) === fingerprint) useCustomerCart.getState().clearBag();
      setCandidate(null); setNotice(`${branch.name} is now your shopping branch.`);
    } catch (cause) { if (sameSession()) { setError(getApiErrorMessage(cause)); if (owner) void client.invalidateQueries({ queryKey: ['customer', 'branch-preference', owner, version] }); } }
    finally { useCustomerCart.getState().setReserving(false); lock.current = false; setBusy(false); }
  }
  function nearby() {
    if (!navigator.geolocation) { setError('Location is unavailable. Choose a branch from the list.'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLocating(false);
      const rad = (v: number) => v * Math.PI / 180;
      const nearest = state.branches.data?.filter(b => b.latitude !== null && b.longitude !== null).map(b => {
        const a = Math.sin(rad(b.latitude! - coords.latitude) / 2) ** 2 + Math.cos(rad(coords.latitude)) * Math.cos(rad(b.latitude!)) * Math.sin(rad(b.longitude! - coords.longitude) / 2) ** 2;
        return { branch: b, distance: 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))) };
      }).sort((a, b) => a.distance - b.distance)[0];
      if (!nearest) { setError('No branch coordinates are available. Choose a branch manually.'); return; }
      setCandidate(nearest.branch); setNotice(`Nearby suggestion: ${nearest.branch.name}, approximately ${nearest.distance.toFixed(1)} km away. This does not confirm delivery coverage.`);
    }, () => { setLocating(false); setError('Location could not be accessed. Choose a branch manually.'); }, { timeout: 10000, maximumAge: 60000 });
  }
  if (initial && state.branch) return null;
  return <section className={s.branchCard} id={initial ? 'branches' : 'my-branch'} aria-label="My shopping branch"><span className={s.smallLabel}><MapPin size={15}/> {initial ? 'LET’S MAKE IT LOCAL' : 'MY BRANCH'}</span><h2>{state.branch ? state.branch.name : 'Your neighbourhood. Your branch.'}</h2><p>{state.customer ? 'Saved to your account, ready next time you sign in. Change it here whenever you need to.' : 'Choose once for this browser. Sign in to save your branch across devices.'}</p>{state.unavailable && <p role="status">Your previous branch is unavailable. Please choose an active branch.</p>}
    {state.loading ? <p role="status">Loading your branch…</p> : state.error ? <div role="alert"><p>{getApiErrorMessage(state.error)}</p><button className={s.secondary} onClick={() => { void state.branches.refetch(); if (state.customer) void state.preference.refetch(); }}><RefreshCw size={15}/> Retry</button></div> : <div className={s.branchSelect}><label>Shopping branch<select aria-label="Shopping branch" value={state.branch?.id ?? ''} disabled={busy || locating} onChange={e => { const branch = state.branches.data?.find(b => b.id === e.target.value); if (branch) void save(branch); }}><option value="">Select your branch</option>{state.branches.data?.map(b => <option key={b.id} value={b.id}>{b.name} · {b.city}</option>)}</select></label>{!state.branch && <button className={s.secondary} disabled={busy || locating} onClick={nearby}><LocateFixed size={16}/>{locating ? 'Finding nearby branches…' : 'Suggest a nearby branch'}</button>}{state.branches.isSuccess && !state.branches.data.length && <p>No active branches are available yet.</p>}</div>}
    {candidate && <div className={s.confirm} role="group" aria-label="Confirm branch change"><strong>Shop at {candidate.name}?</strong><p>{useCustomerCart.getState().items.length ? 'If your bag belongs to another branch, its products will be removed. Existing orders are unaffected.' : 'You can change this later in your profile.'}</p><button className={s.primary} disabled={busy} onClick={() => void save(candidate, true)}>{busy ? 'Saving…' : 'Confirm branch'}</button><button className={s.secondary} disabled={busy} onClick={() => setCandidate(null)}>Keep current branch</button></div>}
    {busy && <p role="status">Saving your branch…</p>}{error && <p role="alert" className={s.error}>{error}</p>}{notice && <p role="status" className={s.saved}><Check size={15}/>{notice}</p>}{!state.customer && <Link href="/shop/login" className={s.textLink}>Save to a customer account <ArrowUpRight size={14}/></Link>}
  </section>;
}
