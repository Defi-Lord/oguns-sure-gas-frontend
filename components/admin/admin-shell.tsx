'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  usePathname,
  useRouter,
} from 'next/navigation';

import {
  useQuery,
} from '@tanstack/react-query';

import {
  Loader2,
} from 'lucide-react';

import {
  api,
} from '@/lib/api/client';

import {
  useAuthStore,
} from '@/stores/auth-store';

import type {
  MeResponse,
} from '@/types/auth';

import {
  AdminSidebar,
} from '@/components/admin/admin-sidebar';

import {
  AdminTopbar,
} from '@/components/admin/admin-topbar';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({
  children,
}: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false);

  const {
    user,
    isAuthenticated,
    hasHydrated,
    setUser,
    clearAuth,
  } = useAuthStore();

  const sessionQuery =
    useQuery({
      queryKey: [
        'admin-session',
      ],

      queryFn: async () => {
        const response =
          await api.get<MeResponse>(
            '/auth/me',
          );

        return response.data.data.user;
      },

      enabled:
        hasHydrated &&
        isAuthenticated,

      retry: false,

      staleTime:
        60_000,

      refetchOnWindowFocus:
        false,
    });

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (
      !isAuthenticated ||
      !user
    ) {
      router.replace(
        '/admin/login',
      );

      return;
    }

    if (
      user.role !==
      'SUPER_ADMIN' &&
      user.role !==
      'BRANCH_MANAGER'
    ) {
      clearAuth();

      router.replace(
        '/admin/login',
      );
    }
  }, [
    clearAuth,
    hasHydrated,
    isAuthenticated,
    router,
    user,
  ]);

  useEffect(() => {
    if (!sessionQuery.data) {
      return;
    }

    if (
      (
        sessionQuery.data.role !==
          'SUPER_ADMIN' &&
        sessionQuery.data.role !==
          'BRANCH_MANAGER'
      ) ||
      sessionQuery.data.status !==
        'ACTIVE'
    ) {
      clearAuth();

      router.replace(
        '/admin/login',
      );

      return;
    }

    setUser(
      sessionQuery.data,
    );
  }, [
    clearAuth,
    router,
    sessionQuery.data,
    setUser,
  ]);

  /*
   * BRANCH_MANAGER_STAGE_2B_ROUTE_FENCE
   *
   * Temporary Stage 2B portal boundary.
   *
   * Branch Managers are now legitimate portal users,
   * but only branch-aware areas that have completed
   * their role/scoping integration are exposed here.
   *
   * This list will expand as Orders, Riders,
   * Deliveries, Analytics and branch settings are
   * upgraded.
   */
  useEffect(() => {
    if (
      user?.role !==
      'BRANCH_MANAGER'
    ) {
      return;
    }

    const allowedBranchManagerRoutes = [
      '/admin/products',
      '/admin/inventory',
    ];

    const isAllowed =
      allowedBranchManagerRoutes.some(
        (route) =>
          pathname === route ||
          pathname.startsWith(
            `${route}/`,
          ),
      );

    if (!isAllowed) {
      router.replace(
        '/admin/products',
      );
    }
  }, [
    pathname,
    router,
    user?.role,
  ]);


  useEffect(() => {
    if (
      sessionQuery.isError
    ) {
      clearAuth();

      router.replace(
        '/admin/login',
      );
    }
  }, [
    clearAuth,
    router,
    sessionQuery.isError,
  ]);

  useEffect(() => {
    setMobileSidebarOpen(
      false,
    );
  }, [pathname]);

  if (
    !hasHydrated ||
    !isAuthenticated ||
    !user
  ) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#f5f9f7] dark:bg-[#061713]">
        <div className="ambient-energy-layer">
          <span className="ambient-orb ambient-orb-one" />
          <span className="ambient-orb ambient-orb-two" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-[22px] bg-emerald-600 text-white shadow-xl shadow-emerald-600/20">
            <Loader2 className="size-7 animate-spin" />
          </div>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Preparing your command center...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[#f6f9f8] text-slate-950 transition-colors duration-300 dark:bg-[#071814] dark:text-slate-100">
      <div className="ambient-energy-layer">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-orb ambient-orb-three" />
        <span className="ambient-ribbon ambient-ribbon-one" />
        <span className="ambient-ribbon ambient-ribbon-two" />
      </div>

      <AdminSidebar
        collapsed={
          sidebarCollapsed
        }
        mobileOpen={
          mobileSidebarOpen
        }
        onCollapse={() =>
          setSidebarCollapsed(
            (value) => !value,
          )
        }
        onMobileClose={() =>
          setMobileSidebarOpen(
            false,
          )
        }
      />

      <div
        className={[
          'relative z-10 min-h-dvh min-w-0 transition-[padding] duration-300',
          sidebarCollapsed
            ? 'md:pl-[88px]'
            : 'md:pl-[304px]',
        ].join(' ')}
      >
        <AdminTopbar
          onOpenMobileMenu={() =>
            setMobileSidebarOpen(
              true,
            )
          }
        />

        <main className="min-w-0 px-3 pb-8 sm:px-4 md:px-5 xl:px-6">
          <div className="mx-auto min-w-0 max-w-[1780px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
