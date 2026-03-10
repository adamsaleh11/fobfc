"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import {
  EmptyState,
  LoadingPage,
  MessageBanner,
  PageHeader,
  Panel,
  StatCard,
} from "@/components/ui";
import { formatCurrency, formatDateTime, getErrorMessage } from "@/lib/format";
import { cn } from "@/lib/cn";

type MemberView = {
  _id: string;
  name: string;
  createdAt: number;
  stats: {
    totalDrives: number;
    currentBalanceCents: number;
    rsvpCount: number;
    eventsCreated: number;
  };
};

export function MembersPage() {
  const rawMembers = useQuery(api.members.getPageData);
  const createMember = useMutation(api.members.create);

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (rawMembers === undefined) {
    return <LoadingPage title="Members" />;
  }

  const memberList = rawMembers as MemberView[];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Member name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createMember({ name });
      setName("");
      setSuccess("Member added.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Members"
        title="Manage the friend group list once, then reference it everywhere."
        description="Members are first-class records across the app. Add people here and they become selectable for events, comments, balances, and drives."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Members"
          value={String(memberList.length)}
          detail="Everyone currently available in the shared app."
        />
        <StatCard
          label="Total drives"
          value={String(
            memberList.reduce((sum, member) => sum + member.stats.totalDrives, 0),
          )}
          detail="Combined driving tallies across the group."
        />
        <StatCard
          label="RSVPs"
          value={String(
            memberList.reduce((sum, member) => sum + member.stats.rsvpCount, 0),
          )}
          detail="Total RSVP selections recorded so far."
        />
        <StatCard
          label="Events created"
          value={String(
            memberList.reduce(
              (sum, member) => sum + member.stats.eventsCreated,
              0,
            ),
          )}
          detail="How many events members have created."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Panel className="space-y-5">
          <div>
            <p className="text-sm text-slate-400">Add member</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Keep the list current
            </h2>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error ? <MessageBanner tone="error">{error}</MessageBanner> : null}
            {success ? <MessageBanner tone="success">{success}</MessageBanner> : null}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60 focus:bg-white/10"
                placeholder="Add a member by name"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full border border-emerald-400/35 bg-emerald-500/12 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500/18 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Adding member..." : "Add member"}
            </button>
          </form>
        </Panel>

        <Panel className="space-y-5">
          <div>
            <p className="text-sm text-slate-400">Member notes</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Simple rules that keep the app clean
            </h2>
          </div>
          <div className="grid gap-3">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white">
                Names are selected everywhere
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Since there is no authentication, every action that needs
                attribution asks the user to pick a member from the group list.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white">
                Duplicate names are blocked
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The backend normalizes names before checking for duplicates, so
                extra spaces and case differences do not create accidental copies.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white">Stats stay live</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Each member card pulls in current drives, outstanding balance,
                RSVPs, and events created from the rest of the app.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="space-y-5">
        <div>
          <p className="text-sm text-slate-400">Group roster</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            All members
          </h2>
        </div>

        {memberList.length === 0 ? (
          <EmptyState
            title="No members yet"
            description="Add the first person to unlock event attribution, money tracking, and driving tallies."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {memberList.map((member) => (
              <div
                key={member._id}
                className="rounded-[24px] border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {member.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Added {formatDateTime(member.createdAt)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      member.stats.currentBalanceCents > 0 &&
                        "bg-emerald-500/12 text-emerald-100",
                      member.stats.currentBalanceCents < 0 &&
                        "bg-rose-500/12 text-rose-100",
                      member.stats.currentBalanceCents === 0 &&
                        "bg-white/8 text-slate-200",
                    )}
                  >
                    {formatCurrency(member.stats.currentBalanceCents)}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MemberStat
                    label="Total drives"
                    value={String(member.stats.totalDrives)}
                  />
                  <MemberStat
                    label="RSVPs"
                    value={String(member.stats.rsvpCount)}
                  />
                  <MemberStat
                    label="Events created"
                    value={String(member.stats.eventsCreated)}
                  />
                  <MemberStat
                    label="Current balance"
                    value={formatCurrency(member.stats.currentBalanceCents)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function MemberStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-black/10 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
