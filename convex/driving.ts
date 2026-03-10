import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

async function requireMember(ctx: MutationCtx, memberId: Id<"members">) {
  const member = await ctx.db.get(memberId);
  if (!member) {
    throw new Error("Selected member was not found.");
  }
  return member as Doc<"members">;
}

function compareNames(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name);
}

export const getPageData = query({
  args: {},
  handler: async (ctx) => {
    const [members, entries] = await Promise.all([
      ctx.db.query("members").collect(),
      ctx.db.query("drivingEntries").collect(),
    ]);

    const membersById = new Map(members.map((member) => [member._id, member]));
    const totals = new Map<Id<"members">, number>();
    for (const member of members) {
      totals.set(member._id, 0);
    }

    for (const entry of entries) {
      totals.set(entry.driverMemberId, (totals.get(entry.driverMemberId) ?? 0) + 1);
    }

    const leaderboard = members
      .slice()
      .sort((a, b) => {
        const diff = (totals.get(b._id) ?? 0) - (totals.get(a._id) ?? 0);
        return diff === 0 ? a.name.localeCompare(b.name) : diff;
      })
      .map((member, index) => ({
        rank: index + 1,
        memberId: member._id,
        memberName: member.name,
        totalDrives: totals.get(member._id) ?? 0,
      }));

    const recentEntries = entries
      .slice()
      .sort((a, b) => {
        const dateCompare = b.driveDate.localeCompare(a.driveDate);
        return dateCompare === 0 ? b.createdAt - a.createdAt : dateCompare;
      })
      .map((entry) => ({
        ...entry,
        driverMember: membersById.get(entry.driverMemberId) ?? null,
        creatorMember: membersById.get(entry.creatorMemberId) ?? null,
      }));

    return {
      members: members.sort(compareNames),
      leaderboard,
      recentEntries,
    };
  },
});

export const addEntry = mutation({
  args: {
    driverMemberId: v.id("members"),
    driveDate: v.string(),
    note: v.optional(v.string()),
    creatorMemberId: v.id("members"),
  },
  handler: async (ctx, args) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.driveDate)) {
      throw new Error("Pick a valid drive date.");
    }

    await Promise.all([
      requireMember(ctx, args.driverMemberId),
      requireMember(ctx, args.creatorMemberId),
    ]);

    const note = args.note?.trim();
    const entryId = await ctx.db.insert("drivingEntries", {
      driverMemberId: args.driverMemberId,
      driveDate: args.driveDate,
      note: note || undefined,
      creatorMemberId: args.creatorMemberId,
      createdAt: Date.now(),
    });

    return await ctx.db.get(entryId);
  },
});
