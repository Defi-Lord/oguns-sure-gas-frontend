import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMomentQueue, notificationMoment } from '../lib/experience/moment-policy.ts';

test('weight discrepancy cues are gentle, customer scoped and do not repeat on refetch', () => {
  const notice = {
    id: 'notice-1', type: 'DELIVERY', title: 'Action needed', message: '',
    data: { event: 'GAS_DISCREPANCY_ACTION_REQUIRED', orderId: 'order', caseVersion: 'first' },
  };
  const first = notificationMoment(notice, 'CUSTOMER');
  assert.equal(first?.kind, 'gentle');
  assert.equal(first?.duration, 3000);
  assert.equal(notificationMoment(notice, 'RIDER'), null);
  const queue = createMomentQueue();
  queue.add(first);
  queue.dismiss();
  queue.add(notificationMoment({ ...notice, id: 'notice-copy' }, 'CUSTOMER'));
  assert.equal(queue.get().length, 0);
  queue.add(notificationMoment({ ...notice, data: { ...notice.data, caseVersion: 'second' } }, 'CUSTOMER'));
  assert.equal(queue.get().length, 1);
});

test('a decision or a return does not show a delivery celebration', () => {
  const notice = { id: 'notice', type: 'DELIVERY', title: '', message: '',
    data: { event: 'GAS_DISCREPANCY_UPDATED', resolution: 'ACCEPTED', orderId: 'order' } };
  assert.equal(notificationMoment(notice, 'CUSTOMER'), null);
  assert.equal(notificationMoment(notice, 'RIDER'), null);
  const delivered = { ...notice, data: { event: 'DELIVERY_STATUS_UPDATED', status: 'DELIVERED' } };
  assert.equal(notificationMoment(delivered, 'CUSTOMER')?.duration, 3000);
});
