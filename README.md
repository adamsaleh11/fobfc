# Sidecar

Private friend group hub built with Next.js, TypeScript, Tailwind CSS, and Convex.

The app includes exactly these pages:

- Home
- Events
- Money Owed
- Driving Tally
- Members

There is no authentication. Every action that needs attribution asks the user to select a member from the shared members list.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Convex for backend queries, mutations, and data storage

## Features

- Dashboard with member count, unsettled total, next event, top driver, and recent activity
- Events with creation, RSVP updates, and comment threads
- Money tracking with unsettled totals, mark-as-settled flow, and per-member net balances
- Driving tally with leaderboard and recent log
- Members page with manual member creation and lightweight cross-app stats

## Environment variables

Create `.env.local` with:

```bash
CONVEX_DEPLOYMENT=dev:your-project-name
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-project.convex.site
```

An `.env.example` file is included as a template.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Start Convex in one terminal:

```bash
npx convex dev
```

This connects your local app to the configured Convex development deployment, pushes functions/schema changes, and regenerates the client API when needed.

3. Start Next.js in another terminal:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Helpful commands

```bash
npm run dev
npm run convex:dev
npm run codegen
npm run lint
npm run build
```

## How the main features work

- Members are stored as first-class Convex records and reused across all other data.
- Events store title, description, location, date/time, creator, RSVP breakdowns, and chronological comments.
- RSVP updates are upserts in Convex, so each member only has one RSVP per event.
- Money entries store who owes, who is owed, amount in cents, creator, reason, and settled state.
- Driving tally entries store the driver, date, optional note, creator, and created timestamp.
- The homepage summary and recent activity are derived directly from live Convex data.

## Convex data model

- `members`
- `events`
- `eventRsvps`
- `eventComments`
- `moneyEntries`
- `drivingEntries`

## Notes

- Backend validation lives in Convex mutations, not only in the UI.
- The app is optimized for small-group scale and simple maintenance, not multi-tenant or enterprise use.
