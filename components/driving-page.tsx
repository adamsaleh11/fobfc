"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";

import { api } from "@/convex/_generated/api";
import { MemberSelect } from "@/components/member-select";
import {
  EmptyState,
  LoadingPage,
  MessageBanner,
  PageHeader,
  Panel,
  StatCard,
  StatusPill,
} from "@/components/ui";
import {
  formatDateTime,
  formatDriveDate,
  getDateInputValue,
  getErrorMessage,
} from "@/lib/format";

type MemberOption = {
  _id: string;
  name: string;
};

type LeaderboardRow = {
  rank: number;
  memberId: string;
  memberName: string;
  totalDrives: number;
};

type DrivingEntryView = {
  _id: string;
  driveDate: string;
  note?: string;
  createdAt: number;
  driverMember: { _id: string; name: string } | null;
  creatorMember: { _id: string; name: string } | null;
};

type DrivingPageData = {
  members: MemberOption[];
  leaderboard: LeaderboardRow[];
  recentEntries: DrivingEntryView[];
};

export function DrivingPage() {
  const rawData = useQuery(api.driving.getPageData);
  const addEntry = useMutation(api.driving.addEntry);

  const [form, setForm] = useState({
    driverMemberId: "",
    driveDate: getDateInputValue(),
    note: "",
    creatorMemberId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (rawData === undefined) {
    return <LoadingPage title="Driving Tally" />;
  }

  const data = rawData as DrivingPageData;
  const members = data.members;
  const leaderboard = data.leaderboard;
  const recentEntries = data.recentEntries;
  const canCreateEntries = members.length > 0;
  const topDriver = leaderboard.find((entry) => entry.totalDrives > 0) ?? null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.driverMemberId || !form.creatorMemberId) {
      setError("Choose both the driver and the member creating the entry.");
      return;
    }
    if (!form.driveDate) {
      setError("Pick a valid drive date.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addEntry({
        driverMemberId: form.driverMemberId as Id<"members">,
        creatorMemberId: form.creatorMemberId as Id<"members">,
        driveDate: form.driveDate,
        note: form.note.trim() || undefined,
      });
      setForm({
        driverMemberId: "",
        driveDate: getDateInputValue(),
        note: "",
        creatorMemberId: "",
      });
      setSuccess("Drive logged.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Driving Tally"
        title="Keep ride fair and visible."
        description="Every time someone drives, log it once and the leaderboard updates instantly. It stays lightweight, fun, and easy to verify."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Drives logged"
          value={String(recentEntries.length)}
          detail="Total driving entries in the shared log."
        />
        <StatCard
          label="Top driver"
          value={topDriver ? topDriver.memberName : "No entries yet"}
          detail={
            topDriver
              ? `${topDriver.totalDrives} drive${
                  topDriver.totalDrives === 1 ? "" : "s"
                }`
              : "Log a drive to start the leaderboard."
          }
        />
        <StatCard
          label="Active drivers"
          value={String(
            leaderboard.filter((row) => row.totalDrives > 0).length,
          )}
          detail="Members with at least one logged drive."
        />
        <StatCard
          label="Members"
          value={String(members.length)}
          detail="Any member can be selected as driver or creator."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="space-y-5">
          <div>
            <p className="text-sm text-slate-400">Add drive</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Log a tally entry
            </h2>
          </div>

          {!canCreateEntries ? (
            <EmptyState
              title="Add members first"
              description="You need at least one member in the group before you can log who drove."
              action={
                <Link
                  href="/members"
                  className="rounded-full border border-emerald-400/35 bg-emerald-500/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500/18"
                >
                  Go to Members
                </Link>
              }
            />
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error ? (
                <MessageBanner tone="error">{error}</MessageBanner>
              ) : null}
              {success ? (
                <MessageBanner tone="success">{success}</MessageBanner>
              ) : null}

              <MemberSelect
                label="Driver"
                value={form.driverMemberId}
                onChange={(value) =>
                  setForm((current) => ({ ...current, driverMemberId: value }))
                }
                members={members}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">
                    Date
                  </span>
                  <input
                    type="date"
                    value={form.driveDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        driveDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60 focus:bg-white/10"
                  />
                </label>

                <MemberSelect
                  label="Created by"
                  value={form.creatorMemberId}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      creatorMemberId: value,
                    }))
                  }
                  members={members}
                />
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">
                  Note (optional)
                </span>
                <textarea
                  value={form.note}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60 focus:bg-white/10"
                  placeholder="Airport run, late-night pickup, grocery run..."
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full border border-emerald-400/35 bg-emerald-500/12 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500/18 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving drive..." : "Add drive entry"}
              </button>
            </form>
          )}
        </Panel>

        <Panel className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Leaderboard</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Total drives by member
              </h2>
            </div>
            <StatusPill tone="success">Highest first</StatusPill>
          </div>

          {leaderboard.length === 0 ? (
            <EmptyState
              title="No members yet"
              description="Once members are added, the leaderboard will rank everyone by their total drives."
            />
          ) : (
            <div className="space-y-3">
              {leaderboard.map((row) => (
                <div
                  key={row.memberId}
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-sm font-semibold text-white">
                      {row.rank}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {row.memberName}
                      </p>
                      <p className="text-sm text-slate-400">
                        {row.totalDrives === 0
                          ? "No drives logged yet"
                          : `${row.totalDrives} drive${
                              row.totalDrives === 1 ? "" : "s"
                            }`}
                      </p>
                    </div>
                  </div>
                  {row.rank === 1 && row.totalDrives > 0 ? (
                    <StatusPill tone="success">Leading</StatusPill>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Recent driving log</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Verify recent tallies
            </h2>
          </div>
          <StatusPill>{recentEntries.length} entries</StatusPill>
        </div>

        {recentEntries.length === 0 ? (
          <EmptyState
            title="No drives logged yet"
            description="Add the first drive and it will appear here right away."
          />
        ) : (
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div
                key={entry._id}
                className="rounded-[24px] border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {entry.driverMember?.name ?? "Unknown"} drove
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {entry.note || "No note added for this drive."}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm text-slate-300 sm:text-right">
                    <p>{formatDriveDate(entry.driveDate)}</p>
                    <p>Added by {entry.creatorMember?.name ?? "Unknown"}</p>
                    <p className="text-xs text-slate-400">
                      Logged {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
