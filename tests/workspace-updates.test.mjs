import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { canCatchUpQuery, notificationAffectsQuery, workspaceChangeAffectsQuery } from '../lib/realtime/workspace-updates.ts';

for (const scenario of [
  {
    name: 'a delivery assignment refreshes the rider list and inbox, leaving the wallet alone',
    update: { type: 'DELIVERY', data: { event: 'DELIVERY_ASSIGNED_TO_RIDER' } },
    targets: [['rider', 'deliveries', 'rider-1'], ['rider', 'notifications', 'rider-1', 'count']],
    unaffected: ['rider', 'wallet', 'rider-1', 1],
  },
  {
    name: 'a paid tip refreshes tip history and the wallet, leaving deliveries alone',
    update: { type: 'PAYMENT', data: { event: 'RIDER_TIP_PAID' } },
    targets: [['rider', 'received-tips', 'rider-1', 'paid', 2], ['rider', 'wallet', 'rider-1', 1]],
    unaffected: ['rider', 'deliveries', 'rider-1'],
  },
]) {
  test(scenario.name, async () => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    let result = 'before';
    const queries = [...scenario.targets, scenario.unaffected].map((queryKey) => {
      const observer = new QueryObserver(client, { queryKey, queryFn: async () => result });
      return { observer, unsubscribe: observer.subscribe(() => {}) };
    });
    const inactive = [...scenario.targets[0], 'other-page'];
    client.setQueryData(inactive, 'before');
    try {
      await Promise.all(queries.map(({ observer }) => observer.refetch()));
      result = 'after';
      await client.invalidateQueries({
        predicate: (query) => notificationAffectsQuery(scenario.update, query.queryKey),
      });
      assert.deepEqual(queries.map(({ observer }) => observer.getCurrentResult().data),
        ['after', 'after', 'before']);
      assert.equal(client.getQueryState(inactive).isInvalidated, true);
    } finally {
      for (const query of queries) query.unsubscribe();
      client.clear();
    }
  });
}

test('order updates reach customer, staff and admin namespace keys without inspecting filters', () => {
  const update = { type: 'ORDER', data: { event: 'ORDER_STATUS_UPDATED' } };
  for (const key of [
    ['customer', 'order', 'account', 'order-id'],
    ['staff', 'orders', 'account', 'detail'],
    ['admin-orders'],
    ['super-admin', 'dashboard', 'orders'],
  ]) assert.equal(notificationAffectsQuery(update, key), true);
  assert.equal(notificationAffectsQuery(update, ['customer', 'addresses', 'orders']), false);
  assert.equal(canCatchUpQuery(['support-draft', 'account']), false);
  assert.equal(canCatchUpQuery(['customer', 'tracking', 'account']), false);
});

test('management mutations refresh catalogue, delivery zones, finance and staff screens independently', () => {
  for (const [domain, key] of [
    ['catalogue', ['customer', 'public-products', 'branch']],
    ['inventory', ['admin-inventory']],
    ['delivery-zones', ['customer', 'delivery-areas', 'account', 'branch']],
    ['finance', ['finance-refunds']],
    ['accounts', ['admin-staff']],
    ['campaigns', ['customer', 'vouchers']],
    ['support', ['order-support', 'account', 'case', 'id']],
  ]) assert.equal(workspaceChangeAffectsQuery(domain, key), true);
  assert.equal(workspaceChangeAffectsQuery('catalogue', ['rider', 'wallet', 'rider-1']), false);
  assert.equal(workspaceChangeAffectsQuery('constructor', ['admin', 'orders']), false);
});
