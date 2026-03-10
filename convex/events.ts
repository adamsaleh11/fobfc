import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

const rsvpStatusValidator = v.union(
  v.literal("coming"),
  v.literal("not_coming"),
  v.literal("not_sure"),
);

type RsvpStatus = "coming" | "not_coming" | "not_sure";

async function requireMember(ctx: MutationCtx, memberId: Id<"members">) {
  const member = await ctx.db.get(memberId);
  if (!member) {
    throw new Error("Selected member was not found.");
  }
  return member as Doc<"members">;
}

async function requireEvent(ctx: MutationCtx, eventId: Id<"events">) {
  const event = await ctx.db.get(eventId);
  if (!event) {
    throw new Error("That event was not found.");
  }
  return event as Doc<"events">;
}

function compareNames(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name);
}

function buildEvent(
  event: Doc<"events">,
  membersById: Map<Id<"members">, Doc<"members">>,
  rsvps: Doc<"eventRsvps">[],
  comments: Doc<"eventComments">[],
) {
  const eventRsvps = rsvps.filter((rsvp) => rsvp.eventId === event._id);
  const eventComments = comments
    .filter((comment) => comment.eventId === event._id)
    .sort((a, b) => a.createdAt - b.createdAt);

  const rsvpGroups: Record<RsvpStatus, string[]> = {
    coming: [],
    not_coming: [],
    not_sure: [],
  };

  for (const rsvp of eventRsvps) {
    const member = membersById.get(rsvp.memberId);
    if (member) {
      const status = rsvp.status as RsvpStatus;
      rsvpGroups[status].push(member.name);
    }
  }

  for (const key of Object.keys(rsvpGroups) as RsvpStatus[]) {
    rsvpGroups[key].sort((a, b) => a.localeCompare(b));
  }

  return {
    ...event,
    creator: membersById.get(event.creatorMemberId) ?? null,
    rsvpSummary: {
      coming: {
        count: rsvpGroups.coming.length,
        members: rsvpGroups.coming,
      },
      notComing: {
        count: rsvpGroups.not_coming.length,
        members: rsvpGroups.not_coming,
      },
      notSure: {
        count: rsvpGroups.not_sure.length,
        members: rsvpGroups.not_sure,
      },
    },
    comments: eventComments.map((comment) => ({
      ...comment,
      member: membersById.get(comment.memberId) ?? null,
    })),
  };
}

export const getPageData = query({
  args: {
    referenceTime: v.number(),
  },
  handler: async (ctx, args) => {
    const [members, events, rsvps, comments] = await Promise.all([
      ctx.db.query("members").collect(),
      ctx.db.query("events").collect(),
      ctx.db.query("eventRsvps").collect(),
      ctx.db.query("eventComments").collect(),
    ]);

    const membersById = new Map(members.map((member) => [member._id, member]));
    const upcomingEvents = events
      .filter((event) => event.eventTime >= args.referenceTime)
      .sort((a, b) => a.eventTime - b.eventTime)
      .map((event) => buildEvent(event, membersById, rsvps, comments));

    const pastEvents = events
      .filter((event) => event.eventTime < args.referenceTime)
      .sort((a, b) => b.eventTime - a.eventTime)
      .map((event) => buildEvent(event, membersById, rsvps, comments));

    return {
      members: members.sort(compareNames),
      upcomingEvents,
      pastEvents,
    };
  },
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    location: v.string(),
    eventTime: v.number(),
    creatorMemberId: v.id("members"),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    const description = args.description.trim();
    const location = args.location.trim();

    if (!title) {
      throw new Error("Event title is required.");
    }
    if (!description) {
      throw new Error("Event description is required.");
    }
    if (!location) {
      throw new Error("Event location is required.");
    }
    if (!Number.isFinite(args.eventTime) || args.eventTime <= 0) {
      throw new Error("Pick a valid event date and time.");
    }

    await requireMember(ctx, args.creatorMemberId);

    const eventId = await ctx.db.insert("events", {
      title,
      description,
      location,
      eventTime: args.eventTime,
      creatorMemberId: args.creatorMemberId,
      createdAt: Date.now(),
    });

    return await ctx.db.get(eventId);
  },
});

export const setRsvp = mutation({
  args: {
    eventId: v.id("events"),
    memberId: v.id("members"),
    status: rsvpStatusValidator,
  },
  handler: async (ctx, args) => {
    await Promise.all([
      requireEvent(ctx, args.eventId),
      requireMember(ctx, args.memberId),
    ]);

    const existing = (await ctx.db.query("eventRsvps").collect()).find(
      (rsvp) =>
        rsvp.eventId === args.eventId && rsvp.memberId === args.memberId,
    );

    const updatedAt = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        updatedAt,
      });
      return await ctx.db.get(existing._id);
    }

    const rsvpId = await ctx.db.insert("eventRsvps", {
      eventId: args.eventId,
      memberId: args.memberId,
      status: args.status,
      createdAt: updatedAt,
      updatedAt,
    });

    return await ctx.db.get(rsvpId);
  },
});

export const addComment = mutation({
  args: {
    eventId: v.id("events"),
    memberId: v.id("members"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const content = args.content.trim();
    if (!content) {
      throw new Error("Comment content is required.");
    }

    await Promise.all([
      requireEvent(ctx, args.eventId),
      requireMember(ctx, args.memberId),
    ]);

    const commentId = await ctx.db.insert("eventComments", {
      eventId: args.eventId,
      memberId: args.memberId,
      content,
      createdAt: Date.now(),
    });

    return await ctx.db.get(commentId);
  },
});
