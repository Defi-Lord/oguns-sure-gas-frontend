'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  Bell,
  ChevronDown,
  Expand,
  LogOut,
  Menu,
  Moon,
  Search,
  SunMedium,
} from 'lucide-react';

import {
  useAuthStore,
} from '@/stores/auth-store';

interface AdminTopbarProps {
  onOpenMobileMenu: () => void;
}

type ThemeMode =
  | 'light'
  | 'dark';

export function AdminTopbar({
  onOpenMobileMenu,
}: AdminTopbarProps) {
  const router = useRouter();

  const searchRef =
    useRef<HTMLInputElement>(null);

  const [
    theme,
    setTheme,
  ] = useState<ThemeMode>(
    'light',
  );

  const {
    user,
    clearAuth,
  } = useAuthStore();

  const initials = user
    ? `${user.firstName.charAt(
        0,
      )}${user.lastName.charAt(
        0,
      )}`.toUpperCase()
    : 'OA';

  useEffect(() => {
    const savedTheme =
      window.localStorage.getItem(
        'ogun-admin-theme',
      );

    const systemDark =
      window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;

    const initialTheme:
      ThemeMode =
      savedTheme === 'dark' ||
      (!savedTheme &&
        systemDark)
        ? 'dark'
        : 'light';

    setTheme(
      initialTheme,
    );

    document.documentElement.classList.toggle(
      'dark',
      initialTheme === 'dark',
    );
  }, []);

  useEffect(() => {
    const handleShortcut = (
      event: KeyboardEvent,
    ) => {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          'k'
      ) {
        event.preventDefault();

        searchRef.current?.focus();
      }
    };

    window.addEventListener(
      'keydown',
      handleShortcut,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleShortcut,
      );
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme:
      ThemeMode =
      theme === 'light'
        ? 'dark'
        : 'light';

    setTheme(
      nextTheme,
    );

    document.documentElement.classList.toggle(
      'dark',
      nextTheme === 'dark',
    );

    window.localStorage.setItem(
      'ogun-admin-theme',
      nextTheme,
    );
  };

  const handleFullscreen =
    async () => {
      try {
        if (
          !document.fullscreenElement
        ) {
          await document.documentElement.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch {
        // Some browsers can deny fullscreen.
      }
    };

  const handleLogout = () => {
    clearAuth();

    router.replace(
      '/admin/login',
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-2xl transition-colors dark:border-white/[0.06] dark:bg-[#081c17]/90">
      <div className="flex h-[74px] min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-5 lg:px-7">
        <button
          type="button"
          onClick={
            onOpenMobileMenu
          }
          aria-label="Open navigation"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
        >
          <Menu className="size-5" />
        </button>

        <div className="relative hidden min-w-0 w-full max-w-[550px] sm:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[17px] -translate-y-1/2 text-slate-500 dark:text-slate-400" />

          <input
            ref={searchRef}
            type="search"
            placeholder="Search orders, branches, riders, products..."
            className="h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50/80 pl-11 pr-20 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-500/[0.06] dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:bg-white/[0.07]"
          />

          <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 lg:flex">
            <span className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[9px] font-semibold text-slate-400 shadow-sm dark:border-white/10 dark:bg-white/[0.07]">
              Ctrl
            </span>

            <span className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[9px] font-semibold text-slate-400 shadow-sm dark:border-white/10 dark:bg-white/[0.07]">
              K
            </span>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 md:flex dark:bg-emerald-400/10 dark:text-emerald-300">
            <span className="live-breath size-2 rounded-full bg-emerald-500" />
            Live
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.06]"
          >
            <Bell className="size-[18px]" />

            <span className="notification-pulse absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#081c17]" />
          </button>

          <button
            type="button"
            onClick={
              handleFullscreen
            }
            aria-label="Toggle fullscreen"
            className="hidden size-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-50 sm:flex dark:text-slate-300 dark:hover:bg-white/[0.06]"
          >
            <Expand className="size-[17px]" />
          </button>

          <button
            type="button"
            onClick={
              toggleTheme
            }
            aria-label="Toggle theme"
            className="flex size-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.06]"
          >
            {theme ===
            'light' ? (
              <SunMedium className="size-[18px]" />
            ) : (
              <Moon className="size-[18px]" />
            )}
          </button>

          <div className="mx-1 hidden h-8 w-px bg-slate-200 md:block dark:bg-white/10" />

          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-[14px] p-1 transition hover:bg-slate-50 sm:pr-2 dark:hover:bg-white/[0.06]"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-700 text-[11px] font-bold text-white shadow-md shadow-emerald-700/15 sm:size-10">
                {initials}
              </div>

              <div className="hidden min-w-0 text-left lg:block">
                <p className="max-w-[110px] truncate text-[12px] font-semibold text-slate-900 dark:text-white">
                  {user?.firstName}{' '}
                  {user?.lastName}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-400">
                  Super Admin
                </p>
              </div>

              <ChevronDown className="hidden size-3.5 text-slate-400 lg:block" />
            </button>

            <div className="invisible absolute right-0 top-[calc(100%+10px)] z-50 w-56 translate-y-1 rounded-[18px] border border-slate-200 bg-white p-2 opacity-0 shadow-2xl transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-white/10 dark:bg-[#0b211b]">
              <div className="border-b border-slate-100 px-3 py-3 dark:border-white/[0.07]">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                  {user?.email}
                </p>

                <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                  Active administrator
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}