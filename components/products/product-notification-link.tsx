'use client';
import Link from 'next/link';
export function ProductNotificationLink({ data, portal }: { data: unknown; portal: 'staff' | 'admin' }) {
  if (!data || typeof data !== 'object' || !('event' in data)) return null;
  if (data.event !== 'PRODUCT_SUBMISSION_UPDATED' && data.event !== 'INVENTORY_STATUS_CHANGED') return null;
  const stock = data.event === 'INVENTORY_STATUS_CHANGED';
  return <Link href={portal === 'staff' ? '/staff/products' : stock ? '/admin/inventory' : '/admin/product-submissions'}>{stock ? 'View branch stock' : 'View product submissions'} ↗</Link>;
}
