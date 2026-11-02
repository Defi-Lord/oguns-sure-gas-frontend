'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Camera, Check, ChevronDown, MapPin, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { announceQuick } from '@/lib/experience/moment-policy';
import { useCustomerCart, useCustomerClock, validQuantity } from '@/stores/customer-cart-store';
import { useAuthStore } from '@/stores/auth-store';
import type { Product } from '@/types/product';
import type { PublicBranch } from '@/types/branch';
import s from './customer-product-sheet.module.css';

const money = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(value);

export function CustomerProductSheet({ product, branch, visual, onClose }: {
  product: Product; branch: PublicBranch; visual: ReactNode; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), scrollArea = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState('1'), [added, setAdded] = useState(''), [error, setError] = useState('');
  const bag = useCustomerCart(), user = useAuthStore(state => state.user), now = useCustomerClock();
  const quantity = Number(amount), valid = validQuantity(product.type, quantity);
  const unitPrice = Number(product.pricePerUnit), total = unitPrice * quantity;
  const priceValid = Number.isFinite(unitPrice) && unitPrice >= 0 && Number.isFinite(total);
  const locked = bag.reserving || Boolean(user && (bag.checkouts[user.id] || (bag.uncertain[user.id] ?? 0) > now));
  const differentBranch = bag.items.length > 0 && bag.branch?.id !== branch.id;
  const gas = product.type === 'GAS';
  const presets = gas ? [3, 5, 6, 12.5] : [1, 2, 3, 4];

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollX = window.scrollX, scrollY = window.scrollY;
    const body = document.body, previous = { position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, overflow: body.style.overflow };
    const viewport = window.visualViewport;
    const resize = () => {
      el.style.setProperty('--sheet-height', `${viewport?.height ?? window.innerHeight}px`);
      el.style.setProperty('--sheet-top', `${viewport?.offsetTop ?? 0}px`);
      // Keep a focused input visible above the software keyboard inside this scroll area.
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && el.contains(active)) requestAnimationFrame(() => {
        const area = scrollArea.current;
        if (!area) return;
        const inputBounds = active.getBoundingClientRect(), areaBounds = area.getBoundingClientRect();
        if (inputBounds.bottom > areaBounds.bottom - 12) area.scrollTop += inputBounds.bottom - areaBounds.bottom + 12;
        else if (inputBounds.top < areaBounds.top + 12) area.scrollTop -= areaBounds.top - inputBounds.top + 12;
      });
    };
    Object.assign(body.style, { position: 'fixed', top: `-${scrollY}px`, left: `-${scrollX}px`, width: '100%', overflow: 'hidden' });
    resize(); el.showModal();
    if (scrollArea.current) scrollArea.current.scrollTop = 0;
    viewport?.addEventListener('resize', resize); viewport?.addEventListener('scroll', resize); window.addEventListener('resize', resize);
    return () => {
      viewport?.removeEventListener('resize', resize); viewport?.removeEventListener('scroll', resize); window.removeEventListener('resize', resize);
      el.close(); Object.assign(body.style, previous); window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' }); priorFocus?.focus({ preventScroll: true });
    };
  }, []);

  function change(value: string) { setAmount(value); setAdded(''); setError(''); }
  function step(direction: number) {
    const value = Number.isFinite(quantity) ? quantity : 1;
    change(String(Math.max(1, Math.round((value + direction) * 1000) / 1000)));
  }
  function add(replace = false) {
    setAdded(''); setError('');
    if (!valid || !priceValid || !product.isActive || product.branchId !== branch.id || locked || !bag.hydrated) return;
    const current = useCustomerCart.getState();
    // Recheck current store state, including branch conflicts, at the moment of the click.
    if (current.items.length && current.branch?.id !== branch.id && !replace) { setError('Your bag now belongs to another branch. Review it before adding this product.'); return; }
    const before = current.items;
    current.add({ id: branch.id, name: branch.name, city: branch.city }, { id: product.id, name: product.name, type: product.type, unit: product.unit, price: unitPrice, quantity }, replace);
    if (useCustomerCart.getState().items === before) { setError('Your bag could not be updated. Check your reserved checkout and try again.'); return; }
    setAdded(`${amount} ${product.unit} of ${product.name} added to your bag.`);
    const owner = useAuthStore.getState().user;
    if (owner?.role === 'CUSTOMER') announceQuick(owner.id, 'Added to your bag', `${amount} ${product.unit} of ${product.name}`, 'cart');
  }

  return createPortal(<dialog ref={dialog} className={s.sheet} aria-labelledby="customer-product-title"
    style={{ '--sheet-height': '100dvh', '--sheet-top': '0px' } as CSSProperties}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target !== event.currentTarget) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); }}>
    <header className={s.header}><span className={s.handle} aria-hidden="true"/><strong>Product details</strong><button type="button" className={s.close} aria-label="Close product details" onClick={onClose}><X size={23}/></button></header>
    <div className={s.scroll} ref={scrollArea}>
      <div className={s.visual}><span className={s.halo} aria-hidden="true"/><span className={s.orbit} aria-hidden="true"/>{visual}</div>
      <div className={s.copy}>
        <span className={s.eyebrow}>{product.category?.name || (gas ? 'Cooking gas' : 'Everyday essentials')}</span>
        <h2 id="customer-product-title">{product.name}</h2>
        <p className={s.price}>{Number.isFinite(unitPrice) && unitPrice >= 0 ? money(unitPrice) : 'Price unavailable'} <span>per {product.unit}</span></p>
        <p className={s.intro}>{gas ? 'Choose the refill amount you need.' : 'An everyday essential from your MySureGas branch.'}</p>
        <div className={s.branch}><span><MapPin size={22}/></span><div><small>Your saved branch</small><strong>{branch.name}</strong></div></div>
        <section className={s.quantitySection} aria-label="Product quantity selection"><label htmlFor="customer-product-quantity">{gas ? 'How much gas?' : 'How many do you need?'}</label>
          <div className={s.stepper}><button type="button" aria-label="Decrease quantity" disabled={locked || (valid && quantity <= 1)} onClick={() => step(-1)}><Minus size={23}/></button><div><input id="customer-product-quantity" aria-label="Product quantity" inputMode={gas ? 'decimal' : 'numeric'} type="number" min="1" step={gas ? '0.001' : '1'} value={amount} disabled={locked} onChange={event => change(event.target.value)} aria-invalid={!valid} aria-describedby="customer-product-quantity-hint"/><span>{product.unit}</span></div><button type="button" aria-label="Increase quantity" disabled={locked} onClick={() => step(1)}><Plus size={23}/></button></div>
          <div className={s.presets} aria-label="Quick quantities">{presets.map(value => <button type="button" key={value} disabled={locked} aria-pressed={quantity === value} onClick={() => change(String(value))}>{value} {product.unit}</button>)}</div>
          <p id="customer-product-quantity-hint" className={valid ? s.hint : s.error}>{gas ? valid ? 'Minimum 1 kg. Decimal quantities accepted.' : 'Enter at least 1 kg, with up to 3 decimal places.' : valid ? 'Choose a whole-number quantity.' : 'Enter a whole number of at least 1.'}</p>
        </section>
        {gas && <p className={s.photoNote}><Camera size={22}/><span>Add your cylinder photo at checkout.</span></p>}
        <details className={s.about}><summary>{gas ? 'About this refill' : 'About this product'}<ChevronDown size={19}/></summary><p>{product.description || 'An everyday essential from your MySureGas branch.'}</p>{gas && <p>Cooking gas is priced per {product.unit}. Final quantity and availability are confirmed when ordering.</p>}<p>{branch.address}, {branch.city}</p></details>
        {error && <p className={s.error} role="alert">{error}</p>}
        {added && <div className={s.success} role="status"><Check size={19}/><span>{added}<Link href="/shop/cart">View your bag</Link></span></div>}
        {differentBranch && !locked && <div className={s.warning}><strong>Your bag is from another branch</strong><p>Starting a bag at {branch.name} will remove the products from {bag.branch?.name}. Your existing orders are unaffected.</p><button type="button" className={s.replace} disabled={!valid || !priceValid || !bag.hydrated} onClick={() => add(true)}>Replace bag and add this product</button><Link href="/shop/cart">Review your current bag</Link></div>}
      </div>
    </div>
    <footer className={s.footer}>
      {locked ? <div className={s.reserved}><strong>Your checkout is reserved.</strong><Link href="/shop/checkout">Resume checkout</Link></div> : <div className={s.actionRow}><div><small>Item estimate</small><strong>{valid && priceValid ? money(total) : '—'}</strong></div><button type="button" className={s.add} disabled={!valid || !priceValid || !bag.hydrated || differentBranch || !product.isActive} onClick={() => add()}><ShoppingBag size={20}/><span>{differentBranch ? 'Branch change needed' : 'Add to bag'}</span></button></div>}
      {differentBranch && !locked && <button type="button" className={s.reviewConflict} onClick={() => scrollArea.current?.scrollTo({ top: scrollArea.current.scrollHeight, behavior: 'smooth' })}>Review branch change</button>}
      <p>Delivery fee calculated at checkout.</p>
    </footer>
  </dialog>, document.body);
}
