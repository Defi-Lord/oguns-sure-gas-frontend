'use client';
import { announceQuick } from '@/lib/experience/moment-policy';
import { getDevicePosition } from '@/lib/native/device';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Bell, Mail, Phone, ChevronRight, BriefcaseBusiness, Package, Check, CheckCheck, Home, Loader2, LocateFixed, MapPin, Pencil, Plus, RefreshCw, ShieldCheck, Star, Trash2, UserRound, X } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthUser, MeResponse } from '@/types/auth';
import c from './customer.module.css';
import { CustomerBranchSettings, useShoppingBranch } from './customer-branch';
import s from './customer-profile.module.css';

type Address = {
  id: string; userId: string; area: string | null; label: string; addressLine: string; city: string; state: string;
  phone: string | null; latitude: number | null; longitude: number | null; isDefault: boolean;
};
type Envelope<T> = { success: true; data: T };
type Point = { latitude: number; longitude: number; accuracy?: number };
type AddressDraft = { area: string; label: string; addressLine: string; city: string; state: string; phone: string; isDefault: boolean; point: Point | null };
const hasPoint = (a: Pick<Address, 'latitude' | 'longitude'>): boolean =>
  typeof a.latitude === 'number' && Number.isFinite(a.latitude) && Math.abs(a.latitude) <= 90 &&
  typeof a.longitude === 'number' && Number.isFinite(a.longitude) && Math.abs(a.longitude) <= 180;
const mapUrl = (point: Point) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${point.latitude},${point.longitude}`)}`;
const activeOwner = (id: string, version: number) => {
  const current = useAuthStore.getState();
  return current.user?.id === id && current.user.role === 'CUSTOMER' && current.user.status === 'ACTIVE' && current.sessionVersion === version;
};

function ProfileSheet({ title, children, onClose, locked = false }: { title: string; children: ReactNode; onClose: () => void; locked?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = 'customer-profile-sheet-title';
  useEffect(() => {
    const el = dialog.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    el?.showModal();
    return () => { el?.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);
  return createPortal(<dialog ref={dialog} className={s.sheet} aria-labelledby={heading}
    onCancel={event => { event.preventDefault(); if (!locked) onClose(); }}
    onClick={event => { if (locked || event.target !== event.currentTarget) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); }}>
    <div className={s.sheetHandle} aria-hidden="true"/>
    <header className={s.sheetHeader}><div><h2 id={heading}>{title}</h2><p>Keep your information up to date.</p></div><button type="button" className={s.iconButton} aria-label="Close profile settings" disabled={locked} onClick={onClose}><X size={20}/></button></header>
    {children}
  </dialog>, document.body);
}

function BranchSummary() {
  const branch = useShoppingBranch();
  const [editing, setEditing] = useState(false);
  return <section id="my-branch" className={s.branchSummary} aria-label="Shopping branch">
    <span className={s.cardIcon}><MapPin size={21}/></span>
    <div><h2>Shopping branch</h2><p>{branch.loading ? 'Loading your branch…' : branch.error ? 'Your branch could not load' : branch.unavailable ? 'Choose an available branch' : branch.branch?.name ?? 'Choose your branch'}</p><small>{branch.branch ? 'Used for your next orders' : 'Save your local shopping branch'}</small></div>
    <button type="button" className={s.textButton} onClick={() => setEditing(true)}>Change <ChevronRight size={17}/></button>
    {editing && <ProfileSheet title="Your shopping branch" onClose={() => setEditing(false)}><CustomerBranchSettings sectionId="customer-profile-branch-editor"/></ProfileSheet>}
  </section>;
}

function ProfileForm({ user, onClose, onBusy }: { user: AuthUser; onClose: () => void; onBusy: (busy: boolean) => void }) {
  const client = useQueryClient(), lock = useRef(false);
  const [edits, setEdits] = useState<Partial<Pick<AuthUser, 'firstName' | 'lastName' | 'phone'>>>({});
  const firstName = edits.firstName ?? user.firstName, lastName = edits.lastName ?? user.lastName, phone = edits.phone ?? user.phone ?? '';
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    setError(''); setNotice('');
    const first = firstName.trim(), last = lastName.trim(), number = phone.trim() || null;
    if (first.length < 2 || first.length > 50 || last.length < 2 || last.length > 50) { setError('Use 2–50 characters for each name.'); return; }
    if (number && (number.length < 7 || number.length > 20)) { setError('Use 7–20 characters for your phone number.'); return; }
    const body = { ...(first !== user.firstName ? { firstName: first } : {}), ...(last !== user.lastName ? { lastName: last } : {}), ...(number !== user.phone ? { phone: number } : {}) };
    if (!Object.keys(body).length) { setNotice('Your details are already up to date.'); return; }
    const version = useAuthStore.getState().sessionVersion;
    if (!activeOwner(user.id, version)) return;
    lock.current = true; setBusy(true); onBusy(true);
    try {
      const updated = (await api.patch<MeResponse>('/users/me', body)).data.data.user;
      if (!activeOwner(user.id, version)) return;
      if (updated.id !== user.id || updated.role !== 'CUSTOMER' || updated.status !== 'ACTIVE') { setError('Your account changed. Sign in again to continue.'); return; }
      const current = useAuthStore.getState(), merged = { ...current.user!, ...updated };
      current.setUser(merged); client.setQueryData(['customer', 'profile', user.id], merged);
      setEdits({}); announceQuick(user.id,'Looking good!','Your profile changes are saved.'); onClose();
    } catch (cause) { if (activeOwner(user.id, version)) setError(getApiErrorMessage(cause)); }
    finally { lock.current = false; setBusy(false); onBusy(false); }
  }
  return <form className={s.profileForm} onSubmit={event => void save(event)} aria-label="Customer profile form">
    <div className={s.names}><label>First name<input value={firstName} onChange={e => setEdits(v => ({ ...v, firstName: e.target.value }))} required minLength={2} maxLength={50} autoComplete="given-name" disabled={busy}/></label><label>Last name<input value={lastName} onChange={e => setEdits(v => ({ ...v, lastName: e.target.value }))} required minLength={2} maxLength={50} autoComplete="family-name" disabled={busy}/></label></div>
    <label>Phone number <small>Optional</small><input type="tel" value={phone} onChange={e => setEdits(v => ({ ...v, phone: e.target.value }))} maxLength={20} autoComplete="tel" placeholder="080…" disabled={busy}/></label><p className={s.hint}>Leave this empty to remove your profile phone number. Each delivery address can have its own number.</p>
    <label>Email address<input value={user.email} readOnly aria-readonly="true" autoComplete="email"/></label><p className={s.hint}>This email is used to sign in and cannot be changed here.</p>
    {error && <p className={s.error} role="alert">{error}</p>}{notice && <p className={s.notice} role="status"><Check size={16}/>{notice}</p>}
    <div className={s.formActions}><button className={s.primary} disabled={busy}>{busy ? <Loader2 size={17} className={s.spin}/> : <Check size={17}/>} {busy ? 'Saving…' : 'Save changes'}</button><button type="button" className={s.textButton} disabled={busy} onClick={onClose}>Cancel</button></div>
  </form>;
}

function AddressEditor({ address, busy, uncertain, onSave, onClose, onRecheck }: {
  address: Address | null; busy: boolean; uncertain: boolean; onSave: (draft: AddressDraft) => Promise<void>; onClose: () => void; onRecheck: () => Promise<void>;
}) {
  const [fields, setFields] = useState({ area: address?.area ?? '', label: address?.label ?? '', addressLine: address?.addressLine ?? '', city: address?.city ?? '', state: address?.state ?? '', phone: address?.phone ?? '' });
  const [isDefault, setDefault] = useState(address?.isDefault ?? false);
  const [point, setPoint] = useState<Point | null>(() => address && hasPoint(address) ? { latitude: address.latitude!, longitude: address.longitude! } : null);
  const [locating, setLocating] = useState(false), [locationError, setLocationError] = useState(''), [error, setError] = useState('');
  const request = useRef({ generation: 0 }), first = useRef<HTMLInputElement>(null);
  useEffect(() => { const lifecycle = request.current; first.current?.focus(); return () => { lifecycle.generation++; }; }, []);
  function change(name: keyof typeof fields, value: string) {
    setFields(v => ({ ...v, [name]: value }));
    if (['area', 'addressLine', 'city', 'state'].includes(name)) { setPoint(null); setLocationError(''); }
  }
  function locate() {
    if (locating || busy || uncertain) return;
    setLocationError('');
    const token = ++request.current.generation; setLocating(true);
    getDevicePosition(position => {
      if (request.current.generation !== token) return;
      const { latitude, longitude, accuracy } = position.coords;
      if (!hasPoint({ latitude, longitude })) { setLocationError('Your phone returned an invalid location. Try again or save the written address.'); setLocating(false); return; }
      setPoint({ latitude, longitude, ...(Number.isFinite(accuracy) && accuracy >= 0 ? { accuracy } : {}) }); setLocating(false);
    }, cause => {
      if (request.current.generation !== token) return;
      setLocating(false); setLocationError(cause.code === 1 ? 'Location permission was declined. You can still save the written address.' : 'We could not get your location. Try again or save the written address.');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || locating || uncertain) return;
    const values = { area: fields.area.trim(), label: fields.label.trim(), addressLine: fields.addressLine.trim(), city: fields.city.trim(), state: fields.state.trim(), phone: fields.phone.trim() };
    if (values.area.length < 2 || values.area.length > 100 || values.label.length < 2 || values.label.length > 50 || values.addressLine.length < 5 || values.addressLine.length > 255 || values.city.length < 2 || values.city.length > 100 || values.state.length < 2 || values.state.length > 100) { setError('Please fill in the address name, delivery area, street, city and state with complete details.'); return; }
    if (values.phone && (values.phone.length < 7 || values.phone.length > 20)) { setError('Use 7–20 characters for the delivery phone number.'); return; }
    setError(''); await onSave({ ...values, isDefault, point });
  }
  return <form className={s.editor} onSubmit={event => void save(event)} aria-label={address ? 'Edit delivery address' : 'New delivery address'}>
    <div className={s.editorHeading}><div><span className={s.eyebrow}>{address ? 'A LITTLE UPDATE' : 'MAKE YOURSELF AT HOME'}</span><h3>{address ? `Edit ${address.label}` : 'Add a delivery address'}</h3></div><button type="button" className={s.iconButton} aria-label="Close address form" disabled={busy || uncertain} onClick={onClose}><X size={19}/></button></div>
    {address && <p className={s.hint}>If an order is on the way, add a new address for your next delivery instead of changing that order’s address.</p>}
    <label>Address name<input ref={first} value={fields.label} onChange={e => change('label', e.target.value)} required minLength={2} maxLength={50} placeholder="Home, work or somewhere familiar" disabled={busy || uncertain}/></label>
    <label>Street address<input value={fields.addressLine} onChange={e => change('addressLine', e.target.value)} required minLength={5} maxLength={255} autoComplete="street-address" placeholder="House number, street and a nearby landmark" disabled={busy || locating || uncertain}/></label>
    <label>Neighbourhood / delivery area<input value={fields.area} onChange={e => change('area', e.target.value)} required minLength={2} maxLength={100} placeholder="Your neighbourhood or estate name" disabled={busy || locating || uncertain}/></label><p className={s.hint}>At checkout, choose the matching area served by your branch to calculate delivery.</p>
    <div className={s.names}><label>City<input value={fields.city} onChange={e => change('city', e.target.value)} required minLength={2} maxLength={100} autoComplete="address-level2" placeholder="Ota" disabled={busy || locating || uncertain}/></label><label>State<input value={fields.state} onChange={e => change('state', e.target.value)} required minLength={2} maxLength={100} autoComplete="address-level1" placeholder="Ogun" disabled={busy || locating || uncertain}/></label></div>
    <label>Delivery phone number <small>Optional</small><input type="tel" value={fields.phone} onChange={e => change('phone', e.target.value)} maxLength={20} autoComplete="tel" placeholder="A number the rider can reach" disabled={busy || uncertain}/></label>
    <div className={s.location}><div><LocateFixed size={20}/><strong>Add a location pin <small>Optional</small></strong></div><p>Only use your current location when you’re at this delivery address. It adds a pin, so you still need to fill in the written address above.</p><button type="button" className={s.button} onClick={locate} disabled={busy || locating || uncertain}>{locating ? <Loader2 className={s.spin} size={16}/> : <LocateFixed size={16}/>} {locating ? 'Finding your location…' : 'Use my current location'}</button>
      {point && <div className={s.pin}><Check size={16}/><span>Location pin ready{point.accuracy !== undefined && <small>Reported accuracy: about {Math.round(point.accuracy)} metres</small>}</span><a href={mapUrl(point)} target="_blank" rel="noopener noreferrer">Check the map <ArrowUpRight size={14}/></a><button className={s.textButton} type="button" disabled={busy || locating || uncertain} onClick={() => setPoint(null)}>Remove pin</button></div>}{locationError && <p className={s.locationError} role="status">{locationError}</p>}
    </div>
    <label className={s.checkbox}><input type="checkbox" checked={isDefault} onChange={e => setDefault(e.target.checked)} disabled={busy || uncertain || Boolean(address?.isDefault)}/><span>Use as my default delivery address<small>{address?.isDefault ? 'This is already your default address.' : 'We’ll select this first at checkout. You can choose another there.'}</small></span></label>
    {error && <p className={s.error} role="alert">{error}</p>}
    {uncertain ? <div className={s.uncertain} role="alert"><p>We couldn’t confirm whether this address was saved. Refresh your addresses and check the list before adding it again.</p><button className={s.button} type="button" onClick={() => void onRecheck()} disabled={busy}><RefreshCw size={16}/> Refresh saved addresses</button></div> : <div className={s.formActions}><button className={s.primary} disabled={busy || locating}>{busy ? <Loader2 className={s.spin} size={17}/> : <Check size={17}/>} {busy ? 'Saving…' : 'Save address'}</button><button type="button" className={s.button} onClick={onClose} disabled={busy}>Cancel</button></div>}
  </form>;
}

function AddressBook({ owner }: { owner: string }) {
  const client = useQueryClient(), lock = useRef(false);
  const [editor, setEditor] = useState<{ address: Address | null } | null>(null), [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [uncertain, setUncertain] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const addresses = useQuery({ queryKey: ['customer', 'addresses', owner], queryFn: async ({ signal }) => (await api.get<Envelope<{ addresses: Address[] }>>('/users/me/addresses', { signal })).data.data.addresses, retry: false });
  async function task(work: (version: number) => Promise<void>) {
    if (lock.current) return;
    const version = useAuthStore.getState().sessionVersion; if (!activeOwner(owner, version)) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(version); } catch (cause) { if (activeOwner(owner, version)) setError(getApiErrorMessage(cause)); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save(draft: AddressDraft) {
    await task(async version => {
      const existing = editor?.address;
      const payload = { area: draft.area, label: draft.label, addressLine: draft.addressLine, city: draft.city, state: draft.state, ...(draft.phone ? { phone: draft.phone } : existing ? { phone: null } : {}), isDefault: draft.isDefault, ...(draft.point ? { latitude: draft.point.latitude, longitude: draft.point.longitude } : existing ? { latitude: null, longitude: null } : {}) };
      let saved: Address;
      try {
        saved = (existing ? await api.patch<Envelope<{ address: Address }>>(`/users/me/addresses/${existing.id}`, payload) : await api.post<Envelope<{ address: Address }>>('/users/me/addresses', payload)).data.data.address;
      } catch (cause) {
        if (!existing && activeOwner(owner, version) && (!axios.isAxiosError(cause) || !cause.response || cause.response.status >= 500)) setUncertain(true);
        throw cause;
      }
      if (!activeOwner(owner, version)) return;
      if (saved.userId !== owner) throw new Error('This address could not be verified for your account. Refresh your addresses.');
      setEditor(null); setNotice(existing ? 'Your address has been updated.' : 'Your delivery address has been saved.'); announceQuick(owner,'You’re on the map',existing?'Your delivery address is updated.':'Your delivery address is saved.');
      await client.invalidateQueries({ queryKey: ['customer', 'addresses', owner] });
    });
  }
  async function makeDefault(address: Address) {
    await task(async version => {
      const saved = (await api.patch<Envelope<{ address: Address }>>(`/users/me/addresses/${address.id}`, { isDefault: true })).data.data.address;
      if (!activeOwner(owner, version)) return;
      if (saved.userId !== owner || !saved.isDefault) throw new Error('Your default address could not be confirmed. Refresh your addresses.');
      setNotice(`${saved.label} is now your default delivery address.`); await client.invalidateQueries({ queryKey: ['customer', 'addresses', owner] });
    });
  }
  async function remove(address: Address) {
    await task(async version => {
      await api.delete(`/users/me/addresses/${address.id}`); if (!activeOwner(owner, version)) return;
      setRemoving(null); setNotice(`${address.label} has been removed.`); await client.invalidateQueries({ queryKey: ['customer', 'addresses', owner] });
    });
  }
  async function recheck() {
    await task(async version => {
      const result = await addresses.refetch(); if (!activeOwner(owner, version)) return;
      if (result.isError) throw result.error;
      setUncertain(false); setEditor(null); setNotice('Addresses refreshed. Check the list before adding another address.');
    });
  }
  function open(address: Address | null) { setEditor({ address }); setRemoving(null); setError(''); setNotice(''); }
  const own = (addresses.data ?? []).filter(a => a.userId === owner);
  return <section id="addresses" className={s.addressBook} aria-label="Saved delivery addresses">
    <div className={s.addressHeading}><div className={s.cardHeading}><span className={s.cardIcon}><MapPin size={22}/></span><div><h2>Delivery addresses</h2><p>{addresses.isPending ? 'Loading saved places…' : addresses.isError ? 'Your saved places' : `${own.length} saved ${own.length === 1 ? 'place' : 'places'}`}</p></div></div><button className={s.button} disabled={busy || Boolean(editor) || addresses.isError || addresses.isPending} onClick={() => open(null)}><Plus size={17}/> Add address</button></div>
    {notice && <p className={s.notice} role="status"><CheckCheck size={17}/>{notice}</p>}{error && <p className={s.error} role="alert">{error}</p>}
    {editor && <ProfileSheet title={editor.address ? `Edit ${editor.address.label}` : 'Add a delivery address'} locked={busy || uncertain} onClose={() => { setEditor(null); setError(''); }}><AddressEditor key={editor.address?.id ?? 'new'} address={editor.address} busy={busy} uncertain={uncertain} onSave={save} onClose={() => { setEditor(null); setError(''); }} onRecheck={recheck}/>{error && <p className={s.error} role="alert">{error}</p>}</ProfileSheet>}
    {addresses.isPending ? <div className={s.loading} role="status">Loading your saved addresses…<div className={s.skeleton}/></div> : addresses.isError ? <div className={s.empty} role="alert"><MapPin size={32}/><h3>Your addresses couldn’t load.</h3><p>{getApiErrorMessage(addresses.error)}</p><button className={s.button} onClick={() => void addresses.refetch()} disabled={busy}>Try again</button></div> : own.length === 0 ? <div className={s.empty}><span className={s.emptyOrb}><Home size={30}/></span><h3>Where should good energy go?</h3><p>Add your first delivery address. It will become your default automatically.</p>{!editor && <button className={s.primary} onClick={() => open(null)}><Plus size={17}/> Add your first address</button>}</div> : <div className={s.addressCards}>{own.map(address => <details key={address.id} className={s.addressCard} data-default={address.isDefault}>
      <summary><span className={s.addressIcon}>{address.label.toLowerCase().includes('work') ? <BriefcaseBusiness size={20}/> : <Home size={20}/>}</span><span className={s.addressName}>{address.label}<small>{address.area || address.city}</small></span>{address.isDefault && <span className={s.defaultBadge}><Star size={12}/> Default</span>}<ChevronRight className={s.addressChevron} size={18}/></summary><div className={s.addressExpanded}><p>{address.addressLine}</p><p>{address.area ? `${address.area}, ` : ''}{address.city}, {address.state}</p>{!address.area && <small>Choose a delivery area at checkout to complete this address.</small>}<small>{address.phone ? `Delivery phone: ${address.phone}` : 'No delivery phone saved'}</small>
      {hasPoint(address) && <a className={s.mapLink} href={mapUrl({ latitude: address.latitude!, longitude: address.longitude! })} target="_blank" rel="noopener noreferrer"><MapPin size={13}/> View saved location <ArrowUpRight size={13}/></a>}
      <div className={s.addressActions}><button className={s.textButton} disabled={busy || Boolean(editor)} onClick={() => open(address)} aria-label={`Edit ${address.label}`}><Pencil size={14}/> Edit</button>{!address.isDefault && <button className={s.textButton} disabled={busy || Boolean(editor)} onClick={() => void makeDefault(address)} aria-label={`Make ${address.label} default`}><Star size={14}/> Make default</button>}<button className={s.removeButton} disabled={busy || Boolean(editor)} onClick={() => { setRemoving(address.id); setError(''); setNotice(''); }} aria-label={`Remove ${address.label}`}><Trash2 size={14}/> Remove</button></div>
      {removing === address.id && <div className={s.confirm} role="group" aria-label={`Confirm removal of ${address.label}`}><strong>Remove {address.label}?</strong><p>You’ll need to add it again to use it for a future checkout. Addresses linked to an order may not be removable.</p><div><button className={s.button} disabled={busy} onClick={() => setRemoving(null)}>Keep address</button><button className={s.danger} disabled={busy} onClick={() => void remove(address)}>{busy ? 'Removing…' : 'Yes, remove'}</button></div></div>}
    </div></details>)}</div>}
    <div className={s.addressFooter}><ShieldCheck size={16}/><span>Your addresses are saved to your customer account.</span><button className={s.textButton} disabled={busy || uncertain || addresses.isFetching} onClick={() => void addresses.refetch()}><RefreshCw size={14}/> Refresh addresses</button></div>
  </section>;
}

function Account({ user }: { user: AuthUser }) {
  const [editing, setEditing] = useState(false), [saving, setSaving] = useState(false);
  const profile = useQuery({ queryKey: ['customer', 'profile', user.id], queryFn: async ({ signal }) => (await api.get<MeResponse>('/users/me', { signal })).data.data.user, retry: false, refetchOnWindowFocus: false });
  const verified = profile.data?.id === user.id && profile.data.role === 'CUSTOMER' && profile.data.status === 'ACTIVE';
  const display = verified ? profile.data! : user;
  return <div className={s.page}>
    <header className={s.heading}><span className={s.eyebrow}>YOUR CUSTOMER SPACE</span><h1>Your profile</h1><p>Everything you need. Right where it belongs.</p></header>
    <section className={s.hero} aria-label="Your account overview">
      <span className={s.avatar} aria-hidden="true">{display.firstName[0]}{display.lastName[0]}</span>
      <div className={s.identity}><span className={s.eyebrow}>HELLO AGAIN</span><h2>{display.firstName} {display.lastName}</h2><p><ShieldCheck size={15}/> Customer account</p></div>
      <button className={s.button} type="button" disabled={!verified || profile.isError} onClick={() => setEditing(true)}><Pencil size={16}/><span>Edit profile</span></button>
    </section>
    <div className={s.overviewGrid}>
      <section id="details" className={s.panel} aria-label="Your details"><h2>Your details</h2>
        {profile.isPending ? <p className={s.loading} role="status">Loading your details…</p> : profile.isError ? <div className={s.error} role="alert"><p>{getApiErrorMessage(profile.error)}</p><button className={s.button} onClick={() => void profile.refetch()}>Try again</button></div> : !verified ? <p className={s.error} role="alert">Your account could not be verified. Sign out and sign in again.</p> : <>
          <div className={s.detailRow}><Mail size={21}/><div><strong>Email</strong><span>{display.email}</span></div><span className={s.readonly}>Sign-in email</span></div>
          <button type="button" className={s.detailRow} onClick={() => setEditing(true)}><Phone size={21}/><span><strong>Phone</strong><span>{display.phone || 'Add a phone number'}</span></span><ChevronRight size={18}/></button>
        </>}
      </section>
      <BranchSummary/>
      <AddressBook owner={user.id}/>
      <nav className={s.shortcuts} aria-label="Account shortcuts"><Link href="/shop/orders"><Package size={20}/><span>Your orders</span><ChevronRight size={17}/></Link><Link href="/shop/notifications"><Bell size={20}/><span>Your inbox</span><ChevronRight size={17}/></Link></nav>
    </div>
    {editing && verified && <ProfileSheet title="Edit your details" locked={saving} onClose={() => setEditing(false)}><ProfileForm user={profile.data!} onClose={() => setEditing(false)} onBusy={setSaving}/></ProfileSheet>}
  </div>;
}

export function CustomerProfile() {
  const { user, hasHydrated } = useAuthStore();
  if (!hasHydrated) return <div className={s.loading} role="status">Preparing your account…</div>;
  if (user?.role !== 'CUSTOMER' || user.status !== 'ACTIVE') return <section className={s.guest}><span className={s.careOrb}><UserRound size={38}/></span><span className={s.eyebrow}>YOUR CUSTOMER SPACE</span><h1>A little more personal.</h1><p>Sign in with your customer account to manage your profile and save your delivery addresses.</p><Link href="/shop/login?next=profile" className={c.primary}>Sign in to your account <ArrowUpRight size={17}/></Link><Link className={s.textButton} href="/shop">Back to the shop</Link></section>;
  return <Account key={user.id} user={user}/>;
}
