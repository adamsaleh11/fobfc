import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

function formatMoneyBrief(amountCents: number) {
  return `$${(amountCents / 100).toFixed(2)}`;
}

export const getSummary = query({
  args: {
    referenceTime: v.number(),
  },
  handler: async (ctx, args) => {
    const [members, events, comments, moneyEntries, drivingEntries] =
      await Promise.all([
        ctx.db.query("members").collect(),
        ctx.db.query("events").collect(),
        ctx.db.query("eventComments").collect(),
        ctx.db.query("moneyEntries").collect(),
        ctx.db.query("drivingEntries").collect(),
      ]);

    const membersById = new Map<Id<"members">, Doc<"members">>(
      members.map((member) => [member._id, member]),
    );
    const eventsById = new Map(events.map((event) => [event._id, event]));

    const totalUnsettledCents = moneyEntries.reduce(
      (sum, entry) => sum + (entry.settled ? 0 : entry.amountCents),
      0,
    );

    const nextUpcomingEvent =
      events
        .filter((event) => event.eventTime >= args.referenceTime)
        .sort((a, b) => a.eventTime - b.eventTime)[0] ?? null;

    const driveCounts = new Map<Id<"members">, number>();
    for (const member of members) {
      driveCounts.set(member._id, 0);
    }
    for (const entry of drivingEntries) {
      driveCounts.set(entry.driverMemberId, (driveCounts.get(entry.driverMemberId) ?? 0) + 1);
    }

    const topDriver =
      members
        .slice()
        .sort((a, b) => {
          const diff = (driveCounts.get(b._id) ?? 0) - (driveCounts.get(a._id) ?? 0);
          return diff === 0 ? a.name.localeCompare(b.name) : diff;
        })
        .map((member) => ({
          memberId: member._id,
          memberName: member.name,
          totalDrives: driveCounts.get(member._id) ?? 0,
        }))[0] ?? null;

    const recentActivity = [
      ...members.map((member) => ({
        id: `member-${member._id}`,
        kind: "member",
        title: `${member.name} was added`,
        detail: "New member joined the group list.",
        createdAt: member.createdAt,
        href: "/members",
      })),
      ...events.map((event) => ({
        id: `event-${event._id}`,
        kind: "event",
        title: `New event: ${event.title}`,
        detail: `${membersById.get(event.creatorMemberId)?.name ?? "Someone"} planned it for the group.`,
        createdAt: event.createdAt,
        href: "/events",
      })),
      ...comments.map((comment) => ({
        id: `comment-${comment._id}`,
        kind: "comment",
        title: `${membersById.get(comment.memberId)?.name ?? "Someone"} commented on ${
          eventsById.get(comment.eventId)?.title ?? "an event"
        }`,
        detail: comment.content,
        createdAt: comment.createdAt,
        href: "/events",
      })),
      ...moneyEntries.map((entry) => ({
        id: `money-${entry._id}`,
        kind: "money",
        title: `${membersById.get(entry.owedByMemberId)?.name ?? "Someone"} owes ${
          membersById.get(entry.owedToMemberId)?.name ?? "someone"
        } ${formatMoneyBrief(entry.amountCents)}`,
        detail: entry.reason,
        createdAt: entry.createdAt,
        href: "/money-owed",
      })),
      ...drivingEntries.map((entry) => ({
        id: `drive-${entry._id}`,
        kind: "driving",
        title: `${membersById.get(entry.driverMemberId)?.name ?? "Someone"} logged a drive`,
        detail:
          entry.note ||
          `Added by ${membersById.get(entry.creatorMemberId)?.name ?? "someone"}.`,
        createdAt: entry.createdAt,
        href: "/driving-tally",
      })),
    ]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8);

    return {
      totalMembers: members.length,
      totalUnsettledCents,
      nextUpcomingEvent: nextUpcomingEvent
        ? {
            ...nextUpcomingEvent,
            creator: membersById.get(nextUpcomingEvent.creatorMemberId) ?? null,
          }
        : null,
      topDriver,
      recentActivity,
    };
  },
});
