import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const rsvpStatus = v.union(
  v.literal("coming"),
  v.literal("not_coming"),
  v.literal("not_sure"),
);

export default defineSchema({
  members: defineTable({
    name: v.string(),
    normalizedName: v.string(),
    createdAt: v.number(),
  })
    .index("by_normalized_name", ["normalizedName"])
    .index("by_created_at", ["createdAt"]),

  events: defineTable({
    title: v.string(),
    description: v.string(),
    location: v.string(),
    eventTime: v.number(),
    creatorMemberId: v.id("members"),
    createdAt: v.number(),
  })
    .index("by_event_time", ["eventTime"])
    .index("by_created_at", ["createdAt"]),

  eventRsvps: defineTable({
    eventId: v.id("events"),
    memberId: v.id("members"),
    status: rsvpStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId", "updatedAt"])
    .index("by_event_member", ["eventId", "memberId"]),

  eventComments: defineTable({
    eventId: v.id("events"),
    memberId: v.id("members"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_event", ["eventId", "createdAt"]),

  moneyEntries: defineTable({
    amountCents: v.number(),
    owedByMemberId: v.id("members"),
    owedToMemberId: v.id("members"),
    reason: v.string(),
    creatorMemberId: v.id("members"),
    settled: v.boolean(),
    settledAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_settled", ["settled", "createdAt"])
    .index("by_created_at", ["createdAt"]),

  drivingEntries: defineTable({
    driverMemberId: v.id("members"),
    driveDate: v.string(),
    note: v.optional(v.string()),
    creatorMemberId: v.id("members"),
    createdAt: v.number(),
  })
    .index("by_driver", ["driverMemberId", "createdAt"])
    .index("by_drive_date", ["driveDate", "createdAt"])
    .index("by_created_at", ["createdAt"]),
});
