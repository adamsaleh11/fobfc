"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import {
  EmptyState,
  LoadingPage,
  PageHeader,
  Panel,
  StatCard,
  StatusPill,
} from "@/components/ui";
import {
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
  truncateText,
} from "@/lib/format";

const activityLabels: Record<string, string> = {
  member: "Member",
  event: "Event",
  comment: "Comment",
  money: "Money",
  driving: "Drive",
};

type DashboardData = {
  totalMembers: number;
  totalUnsettledCents: number;
  nextUpcomingEvent: {
    title: string;
    location: string;
    eventTime: number;
    creator: { name: string } | null;
  } | null;
  topDriver: {
    memberName: string;
    totalDrives: number;
  } | null;
  recentActivity: Array<{
    id: string;
    kind: string;
    title: string;
    detail: string;
    createdAt: number;
    href: string;
  }>;
};

export function DashboardPage() {
  const [referenceTime] = useState(() => Date.now());
  const rawData = useQuery(api.dashboard.getSummary, { referenceTime });

  if (rawData === undefined) {
    return <LoadingPage title="Dashboard" />;
  }

  const data = rawData as DashboardData;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Friend Group Hub"
        title="Fob FC"
        description="Fob FC established in 2019, founded 2002. 5x finals appearances, 4 league wins, 3 championship wins."
        actions={
          <>
            <Link
              href="/events"
              className="rounded-full border border-emerald-400/35 bg-emerald-500/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500/18"
            >
              Plan an event
            </Link>
            <Link
              href="/members"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/8"
            >
              Manage members
            </Link>
          </>
        }
      />

      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Club Snapshot
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Built for the Fob FC group.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Fob FC established in 2019, founded 2002. 5x finals appearances, 4
              league wins, 3 championship wins.
            </p>
          </div>
          <div className="relative min-h-[280px] border-t border-white/10 lg:min-h-[360px] lg:border-t-0 lg:border-l">
            <Image
              src="/groupPhoto.JPG"
              alt="Fob FC group photo"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09110c] via-[#09110c]/25 to-transparent" />
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Members"
          value={String(data.totalMembers)}
          detail="People currently in the group."
        />
        <StatCard
          label="Unsettled money"
          value={formatCurrency(data.totalUnsettledCents)}
          detail="Open balances still waiting to be settled."
        />
        <StatCard
          label="Next event"
          value={
            data.nextUpcomingEvent ? data.nextUpcomingEvent.title : "None yet"
          }
          detail={
            data.nextUpcomingEvent
              ? formatDateTime(data.nextUpcomingEvent.eventTime)
              : "Create the first event to get the group moving."
          }
        />
        <StatCard
          label="Top driver"
          value={data.topDriver ? data.topDriver.memberName : "No drives yet"}
          detail={
            data.topDriver
              ? `${data.topDriver.totalDrives} total drive${
                  data.topDriver.totalDrives === 1 ? "" : "s"
                }`
              : "Once a drive is logged, the leaderboard will appear here."
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Next upcoming event</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                {data.nextUpcomingEvent
                  ? data.nextUpcomingEvent.title
                  : "Nothing on the calendar yet"}
              </h2>
            </div>
            {data.nextUpcomingEvent ? (
              <StatusPill tone="success">Upcoming</StatusPill>
            ) : null}
          </div>

          {data.nextUpcomingEvent ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  When
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {formatDateTime(data.nextUpcomingEvent.eventTime)}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Where
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {data.nextUpcomingEvent.location}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Created by
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {data.nextUpcomingEvent.creator?.name ?? "Unknown"}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No event scheduled"
              description="Use the Events page to add the next hangout, trip, dinner, or game night."
              action={
                <Link
                  href="/events"
                  className="rounded-full border border-emerald-400/35 bg-emerald-500/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500/18"
                >
                  Go to Events
                </Link>
              }
            />
          )}
        </Panel>

        <Panel className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Recent activity</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Live group pulse
              </h2>
            </div>
            <StatusPill>Fresh</StatusPill>
          </div>

          {data.recentActivity.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="As soon as someone adds a member, event, comment, balance, or drive, it will show up here."
            />
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-[22px] border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <StatusPill>
                        {activityLabels[item.kind] ?? "Update"}
                      </StatusPill>
                      <p className="text-sm font-medium text-white">
                        {item.title}
                      </p>
                      <p className="text-sm leading-6 text-slate-300">
                        {truncateText(item.detail)}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-slate-400">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
