'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, Bike, CheckCircle2, ChevronRight, CircleDot, Clock3,
  MapPin, Package, PackageCheck, RefreshCw, Search, ShieldCheck,
  Truck, UserRound, X,
} from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import type { DeliveriesResponse, Delivery, DeliveryStatus } from '@/types/delivery';

interface RiderSummary {
  id: string;
  branchId: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  isAvailable: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    status: string;
    role: string;
  };
}
interface RidersResponse {
  success: boolean;
  message: string;
  data: { riders: RiderSummary[] };
}

const deliveryStatuses: DeliveryStatus[] = [
  'PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED',
];
const statusLabels: Record<DeliveryStatus, string> = {
  PENDING: 'Pending', ASSIGNED: 'Assigned', PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit', DELIVERED: 'Delivered', FAILED: 'Failed', CANCELLED: 'Cancelled',
};
const statusClasses: Record<DeliveryStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-400/10 dark:text-amber-300',
  ASSIGNED: 'bg-sky-50 text-sky-700 ring-sky-600/10 dark:bg-sky-400/10 dark:text-sky-300',
  PICKED_UP: 'bg-violet-50 text-violet-700 ring-violet-600/10 dark:bg-violet-400/10 dark:text-violet-300',
  IN_TRANSIT: 'bg-indigo-50 text-indigo-700 ring-indigo-600/10 dark:bg-indigo-400/10 dark:text-indigo-300',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-400/10 dark:text-emerald-300',
  FAILED: 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-400/10 dark:text-rose-300',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-white/[0.06] dark:text-slate-300',
};
const lifecycle: DeliveryStatus[] = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const customerName = (d: Delivery) =>
  [d.order.customer.firstName, d.order.customer.lastName].filter(Boolean).join(' ') || 'Customer';
const riderName = (d: Delivery) =>
  d.rider ? [d.rider.user.firstName, d.rider.user.lastName].filter(Boolean).join(' ') || 'Rider' : 'Awaiting assignment';
const summaryRiderName = (r: RiderSummary) =>
  [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || 'Rider';
const kg = (value: number | null | undefined) =>
  value == null ? '—' : `${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(value)} kg`;

function StatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1.5 break-words text-xs font-semibold leading-5 text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

function DeliveryDrawer({
  delivery, onClose, onAssign,
}: {
  delivery: Delivery | null;
  onClose: () => void;
  onAssign: (delivery: Delivery) => void;
}) {
  if (!delivery) return null;
  const current = lifecycle.indexOf(delivery.status);
  const address = delivery.order.deliveryAddress;

  return (
    <AnimatePresence>
      <>
        <motion.button
          type="button" aria-label="Close delivery details"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] bg-slate-950/30 backdrop-blur-[2px]"
        />
        <motion.aside
          role="dialog" aria-modal="true"
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[640px] flex-col border-l border-slate-200 bg-[#f7faf9] shadow-[-30px_0_90px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[#071814]"
        >
          <header className="border-b border-slate-200/70 bg-white/90 px-5 py-5 backdrop-blur-xl sm:px-6 dark:border-white/8 dark:bg-[#0b211b]/95">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-10 items-center justify-center rounded-[15px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Truck className="size-4" /></span>
                  <StatusBadge status={delivery.status} />
                </div>
                <h2 className="mt-3 font-serif text-xl font-semibold text-slate-950 sm:text-2xl dark:text-white">{delivery.order.orderNumber}</h2>
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">Delivery ID: {delivery.id}</p>
              </div>
              <button type="button" onClick={onClose} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <X className="size-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 dark:border-white/[0.07] dark:bg-[#0b211b]">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white"><CircleDot className="size-4 text-emerald-600" /> Delivery lifecycle</h3>
              {delivery.status === 'FAILED' || delivery.status === 'CANCELLED' ? (
                <div className="mt-4 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  This delivery is {statusLabels[delivery.status].toLowerCase()}.
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-5 gap-1">
                  {lifecycle.map((status, index) => {
                    const reached = current >= index;
                    return (
                      <div key={status} className="min-w-0 text-center">
                        <div className={`mx-auto flex size-7 items-center justify-center rounded-full border text-[10px] font-bold ${reached ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5'}`}>
                          {reached ? '✓' : index + 1}
                        </div>
                        <p className="mt-2 truncate text-[9px] font-semibold text-slate-500 dark:text-slate-400">{statusLabels[status]}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-white/[0.06]">
                <Detail label="Created" value={formatDate(delivery.createdAt)} />
                <Detail label="Last updated" value={formatDate(delivery.updatedAt)} />
                <Detail label="Pickup time" value={formatDate(delivery.pickupTime)} />
                <Detail label="Delivered time" value={formatDate(delivery.deliveredTime)} />
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 dark:border-white/[0.07] dark:bg-[#0b211b]">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white"><UserRound className="size-4 text-emerald-600" /> Customer & destination</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Detail label="Customer" value={customerName(delivery)} />
                <Detail label="Contact" value={delivery.order.customer.phone ?? delivery.order.customer.email ?? '—'} />
                <div className="sm:col-span-2">
                  <Detail label="Delivery address" value={[address.addressLine, address.area, address.city, address.state].filter(Boolean).join(', ')} />
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 dark:border-white/[0.07] dark:bg-[#0b211b]">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white"><Package className="size-4 text-emerald-600" /> Order items</h3>
              <div className="mt-4 divide-y divide-slate-100 dark:divide-white/[0.06]">
                {delivery.order.items.length ? delivery.order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{item.product?.name ?? 'Product'}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{item.product?.sku ?? item.productId}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">Qty {item.quantity}</span>
                  </div>
                )) : <p className="text-xs text-slate-400">No order items returned.</p>}
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 dark:border-white/[0.07] dark:bg-[#0b211b]">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white"><MapPin className="size-4 text-emerald-600" /> Fulfilment branch</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Detail label="Branch" value={delivery.branch.name} /><Detail label="Code" value={delivery.branch.code} />
                <Detail label="City" value={delivery.branch.city} /><Detail label="State" value={delivery.branch.state} />
              </div>
            </section>

            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 dark:border-white/[0.07] dark:bg-[#0b211b]">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white"><Bike className="size-4 text-emerald-600" /> Rider</h3>
              {delivery.rider ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Detail label="Rider" value={riderName(delivery)} /><Detail label="Phone" value={delivery.rider.user.phone ?? '—'} />
                  <Detail label="Vehicle" value={delivery.rider.vehicleType ?? '—'} /><Detail label="Vehicle number" value={delivery.rider.vehicleNumber ?? '—'} />
                </div>
              ) : (
                <div className="mt-4">
                  <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                    Waiting for a rider. Only available riders from {delivery.branch.name} will be offered.
                  </div>
                  {delivery.status === 'PENDING' ? (
                    <button type="button" onClick={() => onAssign(delivery)} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#0b5f46] px-5 text-xs font-bold text-white shadow-md transition hover:bg-[#084d3a]">
                      <Bike className="size-3.5" /> Assign available rider
                    </button>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 dark:border-white/[0.07] dark:bg-[#0b211b]">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white"><ShieldCheck className="size-4 text-emerald-600" /> Gas verification</h3>
              {delivery.gasVerification ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Detail label="Verification status" value={delivery.gasVerification.verificationStatus} />
                  <Detail label="Expected gas" value={kg(delivery.gasVerification.expectedGasKg)} />
                  <Detail label="Pickup weight" value={kg(delivery.gasVerification.pickupWeightKg)} />
                  <Detail label="Delivery weight" value={kg(delivery.gasVerification.deliveryWeightKg)} />
                  <Detail label="Gas supplied" value={kg(delivery.gasVerification.gasSuppliedKg)} />
                  <Detail label="Discrepancy" value={kg(delivery.gasVerification.discrepancyKg)} />
                  <div className="sm:col-span-2"><Detail label="Notes" value={delivery.gasVerification.verificationNotes ?? delivery.gasVerification.riderNotes ?? 'No notes'} /></div>
                </div>
              ) : <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">No gas-verification record is attached to this delivery.</p>}
            </section>

            <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 dark:border-white/[0.07] dark:bg-[#0b211b]">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">Delivery notes</h3>
              <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">{delivery.deliveryNotes ?? 'No delivery notes have been recorded.'}</p>
            </section>

            {delivery.status !== 'PENDING' ? (
              <div className="rounded-[20px] border border-sky-200/70 bg-sky-50/60 p-4 text-xs leading-5 text-sky-800 dark:border-sky-500/15 dark:bg-sky-500/[0.055] dark:text-sky-200">
                Delivery progress after rider assignment is controlled by the delivery/rider workflow. This command center monitors that lifecycle rather than bypassing it.
              </div>
            ) : null}
          </div>
        </motion.aside>
      </>
    </AnimatePresence>
  );
}

export function DeliveriesCommandCenter() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'ALL'>('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [assignmentDelivery, setAssignmentDelivery] = useState<Delivery | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [assignmentError, setAssignmentError] = useState('');

  const deliveriesQuery = useQuery({
    queryKey: ['admin-deliveries'],
    queryFn: async () => {
      const response = await api.get<DeliveriesResponse>('/deliveries');
      return response.data.data.deliveries ?? [];
    },
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });
  const deliveries = deliveriesQuery.data ?? [];
  const selectedDelivery = deliveries.find((d) => d.id === selectedDeliveryId) ?? null;

  const branches = useMemo(() => {
    const map = new Map<string, string>();
    deliveries.forEach((d) => map.set(d.branch.id, d.branch.name));
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [deliveries]);

  const filteredDeliveries = useMemo(() => {
    const term = search.trim().toLowerCase();
    return deliveries.filter((d) => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (branchFilter !== 'ALL' && d.branchId !== branchFilter) return false;
      if (!term) return true;
      return [
        d.order.orderNumber, customerName(d), d.order.customer.phone, d.order.customer.email,
        d.branch.name, d.branch.code, riderName(d), d.rider?.vehicleNumber,
      ].filter(Boolean).join(' ').toLowerCase().includes(term);
    });
  }, [branchFilter, deliveries, search, statusFilter]);

  const metrics = useMemo(() => ({
    total: deliveries.length,
    awaiting: deliveries.filter((d) => d.status === 'PENDING').length,
    active: deliveries.filter((d) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
    completed: deliveries.filter((d) => d.status === 'DELIVERED').length,
  }), [deliveries]);

  const ridersQuery = useQuery({
    queryKey: ['delivery-assignment-riders', assignmentDelivery?.branchId],
    enabled: Boolean(assignmentDelivery?.branchId),
    queryFn: async () => {
      if (!assignmentDelivery) return [];
      const response = await api.get<RidersResponse>('/riders', {
        params: { branchId: assignmentDelivery.branchId, isAvailable: true },
      });
      return response.data.data.riders ?? [];
    },
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const assignRiderMutation = useMutation({
    mutationFn: async ({ deliveryId, riderId }: { deliveryId: string; riderId: string }) => {
      await api.patch(`/deliveries/${deliveryId}/rider`, { riderId });
      const refreshed = await api.get<DeliveriesResponse>('/deliveries');
      return refreshed.data.data.deliveries ?? [];
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Delivery[]>(['admin-deliveries'], updated);
      setAssignmentDelivery(null); setSelectedRiderId(''); setAssignmentError('');
      void queryClient.invalidateQueries({ queryKey: ['admin-deliveries'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (error) => setAssignmentError(getApiErrorMessage(error)),
  });

  const openAssignment = (delivery: Delivery) => {
    if (delivery.status !== 'PENDING' || delivery.rider) return;
    setSelectedRiderId(''); setAssignmentError(''); setAssignmentDelivery(delivery);
  };
  const closeAssignment = () => {
    if (assignRiderMutation.isPending) return;
    setAssignmentDelivery(null); setSelectedRiderId(''); setAssignmentError('');
  };
  const confirmAssignment = () => {
    if (!assignmentDelivery || !selectedRiderId) return;
    const rider = ridersQuery.data?.find((r) => r.id === selectedRiderId);
    if (!rider) return setAssignmentError('Select an available rider before continuing.');
    if (!window.confirm(`Assign ${summaryRiderName(rider)} to ${assignmentDelivery.order.orderNumber}?`)) return;
    setAssignmentError('');
    assignRiderMutation.mutate({ deliveryId: assignmentDelivery.id, riderId: selectedRiderId });
  };
  const filtersActive = Boolean(search.trim()) || statusFilter !== 'ALL' || branchFilter !== 'ALL';
  const clearFilters = () => { setSearch(''); setStatusFilter('ALL'); setBranchFilter('ALL'); };

  return (
    <>
      <section className="space-y-5 py-5 sm:py-6">
        <div className="overflow-hidden rounded-[26px] border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/50 to-lime-50/50 p-5 shadow-[0_20px_60px_rgba(15,118,110,0.08)] sm:p-6 dark:border-white/[0.07] dark:from-[#0b211b] dark:via-[#0a241c] dark:to-[#0b1d18]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-400/15 dark:bg-white/[0.05] dark:text-emerald-300"><CircleDot className="size-3.5" /> Logistics command center</div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-white">Deliveries</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Monitor dispatch operations, rider assignments, delivery progress and gas verification from one operational view.</p>
            </div>
            <button type="button" onClick={() => deliveriesQuery.refetch()} disabled={deliveriesQuery.isFetching} className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200">
              <RefreshCw className={`size-4 ${deliveriesQuery.isFetching ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Total deliveries', metrics.total, Truck, 'All delivery records'],
            ['Awaiting rider', metrics.awaiting, Clock3, 'Pending assignment'],
            ['Active dispatch', metrics.active, Bike, 'Assigned or moving'],
            ['Delivered', metrics.completed, PackageCheck, 'Completed successfully'],
          ].map(([label, value, Icon, detail]) => {
            const MetricIcon = Icon as typeof Truck;
            return (
              <article key={String(label)} className="rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.04)] dark:border-white/[0.07] dark:bg-[#0b211b]">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{String(label)}</p><p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{Number(value)}</p><p className="mt-1 text-[11px] text-slate-400">{String(detail)}</p></div>
                  <div className="flex size-10 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><MetricIcon className="size-[18px]" /></div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 dark:border-white/[0.07] dark:bg-[#0b211b]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, customer, branch, rider or vehicle..." className="h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-xs outline-none focus:border-emerald-300 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white" /></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | 'ALL')} className="h-11 rounded-[14px] border border-slate-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"><option value="ALL">All statuses</option>{deliveryStatuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}</select>
            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="h-11 rounded-[14px] border border-slate-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"><option value="ALL">All branches</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            {filtersActive ? <button type="button" onClick={clearFilters} className="h-11 rounded-[14px] border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">Clear</button> : null}
          </div>
        </div>

        {deliveriesQuery.isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-slate-200/80 bg-white dark:border-white/[0.07] dark:bg-[#0b211b]"><RefreshCw className="size-6 animate-spin text-emerald-600" /></div>
        ) : deliveriesQuery.isError ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"><AlertCircle className="mr-2 inline size-5" />{getApiErrorMessage(deliveriesQuery.error)}</div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm lg:block dark:border-white/[0.07] dark:bg-[#0b211b]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead className="border-b border-slate-100 bg-slate-50/70 dark:border-white/[0.06] dark:bg-white/[0.025]"><tr className="text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400"><th className="px-5 py-4">Order</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Branch</th><th className="px-5 py-4">Rider</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Verification</th><th className="px-5 py-4">Created</th><th /></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.055]">
                    {filteredDeliveries.map((d) => (
                      <tr key={d.id} tabIndex={0} role="button" onClick={() => setSelectedDeliveryId(d.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedDeliveryId(d.id); }} className="cursor-pointer transition hover:bg-emerald-50/30 focus:outline-none dark:hover:bg-white/[0.025]">
                        <td className="px-5 py-4"><p className="text-xs font-bold text-slate-900 dark:text-white">{d.order.orderNumber}</p><p className="mt-1 max-w-[160px] truncate text-[10px] text-slate-400">{d.id}</p></td>
                        <td className="px-5 py-4"><p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{customerName(d)}</p><p className="mt-1 text-[10px] text-slate-400">{d.order.customer.phone ?? d.order.customer.email}</p></td>
                        <td className="px-5 py-4"><p className="text-xs font-medium text-slate-700 dark:text-slate-300">{d.branch.name}</p><p className="mt-1 text-[10px] text-slate-400">{d.branch.code}</p></td>
                        <td className="px-5 py-4"><p className="text-xs font-medium text-slate-700 dark:text-slate-300">{riderName(d)}</p><p className="mt-1 text-[10px] text-slate-400">{d.rider?.vehicleNumber ?? ''}</p></td>
                        <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                        <td className="px-5 py-4 text-[11px] text-slate-500">{d.gasVerification ? <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-600" />{d.gasVerification.verificationStatus}</span> : 'Not required'}</td>
                        <td className="px-5 py-4 text-[11px] text-slate-500">{formatDate(d.createdAt)}</td>
                        <td className="px-5 py-4"><ChevronRight className="size-4 text-slate-300" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 lg:hidden">
              {filteredDeliveries.map((d) => (
                <button type="button" key={d.id} onClick={() => setSelectedDeliveryId(d.id)} className="rounded-[20px] border border-slate-200/80 bg-white p-4 text-left shadow-sm dark:border-white/[0.07] dark:bg-[#0b211b]">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-slate-900 dark:text-white">{d.order.orderNumber}</p><p className="mt-1 text-[11px] text-slate-400">{customerName(d)}</p></div><StatusBadge status={d.status} /></div>
                  <div className="mt-4 grid gap-3 rounded-[16px] bg-slate-50 p-3 text-[11px] dark:bg-white/[0.035]"><div className="flex items-center gap-2"><MapPin className="size-3.5 text-emerald-600" />{d.branch.name}</div><div className="flex items-center gap-2"><Bike className="size-3.5 text-emerald-600" />{riderName(d)}</div></div>
                  <div className="mt-4 flex items-center justify-between"><span className="text-[10px] text-slate-400">{formatDate(d.createdAt)}</span><ChevronRight className="size-4 text-slate-300" /></div>
                </button>
              ))}
            </div>

            {!filteredDeliveries.length ? <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.025]"><CheckCircle2 className="mx-auto size-7 text-emerald-500" /><h2 className="mt-3 text-sm font-semibold">No deliveries match</h2>{filtersActive ? <button type="button" onClick={clearFilters} className="mt-4 rounded-full bg-[#0b5f46] px-4 py-2 text-xs font-bold text-white">Clear filters</button> : null}</div> : null}
          </>
        )}
      </section>

      <DeliveryDrawer delivery={selectedDelivery} onClose={() => setSelectedDeliveryId(null)} onAssign={openAssignment} />

      <AnimatePresence>
        {assignmentDelivery ? (
          <>
            <motion.button type="button" aria-label="Close rider assignment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAssignment} className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-[3px]" />
            <motion.div role="dialog" aria-modal="true" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.98 }} className="fixed inset-x-3 bottom-3 z-[100] max-h-[88vh] overflow-hidden rounded-[28px] border border-white/80 bg-[#f7faf9] shadow-[0_30px_100px_rgba(2,44,33,0.28)] sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(680px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 dark:border-white/10 dark:bg-[#071814]">
              <div className="border-b border-slate-200/70 bg-white/75 px-5 py-5 dark:border-white/8 dark:bg-white/[0.035]">
                <div className="flex items-start justify-between gap-4"><div><h2 className="font-serif text-xl font-semibold text-slate-950 dark:text-white">Assign rider</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Available riders for {assignmentDelivery.branch.name}. Backend validation remains authoritative.</p></div><button type="button" onClick={closeAssignment} disabled={assignRiderMutation.isPending} className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"><X className="size-4" /></button></div>
              </div>
              <div className="max-h-[52vh] overflow-y-auto p-4 sm:p-5">
                {ridersQuery.isLoading ? <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-slate-500"><RefreshCw className="size-4 animate-spin" />Loading available riders...</div>
                : ridersQuery.isError ? <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Available riders could not be loaded. <button type="button" onClick={() => ridersQuery.refetch()} className="font-bold underline">Try again</button></div>
                : !(ridersQuery.data?.length ?? 0) ? <div className="flex min-h-44 flex-col items-center justify-center text-center"><Bike className="size-7 text-slate-400" /><p className="mt-3 font-semibold">No available riders</p></div>
                : <div className="grid gap-3 sm:grid-cols-2">{ridersQuery.data?.map((r) => {
                    const active = selectedRiderId === r.id;
                    return <button key={r.id} type="button" onClick={() => { setSelectedRiderId(r.id); setAssignmentError(''); }} className={`rounded-[20px] border p-4 text-left transition ${active ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 bg-white dark:border-white/8 dark:bg-white/[0.04]'}`}><p className="text-sm font-bold text-slate-950 dark:text-white">{summaryRiderName(r)}</p><p className="mt-1 text-[11px] text-slate-500">{r.vehicleType ?? 'Vehicle'} · {r.vehicleNumber ?? 'No plate'}</p><p className="mt-1 text-[10px] text-slate-400">{r.user.phone ?? r.user.email}</p></button>;
                  })}</div>}
                {assignmentError ? <div className="mt-4 flex gap-2 rounded-[16px] border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle className="size-4 shrink-0" />{assignmentError}</div> : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200/70 bg-white/75 px-4 py-4 dark:border-white/8 dark:bg-white/[0.035]">
                <button type="button" onClick={closeAssignment} disabled={assignRiderMutation.isPending} className="h-11 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold dark:border-white/10 dark:bg-white/5">Cancel</button>
                <button type="button" onClick={confirmAssignment} disabled={!selectedRiderId || assignRiderMutation.isPending} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0b5f46] px-5 text-xs font-bold text-white disabled:opacity-50">{assignRiderMutation.isPending ? <RefreshCw className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}Confirm assignment</button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
