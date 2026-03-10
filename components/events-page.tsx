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
  StatusPill,
} from "@/components/ui";
import {
  formatDateTime,
  getDateTimeInputValue,
  getErrorMessage,
} from "@/lib/format";
import { cn } from "@/lib/cn";

type MemberOption = {
  _id: string;
  name: string;
};

type EventView = {
  _id: string;
  title: string;
  description: string;
  location: string;
  eventTime: number;
  createdAt: number;
  creator: { _id: string; name: string } | null;
  rsvpSummary: {
    coming: { count: number; members: string[] };
    notComing: { count: number; members: string[] };
    notSure: { count: number; members: string[] };
  };
  comments: Array<{
    _id: string;
    content: string;
    createdAt: number;
    member: { _id: string; name: string } | null;
  }>;
};

type EventsPageData = {
  members: MemberOption[];
  upcomingEvents: EventView[];
  pastEvents: EventView[];
};

const rsvpOptions = [
  { value: "coming", label: "Coming" },
  { value: "not_coming", label: "Not coming" },
  { value: "not_sure", label: "Not sure" },
] as const;

export function EventsPage() {
  const [referenceTime] = useState(() => Date.now());
  const rawData = useQuery(api.events.getPageData, { referenceTime });
  const createEvent = useMutation(api.events.createEvent);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    eventTime: getDateTimeInputValue(),
    creatorMemberId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (rawData === undefined) {
    return <LoadingPage title="Events" />;
  }

  const data = rawData as EventsPageData;
  const members = data.members;
  const canCreateEvents = members.length > 0;

  async function handleCreateEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.title || !form.description || !form.location || !form.eventTime) {
      setError("Fill out the title, description, location, and date/time.");
      return;
    }

    if (!form.creatorMemberId) {
      setError("Choose which member is creating the event.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createEvent({
        title: form.title,
        description: form.description,
        location: form.location,
        eventTime: new Date(form.eventTime).getTime(),
        creatorMemberId: form.creatorMemberId as Id<"members">,
      });
      setForm({
        title: "",
        description: "",
        location: "",
        eventTime: getDateTimeInputValue(),
        creatorMemberId: "",
      });
      setSuccess("Event created.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Events"
        title="Plan hangs, track RSVPs, and keep event chatter in one place."
        description="Each event is live-updated from Convex so everyone sees the latest plans, RSVP totals, and comments without any login flow."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="space-y-5">
          <div>
            <p className="text-sm text-slate-400">Create event</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Add the next plan
            </h2>
          </div>

          {!canCreateEvents ? (
            <EmptyState
              title="Add members first"
              description="Every event needs a selected creator member because the app has zero authentication."
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
            <form className="space-y-4" onSubmit={handleCreateEvent}>
              {error ? <MessageBanner tone="error">{error}</MessageBanner> : null}
              {success ? (
                <MessageBanner tone="success">{success}</MessageBanner>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">Title</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60 focus:bg-white/10"
                  placeholder="Movie night, dinner out, road trip..."
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-200">
                  Description
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60 focus:bg-white/10"
                  placeholder="What is the plan and what should people know?"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">
                    Location
                  </span>
                  <input
                    value={form.location}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        location: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60 focus:bg-white/10"
                    placeholder="Address, neighborhood, or venue"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">
                    Date and time
                  </span>
                  <input
                    type="datetime-local"
                    value={form.eventTime}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        eventTime: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60 focus:bg-white/10"
                  />
                </label>
              </div>

              <MemberSelect
                label="Creator member"
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
                {isSubmitting ? "Creating event..." : "Create event"}
              </button>
            </form>
          )}
        </Panel>

        <Panel className="space-y-4">
          <p className="text-sm text-slate-400">Quick view</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Upcoming
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {data.upcomingEvents.length}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Past
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {data.pastEvents.length}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Members
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {members.length}
              </p>
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-emerald-300/12 via-white/4 to-lime-300/10 p-5">
            <h3 className="text-lg font-semibold text-white">
              Fast, no-login event flow
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Create an event, pick a member, and the group can immediately RSVP
              or comment by choosing their name from a dropdown. That keeps the
              experience simple without losing attribution.
            </p>
          </div>
        </Panel>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Upcoming events</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              What is next
            </h2>
          </div>
          <StatusPill tone="success">{data.upcomingEvents.length} upcoming</StatusPill>
        </div>

        {data.upcomingEvents.length === 0 ? (
          <EmptyState
            title="No upcoming events"
            description="Once the next plan is created, it will show up here with RSVPs and comments."
          />
        ) : (
          <div className="space-y-4">
            {data.upcomingEvents.map((event) => (
              <EventCard key={event._id} event={event} members={members} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Past events</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Previous plans
            </h2>
          </div>
          <StatusPill>{data.pastEvents.length} past</StatusPill>
        </div>

        {data.pastEvents.length === 0 ? (
          <EmptyState
            title="No past events yet"
            description="Once dates pass, completed events will collect here for easy reference."
          />
        ) : (
          <div className="space-y-4">
            {data.pastEvents.map((event) => (
              <EventCard key={event._id} event={event} members={members} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EventCard({
  event,
  members,
}: {
  event: EventView;
  members: MemberOption[];
}) {
  const setRsvp = useMutation(api.events.setRsvp);
  const addComment = useMutation(api.events.addComment);

  const [rsvpMemberId, setRsvpMemberId] = useState("");
  const [rsvpStatus, setRsvpStatus] =
    useState<(typeof rsvpOptions)[number]["value"]>("coming");
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpSuccess, setRsvpSuccess] = useState<string | null>(null);
  const [isSavingRsvp, setIsSavingRsvp] = useState(false);

  const [commentMemberId, setCommentMemberId] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);
  const [isSavingComment, setIsSavingComment] = useState(false);

  async function handleRsvpSubmit(eventForm: React.FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    setRsvpError(null);
    setRsvpSuccess(null);

    if (!rsvpMemberId) {
      setRsvpError("Choose a member before saving an RSVP.");
      return;
    }

    setIsSavingRsvp(true);
    try {
      await setRsvp({
        eventId: event._id as Id<"events">,
        memberId: rsvpMemberId as Id<"members">,
        status: rsvpStatus,
      });
      setRsvpSuccess("RSVP saved.");
    } catch (submitError) {
      setRsvpError(getErrorMessage(submitError));
    } finally {
      setIsSavingRsvp(false);
    }
  }

  async function handleCommentSubmit(
    commentFormEvent: React.FormEvent<HTMLFormElement>,
  ) {
    commentFormEvent.preventDefault();
    setCommentError(null);
    setCommentSuccess(null);

    if (!commentMemberId) {
      setCommentError("Choose a member before posting a comment.");
      return;
    }
    if (!commentContent.trim()) {
      setCommentError("Write a comment before posting it.");
      return;
    }

    setIsSavingComment(true);
    try {
      await addComment({
        eventId: event._id as Id<"events">,
        memberId: commentMemberId as Id<"members">,
        content: commentContent,
      });
      setCommentContent("");
      setCommentSuccess("Comment added.");
    } catch (submitError) {
      setCommentError(getErrorMessage(submitError));
    } finally {
      setIsSavingComment(false);
    }
  }

  return (
    <Panel className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={event.eventTime >= Date.now() ? "success" : "neutral"}>
              {event.eventTime >= Date.now() ? "Upcoming" : "Past"}
            </StatusPill>
            <StatusPill>{formatDateTime(event.eventTime)}</StatusPill>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white">{event.title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              {event.description}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Location
            </p>
            <p className="mt-2 text-sm font-medium text-white">
              {event.location}
            </p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Created by
            </p>
            <p className="mt-2 text-sm font-medium text-white">
              {event.creator?.name ?? "Unknown"}
            </p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Comments
            </p>
            <p className="mt-2 text-sm font-medium text-white">
              {event.comments.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/4 p-4">
          <div>
            <p className="text-sm text-slate-400">RSVPs</p>
            <h4 className="mt-1 text-lg font-semibold text-white">
              Quick response
            </h4>
          </div>

          <form className="space-y-4" onSubmit={handleRsvpSubmit}>
            {rsvpError ? (
              <MessageBanner tone="error">{rsvpError}</MessageBanner>
            ) : null}
            {rsvpSuccess ? (
              <MessageBanner tone="success">{rsvpSuccess}</MessageBanner>
            ) : null}

            <MemberSelect
              label="Member"
              value={rsvpMemberId}
              onChange={setRsvpMemberId}
              members={members}
            />

            <div className="grid gap-2 sm:grid-cols-3">
              {rsvpOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRsvpStatus(option.value)}
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-sm font-medium transition",
                    rsvpStatus === option.value
                      ? "border-emerald-400/40 bg-emerald-500/12 text-white"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/8",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isSavingRsvp}
              className="w-full rounded-full border border-emerald-400/35 bg-emerald-500/12 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500/18 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingRsvp ? "Saving RSVP..." : "Save RSVP"}
            </button>
          </form>

          <div className="grid gap-3">
            <RsvpGroup
              label="Coming"
              count={event.rsvpSummary.coming.count}
              members={event.rsvpSummary.coming.members}
              tone="success"
            />
            <RsvpGroup
              label="Not coming"
              count={event.rsvpSummary.notComing.count}
              members={event.rsvpSummary.notComing.members}
            />
            <RsvpGroup
              label="Not sure"
              count={event.rsvpSummary.notSure.count}
              members={event.rsvpSummary.notSure.members}
              tone="warning"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/4 p-4">
          <div>
            <p className="text-sm text-slate-400">Comments</p>
            <h4 className="mt-1 text-lg font-semibold text-white">
              Event thread
            </h4>
          </div>

          {event.comments.length === 0 ? (
            <EmptyState
              title="No comments yet"
              description="Add the first note, question, or update for this event."
            />
          ) : (
            <div className="space-y-3">
              {event.comments.map((comment) => (
                <div
                  key={comment._id}
                  className="rounded-[22px] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-white">
                      {comment.member?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(comment.createdAt)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleCommentSubmit}>
            {commentError ? (
              <MessageBanner tone="error">{commentError}</MessageBanner>
            ) : null}
            {commentSuccess ? (
              <MessageBanner tone="success">{commentSuccess}</MessageBanner>
            ) : null}

            <MemberSelect
              label="Commenting as"
              value={commentMemberId}
              onChange={setCommentMemberId}
              members={members}
            />

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Comment</span>
              <textarea
                value={commentContent}
                onChange={(event) => setCommentContent(event.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60 focus:bg-white/10"
                placeholder="Ask a question, share an update, suggest a tweak..."
              />
            </label>

            <button
              type="submit"
              disabled={isSavingComment}
              className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingComment ? "Posting comment..." : "Add comment"}
            </button>
          </form>
        </div>
      </div>
    </Panel>
  );
}

function RsvpGroup({
  label,
  count,
  members,
  tone = "neutral",
}: {
  label: string;
  count: number;
  members: string[];
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <StatusPill tone={tone}>{label}</StatusPill>
        <p className="text-sm font-medium text-white">{count}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {members.length === 0 ? "No one yet." : members.join(", ")}
      </p>
    </div>
  );
}
