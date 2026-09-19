'use client';

import {
  useMemo,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  AlertCircle,
  Boxes,
  Building2,
  Check,
  CircleAlert,
  CirclePlus,
  Edit3,
  Minus,
  PackageCheck,
  PackagePlus,
  Plus,
  Search,
  SlidersHorizontal,
  Warehouse,
  X,
} from 'lucide-react';

import {
  getManagementBranches,
} from '@/lib/api/branches';

import {
  getManagementProducts,
} from '@/lib/api/products';

import {
  createInventory,
  getInventories,
  updateInventory,
  updateInventoryStock,
} from '@/lib/api/inventory';

import {
  useAuthStore,
} from '@/stores/auth-store';

import type {
  Product,
} from '@/types/product';

import type {
  CreateInventoryInput,
  InventoryRecord,
  InventoryStatus,
} from '@/types/inventory';


const statusLabels: Record<
  InventoryStatus,
  string
> = {
  IN_STOCK: 'In stock',
  LOW_STOCK: 'Low stock',
  OUT_OF_STOCK: 'Out of stock',
};

const statusClasses: Record<
  InventoryStatus,
  string
> = {
  IN_STOCK:
    'bg-emerald-50 text-emerald-700',
  LOW_STOCK:
    'bg-amber-50 text-amber-700',
  OUT_OF_STOCK:
    'bg-rose-50 text-rose-700',
};


const getErrorMessage = (
  error: unknown,
): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: unknown;
          };
        };
      }
    ).response;

    if (
      typeof response?.data?.message ===
      'string'
    ) {
      return response.data.message;
    }
  }

  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};


type Notice = {
  type: 'success' | 'error';
  message: string;
} | null;


type StockAction =
  | 'ADD'
  | 'REMOVE'
  | 'SET';


interface AssignmentBranch {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}


function NoticeBanner({
  notice,
  onClose,
}: {
  notice: Notice;
  onClose: () => void;
}) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className={[
        'mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3',
        notice.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-800',
      ].join(' ')}
    >
      {notice.type === 'success' ? (
        <Check className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      )}

      <p className="flex-1 text-sm font-medium">
        {notice.message}
      </p>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 transition hover:bg-black/5"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}


function Modal({
  title,
  description,
  onClose,
  children,
  size = 'default',
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'default' | 'large';
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/35 backdrop-blur-[2px] sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        className={[
          'relative max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-slate-200 bg-white shadow-2xl sm:rounded-[28px]',
          size === 'large'
            ? 'sm:max-w-2xl'
            : 'sm:max-w-lg',
        ].join(' ')}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X className="size-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}


function AssignInventoryForm({
  branches,
  products,
  inventories,
  initialBranchId,
  lockBranchSelection = false,
  onCancel,
  onSuccess,
}: {
  branches: AssignmentBranch[];
  products: Product[];
  inventories: InventoryRecord[];
  initialBranchId?: string;
  lockBranchSelection?: boolean;
  onCancel: () => void;
  onSuccess: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  const [branchId, setBranchId] =
    useState(
      initialBranchId ||
        (lockBranchSelection
          ? branches[0]?.id ??
            ''
          : ''),
    );

  const [productId, setProductId] =
    useState('');

  const [quantity, setQuantity] =
    useState('0');

  const [
    lowStockLevel,
    setLowStockLevel,
  ] = useState('0');

  const [formError, setFormError] =
    useState<string | null>(null);

  const activeBranches =
    useMemo(
      () =>
        branches.filter(
          (branch) => branch.isActive,
        ),
      [branches],
    );

  const activeProducts =
    useMemo(
      () =>
        products.filter(
          (product) => product.isActive,
        ),
      [products],
    );

  const assignedProductIds =
    useMemo(() => {
      if (!branchId) {
        return new Set<string>();
      }

      return new Set(
        inventories
          .filter(
            (inventory) =>
              inventory.branchId ===
              branchId,
          )
          .map(
            (inventory) =>
              inventory.productId,
          ),
      );
    }, [
      branchId,
      inventories,
    ]);

  const branchProducts =
    useMemo(
      () =>
        activeProducts.filter(
          (product) =>
            Boolean(branchId) &&
            product.branchId ===
              branchId,
        ),
      [
        activeProducts,
        branchId,
      ],
    );

  const availableProducts =
    useMemo(
      () =>
        branchProducts.filter(
          (product) =>
            !assignedProductIds.has(
              product.id,
            ),
        ),
      [
        branchProducts,
        assignedProductIds,
      ],
    );

  const selectedBranch =
    activeBranches.find(
      (branch) =>
        branch.id === branchId,
    ) ??
    null;

  const selectedProduct =
    branchProducts.find(
      (product) =>
        product.id ===
        productId,
    ) ??
    null;

  const alreadyAssignedCount =
    branchProducts.length -
    availableProducts.length;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!branchId) {
        throw new Error(
          'Select a branch.',
        );
      }

      if (!productId) {
        throw new Error(
          'Select a product.',
        );
      }

      if (
        assignedProductIds.has(
          productId,
        )
      ) {
        throw new Error(
          'This product is already assigned to the selected branch.',
        );
      }

      const parsedQuantity =
        Number(quantity);

      const parsedLowStockLevel =
        Number(lowStockLevel);

      if (
        !Number.isFinite(
          parsedQuantity,
        ) ||
        parsedQuantity < 0
      ) {
        throw new Error(
          'Opening quantity must be zero or greater.',
        );
      }

      if (
        !Number.isFinite(
          parsedLowStockLevel,
        ) ||
        parsedLowStockLevel < 0
      ) {
        throw new Error(
          'Low-stock level must be zero or greater.',
        );
      }

      const input: CreateInventoryInput = {
        branchId,
        productId,
        quantity: parsedQuantity,
        lowStockLevel:
          parsedLowStockLevel,
      };

      return createInventory(input);
    },

    onSuccess: async (
      inventory,
    ) => {
      await queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'inventory',
        ],
      });

      onSuccess(
        `${inventory.product.name} assigned to ${inventory.branch.name} successfully.`,
      );
    },

    onError: (error) => {
      setFormError(
        getErrorMessage(error),
      );
    },
  });

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setFormError(null);

    mutation.mutate();
  };

  const handleBranchChange = (
    nextBranchId: string,
  ) => {
    setBranchId(nextBranchId);
    setProductId('');
    setFormError(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 sm:p-6"
    >
      {formError ? (
        <div className="mb-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />

          <span>
            {formError}
          </span>
        </div>
      ) : null}

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
            <PackagePlus className="size-4" />
          </div>

          <div>
            <p className="text-sm font-bold text-emerald-950">
              Branch inventory assignment
            </p>

            <p className="mt-1 text-xs leading-5 text-emerald-800/70">
              Each product can have one
              inventory record per branch.
              Stock status is calculated
              automatically after creation.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {lockBranchSelection ? (
          <div className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-700">
              Branch
            </span>

            <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-bold text-emerald-900">
                {selectedBranch
                  ? selectedBranch.name
                  : 'Branch unavailable'}
              </p>

              <p className="mt-1 text-xs text-emerald-700/70">
                {selectedBranch
                  ? `${selectedBranch.code} ? Branch selection is locked for this assignment.`
                  : 'The selected branch is not active or no longer available.'}
              </p>
            </div>
          </div>
        ) : (
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-700">
              Branch
            </span>

            <select
              value={branchId}
              onChange={(event) =>
                handleBranchChange(
                  event.target.value,
                )
              }
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="">
                Select active branch
              </option>

              {activeBranches.map(
                (branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name} ?{' '}
                    {branch.code}
                  </option>
                ),
              )}
            </select>

            {activeBranches.length ===
            0 ? (
              <p className="mt-2 text-xs text-rose-500">
                No active branches are
                available.
              </p>
            ) : null}
          </label>
        )}

        <label className="sm:col-span-2">
          <span className="text-xs font-semibold text-slate-700">
            Product
          </span>

          <select
            value={productId}
            disabled={!branchId}
            onChange={(event) => {
              setProductId(
                event.target.value,
              );
              setFormError(null);
            }}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">
              {!branchId
                ? 'Select a branch first'
                : 'Select product'}
            </option>

            {availableProducts.map(
              (product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name} ·{' '}
                  {product.sku}
                </option>
              ),
            )}
          </select>

          {branchId &&
          availableProducts.length ===
            0 ? (
            <p className="mt-2 text-xs font-medium text-amber-600">
              Every active product is
              already assigned to this
              branch.
            </p>
          ) : branchId &&
            alreadyAssignedCount > 0 ? (
            <p className="mt-2 text-xs text-slate-400">
              {alreadyAssignedCount}{' '}
              product
              {alreadyAssignedCount === 1
                ? ''
                : 's'}{' '}
              already assigned and hidden
              from this list.
            </p>
          ) : null}
        </label>

        <label>
          <span className="text-xs font-semibold text-slate-700">
            Opening quantity
          </span>

          <div className="relative mt-2">
            <input
              type="number"
              min="0"
              step="0.001"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-20 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />

            {selectedProduct ? (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                {selectedProduct.unit}
              </span>
            ) : null}
          </div>
        </label>

        <label>
          <span className="text-xs font-semibold text-slate-700">
            Low-stock alert level
          </span>

          <div className="relative mt-2">
            <input
              type="number"
              min="0"
              step="0.001"
              value={lowStockLevel}
              onChange={(event) =>
                setLowStockLevel(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-20 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />

            {selectedProduct ? (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                {selectedProduct.unit}
              </span>
            ) : null}
          </div>
        </label>
      </div>

      {selectedBranch ||
      selectedProduct ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Assignment preview
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[11px] text-slate-400">
                Branch
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {selectedBranch
                  ? `${selectedBranch.name} · ${selectedBranch.code}`
                  : 'Not selected'}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400">
                Product
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {selectedProduct
                  ? `${selectedProduct.name} · ${selectedProduct.sku}`
                  : 'Not selected'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={mutation.isPending}
          className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            mutation.isPending ||
            !branchId ||
            !productId
          }
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PackagePlus className="size-4" />

          {mutation.isPending
            ? 'Assigning…'
            : 'Assign product'}
        </button>
      </div>
    </form>
  );
}


function StockAdjustmentForm({
  inventory,
  onCancel,
  onSuccess,
}: {
  inventory: InventoryRecord;
  onCancel: () => void;
  onSuccess: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  const [action, setAction] =
    useState<StockAction>('ADD');

  const [amount, setAmount] =
    useState('');

  const [formError, setFormError] =
    useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed =
        Number(amount);

      if (
        !Number.isFinite(parsed) ||
        parsed < 0
      ) {
        throw new Error(
          'Enter a valid quantity.',
        );
      }

      if (
        action !== 'SET' &&
        parsed <= 0
      ) {
        throw new Error(
          'Adjustment amount must be greater than zero.',
        );
      }

      let nextQuantity =
        inventory.quantity;

      if (action === 'ADD') {
        nextQuantity =
          inventory.quantity +
          parsed;
      }

      if (action === 'REMOVE') {
        nextQuantity =
          inventory.quantity -
          parsed;
      }

      if (action === 'SET') {
        nextQuantity = parsed;
      }

      if (nextQuantity < 0) {
        throw new Error(
          `You cannot remove more than the current ${inventory.quantity.toLocaleString()} ${inventory.product.unit}.`,
        );
      }

      return updateInventoryStock(
        inventory.id,
        {
          quantity: nextQuantity,
        },
      );
    },

    onSuccess: async (
      updatedInventory,
    ) => {
      await queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'inventory',
        ],
      });

      onSuccess(
        `Stock updated to ${updatedInventory.quantity.toLocaleString()} ${updatedInventory.product.unit}.`,
      );
    },

    onError: (error) => {
      setFormError(
        getErrorMessage(error),
      );
    },
  });

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError(null);
    mutation.mutate();
  };

  const parsed =
    Number(amount);

  const preview =
    Number.isFinite(parsed)
      ? action === 'ADD'
        ? inventory.quantity +
          parsed
        : action === 'REMOVE'
          ? inventory.quantity -
            parsed
          : parsed
      : inventory.quantity;

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 sm:p-6"
    >
      {formError ? (
        <div className="mb-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium text-slate-500">
          Current stock
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-950">
          {inventory.quantity.toLocaleString()}
          <span className="ml-1 text-sm font-semibold text-slate-400">
            {inventory.product.unit}
          </span>
        </p>

        <p className="mt-2 text-xs text-slate-500">
          {inventory.product.name} ·{' '}
          {inventory.branch.name}
        </p>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold text-slate-700">
          Adjustment
        </p>

        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            {
              value: 'ADD' as const,
              label: 'Add',
              icon: Plus,
            },
            {
              value: 'REMOVE' as const,
              label: 'Remove',
              icon: Minus,
            },
            {
              value: 'SET' as const,
              label: 'Set exact',
              icon: Edit3,
            },
          ].map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setAction(
                    option.value,
                  )
                }
                className={[
                  'flex h-11 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition',
                  action === option.value
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/10'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                ].join(' ')}
              >
                <Icon className="size-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="mt-5 block">
        <span className="text-xs font-semibold text-slate-700">
          {action === 'SET'
            ? 'New quantity'
            : 'Quantity to adjust'}
        </span>

        <div className="relative mt-2">
          <input
            type="number"
            min="0"
            step="0.001"
            value={amount}
            onChange={(event) =>
              setAmount(
                event.target.value,
              )
            }
            placeholder="0"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-20 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />

          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
            {inventory.product.unit}
          </span>
        </div>
      </label>

      {amount ? (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
          <span className="text-xs font-medium text-emerald-700">
            Resulting stock
          </span>

          <span
            className={[
              'text-sm font-bold',
              preview < 0
                ? 'text-rose-600'
                : 'text-emerald-800',
            ].join(' ')}
          >
            {Number.isFinite(preview)
              ? preview.toLocaleString()
              : '—'}{' '}
            {inventory.product.unit}
          </span>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={mutation.isPending}
          className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {mutation.isPending
            ? 'Updating…'
            : 'Update stock'}
        </button>
      </div>
    </form>
  );
}


function ThresholdForm({
  inventory,
  onCancel,
  onSuccess,
}: {
  inventory: InventoryRecord;
  onCancel: () => void;
  onSuccess: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  const [
    lowStockLevel,
    setLowStockLevel,
  ] = useState(
    String(inventory.lowStockLevel),
  );

  const [formError, setFormError] =
    useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed =
        Number(lowStockLevel);

      if (
        !Number.isFinite(parsed) ||
        parsed < 0
      ) {
        throw new Error(
          'Low-stock level must be zero or greater.',
        );
      }

      return updateInventory(
        inventory.id,
        {
          lowStockLevel: parsed,
        },
      );
    },

    onSuccess: async (
      updatedInventory,
    ) => {
      await queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'inventory',
        ],
      });

      onSuccess(
        `Low-stock alert level updated to ${updatedInventory.lowStockLevel.toLocaleString()} ${updatedInventory.product.unit}.`,
      );
    },

    onError: (error) => {
      setFormError(
        getErrorMessage(error),
      );
    },
  });

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError(null);
    mutation.mutate();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 sm:p-6"
    >
      {formError ? (
        <div className="mb-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">
          {inventory.product.name}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {inventory.branch.name} ·{' '}
          {inventory.branch.code}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Current stock
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              {inventory.quantity.toLocaleString()}{' '}
              {inventory.product.unit}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Current alert
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              {inventory.lowStockLevel.toLocaleString()}{' '}
              {inventory.product.unit}
            </p>
          </div>
        </div>
      </div>

      <label className="mt-5 block">
        <span className="text-xs font-semibold text-slate-700">
          Low-stock level
        </span>

        <div className="relative mt-2">
          <input
            type="number"
            min="0"
            step="0.001"
            value={lowStockLevel}
            onChange={(event) =>
              setLowStockLevel(
                event.target.value,
              )
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-20 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />

          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
            {inventory.product.unit}
          </span>
        </div>

        <p className="mt-2 text-[11px] leading-5 text-slate-400">
          Stock at or below this quantity
          is automatically marked Low
          stock. Zero quantity becomes Out
          of stock.
        </p>
      </label>

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={mutation.isPending}
          className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {mutation.isPending
            ? 'Saving…'
            : 'Save threshold'}
        </button>
      </div>
    </form>
  );
}


function InventoryRow({
  inventory,
  onAdjust,
  onThreshold,
}: {
  inventory: InventoryRecord;
  onAdjust: () => void;
  onThreshold: () => void;
}) {
  return (
    <div className="grid gap-4 border-b border-slate-100 px-5 py-4 transition hover:bg-emerald-50/30 xl:grid-cols-[minmax(210px,1.35fr)_minmax(170px,1fr)_120px_120px_120px_190px] xl:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {inventory.product.name}
        </p>

        <p className="mt-1 truncate text-xs text-slate-400">
          {inventory.product.sku}
        </p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
          Branch
        </p>

        <p className="mt-1 truncate text-sm text-slate-700 xl:mt-0">
          {inventory.branch.name}
        </p>

        <p className="text-[11px] text-slate-400">
          {inventory.branch.code}
        </p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
          Quantity
        </p>

        <p className="mt-1 text-sm font-bold text-slate-900 xl:mt-0">
          {inventory.quantity.toLocaleString()}
          {' '}
          <span className="text-xs font-medium text-slate-400">
            {inventory.product.unit}
          </span>
        </p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
          Low stock at
        </p>

        <p className="mt-1 text-sm text-slate-700 xl:mt-0">
          {inventory.lowStockLevel.toLocaleString()}
          {' '}
          {inventory.product.unit}
        </p>
      </div>

      <div>
        <span
          className={[
            'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold',
            statusClasses[
              inventory.status
            ],
          ].join(' ')}
        >
          {statusLabels[
            inventory.status
          ]}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 xl:justify-end">
        <button
          type="button"
          onClick={onAdjust}
          className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
        >
          <SlidersHorizontal className="size-3.5" />
          Adjust stock
        </button>

        <button
          type="button"
          onClick={onThreshold}
          className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <CircleAlert className="size-3.5" />
          Alert level
        </button>
      </div>
    </div>
  );
}


export function InventoryPage() {
  const user =
    useAuthStore(
      (state) => state.user,
    );

  const isSuperAdmin =
    user?.role ===
    'SUPER_ADMIN';

  const managedBranch =
    user?.managedBranch ??
    null;

  const [search, setSearch] =
    useState('');

  const [notice, setNotice] =
    useState<Notice>(null);

  const [
    selectedBranchId,
    setSelectedBranchId,
  ] = useState('');

  const [
    assignmentOpen,
    setAssignmentOpen,
  ] = useState(false);

  const [
    stockInventory,
    setStockInventory,
  ] = useState<InventoryRecord | null>(
    null,
  );

  const [
    thresholdInventory,
    setThresholdInventory,
  ] = useState<InventoryRecord | null>(
    null,
  );

  const scopeKey =
    isSuperAdmin
      ? selectedBranchId ||
        'all-branches'
      : managedBranch?.id ||
        'unassigned-manager';

  const inventoryQuery =
    useQuery({
      queryKey: [
        'admin',
        'inventory',
        user?.id ??
          'anonymous',
      ],

      queryFn:
        getInventories,

      enabled:
        isSuperAdmin ||
        Boolean(
          managedBranch?.id,
        ),
    });

  const branchesQuery =
    useQuery({
      queryKey: [
        'admin',
        'branches',
        'management',
        'inventory-scope',
      ],

      queryFn:
        getManagementBranches,

      enabled:
        isSuperAdmin,
    });

  const productsQuery =
    useQuery({
      queryKey: [
        'admin',
        'products',
        'management',
        'inventory',
        scopeKey,
      ],

      queryFn: () =>
        getManagementProducts(
          isSuperAdmin &&
            selectedBranchId
            ? {
                branchId:
                  selectedBranchId,
              }
            : {},
        ),

      enabled:
        isSuperAdmin ||
        Boolean(
          managedBranch?.id,
        ),
    });

  const branches:
    AssignmentBranch[] =
    isSuperAdmin
      ? branchesQuery.data ??
        []
      : managedBranch
        ? [managedBranch]
        : [];

  const allInventories =
    inventoryQuery.data ??
    [];

  const inventories =
    isSuperAdmin &&
    selectedBranchId
      ? allInventories.filter(
          (inventory) =>
            inventory.branchId ===
            selectedBranchId,
        )
      : allInventories;

  const products =
    productsQuery.data ??
    [];

  const selectedScopeBranch =
    branches.find(
      (branch) =>
        branch.id ===
        selectedBranchId,
    ) ??
    null;

  const canAssign =
    isSuperAdmin
      ? selectedBranchId
        ? Boolean(
            selectedScopeBranch
              ?.isActive,
          )
        : branches.some(
            (branch) =>
              branch.isActive,
          )
      : Boolean(
          managedBranch?.id &&
            managedBranch.isActive,
        );

  const filteredInventories =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      if (!term) {
        return inventories;
      }

      return inventories.filter(
        (inventory) =>
          inventory.product.name
            .toLowerCase()
            .includes(term) ||
          inventory.product.sku
            .toLowerCase()
            .includes(term) ||
          inventory.branch.name
            .toLowerCase()
            .includes(term) ||
          inventory.branch.code
            .toLowerCase()
            .includes(term) ||
          statusLabels[
            inventory.status
          ]
            .toLowerCase()
            .includes(term),
      );
    }, [
      inventories,
      search,
    ]);

  const inStock =
    inventories.filter(
      (inventory) =>
        inventory.status ===
        'IN_STOCK',
    ).length;

  const lowStock =
    inventories.filter(
      (inventory) =>
        inventory.status ===
        'LOW_STOCK',
    ).length;

  const outOfStock =
    inventories.filter(
      (inventory) =>
        inventory.status ===
        'OUT_OF_STOCK',
    ).length;

  const activeBranches =
    branches.filter(
      (branch) => branch.isActive,
    ).length;

  const activeProducts =
    products.filter(
      (product) => product.isActive,
    ).length;

  const assignmentDataLoading =
    (isSuperAdmin &&
      branchesQuery.isLoading) ||
    productsQuery.isLoading;

  return (
    <div className="min-h-full bg-[#f7faf8]">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <NoticeBanner
          notice={notice}
          onClose={() =>
            setNotice(null)
          }
        />

        <div className="overflow-hidden rounded-[28px] border border-emerald-100/80 bg-gradient-to-br from-[#073f35] via-[#0b5748] to-[#0c6a55] p-5 text-white shadow-[0_22px_65px_rgba(6,78,65,0.16)] sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <Warehouse className="size-5 text-emerald-200" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                Branch stock network
              </p>

              <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Inventory
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/70">
                Assign products to branches,
                control stock, replenish
                inventory and configure
                low-stock thresholds.
              </p>
            </div>

            <button
              type="button"
              disabled={
                 assignmentDataLoading ||
                 !canAssign
               }
              onClick={() =>
                setAssignmentOpen(true)
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CirclePlus className="size-4" />

              {assignmentDataLoading
                ? 'Loading…'
                : 'Assign product'}
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-[22px] border border-slate-200/70 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                Inventory branch
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {isSuperAdmin
                  ? selectedScopeBranch
                    ? selectedScopeBranch.name
                    : 'All branches'
                  : managedBranch?.name ??
                    'No branch assigned'}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {isSuperAdmin
                  ? selectedScopeBranch
                    ? `Showing inventory and products for ${selectedScopeBranch.code}.`
                    : 'Showing company-wide stock. Select a branch to focus assignment and catalogue data.'
                  : managedBranch
                    ? `${managedBranch.code} ? Inventory access is locked to your managed branch.`
                    : 'A Super Admin must assign this account to a branch before inventory operations can continue.'}
              </p>
            </div>

            {isSuperAdmin ? (
              <label className="w-full lg:max-w-sm">
                <span className="sr-only">
                  Inventory branch
                </span>

                <select
                  value={selectedBranchId}
                  onChange={(event) => {
                    setSelectedBranchId(
                      event.target.value,
                    );

                    setAssignmentOpen(
                      false,
                    );
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="">
                    All branches
                  </option>

                  {branches.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name} ?{' '}
                        {branch.code}
                        {branch.isActive
                          ? ''
                          : ' (Inactive)'}
                      </option>
                    ),
                  )}
                </select>
              </label>
            ) : (
              <div
                className={[
                  'rounded-xl border px-4 py-3 text-xs font-semibold',
                  managedBranch?.isActive
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700',
                ].join(' ')}
              >
                {managedBranch?.isActive
                  ? 'Managed branch locked'
                  : 'Branch action required'}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label:
                'Inventory records',
              value: inventories.length,
              icon: Boxes,
            },
            {
              label: 'In stock',
              value: inStock,
              icon: PackageCheck,
            },
            {
              label: 'Low stock',
              value: lowStock,
              icon: CircleAlert,
            },
            {
              label: 'Out of stock',
              value: outOfStock,
              icon: AlertCircle,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-[22px] border border-slate-200/70 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">
                    {item.label}
                  </p>

                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon className="size-4" />
                  </div>
                </div>

                <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {inventoryQuery.isLoading
                    ? '—'
                    : item.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-[20px] border border-slate-200/70 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.035)]">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 className="size-4" />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Active branches available
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {branchesQuery.isLoading
                  ? '—'
                  : activeBranches}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-[20px] border border-slate-200/70 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.035)]">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <PackagePlus className="size-4" />
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Active catalogue products
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {productsQuery.isLoading
                  ? '—'
                  : activeProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Stock positions
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Branch-level inventory,
                availability and alert
                thresholds.
              </p>
            </div>

            <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:max-w-sm">
              <Search className="size-4 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search product, SKU, branch..."
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="hidden grid-cols-[minmax(210px,1.35fr)_minmax(170px,1fr)_120px_120px_120px_190px] border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400 xl:grid">
            <span>Product</span>
            <span>Branch</span>
            <span>Quantity</span>
            <span>Low stock at</span>
            <span>Status</span>
            <span className="text-right">
              Actions
            </span>
          </div>

          {inventoryQuery.isLoading ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Loading inventory…
            </div>
          ) : inventoryQuery.isError ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <AlertCircle className="size-6 text-rose-500" />

              <p className="mt-3 text-sm font-semibold text-slate-800">
                Inventory could not be
                loaded.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Check the API connection
                and try again.
              </p>
            </div>
          ) : filteredInventories.length ===
            0 ? (
            <div className="p-10 text-center">
              <Warehouse className="mx-auto size-7 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No inventory records
                found.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Assign an active product to
                a branch to create the first
                inventory record.
              </p>

              <button
                type="button"
                disabled={
                 assignmentDataLoading ||
                 !canAssign
               }
                onClick={() =>
                  setAssignmentOpen(true)
                }
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
              >
                <CirclePlus className="size-3.5" />
                Assign product
              </button>
            </div>
          ) : (
            filteredInventories.map(
              (inventory) => (
                <InventoryRow
                  key={inventory.id}
                  inventory={inventory}
                  onAdjust={() =>
                    setStockInventory(
                      inventory,
                    )
                  }
                  onThreshold={() =>
                    setThresholdInventory(
                      inventory,
                    )
                  }
                />
              ),
            )
          )}
        </div>

        {(isSuperAdmin &&
          branchesQuery.isError) ||
        productsQuery.isError ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            Inventory records loaded, but
            branch or catalogue assignment
            data could not be retrieved.
            Refresh before creating a new
            assignment.
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-xs leading-5 text-emerald-800">
            Stock status is calculated by
            the backend automatically.
            Low-stock and out-of-stock
            transitions continue through
            the existing notification and
            audit systems.
          </div>
        )}
      </div>

      {assignmentOpen ? (
        <Modal
          title="Assign product to branch"
          description="Create a new branch inventory record with its opening quantity and low-stock alert level."
          onClose={() =>
            setAssignmentOpen(false)
          }
          size="large"
        >
          <AssignInventoryForm
            key="new-inventory"
            branches={branches}
            products={products}
            inventories={inventories}
            initialBranchId={
              isSuperAdmin
                ? selectedBranchId ||
                  undefined
                : managedBranch?.id
            }
            lockBranchSelection={
              !isSuperAdmin ||
              Boolean(
                selectedBranchId,
              )
            }
            onCancel={() =>
              setAssignmentOpen(false)
            }
            onSuccess={(message) => {
              setAssignmentOpen(false);

              setNotice({
                type: 'success',
                message,
              });
            }}
          />
        </Modal>
      ) : null}

      {stockInventory ? (
        <Modal
          title="Adjust stock"
          description="Add, remove or set the exact quantity for this branch inventory record."
          onClose={() =>
            setStockInventory(null)
          }
        >
          <StockAdjustmentForm
            key={stockInventory.id}
            inventory={stockInventory}
            onCancel={() =>
              setStockInventory(null)
            }
            onSuccess={(message) => {
              setStockInventory(null);

              setNotice({
                type: 'success',
                message,
              });
            }}
          />
        </Modal>
      ) : null}

      {thresholdInventory ? (
        <Modal
          title="Low-stock alert level"
          description="Control when this inventory record enters the low-stock state."
          onClose={() =>
            setThresholdInventory(null)
          }
        >
          <ThresholdForm
            key={thresholdInventory.id}
            inventory={
              thresholdInventory
            }
            onCancel={() =>
              setThresholdInventory(null)
            }
            onSuccess={(message) => {
              setThresholdInventory(null);

              setNotice({
                type: 'success',
                message,
              });
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
