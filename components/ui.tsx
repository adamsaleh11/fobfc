import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type PanelProps = {
  children?: ReactNode;
  className?: string;
};

type MessageBannerProps = {
  children: ReactNode;
  tone: "error" | "success";
};

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
};

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

type StatusPillProps = {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
};

export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-emerald-900/50 bg-[#09110c]/78 p-5 shadow-[0_18px_70px_rgba(5,32,18,0.4)] backdrop-blur sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
          {eyebrow}
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="text-sm leading-7 text-slate-300 sm:text-base">
            {description}
          </p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <Panel className="h-full">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
    </Panel>
  );
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/12 bg-white/4 px-5 py-8 text-center">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300">
        {description}
      </p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function MessageBanner({ children, tone }: MessageBannerProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "error"
          ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
          : "border-emerald-400/30 bg-emerald-500/10 text-white",
      )}
    >
      {children}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
        tone === "success" &&
          "border-emerald-400/30 bg-emerald-500/10 text-white",
        tone === "warning" &&
          "border-amber-400/30 bg-amber-500/10 text-amber-100",
        tone === "neutral" &&
          "border-white/10 bg-white/5 text-slate-200",
      )}
    >
      {children}
    </span>
  );
}

export function LoadingPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Loading"
        title={title}
        description="Pulling the latest Convex data for your group."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Panel
            key={index}
            className="h-36 animate-pulse bg-[#0d1610]/70 shadow-none"
          />
        ))}
      </div>
      <Panel className="h-72 animate-pulse bg-[#0d1610]/70 shadow-none" />
    </div>
  );
}
