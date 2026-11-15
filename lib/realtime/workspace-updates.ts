import type { NotificationRecord } from '@/types/notification';

const scopedKeys = new Set(['customer', 'rider', 'staff', 'admin', 'super-admin', 'branch-manager']);
const inbox = /^(notifications?|moments)$/;
const orders = /(^|-)(orders?|checkout|deliver(y|ies)|gas-returns|riders|analytics|reports?|inventory|stock)(-|$)/;
const money = /(^|-)(payments?|finance|refunds?|wallet|payouts?|settlements?|analytics|reports?)(-|$)/;
const tips = /^(received-tips|rider-tip|wallet)$/;
const products = /(^|-)(products?|catalogue|categories|stock|inventory|submissions)(-|$)/;
const campaigns = /(^|-)(campaigns?|giveaways?|vouchers?)(-|$)/;
const people = /(^|-)(staff|branches|riders?|availability|profile|session)(-|$)/;
const support = /(^|-)support(-|$)/;

function matches(key: readonly unknown[], group: RegExp): boolean {
  // Inspect namespaces only, never record IDs, filters or user input.
  const first = typeof key[0] === 'string' ? key[0] : '';
  const second = typeof key[1] === 'string' ? key[1] : '';
  return scopedKeys.has(first)
    ? group.test(second) || (second === 'dashboard' && typeof key[2] === 'string' && group.test(key[2]))
    : group.test(first);
}

export function canCatchUpQuery(key: readonly unknown[]): boolean {
  return key[0] !== 'support-draft'
    && !(key[0] === 'customer' && key[1] === 'tracking')
    && !(key[0] === 'rider' && key[1] === 'wallet-banks');
}

export function notificationAffectsQuery(
  notification: Pick<NotificationRecord, 'type' | 'data'>,
  key: readonly unknown[],
): boolean {
  if (matches(key, inbox)) return true;
  if (!canCatchUpQuery(key)) return false;

  const { data, type } = notification;
  const event = data && typeof data === 'object' && !Array.isArray(data)
    && typeof data.event === 'string' ? data.event : '';

  if (event.startsWith('RIDER_TIP_')) return matches(key, tips) || matches(key, money);
  if (event.startsWith('ORDER_SUPPORT_')) return matches(key, support);
  if (/^(PRODUCT_|INVENTORY_)/.test(event)) return matches(key, products);
  if (/^(CAMPAIGN_|VOUCHER_)/.test(event) || type === 'PROMOTION') return matches(key, campaigns);
  if (/^(STAFF_|BRANCH_|RIDER_ACCOUNT_|RIDER_AVAILABILITY_|ACCOUNT_)/.test(event)) {
    return matches(key, people);
  }
  if (type === 'PAYMENT' || /^(PAYMENT_|REFUND_|PAYOUT_)/.test(event)) {
    return matches(key, money) || matches(key, orders);
  }
  if (type === 'ORDER' || type === 'DELIVERY' || /^(ORDER_|DELIVERY_|GAS_)/.test(event)) {
    return matches(key, orders);
  }
  return false;
}
