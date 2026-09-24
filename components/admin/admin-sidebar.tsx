'use client';

import Link from 'next/link';

import {
  usePathname,
} from 'next/navigation';

import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flame,
  Gift,
  LayoutDashboard,
  MoreHorizontal,
  PackageSearch,
  ReceiptText,
  Settings,
  Truck,
  UserRoundCog,
  UsersRound,
  X,
} from 'lucide-react';

import {
  useAuthStore,
} from '@/stores/auth-store';

interface AdminSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onMobileClose: () => void;
}

interface NavigationItem {
  label: string;
  href: string;
  icon:
    React.ComponentType<{
      className?: string;
    }>;
  disabled?: boolean;
  liveDot?: boolean;
}

const primaryNavigation:
  NavigationItem[] = [
    {
      label: 'Overview',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Orders',
      href: '/admin/orders',
      icon: ClipboardList,
    },
    {
      label: 'Branches',
      href: '/admin/branches',
      icon: Building2,
    },
    {
      label: 'Products',
      href: '/admin/products',
      icon: PackageSearch,
    },
    {
      label: 'Inventory',
      href: '/admin/inventory',
      icon: Boxes,
    },
    {
      label: 'Deliveries',
      href: '/admin/deliveries',
      icon: Truck,
      },
    {
      label: 'Riders',
      href: '/admin/riders',
      icon: UsersRound,
      },
    {
      label: 'Staff',
      href: '/admin/staff',
      icon: UserRoundCog,
      },
  ];

const secondaryNavigation:
  NavigationItem[] = [
    {
      label: 'Campaigns',
      href: '/admin/campaigns',
      icon: Gift,
      disabled: true,
    },
    {
      label: 'Notifications',
      href: '/admin/notifications',
      icon: Bell,
      disabled: true,
      liveDot: true,
    },
    {
      label: 'Reports',
      href: '/admin/reports',
      icon: ReceiptText,
      disabled: true,
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      disabled: true,
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      disabled: true,
    },
  ];

function BrandMark() {
  return (
    <div className="relative flex h-12 w-10 shrink-0 items-center justify-center">
      <div className="absolute h-10 w-7 rotate-45 rounded-[40%_60%_55%_45%] bg-gradient-to-br from-lime-300 via-emerald-400 to-emerald-700 shadow-[0_8px_26px_rgba(34,197,94,0.28)]" />

      <div className="relative z-10 flex size-6 items-center justify-center rounded-full bg-[#083d34]/75 text-lime-200">
        <Flame className="size-4 fill-current" />
      </div>
    </div>
  );
}

function SidebarItem({
  item,
  collapsed,
}: {
  item: NavigationItem;
  collapsed: boolean;
}) {
  const pathname =
    usePathname();

  const Icon = item.icon;

  const active =
    pathname === item.href ||
    (
      item.href !==
        '/admin/dashboard' &&
      pathname.startsWith(
        `${item.href}/`,
      )
    );

  const content = (
    <>
      <div
        className={[
          'flex size-[30px] shrink-0 items-center justify-center rounded-[10px] transition',
          active
            ? 'bg-emerald-300 text-[#063c34]'
            : 'text-emerald-50/75 group-hover:bg-white/10 group-hover:text-white',
        ].join(' ')}
      >
        <Icon className="size-[17px]" />
      </div>

      {!collapsed ? (
        <>
          <span className="truncate">
            {item.label}
          </span>

          {item.liveDot ? (
            <span className="live-breath ml-auto size-2 rounded-full bg-emerald-400" />
          ) : item.disabled ? (
            <span className="ml-auto rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[9px] font-semibold text-emerald-100/65">
              Soon
            </span>
          ) : null}
        </>
      ) : null}
    </>
  );

  const className = [
    'group relative flex h-[46px] items-center rounded-[14px] text-[13px] font-medium transition-all duration-200',
    collapsed
      ? 'justify-center px-2'
      : 'gap-3 px-3',
    active
      ? 'bg-gradient-to-r from-emerald-500/35 to-emerald-300/15 text-white'
      : 'text-emerald-50/75 hover:bg-white/[0.07] hover:text-white',
  ].join(' ');

  if (item.disabled) {
    return (
      <div
        className={`${className} cursor-default opacity-75`}
        title={
          collapsed
            ? item.label
            : undefined
        }
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      title={
        collapsed
          ? item.label
          : undefined
      }
      className={className}
    >
      {content}
    </Link>
  );
}

export function AdminSidebar({
  collapsed,
  mobileOpen,
  onCollapse,
  onMobileClose,
}: AdminSidebarProps) {
  const user =
    useAuthStore(
      (state) => state.user,
    );


  /*
   * BRANCH_MANAGER_STAGE_2B_NAVIGATION
   *
   * The AdminShell route fence remains the real
   * authorization boundary.
   *
   * This sidebar filter only prevents Branch Managers
   * from seeing company-wide destinations that Stage 2B
   * has not yet made branch-aware.
   */
  const canSeeNavigationItem = (
    href: string,
  ) => {
    if (
      user?.role !==
      'BRANCH_MANAGER'
    ) {
      return true;
    }

    return [
      '/admin/products',
      '/admin/inventory',
    ].includes(href);
  };

  const initials =
    user
      ? `${user.firstName.charAt(
          0,
        )}${user.lastName.charAt(
          0,
        )}`.toUpperCase()
      : 'OA';

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          onClick={
            onMobileClose
          }
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[3px] md:hidden"
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex overflow-hidden bg-[#063c34] text-white shadow-[14px_0_45px_rgba(4,47,40,0.09)] transition-[width,transform] duration-300',
          collapsed
            ? 'md:w-[88px]'
            : 'md:w-[304px]',
          mobileOpen
            ? 'w-[min(304px,86vw)] translate-x-0'
            : 'w-[min(304px,86vw)] -translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <div className="sidebar-energy pointer-events-none absolute inset-0" />

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 overflow-hidden opacity-45">
          <div className="sidebar-wave-one absolute -bottom-16 -left-20 h-36 w-[85%] rounded-[100%_100%_0_0] bg-emerald-900" />

          <div className="sidebar-wave-two absolute -bottom-14 right-[-25%] h-40 w-[105%] rounded-[100%_100%_0_0] bg-emerald-700/65" />
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div
            className={[
              'flex h-[86px] items-center border-b border-white/[0.07]',
              collapsed
                ? 'justify-center px-3'
                : 'px-5',
            ].join(' ')}
          >
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark />

              {!collapsed ? (
                <div className="min-w-0">
                  <h1 className="truncate font-serif text-[18px] font-semibold text-white">
                    Ogun&apos;s Sure Gas
                  </h1>

                  <p className="mt-1 truncate text-[10px] text-emerald-100/55">
                    Safe Energy. Brighter Lives.
                  </p>
                </div>
              ) : null}
            </div>

            {!collapsed ? (
              <button
                type="button"
                onClick={
                  onCollapse
                }
                className="ml-auto hidden size-9 items-center justify-center rounded-full bg-white/[0.07] text-white/65 hover:bg-white/10 hover:text-white md:flex"
              >
                <ChevronLeft className="size-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={
                onMobileClose
              }
              className="ml-auto flex size-9 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 md:hidden"
            >
              <X className="size-5" />
            </button>
          </div>

          {collapsed ? (
            <button
              type="button"
              onClick={
                onCollapse
              }
              className="mx-auto mt-4 hidden size-9 items-center justify-center rounded-full bg-white/[0.07] text-white/60 hover:bg-white/10 hover:text-white md:flex"
            >
              <ChevronRight className="size-4" />
            </button>
          ) : null}

          <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {primaryNavigation.filter((item) => canSeeNavigationItem(item.href)).map((item) => (
                  <SidebarItem
                    key={
                      item.href
                    }
                    item={
                      item
                    }
                    collapsed={
                      collapsed
                    }
                  />
                ),
              )}
            </div>

            <div className="mx-2 my-4 border-t border-white/10" />

            <div className="space-y-1">
              {secondaryNavigation.filter((item) => canSeeNavigationItem(item.href)).map((item) => (
                  <SidebarItem
                    key={
                      item.href
                    }
                    item={
                      item
                    }
                    collapsed={
                      collapsed
                    }
                  />
                ),
              )}
            </div>
          </nav>

          <div className="relative border-t border-white/[0.08] bg-[#04372f]/75 p-3">
            <div
              className={[
                'flex items-center rounded-[15px]',
                collapsed
                  ? 'justify-center p-1'
                  : 'gap-3 px-2 py-2',
              ].join(' ')}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 text-xs font-bold text-[#063c34]">
                {initials}
              </div>

              {!collapsed ? (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-white">
                      {user?.firstName}{' '}
                      {user?.lastName}
                    </p>

                    <p className="mt-0.5 text-[10px] text-emerald-100/55">
                      Super Admin
                    </p>
                  </div>

                  <MoreHorizontal className="size-4 text-white/45" />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}