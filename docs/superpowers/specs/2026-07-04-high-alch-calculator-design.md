# OSRS High Alchemy Calculator Design

## Goal

Build the first version of a better OSRS high alchemy calculator than Alchmate by focusing on one fast, trustworthy profit table. The main user pain point is stale pricing, so price freshness and refresh behavior are core product features rather than hidden implementation details.

## MVP Scope

The MVP is a single High Alchemy Calculator page for Old School RuneScape. It shows a searchable, sortable table of alchable items with live profit math, pricing mode controls, freshness indicators, and clear handling for stale or incomplete data.

Out of scope for the first version:

- User accounts.
- Saved shopping lists.
- RS3 support.
- Additional calculators.
- Historical charts beyond basic freshness and volume signals.
- Automated trading advice beyond sortable calculator data.

## Data Sources

Use the OSRS Wiki real-time prices API as the primary data source.

- Item metadata: `https://prices.runescape.wiki/api/v1/osrs/mapping`
- Most recent prices: `https://prices.runescape.wiki/api/v1/osrs/latest`
- Stable/volume data: `https://prices.runescape.wiki/api/v1/osrs/5m`

The mapping endpoint provides item fields needed by the calculator:

- `id`
- `name`
- `icon`
- `members`
- `highalch`
- `lowalch`
- `limit`
- `value`
- `examine`

The latest endpoint provides item prices keyed by item ID:

- `high`
- `highTime`
- `low`
- `lowTime`

The 5-minute endpoint provides aggregate market data keyed by item ID:

- `avgHighPrice`
- `highPriceVolume`
- `avgLowPrice`
- `lowPriceVolume`

The official Jagex/RuneScape Grand Exchange detail endpoint can be used later as a reference price source, but it is not the primary table feed because it is per-item and returns formatted display prices rather than a clean bulk dataset.

## Pricing Modes

Use one unified table with a prominent pricing-mode switcher. Filters, search, and sort state stay in place when users switch modes.

### Most Recent

Default mode. Uses `latest.low` as the expected buy price because a user alching items generally needs to buy from sell offers. Use `latest.lowTime` as the row's price freshness timestamp.

Profit formula:

```text
profit = highalch - buyPrice - natureRuneCost
```

Default `natureRuneCost` should be editable. If no live nature rune value is configured yet, start with a visible default and make the value easy to change.

### Stable Pricing

Uses `5m.avgLowPrice` as the expected buy price. This mode is less reactive but filters out one-off trades better than Most Recent.

Rows should show 5-minute low volume so users can judge liquidity. If `avgLowPrice` is missing, the row is excluded from Stable Pricing or clearly marked as unavailable.

### Official GE

Do not build this as a first-class MVP mode unless needed during implementation. The official endpoint is useful as a future reference column or row detail, but it should not block the first release because it is not a bulk, clean, real-time feed.

## Refresh Model

Use auto-refresh every 60 seconds for the `/latest` data, matching the observed upstream cache behavior. Include a manual refresh button, but avoid duplicate upstream requests inside the same refresh window.

Refresh state:

- `fetchedAt`: when the app received the payload.
- `nextRefreshAt`: normally `fetchedAt + 60s`.
- `sourceAge`: the upstream cache `Age` header when available.
- `isRefreshing`: active network request state.
- `lastSuccessfulFetchAt`: last successful update used for the table.

Manual refresh behavior:

- If the user clicks refresh before `nextRefreshAt`, do not call the upstream API again.
- Show a small status message such as `Prices checked 14s ago. Next live refresh in 46s.`
- When `nextRefreshAt` has passed, the button triggers a real fetch.
- Auto-refresh uses the same boundary.

If a refresh fails, keep the last successful data visible and show a non-blocking warning with the age of the last successful update.

## Row Freshness And Confidence

Each row should make freshness visible.

Suggested row signals:

- `Fresh`: latest low trade is less than 5 minutes old.
- `Aging`: latest low trade is 5-30 minutes old.
- `Stale`: latest low trade is more than 30 minutes old.
- `No recent buy price`: latest low price is missing.

Stable Pricing should additionally show volume from `/5m`:

- Good liquidity: meaningful low-price volume in the 5-minute window.
- Thin liquidity: low but non-zero volume.
- No recent volume: missing or zero low volume.

The default sort can still be profit descending, but stale rows should be visually obvious. A later improvement can offer a confidence-adjusted ranking.

## Table Columns

Initial columns:

- Item: icon, name, members indicator.
- High alch value.
- Buy price: based on selected pricing mode.
- Nature rune cost.
- Profit each.
- ROI percentage.
- GE limit.
- Potential profit per limit.
- Freshness: last trade age or 5-minute volume context.

Useful filters:

- Search by item name.
- Profitable only.
- Members/free-to-play.
- Hide stale prices.
- Minimum profit.
- Minimum ROI.
- Minimum buy limit.

Useful sorts:

- Profit each.
- ROI.
- Potential profit per limit.
- Buy limit.
- Freshness.
- Name.

## User Experience

The first screen should be the working calculator, not a marketing landing page. The user should immediately see:

- Pricing mode switcher.
- Refresh status and countdown.
- Editable nature rune cost.
- Search/filter controls.
- Sortable profit table.

The app should avoid implying precision it does not have. When data is cached, stale, missing, or low-volume, the UI should say so plainly.

## Architecture

Use a small frontend app with a thin server/API layer.

Recommended shape:

- Frontend renders the calculator and manages table state.
- Server route fetches OSRS Wiki endpoints, applies caching rules, and normalizes response data.
- Normalization module joins mapping, latest prices, and 5-minute aggregate data into calculator rows.
- Calculation module owns profit, ROI, potential profit, freshness labels, and pricing-mode selection.

This keeps upstream API policy, row calculation, and UI rendering separate enough to test independently.

## Error Handling

Handle these cases explicitly:

- Mapping fetch fails: show blocking error because item names and alch values are required.
- Latest fetch fails: show last successful data if available; otherwise show retry state.
- 5-minute fetch fails: keep Most Recent mode working and mark Stable Pricing as temporarily unavailable.
- Missing `highalch`: exclude from alch table.
- Missing selected buy price: show row as unavailable for that pricing mode or hide it by default.
- Stale latest timestamps: keep row visible but label it.

## Testing

Unit tests:

- Profit formula.
- ROI formula.
- Potential profit per limit.
- Freshness label boundaries.
- Pricing-mode buy price selection.
- Missing-data behavior.

Integration tests:

- Normalizing mapping plus latest payload.
- Stable Pricing fallback/unavailable behavior when `/5m` fields are missing.
- Refresh guard prevents duplicate fetches inside the 60-second window.

UI tests:

- Table renders rows from mocked API data.
- Pricing mode switch preserves search/filter state.
- Manual refresh before the refresh window shows cached-status messaging.
- Failed refresh keeps stale data visible with warning.

## Open Decisions For Implementation

- Framework choice for the new app.
- Exact visual style.
- Whether nature rune cost defaults to a fixed editable value or the live nature rune price from the same API.
- Exact stale thresholds after testing with real user expectations.
