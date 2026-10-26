export type Moment = { key: string; title: string; message: string; kind: 'success' | 'assignment' | 'tip' | 'reward' | 'gentle' | 'thanks'; duration: number; tipId?: string; variant?: 'saved' | 'cart' | 'checkout' | 'entry' };
type Notice = { id: string; type: string; title: string; message: string; data: unknown };
export function notificationMoment(n: Notice, role: string): Moment | null {
  const d = n.data && typeof n.data === 'object' && !Array.isArray(n.data) ? n.data as Record<string, unknown> : {};
  const str = (key: string) => typeof d[key] === 'string' ? String(d[key]).slice(0, 160) : '';
  const event = str('event'), status = str('status'), order = str('orderNumber'), orderId = str('orderId') || str('deliveryId') || n.id;
  const key = (stage: string) => `${role}:${orderId}:${stage}`;
  if (role === 'RIDER') {
    if (event === 'DELIVERY_ASSIGNED_TO_RIDER') return { key: `assignment:${n.id}`, title: 'A new delivery for you', message: `${order || 'Your new order'} is ready to review in Deliveries.`, kind: 'assignment', duration: 3000 };
    if (event === 'RIDER_TIP_PAID' && str('riderTipId')) return { key: `tip:${str('riderTipId')}`, title: 'You got tipped!', message: `${order || 'A completed delivery'} · Thank you for sharing good energy.`, kind: 'tip', tipId: str('riderTipId'), duration: 8000 };
    if (event === 'DELIVERY_STATUS_UPDATED_FOR_RIDER' && status === 'PICKED_UP') return { key: key(status), title: 'Pickup confirmed', message: order || 'Your delivery is up to date.', kind: 'success', duration: 1000 };
    if (event === 'DELIVERY_STATUS_UPDATED_FOR_RIDER' && status === 'DELIVERED') return { key: key(status), title: 'Well done!', message: `${order || 'Your order'} delivered. Another doorstep, another smile.`, kind: 'success', duration: 3000 };
    return null;
  }
  if (role !== 'CUSTOMER') return null;
  if (event === 'RIDER_TIP_THANKED') return { key: `thanks:${str('riderTipId') || n.id}`, title: `${str('riderName') || 'Your rider'} says thank you!`, message: `${order || 'Your delivery'} · Your kindness made their day.`, kind: 'thanks', duration: 4000 };
  if (event === 'CAMPAIGN_GIVEAWAY_WINNER') return { key: `winner:${str('voucherId') || str('campaignId') || n.id}`, title: 'You won a giveaway!', message: 'Your reward is waiting in My vouchers. Check its expiry and redemption details.', kind: 'reward', duration: 5000 };
  if (event === 'CAMPAIGN_ENTRY_QUALIFIED') return { key: `qualified:${str('campaignEntryId') || n.id}`, title: 'Your tasks are approved', message: 'Thank you for taking part. Winner selection is still pending.', kind: 'gentle', duration: 3500 };
  if (event === 'CAMPAIGN_ENTRY_DISQUALIFIED' || event === 'CAMPAIGN_GIVEAWAY_NOT_SELECTED') return { key: `entry-result:${n.id}`, title: 'Thank you for taking part', message: event === 'CAMPAIGN_ENTRY_DISQUALIFIED' ? 'This entry was not approved. Check the giveaway instructions in your inbox.' : 'No reward this round. Watch Giveaways for your next opportunity.', kind: 'gentle', duration: 4000 };
  if (['ORDER', 'DELIVERY'].includes(n.type) && status === 'DELIVERED') return { key: key('DELIVERED'), title: 'Good energy, delivered!', message: `${order || 'Your order'} has arrived. Thank you for choosing MySureGas.`, kind: 'success', duration: 3000 };
  if (n.type === 'ORDER' && status === 'CONFIRMED') return { key: key(status), title: 'You’re all set!', message: `${order || 'Your order'} is confirmed. Thank you for shopping with us.`, kind: 'thanks', duration: 3000 };
  if (n.type === 'ORDER' && status === 'PENDING' && n.title === 'Order placed successfully') return { key: key('CREATED'), title: 'Thank you for your order', message: `${order || 'Your order'} was placed and is awaiting confirmation.`, kind: 'thanks', duration: 3000 };
  return null;
}

// A bounded, per-session queue. A refetch cannot replay the same business milestone.
export function createMomentQueue() {
  let items: Moment[] = [];
  const seen = new Set<string>(), listeners = new Set<() => void>();
  return {
    get: () => items,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    add: (item: Moment) => { if (seen.has(item.key)) return; seen.add(item.key); items = [...items, item].slice(0, 6); listeners.forEach(fn => fn()); },
    dismiss: () => { items = items.slice(1); listeners.forEach(fn => fn()); },
  };
}
export function announceMoment(owner: string, moment: Moment) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mysuregas:moment', { detail: { owner, moment } }));
}

// Small confirmations for explicit user actions; never emitted for failed requests.
export function announceQuick(owner: string, title: string, message: string, variant: Moment['variant'] = 'saved') {
  announceMoment(owner, { key: `quick:${crypto.randomUUID()}`, title, message, kind: 'gentle', duration: 1800, variant });
}
