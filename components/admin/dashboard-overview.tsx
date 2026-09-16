'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  motion,
} from 'framer-motion';

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  Boxes,
  Building2,
  CalendarDays,
  Clock3,
  MoreHorizontal,
  PackageOpen,
  ShoppingCart,
  Truck,
  UsersRound,
} from 'lucide-react';

import {
  useAuthStore,
} from '@/stores/auth-store';

const entrance = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

type Accent =
  | 'green'
  | 'blue'
  | 'violet'
  | 'amber';

interface StatCardProps {
  title: string;
  subtitle: string;
  action: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  accent: Accent;
  delay: number;
}

const accents = {
  green: {
    icon:
      'bg-emerald-50 text-emerald-600',
    tint:
      'from-emerald-50/55 to-transparent',
    bar:
      'bg-emerald-300/55',
    action:
      'text-emerald-700',
  },

  blue: {
    icon:
      'bg-blue-50 text-blue-600',
    tint:
      'from-blue-50/55 to-transparent',
    bar:
      'bg-blue-300/55',
    action:
      'text-blue-600',
  },

  violet: {
    icon:
      'bg-violet-50 text-violet-600',
    tint:
      'from-violet-50/55 to-transparent',
    bar:
      'bg-violet-300/55',
    action:
      'text-violet-600',
  },

  amber: {
    icon:
      'bg-amber-50 text-amber-600',
    tint:
      'from-amber-50/55 to-transparent',
    bar:
      'bg-amber-300/55',
    action:
      'text-amber-600',
  },
};

function AnimatedBars({
  accent,
}: {
  accent: Accent;
}) {
  const heights = [
    23,
    35,
    29,
    46,
    33,
    54,
    41,
  ];

  return (
    <div className="absolute bottom-0 right-0 flex h-[84px] items-end gap-[6px] opacity-65">
      {heights.map(
        (
          height,
          index,
        ) => (
          <motion.div
            key={index}
            initial={{
              height: 0,
            }}
            animate={{
              height,
            }}
            transition={{
              duration: 0.65,
              delay:
                0.15 +
                index * 0.06,
            }}
            className={[
              'w-[11px] rounded-t-full',
              accents[accent]
                .bar,
            ].join(' ')}
          />
        ),
      )}
    </div>
  );
}

function StatCard({
  title,
  subtitle,
  action,
  icon: Icon,
  accent,
  delay,
}: StatCardProps) {
  const theme =
    accents[accent];

  return (
    <motion.article
      variants={entrance}
      initial="hidden"
      animate="visible"
      transition={{
        duration: 0.45,
        delay,
      }}
      whileHover={{
        y: -4,
      }}
      className="group relative flex min-h-[218px] flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_8px_35px_rgba(15,23,42,0.035)] transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(15,23,42,0.075)]"
    >
      <div
        className={[
          'pointer-events-none absolute inset-0 bg-gradient-to-br',
          theme.tint,
        ].join(' ')}
      />

      <div className="relative flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between">
          <motion.div
            whileHover={{
              rotate: -5,
              scale: 1.05,
            }}
            className={[
              'flex size-11 items-center justify-center rounded-[15px]',
              theme.icon,
            ].join(' ')}
          >
            <Icon className="size-[19px]" />
          </motion.div>

          <div className="flex items-center gap-2 rounded-full bg-slate-50/85 px-3 py-1.5 text-[9px] font-semibold text-slate-400">
            <span>—</span>
            <span>0%</span>
          </div>
        </div>

        <div className="relative mt-auto min-h-[96px] pt-8">
          <p className="text-[30px] font-semibold leading-none text-slate-950">
            —
          </p>

          <h3 className="mt-3 font-serif text-[17px] font-semibold leading-tight text-slate-950">
            {title}
          </h3>

          <p className="mt-1.5 max-w-[165px] text-[11px] leading-4 text-slate-400">
            {subtitle}
          </p>

          <AnimatedBars
            accent={accent}
          />
        </div>
      </div>

      <div className="relative border-t border-slate-100 bg-white/60 px-5 py-3.5">
        <button
          type="button"
          className={[
            'group/link inline-flex items-center gap-2 text-[11px] font-semibold',
            theme.action,
          ].join(' ')}
        >
          {action}

          <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-1" />
        </button>
      </div>
    </motion.article>
  );
}

function Leaf({
  className,
}: {
  className: string;
}) {
  return (
    <motion.div
      animate={{
        rotate: [
          -3,
          4,
          -3,
        ],
        y: [
          0,
          -4,
          0,
        ],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={[
        'absolute rounded-[100%_0_100%_0]',
        className,
      ].join(' ')}
    />
  );
}

function Cylinder({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  return (
    <motion.div
      animate={{
        y: [
          0,
          -5,
          0,
        ],
      }}
      transition={{
        duration: 5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={[
        'absolute',
        className,
      ].join(' ')}
    >
      <div className="absolute left-1/2 top-0 h-[25%] w-[45%] -translate-x-1/2 rounded-t-[20px] border-[6px] border-[#086b3e] border-b-0" />

      <div className="absolute left-1/2 top-[17%] h-[12%] w-[58%] -translate-x-1/2 rounded-[12px] bg-[#086b3e]" />

      <div className="absolute inset-x-0 bottom-0 top-[25%] overflow-hidden rounded-[40px_40px_18px_18px] bg-gradient-to-r from-[#05783e] via-[#16b968] to-[#087a41] shadow-[0_24px_42px_rgba(5,120,62,0.18)]">
        <div className="absolute left-[18%] top-[12%] h-[65%] w-[9%] rounded-full bg-white/16 blur-[2px]" />

        <div className="absolute bottom-0 right-0 h-[55%] w-[35%] bg-emerald-900/10 blur-xl" />
      </div>
    </motion.div>
  );
}

function HeroArtwork() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden xl:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(34,197,94,0.15),transparent_47%)]" />

      <div className="absolute -right-[160px] -top-[110px] size-[440px] rounded-full border-[45px] border-emerald-600/14" />

      <div className="absolute bottom-0 right-0 h-full w-[62%] bg-gradient-to-l from-emerald-50/80 to-transparent" />

      <Leaf className="bottom-[22px] right-[245px] size-[72px] bg-emerald-300/35" />
      <Leaf className="bottom-[100px] right-[132px] size-[54px] rotate-[35deg] bg-lime-300/30" />
      <Leaf className="bottom-[38px] right-[55px] size-[64px] rotate-[50deg] bg-green-300/30" />

      <Cylinder
        className="bottom-[-20px] right-[105px] h-[188px] w-[104px]"
      />

      <Cylinder
        delay={0.7}
        className="bottom-[-15px] right-[28px] h-[145px] w-[82px]"
      />
    </div>
  );
}

interface PulseItemProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  active?: boolean;
  warning?: boolean;
}

function PulseItem({
  title,
  subtitle,
  icon: Icon,
  active = false,
  warning = false,
}: PulseItemProps) {
  return (
    <motion.div
      whileHover={{
        x: 3,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 28,
      }}
      className="flex items-center gap-3 rounded-[16px] bg-slate-50/90 px-3.5 py-3.5"
    >
      <div
        className={[
          'flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-white shadow-sm',
          warning
            ? 'text-rose-500'
            : 'text-slate-500',
        ].join(' ')}
      >
        <Icon className="size-[17px]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 truncate text-[10px] text-slate-400">
          {subtitle}
        </p>
      </div>

      <motion.span
        animate={
          active
            ? {
                boxShadow: [
                  '0 0 0 0 rgba(16,185,129,0)',
                  '0 0 0 6px rgba(16,185,129,0.11)',
                  '0 0 0 0 rgba(16,185,129,0)',
                ],
              }
            : undefined
        }
        transition={{
          duration: 2.2,
          repeat: Infinity,
        }}
        className={[
          'size-2 rounded-full',
          active
            ? 'bg-emerald-500'
            : 'bg-slate-300',
        ].join(' ')}
      />
    </motion.div>
  );
}

export function DashboardOverview() {
  const user =
    useAuthStore(
      (state) => state.user,
    );

  const [
    now,
    setNow,
  ] = useState<Date | null>(
    null,
  );

  useEffect(() => {
    setNow(new Date());

    const timer =
      window.setInterval(() => {
        setNow(new Date());
      }, 60_000);

    return () =>
      window.clearInterval(
        timer,
      );
  }, []);

  return (
    <div className="space-y-5 pb-6">
      <motion.section
        variants={entrance}
        initial="hidden"
        animate="visible"
        transition={{
          duration: 0.5,
        }}
        className="relative -mx-3 overflow-hidden border-b border-slate-200/60 bg-[linear-gradient(110deg,#ffffff_0%,#f6fbff_48%,#e7f7ef_100%)] px-6 py-7 sm:-mx-4 sm:px-8 lg:-mx-5 lg:px-8 xl:-mx-6 xl:px-9"
      >
        <HeroArtwork />

        <div className="relative z-10 min-h-[215px]">
          <div className="max-w-[780px]">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em] text-emerald-700">
              <motion.span
                animate={{
                  scale: [
                    1,
                    1.35,
                    1,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat:
                    Infinity,
                }}
                className="size-1.5 rounded-full bg-emerald-500"
              />

              Operations command center
            </div>

            <h1 className="mt-5 font-serif text-[36px] font-semibold leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-[44px]">
              Good to see you,{' '}
              {user?.firstName}.
            </h1>

            <p className="mt-4 text-[13px] text-slate-500">
              Here&apos;s what&apos;s happening across your gas business today.
            </p>
          </div>

          <div className="absolute right-[27%] top-3 hidden max-w-[220px] xl:block">
            <p className="font-serif text-[14px] italic leading-6 text-slate-500">
              “Powering homes,
              <br />
              empowering communities.”
            </p>

            <p className="mt-2 text-[11px] text-slate-400">
              — Ogun&apos;s Sure Gas
            </p>
          </div>

          {now ? (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.35,
              }}
              className="absolute right-0 top-0 hidden items-center gap-2 rounded-full border border-white/80 bg-white/85 px-4 py-2.5 text-[10px] font-medium text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl xl:flex"
            >
              <CalendarDays className="size-3.5" />

              {now.toLocaleDateString(
                'en-GB',
                {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                },
              )}

              <span className="text-slate-300">
                |
              </span>

              {now.toLocaleTimeString(
                'en-GB',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                },
              )}
            </motion.div>
          ) : null}
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Orders today"
          subtitle="No data yet"
          action="View orders"
          icon={ShoppingCart}
          accent="green"
          delay={0.04}
        />

        <StatCard
          title="Active deliveries"
          subtitle="No data yet"
          action="Track deliveries"
          icon={Truck}
          accent="blue"
          delay={0.1}
        />

        <StatCard
          title="Branch network"
          subtitle="No data yet"
          action="View branches"
          icon={Building2}
          accent="violet"
          delay={0.16}
        />

        <StatCard
          title="Inventory alerts"
          subtitle="No data yet"
          action="View inventory"
          icon={Boxes}
          accent="amber"
          delay={0.22}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.58fr_0.72fr]">
        <motion.article
          variants={entrance}
          initial="hidden"
          animate="visible"
          transition={{
            duration: 0.5,
            delay: 0.22,
          }}
          className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_10px_38px_rgba(15,23,42,0.035)]"
        >
          <div className="flex min-h-[76px] items-center gap-3 border-b border-slate-100 px-5">
            <div className="flex size-10 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-600">
              <BellRing className="size-[18px]" />
            </div>

            <div>
              <h2 className="font-serif text-[17px] font-semibold text-slate-950">
                Recent operations
              </h2>

              <p className="mt-1 text-[10px] text-slate-400">
                Latest orders, deliveries and system activity.
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="group hidden items-center gap-2 rounded-[11px] border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex"
              >
                View all activity

                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-[11px] border border-slate-200 text-slate-500 shadow-sm"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-[302px] items-center justify-center overflow-hidden px-6 py-10 text-center">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-emerald-50/65 to-transparent" />

            <div className="relative max-w-md">
              <motion.div
                animate={{
                  y: [
                    0,
                    -5,
                    0,
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat:
                    Infinity,
                  ease:
                    'easeInOut',
                }}
                className="relative mx-auto flex size-[76px] items-center justify-center rounded-[25px] bg-slate-50 text-slate-400 shadow-inner"
              >
                <PackageOpen className="size-7" />

                <motion.span
                  animate={{
                    scale: [
                      1,
                      1.25,
                      1,
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat:
                      Infinity,
                  }}
                  className="absolute -right-1 -top-1 size-4 rounded-full border-4 border-white bg-emerald-500"
                />
              </motion.div>

              <h3 className="mt-5 font-serif text-[18px] font-semibold text-slate-950">
                Activity feed ready
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-slate-400">
                We&apos;ll connect this panel to your live order and delivery data.
                Once activity starts, you&apos;ll see real-time updates here.
              </p>

              <motion.button
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                type="button"
                className="mt-5 inline-flex items-center gap-2 rounded-[11px] bg-emerald-600 px-5 py-2.5 text-[10px] font-semibold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700"
              >
                Explore features

                <ArrowRight className="size-3.5" />
              </motion.button>
            </div>
          </div>
        </motion.article>

        <motion.article
          variants={entrance}
          initial="hidden"
          animate="visible"
          transition={{
            duration: 0.5,
            delay: 0.3,
          }}
          className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_38px_rgba(15,23,42,0.035)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-600">
              <BarChart3 className="size-[18px]" />
            </div>

            <div>
              <h2 className="font-serif text-[17px] font-semibold text-slate-950">
                Operations pulse
              </h2>

              <p className="mt-1 text-[10px] text-slate-400">
                Real-time insights and alerts.
              </p>
            </div>

            <button
              type="button"
              className="ml-auto hidden rounded-full bg-slate-50 px-3 py-1.5 text-[9px] font-medium text-slate-500 sm:block"
            >
              All systems
            </button>
          </div>

          <div className="mt-5 space-y-2.5">
            <PulseItem
              title="Realtime order feed"
              subtitle="Pending integration"
              icon={Clock3}
            />

            <PulseItem
              title="Staff activity"
              subtitle="Pending integration"
              icon={UsersRound}
            />

            <PulseItem
              title="Rider tracking"
              subtitle="Realtime-ready"
              icon={Truck}
              active
            />

            <PulseItem
              title="Inventory alerts"
              subtitle="Realtime-ready"
              icon={AlertTriangle}
              active
              warning
            />
          </div>
        </motion.article>
      </section>
    </div>
  );
}