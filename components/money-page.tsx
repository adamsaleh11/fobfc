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
import { formatCurrency, formatDateTime, getErrorMessage } from "@/lib/format";
import { cn } from "@/lib/cn";

type MemberOption = {
  _id: string;
  name: string;
};

type BalanceView = {
  memberId: string;
  memberName: string;
  netCents: number;
};

type EntryView = {
  _id: string;
  amountCents: number;
  reason: string;
  settled: boolean;
  settledAt?: number;
  createdAt: number;
  owedByMember: { _id: string; name: string } | null;
  owedToMember: { _id: string; name: string } | null;
  creatorMember: { _id: string; name: string } | null;
};

type MoneyPageData = {
  members: MemberOption[];
  balances: BalanceView[];
  entries: EntryView[];
  unsettledTotalCents: number;
};

export function MoneyPage() {
  const rawData = useQuery(api.money.getPageData);
  const createEntry = useMutation(api.money.createEntry);
  const markSettled = useMutation(api.money.markSettled);

  const [filter, setFilter] = useState<"all" | "unsettled" | "settled">("all");
  const [form, setForm] = useState({
    amount: "",
    owedByMemberId: "",
    owedToMemberId: "",
    reason: "",
    creatorMemberId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  if (rawData === undefined) {
    return <LoadingPage title="Money Owed" />;
  }

  const data = rawData as MoneyPageData;
  const members = data.members;
  const balances = data.balances;
  const entries = data.entries;
  const canCreateEntries = members.length >= 2;

  const filteredEntries = entries.filter((entry) => {
    if (filter === "unsettled") {
      return !entry.settled;
    }
    if (filter === "settled") {
      return entry.settled;
    }
    return true;
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedAmount = Number(form.amount);
    const amountCents = Math.round(parsedAmount * 100);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    if (!form.owedByMemberId || !form.owedToMemberId || !form.creatorMemberId) {
      setError("Choose all three members before saving.");
      return;
    }
    if (form.owedByMemberId === form.owedToMemberId) {
      setError("A member cannot owe themselves money.");
      return;
    }
    if (!form.reason.trim()) {
      setError("Add a short reason for the balance.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createEntry({
        amountCents,
        owedByMemberId: form.owedByMemberId as Id<"members">,
        owedToMemberId: form.owedToMemberId as Id<"members">,
        reason: form.reason,
        creatorMemberId: form.creatorMemberId as Id<"members">,
      });
      setForm({
        amount: "",
        owedByMemberId: "",
        owedToMemberId: "",
        reason: "",
        creatorMemberId: "",
      });
      setSuccess("Money entry created.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMarkSettled(entryId: string) {
    setSettlingId(entryId);
    try {
      await markSettled({
        entryId: entryId as Id<"moneyEntries">,
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSettlingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Money Owed"
        title="Track balances without turning the group chat into bookkeeping."
        description="Log who owes who, mark balances as settled when they are done, and keep the net picture clear for everyone."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Unsettled total"
          value={formatCurrency(data.unsettledTotalCents)}
          detail="Open balances across the whole group."
        />
        <StatCard
          label="Entries"
          value={String(entries.length)}
          detail="Both open and settled records stay visible."
        />
        <StatCard
          label="Open balances"
          value={String(entries.filter((entry) => !entry.settled).length)}
          detail="Items still waiting to be settled."
        />
        <StatCard
          label="Members"
          value={String(members.length)}
          detail="You need at least two members to log a balance."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel className="space-y-5">
          <div>
            <p className="text-sm text-slate-400">Create entry</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Add a balance
            </h2>
          </div>

          {!canCreateEntries ? (
            <EmptyState
              title="You need at least two members"
              description="Add the friend group first so one person can owe another."
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
              {error ? <MessageBanner tone="error">{error}</MessageBanner> : null}
              {success ? (
                <MessageBanner tone="success">{success}</MessageBanner>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">Amount</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60 focus:bg-white/10"
                    placeholder="24.50"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">Reason</span>
                  <input
                    value={form.reason}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60 focus:bg-white/10"
                    placeholder="Dinner, gas, tickets..."
                  />
                </label>
              </div>

              <MemberSelect
                label="Who owes"
                value={form.owedByMemberId}
                onChange={(value) =>
                  setForm((current) => ({ ...current, owedByMemberId: value }))
                }
                members={members}
              />

              <MemberSelect
                label="Who is owed"
                value={form.owedToMemberId}
                onChange={(value) =>
                  setForm((current) => ({ ...current, owedToMemberId: value }))
                }
                members={members}
              />

              <MemberSelect
                label="Created by"
                value={form.creatorMemberId}
                onChange={(value) =>
                  setForm((current) => ({ ...current, creatorMemberId: value }))
                }
                members={members}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full border border-emerald-400/35 bg-emerald-500/12 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500/18 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving entry..." : "Create money entry"}
              </button>
            </form>
          )}
        </Panel>

        <Panel className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Per-member net balance</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Who is owed overall
              </h2>
            </div>
            <StatusPill>Unsettled only</StatusPill>
          </div>

          {balances.length === 0 ? (
            <EmptyState
              title="No member balances yet"
              description="Add members first, then open balances will automatically roll into per-member net totals."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {balances.map((balance) => (
                <div
                  key={balance.memberId}
                  className={cn(
                    "rounded-[22px] border p-4",
                    balance.netCents > 0 &&
                      "border-emerald-400/20 bg-emerald-500/8",
                    balance.netCents < 0 && "border-rose-400/20 bg-rose-500/8",
                    balance.netCents === 0 && "border-white/10 bg-white/5",
                  )}
                >
                  <p className="text-sm text-slate-300">{balance.memberName}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatCurrency(balance.netCents)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {balance.netCents > 0
                      ? "Net positive: this member is owed money overall."
                      : balance.netCents < 0
                        ? "Net negative: this member owes money overall."
                        : "Currently settled up."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">Entries</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Money log
            </h2>
          </div>
          <div className="flex gap-2">
            {(["all", "unsettled", "settled"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium capitalize transition",
                  filter === value
                    ? "border-emerald-400/40 bg-emerald-500/12 text-white"
                    : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/8",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <EmptyState
            title="No matching balances"
            description="Change the filter or create the first money entry."
          />
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry) => (
              <div
                key={entry._id}
                className="rounded-[24px] border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={entry.settled ? "neutral" : "warning"}>
                        {entry.settled ? "Settled" : "Unsettled"}
                      </StatusPill>
                      <p className="text-sm text-slate-400">
                        Created {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {entry.owedByMember?.name ?? "Unknown"} owes{" "}
                      {entry.owedToMember?.name ?? "Unknown"}
                    </h3>
                    <p className="text-sm leading-6 text-slate-300">
                      {entry.reason}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <p className="text-2xl font-semibold text-white">
                      {formatCurrency(entry.amountCents)}
                    </p>
                    <p className="text-sm text-slate-300">
                      Added by {entry.creatorMember?.name ?? "Unknown"}
                    </p>
                    {entry.settled ? (
                      <p className="text-xs text-slate-400">
                        Settled{" "}
                        {entry.settledAt ? formatDateTime(entry.settledAt) : ""}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleMarkSettled(entry._id)}
                        disabled={settlingId === entry._id}
                        className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/16 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {settlingId === entry._id ? "Settling..." : "Mark settled"}
                      </button>
                    )}
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
