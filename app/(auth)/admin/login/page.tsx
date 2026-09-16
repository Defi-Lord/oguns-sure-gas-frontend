import {
  ShieldCheck,
  Zap,
} from 'lucide-react';

import {
  LoginForm,
} from '@/components/auth/login-form';

import {
  Badge,
} from '@/components/ui/badge';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminLoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <section className="hidden lg:block">
          <Badge
            variant="secondary"
            className="mb-6 rounded-full px-4 py-2"
          >
            <Zap className="mr-2 size-4" />
            Ogun&apos;s Sure Gas
          </Badge>

          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 xl:text-6xl">
            Control every part of
            your gas operation from
            one place.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Branches, inventory,
            orders, riders, staff,
            campaigns and realtime
            delivery operations — all
            managed from one secure
            command center.
          </p>

          <div className="mt-10 flex items-center gap-3 text-sm text-slate-600">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <p className="font-medium text-slate-900">
                Secure administrator
                access
              </p>

              <p>
                Restricted to
                authorized Super
                Admin accounts.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-2"
            >
              Ogun&apos;s Sure Gas
            </Badge>
          </div>

          <Card className="border-white/70 bg-white/85 shadow-2xl shadow-slate-200/60 backdrop-blur-xl">
            <CardHeader className="space-y-3 pb-2">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <ShieldCheck className="size-6" />
              </div>

              <div>
                <CardTitle className="text-2xl">
                  Admin portal
                </CardTitle>

                <CardDescription className="mt-2">
                  Sign in with your
                  authorized Ogun&apos;s
                  Sure Gas administrator
                  account.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <LoginForm />
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-slate-500">
            Protected administration
            environment · Ogun&apos;s
            Sure Gas
          </p>
        </section>
      </div>
    </main>
  );
}