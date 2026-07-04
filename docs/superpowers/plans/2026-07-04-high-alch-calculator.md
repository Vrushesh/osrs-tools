# High Alch Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working OSRS High Alchemy Calculator as a freshness-aware live profit table.

**Architecture:** Use a TypeScript Next.js app with a thin server route for OSRS Wiki data and pure utility modules for normalization, calculations, and refresh-window behavior. React components consume normalized rows and own only UI state such as filters, sort, pricing mode, and editable nature rune cost.

**Tech Stack:** Next.js App Router, TypeScript, React, Vitest, CSS modules/plain CSS.

---

## File Structure

- `package.json`: scripts and dependencies after scaffolding.
- `src/app/page.tsx`: calculator page shell.
- `src/app/api/prices/route.ts`: server endpoint that fetches OSRS Wiki data and returns normalized payload plus refresh metadata.
- `src/lib/osrs/types.ts`: shared TypeScript types for upstream and normalized data.
- `src/lib/osrs/calculate.ts`: pure profit, ROI, potential profit, and freshness functions.
- `src/lib/osrs/normalize.ts`: joins mapping, latest, and 5-minute data into calculator rows.
- `src/lib/osrs/refresh.ts`: computes refresh status and guards manual refresh inside the 60-second window.
- `src/components/CalculatorControls.tsx`: pricing mode, search, filters, rune cost, and refresh controls.
- `src/components/AlchTable.tsx`: sortable table.
- `src/components/FreshnessBadge.tsx`: visual row freshness indicator.
- `src/test/osrs/*.test.ts`: unit tests for calculation, normalization, and refresh behavior.

## Task 1: Scaffold The App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Scaffold Next.js with TypeScript**

Run from `/Users/Vrushesh/Desktop/projects_2026/osrs-high-alch`:

```bash
npx create-next-app@latest . --ts --eslint --app --src-dir --no-tailwind --use-npm
```

Expected: Next.js app files are created in the current folder without deleting `AGENTS.md` or `docs/`.

- [ ] **Step 2: Install Vitest**

Run:

```bash
npm install -D vitest
```

Expected: `vitest` is added to `devDependencies`.

- [ ] **Step 3: Add test script**

Modify `package.json` scripts to include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  }
}
```

- [ ] **Step 4: Replace starter page with placeholder calculator shell**

Set `src/app/page.tsx` to:

```tsx
export default function Home() {
  return (
    <main className="appShell">
      <section className="toolbar">
        <h1>OSRS High Alchemy Calculator</h1>
        <p>Live profit table loading soon.</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Add base global styles**

Set `src/app/globals.css` to:

```css
:root {
  color-scheme: dark;
  --bg: #16181c;
  --panel: #22252b;
  --panel-strong: #2c3038;
  --text: #f3f1e8;
  --muted: #aaa69a;
  --line: #3b404a;
  --gold: #d7a84f;
  --green: #79c879;
  --red: #d97878;
  --blue: #6ea8d9;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
}

button,
input,
select {
  font: inherit;
}

.appShell {
  min-height: 100vh;
  padding: 24px;
}

.toolbar {
  max-width: 1280px;
  margin: 0 auto 16px;
}
```

- [ ] **Step 6: Verify scaffold**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json src
git commit -m "chore: scaffold high alch app"
```

## Task 2: Add Calculator Types And Math

**Files:**
- Create: `src/lib/osrs/types.ts`
- Create: `src/lib/osrs/calculate.ts`
- Create: `src/test/osrs/calculate.test.ts`

- [ ] **Step 1: Write failing calculation tests**

Create `src/test/osrs/calculate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  calculateProfit,
  calculateRoi,
  calculatePotentialProfit,
  getFreshness,
} from "../../lib/osrs/calculate";

describe("high alch calculations", () => {
  it("calculates profit after buy price and nature rune cost", () => {
    expect(calculateProfit(39000, 38200, 105)).toBe(695);
  });

  it("calculates ROI against total input cost", () => {
    expect(calculateRoi(695, 38200, 105)).toBeCloseTo(0.01814, 5);
  });

  it("calculates potential profit when limit exists", () => {
    expect(calculatePotentialProfit(695, 70)).toBe(48650);
  });

  it("returns null potential profit when limit is missing", () => {
    expect(calculatePotentialProfit(695, undefined)).toBeNull();
  });

  it("labels row freshness", () => {
    const now = 1_800_000_000;
    expect(getFreshness(now - 60, now).label).toBe("Fresh");
    expect(getFreshness(now - 600, now).label).toBe("Aging");
    expect(getFreshness(now - 3600, now).label).toBe("Stale");
    expect(getFreshness(undefined, now).label).toBe("No recent buy price");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm run test -- src/test/osrs/calculate.test.ts
```

Expected: FAIL because `src/lib/osrs/calculate.ts` does not exist.

- [ ] **Step 3: Add shared types**

Create `src/lib/osrs/types.ts`:

```ts
export type PricingMode = "recent" | "stable";

export type FreshnessLabel =
  | "Fresh"
  | "Aging"
  | "Stale"
  | "No recent buy price";

export type Freshness = {
  label: FreshnessLabel;
  ageSeconds: number | null;
};

export type MappingItem = {
  id: number;
  name: string;
  icon: string;
  members: boolean;
  highalch?: number;
  lowalch?: number;
  limit?: number;
  value?: number;
  examine?: string;
};

export type LatestPrice = {
  high?: number | null;
  highTime?: number | null;
  low?: number | null;
  lowTime?: number | null;
};

export type FiveMinutePrice = {
  avgHighPrice?: number | null;
  highPriceVolume?: number;
  avgLowPrice?: number | null;
  lowPriceVolume?: number;
};

export type AlchRow = {
  id: number;
  name: string;
  icon: string;
  members: boolean;
  highalch: number;
  limit?: number;
  recentBuyPrice: number | null;
  recentBuyTime: number | null;
  stableBuyPrice: number | null;
  stableLowVolume: number;
};
```

- [ ] **Step 4: Add calculation implementation**

Create `src/lib/osrs/calculate.ts`:

```ts
import type { Freshness } from "./types";

export function calculateProfit(
  highAlch: number,
  buyPrice: number,
  natureRuneCost: number,
) {
  return highAlch - buyPrice - natureRuneCost;
}

export function calculateRoi(
  profit: number,
  buyPrice: number,
  natureRuneCost: number,
) {
  const inputCost = buyPrice + natureRuneCost;
  if (inputCost <= 0) return 0;
  return profit / inputCost;
}

export function calculatePotentialProfit(
  profit: number,
  limit: number | undefined,
) {
  if (typeof limit !== "number") return null;
  return profit * limit;
}

export function getFreshness(
  tradeTime: number | null | undefined,
  nowSeconds: number,
): Freshness {
  if (!tradeTime) {
    return { label: "No recent buy price", ageSeconds: null };
  }

  const ageSeconds = Math.max(0, nowSeconds - tradeTime);

  if (ageSeconds < 5 * 60) {
    return { label: "Fresh", ageSeconds };
  }

  if (ageSeconds <= 30 * 60) {
    return { label: "Aging", ageSeconds };
  }

  return { label: "Stale", ageSeconds };
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test -- src/test/osrs/calculate.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/osrs src/test/osrs/calculate.test.ts
git commit -m "test: add high alch calculations"
```

## Task 3: Normalize OSRS Wiki Data

**Files:**
- Create: `src/lib/osrs/normalize.ts`
- Create: `src/test/osrs/normalize.test.ts`

- [ ] **Step 1: Write failing normalization tests**

Create `src/test/osrs/normalize.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeRows } from "../../lib/osrs/normalize";
import type { FiveMinutePrice, LatestPrice, MappingItem } from "../../lib/osrs/types";

describe("normalizeRows", () => {
  const mapping: MappingItem[] = [
    {
      id: 1127,
      name: "Rune platebody",
      icon: "Rune platebody.png",
      members: false,
      highalch: 39000,
      limit: 70,
    },
    {
      id: 999,
      name: "No alch item",
      icon: "No alch item.png",
      members: true,
    },
  ];

  const latest: Record<string, LatestPrice> = {
    "1127": { low: 38200, lowTime: 1_800_000_000, high: 38300, highTime: 1_800_000_010 },
  };

  const fiveMinute: Record<string, FiveMinutePrice> = {
    "1127": { avgLowPrice: 38100, lowPriceVolume: 42 },
  };

  it("joins mapping, latest, and five-minute data", () => {
    expect(normalizeRows(mapping, latest, fiveMinute)).toEqual([
      {
        id: 1127,
        name: "Rune platebody",
        icon: "Rune platebody.png",
        members: false,
        highalch: 39000,
        limit: 70,
        recentBuyPrice: 38200,
        recentBuyTime: 1_800_000_000,
        stableBuyPrice: 38100,
        stableLowVolume: 42,
      },
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm run test -- src/test/osrs/normalize.test.ts
```

Expected: FAIL because `normalize.ts` does not exist.

- [ ] **Step 3: Add normalization implementation**

Create `src/lib/osrs/normalize.ts`:

```ts
import type {
  AlchRow,
  FiveMinutePrice,
  LatestPrice,
  MappingItem,
} from "./types";

export function normalizeRows(
  mapping: MappingItem[],
  latest: Record<string, LatestPrice>,
  fiveMinute: Record<string, FiveMinutePrice>,
): AlchRow[] {
  return mapping
    .filter((item) => typeof item.highalch === "number")
    .map((item) => {
      const recent = latest[String(item.id)];
      const stable = fiveMinute[String(item.id)];

      return {
        id: item.id,
        name: item.name,
        icon: item.icon,
        members: item.members,
        highalch: item.highalch as number,
        limit: item.limit,
        recentBuyPrice: recent?.low ?? null,
        recentBuyTime: recent?.lowTime ?? null,
        stableBuyPrice: stable?.avgLowPrice ?? null,
        stableLowVolume: stable?.lowPriceVolume ?? 0,
      };
    });
}
```

- [ ] **Step 4: Run normalization tests**

Run:

```bash
npm run test -- src/test/osrs/normalize.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/osrs/normalize.ts src/test/osrs/normalize.test.ts
git commit -m "test: normalize OSRS price data"
```

## Task 4: Add Refresh Window Guard

**Files:**
- Create: `src/lib/osrs/refresh.ts`
- Create: `src/test/osrs/refresh.test.ts`

- [ ] **Step 1: Write failing refresh tests**

Create `src/test/osrs/refresh.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getRefreshState, shouldFetchOnManualRefresh } from "../../lib/osrs/refresh";

describe("refresh window", () => {
  it("blocks manual fetches inside the 60 second window", () => {
    const state = getRefreshState(1_000_000, 1_000_014);
    expect(state.secondsSinceFetch).toBe(14);
    expect(state.secondsUntilRefresh).toBe(46);
    expect(shouldFetchOnManualRefresh(state)).toBe(false);
  });

  it("allows manual fetch when the 60 second window has elapsed", () => {
    const state = getRefreshState(1_000_000, 1_000_060);
    expect(state.secondsUntilRefresh).toBe(0);
    expect(shouldFetchOnManualRefresh(state)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm run test -- src/test/osrs/refresh.test.ts
```

Expected: FAIL because `refresh.ts` does not exist.

- [ ] **Step 3: Add refresh implementation**

Create `src/lib/osrs/refresh.ts`:

```ts
const REFRESH_WINDOW_SECONDS = 60;

export type RefreshState = {
  secondsSinceFetch: number;
  secondsUntilRefresh: number;
  canFetch: boolean;
};

export function getRefreshState(
  fetchedAtSeconds: number,
  nowSeconds: number,
): RefreshState {
  const secondsSinceFetch = Math.max(0, nowSeconds - fetchedAtSeconds);
  const secondsUntilRefresh = Math.max(
    0,
    REFRESH_WINDOW_SECONDS - secondsSinceFetch,
  );

  return {
    secondsSinceFetch,
    secondsUntilRefresh,
    canFetch: secondsUntilRefresh === 0,
  };
}

export function shouldFetchOnManualRefresh(state: RefreshState) {
  return state.canFetch;
}
```

- [ ] **Step 4: Run refresh tests**

Run:

```bash
npm run test -- src/test/osrs/refresh.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/osrs/refresh.ts src/test/osrs/refresh.test.ts
git commit -m "test: guard refresh window"
```

## Task 5: Add Server Price API Route

**Files:**
- Create: `src/app/api/prices/route.ts`
- Modify: `src/lib/osrs/types.ts`

- [ ] **Step 1: Extend API payload type**

Append to `src/lib/osrs/types.ts`:

```ts
export type PriceApiPayload = {
  rows: AlchRow[];
  fetchedAt: string;
  sourceAge: number | null;
  stableAvailable: boolean;
};
```

- [ ] **Step 2: Add API route**

Create `src/app/api/prices/route.ts`:

```ts
import { NextResponse } from "next/server";
import { normalizeRows } from "@/lib/osrs/normalize";
import type {
  FiveMinutePrice,
  LatestPrice,
  MappingItem,
  PriceApiPayload,
} from "@/lib/osrs/types";

const USER_AGENT =
  "osrs-high-alch-calculator local-dev contact: github.com/vrushesh";

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const sourceAgeHeader = response.headers.get("age");
  const sourceAge = sourceAgeHeader ? Number(sourceAgeHeader) : null;
  const json = (await response.json()) as T;

  return { json, sourceAge };
}

export async function GET() {
  const [mappingResult, latestResult, fiveMinuteResult] = await Promise.allSettled([
    fetchJson<MappingItem[]>("https://prices.runescape.wiki/api/v1/osrs/mapping"),
    fetchJson<{ data: Record<string, LatestPrice> }>(
      "https://prices.runescape.wiki/api/v1/osrs/latest",
    ),
    fetchJson<{ data: Record<string, FiveMinutePrice> }>(
      "https://prices.runescape.wiki/api/v1/osrs/5m",
    ),
  ]);

  if (mappingResult.status === "rejected" || latestResult.status === "rejected") {
    return NextResponse.json(
      { error: "Unable to load required OSRS price data." },
      { status: 502 },
    );
  }

  const fiveMinute =
    fiveMinuteResult.status === "fulfilled" ? fiveMinuteResult.value.json.data : {};

  const payload: PriceApiPayload = {
    rows: normalizeRows(
      mappingResult.value.json,
      latestResult.value.json.data,
      fiveMinute,
    ),
    fetchedAt: new Date().toISOString(),
    sourceAge: latestResult.value.sourceAge,
    stableAvailable: fiveMinuteResult.status === "fulfilled",
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=30",
    },
  });
}
```

- [ ] **Step 3: Verify build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/prices/route.ts src/lib/osrs/types.ts
git commit -m "feat: add OSRS price API route"
```

## Task 6: Build Calculator UI

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/CalculatorControls.tsx`
- Create: `src/components/AlchTable.tsx`
- Create: `src/components/FreshnessBadge.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add freshness badge component**

Create `src/components/FreshnessBadge.tsx`:

```tsx
import type { Freshness } from "@/lib/osrs/types";

export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  return (
    <span className={`badge badge-${freshness.label.toLowerCase().replaceAll(" ", "-")}`}>
      {freshness.label}
    </span>
  );
}
```

- [ ] **Step 2: Add controls component**

Create `src/components/CalculatorControls.tsx`:

```tsx
import type { PricingMode } from "@/lib/osrs/types";

type Props = {
  pricingMode: PricingMode;
  setPricingMode: (mode: PricingMode) => void;
  search: string;
  setSearch: (value: string) => void;
  natureRuneCost: number;
  setNatureRuneCost: (value: number) => void;
  profitableOnly: boolean;
  setProfitableOnly: (value: boolean) => void;
  hideStale: boolean;
  setHideStale: (value: boolean) => void;
  refreshText: string;
  onRefresh: () => void;
};

export function CalculatorControls(props: Props) {
  return (
    <section className="controls">
      <div className="segmented">
        <button
          className={props.pricingMode === "recent" ? "active" : ""}
          onClick={() => props.setPricingMode("recent")}
        >
          Most Recent
        </button>
        <button
          className={props.pricingMode === "stable" ? "active" : ""}
          onClick={() => props.setPricingMode("stable")}
        >
          Stable Pricing
        </button>
      </div>

      <input
        aria-label="Search items"
        placeholder="Search items"
        value={props.search}
        onChange={(event) => props.setSearch(event.target.value)}
      />

      <label>
        Nature rune
        <input
          type="number"
          min="0"
          value={props.natureRuneCost}
          onChange={(event) => props.setNatureRuneCost(Number(event.target.value))}
        />
      </label>

      <label>
        <input
          type="checkbox"
          checked={props.profitableOnly}
          onChange={(event) => props.setProfitableOnly(event.target.checked)}
        />
        Profitable only
      </label>

      <label>
        <input
          type="checkbox"
          checked={props.hideStale}
          onChange={(event) => props.setHideStale(event.target.checked)}
        />
        Hide stale
      </label>

      <button onClick={props.onRefresh}>Refresh</button>
      <span className="refreshText">{props.refreshText}</span>
    </section>
  );
}
```

- [ ] **Step 3: Add table component**

Create `src/components/AlchTable.tsx`:

```tsx
import { calculatePotentialProfit, calculateProfit, calculateRoi, getFreshness } from "@/lib/osrs/calculate";
import type { AlchRow, PricingMode } from "@/lib/osrs/types";
import { FreshnessBadge } from "./FreshnessBadge";

type Props = {
  rows: AlchRow[];
  pricingMode: PricingMode;
  natureRuneCost: number;
  nowSeconds: number;
};

function formatNumber(value: number | null) {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function AlchTable({ rows, pricingMode, natureRuneCost, nowSeconds }: Props) {
  const enriched = rows
    .map((row) => {
      const buyPrice =
        pricingMode === "recent" ? row.recentBuyPrice : row.stableBuyPrice;
      const profit =
        buyPrice === null
          ? null
          : calculateProfit(row.highalch, buyPrice, natureRuneCost);
      const roi =
        buyPrice === null || profit === null
          ? null
          : calculateRoi(profit, buyPrice, natureRuneCost);
      const potential =
        profit === null ? null : calculatePotentialProfit(profit, row.limit);
      const freshness = getFreshness(row.recentBuyTime, nowSeconds);

      return { row, buyPrice, profit, roi, potential, freshness };
    })
    .sort((a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity));

  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>High alch</th>
            <th>Buy price</th>
            <th>Profit</th>
            <th>ROI</th>
            <th>Limit</th>
            <th>Limit profit</th>
            <th>Freshness</th>
          </tr>
        </thead>
        <tbody>
          {enriched.map(({ row, buyPrice, profit, roi, potential, freshness }) => (
            <tr key={row.id}>
              <td>
                <div className="itemCell">
                  <span>{row.name}</span>
                  {row.members ? <span className="members">Members</span> : null}
                </div>
              </td>
              <td>{formatNumber(row.highalch)}</td>
              <td>{formatNumber(buyPrice)}</td>
              <td className={profit !== null && profit >= 0 ? "profit" : "loss"}>
                {formatNumber(profit)}
              </td>
              <td>{roi === null ? "Unavailable" : `${(roi * 100).toFixed(2)}%`}</td>
              <td>{row.limit ?? "Unavailable"}</td>
              <td>{formatNumber(potential)}</td>
              <td><FreshnessBadge freshness={freshness} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Build page**

Replace `src/app/page.tsx` with:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { AlchTable } from "@/components/AlchTable";
import { CalculatorControls } from "@/components/CalculatorControls";
import { getRefreshState } from "@/lib/osrs/refresh";
import type { AlchRow, PriceApiPayload, PricingMode } from "@/lib/osrs/types";

const DEFAULT_RUNE_COST = 105;

export default function Home() {
  const [rows, setRows] = useState<AlchRow[]>([]);
  const [pricingMode, setPricingMode] = useState<PricingMode>("recent");
  const [search, setSearch] = useState("");
  const [natureRuneCost, setNatureRuneCost] = useState(DEFAULT_RUNE_COST);
  const [profitableOnly, setProfitableOnly] = useState(true);
  const [hideStale, setHideStale] = useState(false);
  const [fetchedAtSeconds, setFetchedAtSeconds] = useState(0);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const [status, setStatus] = useState("Loading prices...");

  async function loadPrices(forceMessage = false) {
    const response = await fetch("/api/prices");
    if (!response.ok) {
      setStatus("Unable to refresh prices. Showing last successful data if available.");
      return;
    }

    const payload = (await response.json()) as PriceApiPayload;
    setRows(payload.rows);
    setFetchedAtSeconds(Math.floor(new Date(payload.fetchedAt).getTime() / 1000));
    setStatus(forceMessage ? "Prices refreshed." : "Prices loaded.");
  }

  useEffect(() => {
    void loadPrices();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextNow = Math.floor(Date.now() / 1000);
      setNowSeconds(nextNow);
      if (fetchedAtSeconds && getRefreshState(fetchedAtSeconds, nextNow).canFetch) {
        void loadPrices();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [fetchedAtSeconds]);

  const refreshState = fetchedAtSeconds
    ? getRefreshState(fetchedAtSeconds, nowSeconds)
    : null;

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const buyPrice =
        pricingMode === "recent" ? row.recentBuyPrice : row.stableBuyPrice;
      const profit =
        buyPrice === null ? null : row.highalch - buyPrice - natureRuneCost;
      const isStale =
        row.recentBuyTime === null || nowSeconds - row.recentBuyTime > 30 * 60;

      if (query && !row.name.toLowerCase().includes(query)) return false;
      if (profitableOnly && (profit === null || profit <= 0)) return false;
      if (hideStale && isStale) return false;
      return true;
    });
  }, [hideStale, natureRuneCost, nowSeconds, pricingMode, profitableOnly, rows, search]);

  function handleManualRefresh() {
    if (refreshState && !refreshState.canFetch) {
      setStatus(
        `Prices checked ${refreshState.secondsSinceFetch}s ago. Next live refresh in ${refreshState.secondsUntilRefresh}s.`,
      );
      return;
    }

    void loadPrices(true);
  }

  const refreshText = refreshState
    ? `${status} Next refresh in ${refreshState.secondsUntilRefresh}s.`
    : status;

  return (
    <main className="appShell">
      <section className="toolbar">
        <h1>OSRS High Alchemy Calculator</h1>
        <p>Live alch profit with visible price freshness.</p>
      </section>
      <CalculatorControls
        pricingMode={pricingMode}
        setPricingMode={setPricingMode}
        search={search}
        setSearch={setSearch}
        natureRuneCost={natureRuneCost}
        setNatureRuneCost={setNatureRuneCost}
        profitableOnly={profitableOnly}
        setProfitableOnly={setProfitableOnly}
        hideStale={hideStale}
        setHideStale={setHideStale}
        refreshText={refreshText}
        onRefresh={handleManualRefresh}
      />
      <AlchTable
        rows={filteredRows}
        pricingMode={pricingMode}
        natureRuneCost={natureRuneCost}
        nowSeconds={nowSeconds}
      />
    </main>
  );
}
```

- [ ] **Step 5: Add UI styles**

Append to `src/app/globals.css`:

```css
.controls {
  max-width: 1280px;
  margin: 0 auto 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
}

.controls input,
.controls button {
  color: var(--text);
  background: var(--panel-strong);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 8px 10px;
}

.segmented {
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
}

.segmented button {
  border: 0;
  border-radius: 0;
}

.segmented .active {
  background: var(--blue);
  color: #071018;
}

.refreshText {
  color: var(--muted);
  font-size: 14px;
}

.tableWrap {
  max-width: 1280px;
  margin: 0 auto;
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  white-space: nowrap;
}

th {
  color: var(--gold);
  background: #1d2026;
  position: sticky;
  top: 0;
}

.itemCell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.members,
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 12px;
}

.members {
  background: #3a3324;
  color: var(--gold);
}

.profit {
  color: var(--green);
}

.loss {
  color: var(--red);
}

.badge-fresh {
  color: #081308;
  background: var(--green);
}

.badge-aging {
  color: #1f1605;
  background: var(--gold);
}

.badge-stale,
.badge-no-recent-buy-price {
  color: #210909;
  background: var(--red);
}
```

- [ ] **Step 6: Verify build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/app/globals.css src/components
git commit -m "feat: build high alch calculator UI"
```

## Task 7: Final Verification

**Files:**
- No new files expected.

- [ ] **Step 1: Run tests**

Run:

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: lint passes. If the scaffold uses `next lint` and the installed Next.js version no longer supports it, replace the script with the scaffold's supported lint command and rerun.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Start dev server**

Run:

```bash
npm run dev
```

Expected: local URL is printed, usually `http://localhost:3000`.

- [ ] **Step 5: Manually verify the app**

Open the local URL and verify:

- Table renders OSRS item rows.
- Most Recent is selected by default.
- Stable Pricing can be selected without clearing search/filter state.
- Manual refresh inside 60 seconds shows cached-status text.
- Profitable-only filter works.
- Hide-stale filter works.
- Rows show Fresh/Aging/Stale/No recent buy price.

- [ ] **Step 6: Commit verification fixes if needed**

If verification required fixes:

```bash
git add .
git commit -m "fix: polish high alch calculator verification"
```

Expected: only intentional source changes are committed.

## Self-Review

- Spec coverage: data sources, pricing modes, 60-second refresh guard, stale row visibility, filters, table columns, error handling, and tests are covered by Tasks 2-7.
- Placeholder scan: no `TBD`, `TODO`, or deferred implementation placeholders are required to execute the plan.
- Type consistency: `PricingMode`, `AlchRow`, `PriceApiPayload`, and helper function names are consistent across tasks.
