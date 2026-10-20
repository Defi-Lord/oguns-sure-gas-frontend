'use client';

import { useState } from 'react';
import { Clipboard } from 'lucide-react';

export function StaffInvitationLink({ token }: { token: string }) {
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const copy = async () => {
    const url = `${window.location.origin}/staff/accept-invite?token=${encodeURIComponent(token)}`;
    setLink(url);
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Acceptance link copied. Share it privately with this staff member.');
    } catch {
      setMessage('Select and copy the acceptance link below.');
    }
  };
  return <section className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
    <h3 className="text-sm font-semibold text-emerald-950">Staff acceptance link</h3>
    <p className="text-sm leading-6 text-emerald-900">Share this link privately. The staff member will set a password, then wait for management approval. No email is sent automatically.</p>
    <button type="button" onClick={() => void copy()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white"><Clipboard size={16} aria-hidden="true" /> Copy acceptance link</button>
    {link && <><label htmlFor="staff-acceptance-link" className="block text-xs font-semibold text-emerald-950">Acceptance link</label><textarea id="staff-acceptance-link" readOnly value={link} className="min-h-24 w-full rounded-xl border border-emerald-200 bg-white p-3 text-xs text-slate-800" onFocus={event => event.currentTarget.select()} /><p className="text-xs leading-5 text-emerald-900">This link uses the address you opened the admin panel with. A localhost link works only on this computer.</p></>}
    <p role="status" className="text-sm text-emerald-950">{message}</p>
  </section>;
}
