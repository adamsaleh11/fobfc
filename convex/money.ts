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
      ctx.db.query("moneyEntries").collect(),
    ]);

    const membersById = new Map(members.map((member) => [member._id, member]));
    const balances = new Map<Id<"members">, number>();
    for (const member of members) {
      balances.set(member._id, 0);
    }

    let unsettledTotalCents = 0;
    for (const entry of entries) {
      if (entry.settled) {
        continue;
      }
      unsettledTotalCents += entry.amountCents;
      balances.set(
        entry.owedByMemberId,
        (balances.get(entry.owedByMemberId) ?? 0) - entry.amountCents,
      );
      balances.set(
        entry.owedToMemberId,
        (balances.get(entry.owedToMemberId) ?? 0) + entry.amountCents,
      );
    }

    const sortedEntries = entries
      .slice()
      .sort((a, b) => {
        if (a.settled !== b.settled) {
          return Number(a.settled) - Number(b.settled);
        }
        return b.createdAt - a.createdAt;
      })
      .map((entry) => ({
        ...entry,
        owedByMember: membersById.get(entry.owedByMemberId) ?? null,
        owedToMember: membersById.get(entry.owedToMemberId) ?? null,
        creatorMember: membersById.get(entry.creatorMemberId) ?? null,
      }));

    const balanceList = members
      .slice()
      .sort(compareNames)
      .map((member) => ({
        memberId: member._id,
        memberName: member.name,
        netCents: balances.get(member._id) ?? 0,
      }));

    return {
      members: members.sort(compareNames),
      entries: sortedEntries,
      unsettledTotalCents,
      balances: balanceList,
    };
  },
});

export const createEntry = mutation({
  args: {
    amountCents: v.number(),
    owedByMemberId: v.id("members"),
    owedToMemberId: v.id("members"),
    reason: v.string(),
    creatorMemberId: v.id("members"),
  },
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
      throw new Error("Amount must be greater than zero.");
    }
    if (args.owedByMemberId === args.owedToMemberId) {
      throw new Error("A member cannot owe themselves money.");
    }

    const reason = args.reason.trim();
    if (!reason) {
      throw new Error("Reason is required.");
    }

    await Promise.all([
      requireMember(ctx, args.owedByMemberId),
      requireMember(ctx, args.owedToMemberId),
      requireMember(ctx, args.creatorMemberId),
    ]);

    const entryId = await ctx.db.insert("moneyEntries", {
      amountCents: args.amountCents,
      owedByMemberId: args.owedByMemberId,
      owedToMemberId: args.owedToMemberId,
      reason,
      creatorMemberId: args.creatorMemberId,
      settled: false,
      createdAt: Date.now(),
    });

    return await ctx.db.get(entryId);
  },
});

export const markSettled = mutation({
  args: {
    entryId: v.id("moneyEntries"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("That money entry was not found.");
    }
    if (entry.settled) {
      return entry;
    }

    await ctx.db.patch(args.entryId, {
      settled: true,
      settledAt: Date.now(),
    });

    return await ctx.db.get(args.entryId);
  },
});
