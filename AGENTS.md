# AGENTS.md

## Project

This repository is for a better OSRS High Alchemy Calculator. The first product goal is to beat Alchmate's OSRS high alch page with a faster, clearer, freshness-aware calculator.

## Current State

- This is a new project.
- The approved design spec is at `docs/superpowers/specs/2026-07-04-high-alch-calculator-design.md`.
- The implementation plan is at `docs/superpowers/plans/2026-07-04-high-alch-calculator.md`.
- Visual brainstorming artifacts, if present, live under `.superpowers/` and are intentionally ignored by git.

## Product Decisions

- First screen should be the working calculator, not a marketing landing page.
- Use one unified table with a pricing mode switcher.
- Default pricing mode is `Most Recent`.
- `Most Recent` uses OSRS Wiki `/latest` and `low` as expected buy price.
- `Stable Pricing` uses OSRS Wiki `/5m` and `avgLowPrice`.
- Official GE/Jagex pricing is not part of MVP because it is per-item and returns formatted display prices.
- Auto-refresh `/latest` every 60 seconds.
- Manual refresh inside the 60-second window must not call the upstream API again. Show cached-status messaging instead.
- Stale pricing must be visible per row.

## Data Sources

Primary:

- `https://prices.runescape.wiki/api/v1/osrs/mapping`
- `https://prices.runescape.wiki/api/v1/osrs/latest`
- `https://prices.runescape.wiki/api/v1/osrs/5m`

Use a clear User-Agent when calling OSRS Wiki APIs from the server.

Important response fields:

- Mapping: `id`, `name`, `icon`, `members`, `highalch`, `lowalch`, `limit`, `value`, `examine`
- Latest: `high`, `highTime`, `low`, `lowTime`
- 5m: `avgHighPrice`, `highPriceVolume`, `avgLowPrice`, `lowPriceVolume`

## Recommended Stack

Use a TypeScript Next.js app unless the user changes direction. Keep the implementation boring and testable:

- Next.js App Router
- TypeScript
- CSS modules or plain CSS, whichever the scaffold defaults make simpler
- Vitest for calculation and normalization tests
- Playwright only if UI verification is needed after the core app works

## Engineering Constraints

- Keep API fetch/caching logic separate from calculator math.
- Keep calculator math testable without React.
- Do not hide missing or stale data.
- Do not spam upstream APIs; respect the 60-second `/latest` refresh window.
- Prefer small focused files over large mixed-responsibility modules.
- Use TDD for calculation, normalization, and refresh-guard behavior.

## Key Formulas

Profit:

```text
profit = highalch - buyPrice - natureRuneCost
```

ROI:

```text
roi = profit / (buyPrice + natureRuneCost)
```

Potential profit per limit:

```text
potentialProfit = profit * limit
```

If `limit` is missing, display unavailable instead of inventing a value.

## Verification Expectations

Before claiming completion:

- Run unit tests.
- Run lint/typecheck if available.
- Start the app locally and verify the calculator renders.
- Verify refresh-before-window behavior does not call the upstream API.
- Verify stale/missing price states are visible in the UI.

## Useful Local Commands

These may change once the project is scaffolded:

```bash
npm run test
npm run lint
npm run build
npm run dev
```
