"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/money-owed", label: "Money Owed" },
  { href: "/driving-tally", label: "Driving Tally" },
  { href: "/members", label: "Members" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <header className="sticky top-4 z-30 mb-8 rounded-[30px] border border-emerald-900/50 bg-[#08110c]/82 px-4 py-4 shadow-[0_20px_80px_rgba(6,35,19,0.42)] backdrop-blur sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-white"
            >
              Fob FC
            </Link>
            <p className="mt-1 text-sm text-slate-300">
              Established in 2019. Shared plans, balances, and ride.
            </p>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition",
                    isActive
                      ? "border-emerald-400/45 bg-emerald-500/12 text-white"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/8",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="pb-12">{children}</main>
    </div>
  );
}
