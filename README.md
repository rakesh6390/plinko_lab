# Plinko Lab

A small provably-fair Plinko prototype built with Next.js, Prisma, and PostgreSQL. The app lets a player drop one or more balls, records each round through API routes, and includes a verifier page that recomputes the same hash and engine result from the revealed inputs.

## Links

- Live app: https://plinko-lab-kappa.vercel.app
- Verifier page: https://plinko-lab-kappa.vercel.app/verify
- Example round permalink: `https://plinko-lab-kappa.vercel.app/api/rounds/{roundId}`

The round permalink is created after a round is committed. Use the `roundId` returned by `POST /api/rounds/commit`, or inspect the network response while playing, then replace `{roundId}` in the URL.

## Run Locally

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

For Neon, use the connection string from the Neon dashboard. The project uses Prisma 7 driver adapters, and the runtime client is configured in `lib/prisma.ts`.

Apply migrations and generate Prisma Client:

```bash
npx prisma migrate dev
npx prisma generate
```

Run the app:

```bash
npm run dev
```

Open the URL printed by Next.js, usually:

```text
http://localhost:3000
```

If port `3000` is already in use, Next.js will choose another port such as `3001`.

### Environment Variables

Required:

```env
DATABASE_URL="postgresql://..."
```

Optional for local development:

```env
LOCAL_ROUNDS=1
```

`LOCAL_ROUNDS=1` makes the API use an in-memory round store instead of the remote database. This is useful when Neon is blocked or timing out locally. It is only for development: rounds reset when the dev server restarts.

Useful scripts:

```bash
npm run dev
npm run build
npm run lint
npm test
```

## Architecture

```text
Browser
  |
  | renders game board and calls API routes
  v
Next.js App Router
  |
  | /api/rounds/commit
  | /api/rounds/:id/start
  | /api/rounds/:id
  | /api/rounds/:id/reveal
  | /api/verify
  v
Fairness + Engine Libraries
  |
  | commit hash, combined seed, PRNG, peg map, path
  v
Round Store
  |
  | Prisma + PostgreSQL in normal mode
  | in-memory Map when LOCAL_ROUNDS=1
  v
Database
```

Main files:

- `components/Board.tsx`: canvas board, play loop, API calls, result display.
- `lib/fairness.ts`: seed generation and SHA-256 commit/combined seed helpers.
- `lib/prng.ts`: deterministic XorShift32 PRNG.
- `lib/engine.ts`: peg map generation, path calculation, bin result.
- `lib/roundStore.ts`: storage wrapper for Prisma or local memory mode.
- `prisma/schema.prisma`: `Round` model.
- `app/verify/page.tsx`: manual verifier UI.
- `app/api/verify/route.ts`: recomputes fairness outputs from submitted inputs.

## Fairness Spec

This prototype implements a reproducible commit-reveal flow.

### Commit

When a round is created, the server generates:

- `serverSeed`: 32 random bytes encoded as hex.
- `nonce`: 8 random bytes encoded as hex.

The public commitment is:

```text
commitHex = SHA256(serverSeed + ":" + nonce)
```

The server can publish `commitHex` before revealing `serverSeed`. After reveal, a player can recompute the hash and confirm the seed was not changed.

### Combined Seed

When a round starts, the client provides:

- `clientSeed`
- `dropColumn`
- `betCents`

The deterministic game seed is:

```text
combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
```

The engine takes the first 8 hex characters of `combinedSeed`, parses them as a 32-bit unsigned integer, and uses that value to seed XorShift32.

### PRNG

The PRNG is XorShift32:

```text
state ^= state << 13
state ^= state >>> 17
state ^= state << 5
random = unsigned_state / 4294967296
```

This is deterministic and easy to verify. It is not meant to be a production-grade casino RNG by itself; the goal here is transparent reproducibility for the assignment prototype.

### Peg Map Rules

The board currently uses `12` rows.

For every peg, the engine generates a bias:

```text
bias = 0.5 + (rand() - 0.5) * 0.2
```

That produces a value from `0.4` to `0.6`. The value is rounded with:

```ts
Number(bias.toFixed(6))
```

The full `pegMap` is then hashed:

```text
pegMapHash = SHA256(JSON.stringify(pegMap))
```

### Path Rules

The ball starts at position `0`. For each row:

```text
pegIndex = min(position, row)
dropAdjustment = (dropColumn - floor(rows / 2)) * 0.01
effectiveBias = clamp(pegMap[row][pegIndex] + dropAdjustment, 0, 1)
```

Then:

```text
if rand() < effectiveBias:
  path += "L"
else:
  path += "R"
  position += 1
```

After all rows are processed:

```text
binIndex = position
```

The verifier recomputes `commitHex`, `combinedSeed`, `pegMapHash`, and `binIndex` from the submitted inputs.

### Rounding and Payout Display

The engine stores `betCents`, `binIndex`, and `pathJson`. The UI displays currency values with `toFixed(2)`. Multipliers are currently client-side display values:

```text
[0.2, 0.5, 0.8, 1, 1.5, 3, 5, 3, 1.5, 1, 0.8, 0.5, 0.2]
```

With more time, payout calculation should be moved fully server-side and stored as cents to avoid floating-point money math.

## API Overview

Create a committed round:

```http
POST /api/rounds/commit
```

Returns:

```json
{
  "roundId": "...",
  "commitHex": "...",
  "nonce": "..."
}
```

Start a round:

```http
POST /api/rounds/{roundId}/start
```

Body:

```json
{
  "clientSeed": "candidate-hello",
  "betCents": 100,
  "dropColumn": 6
}
```

Get a round:

```http
GET /api/rounds/{roundId}
```

Reveal a server seed:

```http
POST /api/rounds/{roundId}/reveal
```

Verify manually:

```http
GET /api/verify?serverSeed=...&clientSeed=...&nonce=...&dropColumn=6
```

## AI Usage

I used AI as a coding assistant for implementation support, debugging, and documentation cleanup.

Key prompts/tasks included:

- Build and refine a Next.js Plinko prototype with provably-fair commit-reveal APIs.
- Add Prisma schema and migration support for storing rounds.
- Debug why the migration folder was missing and generate the initial migration.
- Diagnose the browser `Unexpected end of JSON input` error and trace it to a failing API response.
- Investigate Neon connection timeouts and add a local development fallback.
- Update the README with local setup, architecture, fairness details, links, time log, and next steps.

What I kept:

- The deterministic fairness flow using `commitHex`, `combinedSeed`, seeded PRNG, peg map hash, and verifier route.
- The simple API route structure because it makes each round phase easy to inspect.
- The local fallback mode because it keeps development usable when the remote database is unavailable.

What I changed:

- Added error handling around API routes so frontend code receives JSON errors instead of crashing on empty `500` responses.
- Switched the Prisma runtime adapter toward Neon support.
- Added `LOCAL_ROUNDS=1` development mode after local network tests showed the Neon host timing out.
- Documented limitations around XorShift32 and client-side payout math.

## Time Log

Rough time spent:

- Project setup and UI/game board: 2-3 hours.
- Fairness helpers, PRNG, engine, and verifier: 2-3 hours.
- Prisma schema, migrations, and API persistence: 1-2 hours.
- Debugging local database/Neon connectivity: 1 hour.
- Tests, build checks, and README: 1 hour.

Total: about 7-10 hours.

## What I Would Do Next

With more time, I would:

- Move payout calculation fully server-side and store final payout in cents.
- Add a first-class round details page instead of only exposing `/api/rounds/{id}` JSON.
- Add validation with Zod for API request bodies and verifier query params.
- Add stronger tests for verifier equivalence and edge cases around `dropColumn`.
- Replace XorShift32 with a stronger deterministic stream based on HMAC-SHA256 or SHA-256 counter mode.
- Add a production-safe reveal flow where `serverSeed` is only exposed after the round is complete.
- Improve database resilience and deployment environment checks for Neon.
- Add Playwright tests for the main play flow and verifier page.
