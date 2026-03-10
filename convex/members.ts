import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

function cleanName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeName(name: string) {
  return cleanName(name).toLowerCase();
}

function compareNames(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name);
}

function buildBalanceMap(
  members: Doc<"members">[],
  moneyEntries: Doc<"moneyEntries">[],
) {
  const balances = new Map<Id<"members">, number>();
  for (const member of members) {
    balances.set(member._id, 0);
  }

  for (const entry of moneyEntries) {
    if (entry.settled) {
      continue;
    }
    balances.set(
      entry.owedByMemberId,
      (balances.get(entry.owedByMemberId) ?? 0) - entry.amountCents,
    );
    balances.set(
      entry.owedToMemberId,
      (balances.get(entry.owedToMemberId) ?? 0) + entry.amountCents,
    );
  }

  return balances;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("members").collect();
    return members.sort(compareNames);
  },
});

export const getPageData = query({
  args: {},
  handler: async (ctx) => {
    const [members, drivingEntries, moneyEntries, rsvps, events] =
      await Promise.all([
        ctx.db.query("members").collect(),
        ctx.db.query("drivingEntries").collect(),
        ctx.db.query("moneyEntries").collect(),
        ctx.db.query("eventRsvps").collect(),
        ctx.db.query("events").collect(),
      ]);

    const balances = buildBalanceMap(members, moneyEntries);

    return members.sort(compareNames).map((member) => ({
      ...member,
      stats: {
        totalDrives: drivingEntries.filter(
          (entry) => entry.driverMemberId === member._id,
        ).length,
        currentBalanceCents: balances.get(member._id) ?? 0,
        rsvpCount: rsvps.filter((rsvp) => rsvp.memberId === member._id).length,
        eventsCreated: events.filter(
          (event) => event.creatorMemberId === member._id,
        ).length,
      },
    }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const name = cleanName(args.name);
    if (!name) {
      throw new Error("Member name is required.");
    }

    const normalizedName = normalizeName(name);
    const existing = (await ctx.db.query("members").collect()).find(
      (member) => member.normalizedName === normalizedName,
    );

    if (existing) {
      throw new Error("That member name already exists.");
    }

    const createdAt = Date.now();
    const memberId = await ctx.db.insert("members", {
      name,
      normalizedName,
      createdAt,
    });

    return await ctx.db.get(memberId);
  },
});
