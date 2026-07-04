"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ToolTabs } from "@/components/ToolTabs";
import { ARMOUR_SETS } from "@/lib/osrs/armourSets";
import {
  enrichArmourFlips,
  type ArmourFlipMode,
  type ArmourFlipRow,
} from "@/lib/osrs/armourFlip";
import { formatRelativeTime } from "@/lib/osrs/table";
import type { PriceApiPayload, PricingMode } from "@/lib/osrs/types";

const FLAG = "armour-flipper";

type ArmourSortKey = "name" | "buy" | "sell" | "profit" | "roi" | "limit" | "volume";
type SortDirection = "asc" | "desc";
type ArmourSortState = {
  key: ArmourSortKey;
  direction: SortDirection;
};

const armourColumns: Array<{
  key: ArmourSortKey;
  label: string;
  className?: string;
}> = [
  { key: "name", label: "Set" },
  { key: "buy", label: "Buy", className: "numeric" },
  { key: "sell", label: "Sell taxed", className: "numeric" },
  { key: "profit", label: "Profit", className: "numeric" },
  { key: "roi", label: "ROI", className: "numeric" },
  { key: "limit", label: "Limit", className: "numeric" },
  { key: "volume", label: "Volume", className: "numeric" },
];

export default function ArmourFlipperPage() {
  const [isReady, setIsReady] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [payload, setPayload] = useState<PriceApiPayload | null>(null);
  const [status, setStatus] = useState("Loading prices...");
  const [mode, setMode] = useState<ArmourFlipMode>("pieces-to-set");
  const [pricingMode, setPricingMode] = useState<PricingMode>("recent");
  const [includeMembers, setIncludeMembers] = useState(true);
  const [search, setSearch] = useState("");
  const [minProfit, setMinProfit] = useState("1");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<ArmourSortState>({
    key: "profit",
    direction: "desc",
  });
  const [nowSeconds, setNowSeconds] = useState(() =>
    Math.floor(Date.now() / 1000),
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const enabled = params.get("ff") === FLAG;
      setIsEnabled(enabled);
      setIsReady(true);
      if (enabled) void loadPrices();
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  async function loadPrices() {
    setStatus("Loading prices...");
    const response = await fetch("/api/prices");

    if (!response.ok) {
      setStatus("Unable to load OSRS prices.");
      return;
    }

    const nextPayload = (await response.json()) as PriceApiPayload;
    setPayload(nextPayload);
    setStatus("Prices loaded.");
  }

  const rows = useMemo(() => {
    const items = payload?.items ?? [];
    const query = search.trim().toLowerCase();
    const minProfitValue = parseOptionalNumber(minProfit);

    return enrichArmourFlips(ARMOUR_SETS, items, mode, pricingMode)
      .filter((row) => includeMembers || !row.definition.members)
      .filter((row) => !query || row.definition.name.toLowerCase().includes(query))
      .filter((row) => minProfitValue === null || (row.profit ?? -Infinity) >= minProfitValue)
      .sort((left, right) => compareArmourRows(left, right, sort));
  }, [includeMembers, minProfit, mode, payload?.items, pricingMode, search, sort]);

  const selected = rows.find((row) => row.definition.id === selectedId) ?? rows[0] ?? null;

  function handleSort(key: ArmourSortKey) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  }

  if (!isReady) return null;

  if (!isEnabled) {
    return (
      <main className="appShell">
        <section className="toolbar">
          <div className="brandLockup">
            <Image alt="" height="48" priority src="/alchmark.svg" width="48" />
            <div>
              <h1>Armour Flipper</h1>
              <p>This experimental tool is hidden behind a URL flag.</p>
            </div>
          </div>
        </section>
        <section className="emptyState">
          Add <code>?ff=armour-flipper</code> to the URL to preview this feature.
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <section className="toolbar">
        <div className="brandLockup">
          <Image alt="" height="48" priority src="/alchmark.svg" width="48" />
          <div>
            <h1>Armour Flipper</h1>
            <p>Find armour set flips after Grand Exchange tax.</p>
          </div>
        </div>
        <span className="rowCount">{rows.length.toLocaleString()} sets</span>
      </section>
      <ToolTabs active="armour" />

      <section className="controlsPanel armourControls">
        <div className="armourControlHeader">
          <div className="armourModeStack">
            <div className="segmented" aria-label="Flip direction">
              <button
                className={mode === "pieces-to-set" ? "active" : ""}
                onClick={() => setMode("pieces-to-set")}
                type="button"
              >
                <span className="modeLabelFull">Pieces → Set</span>
                <span className="modeLabelShort">Pieces</span>
              </button>
              <button
                className={mode === "set-to-pieces" ? "active" : ""}
                onClick={() => setMode("set-to-pieces")}
                type="button"
              >
                <span className="modeLabelFull">Set → Pieces</span>
                <span className="modeLabelShort">Set</span>
              </button>
            </div>

            <div className="segmented" aria-label="Pricing mode">
              <button
                className={pricingMode === "recent" ? "active" : ""}
                onClick={() => setPricingMode("recent")}
                type="button"
              >
                Recent
              </button>
              <button
                className={pricingMode === "stable" ? "active" : ""}
                onClick={() => setPricingMode("stable")}
                type="button"
              >
                Stable
              </button>
            </div>
          </div>

          <div className="armourRefresh">
            <button className="refreshButton" onClick={() => void loadPrices()} type="button">
              Refresh prices
            </button>
            <span className="refreshText">
              {payload ? `Updated ${formatRelativeTime(Math.floor(new Date(payload.fetchedAt).getTime() / 1000), nowSeconds)}` : status}
            </span>
          </div>
        </div>

        <div className="filtersContent armourFilters">
          <div className="memberSegment" aria-label="Members set filter">
            <button
              className={!includeMembers ? "active" : ""}
              onClick={() => setIncludeMembers(false)}
              type="button"
            >
              F2P
            </button>
            <button
              className={includeMembers ? "active" : ""}
              onClick={() => setIncludeMembers(true)}
              type="button"
            >
              All
            </button>
          </div>

          <label className="compactControl">
            Min profit
            <input
              placeholder="Min"
              type="number"
              value={minProfit}
              onChange={(event) => setMinProfit(event.target.value)}
            />
          </label>

          <input
            aria-label="Search armour sets"
            className="searchInput"
            placeholder="Search armour sets..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      <section className="armourLayout">
        <ArmourSummaryTable
          sort={sort}
          rows={rows}
          selectedId={selected?.definition.id ?? null}
          onSort={handleSort}
          onSetSort={setSort}
          onSelect={setSelectedId}
        />
        <ArmourDetail row={selected} nowSeconds={nowSeconds} />
      </section>
    </main>
  );
}

function ArmourSummaryTable({
  rows,
  sort,
  selectedId,
  onSort,
  onSetSort,
  onSelect,
}: {
  rows: ArmourFlipRow[];
  sort: ArmourSortState;
  selectedId: string | null;
  onSort: (key: ArmourSortKey) => void;
  onSetSort: (sort: ArmourSortState) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="armourResults">
      <div className="tableWrap armourTableWrap">
        <table>
          <thead>
            <tr>
              {armourColumns.map((column) => (
                <th className={column.className} key={column.key}>
                  <button
                    className="sortHeader"
                    onClick={() => onSort(column.key)}
                    type="button"
                  >
                    <span>{column.label}</span>
                    <span className="sortIcon">
                      {sort.key === column.key
                        ? sort.direction === "asc"
                          ? "↑"
                          : "↓"
                        : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className={selectedId === row.definition.id ? "selectedRow" : ""}
                key={row.definition.id}
                onClick={() => onSelect(row.definition.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(row.definition.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <td>
                  <ArmourSetName row={row} />
                </td>
                <td className="numeric">{formatNumber(row.buyTotal)}</td>
                <td className="numeric">{formatNumber(row.sellAfterTax)}</td>
                <td className="numeric">
                  <ProfitPill row={row} />
                </td>
                <td className="numeric">{formatRoi(row)}</td>
                <td className="numeric">{row.limit ?? "-"}</td>
                <td className="numeric">{row.volume.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobileSort">
        <label>
          Sort
          <select
            value={`${sort.key}:${sort.direction}`}
            onChange={(event) => {
              const [key, direction] = event.target.value.split(":") as [
                ArmourSortKey,
                SortDirection,
              ];
              onSetSort({ key, direction });
            }}
          >
            <option value="profit:desc">Profit high to low</option>
            <option value="profit:asc">Profit low to high</option>
            <option value="roi:desc">ROI high to low</option>
            <option value="volume:desc">Volume high to low</option>
            <option value="buy:asc">Buy low to high</option>
            <option value="name:asc">Name A-Z</option>
          </select>
        </label>
      </div>

      <div className="armourCards" aria-label="Armour flip results">
        {rows.map((row) => (
          <button
            className={selectedId === row.definition.id ? "armourCard selectedRow" : "armourCard"}
            key={row.definition.id}
            onClick={() => onSelect(row.definition.id)}
            type="button"
          >
            <div className="armourCardHeader">
              <ArmourSetName row={row} />
              <ProfitPill row={row} />
            </div>
            <div className="armourCardStats">
              <Stat label="Buy" value={formatNumber(row.buyTotal)} />
              <Stat label="Sell taxed" value={formatNumber(row.sellAfterTax)} />
              <Stat label="ROI" value={formatRoi(row)} />
              <Stat label="Limit" value={String(row.limit ?? "-")} />
              <Stat label="Volume" value={row.volume.toLocaleString()} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ArmourSetName({ row }: { row: ArmourFlipRow }) {
  return (
    <div className="itemCell">
      <span>{row.definition.name}</span>
      {row.definition.members ? (
        <span className="membersMark" title="Members set">
          M
        </span>
      ) : null}
    </div>
  );
}

function ProfitPill({ row }: { row: ArmourFlipRow }) {
  return (
    <span className={row.profit !== null && row.profit >= 0 ? "profitPill" : "lossPill"}>
      {formatNumber(row.profit)}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ArmourDetail({
  row,
  nowSeconds,
}: {
  row: ArmourFlipRow | null;
  nowSeconds: number;
}) {
  if (!row) {
    return <aside className="detailPanel">No armour sets match the current filters.</aside>;
  }

  return (
    <aside className="detailPanel">
      <div className="detailHeader">
        <h2>{row.definition.name}</h2>
        <span className={row.profit !== null && row.profit >= 0 ? "profitPill" : "lossPill"}>
          {formatNumber(row.profit)}
        </span>
      </div>
      <dl className="metricGrid">
        <div>
          <dt>Buy total</dt>
          <dd>{formatNumber(row.buyTotal)}</dd>
        </div>
        <div>
          <dt>Sell after tax</dt>
          <dd>{formatNumber(row.sellAfterTax)}</dd>
        </div>
        <div>
          <dt>ROI</dt>
          <dd>{row.roi === null ? "Unavailable" : `${row.roi.toFixed(2)}%`}</dd>
        </div>
        <div>
          <dt>Freshness</dt>
          <dd>{formatRelativeTime(row.lastUpdatedTime, nowSeconds)}</dd>
        </div>
      </dl>

      {row.missingItems.length ? (
        <p className="warningText">Missing price data: {row.missingItems.join(", ")}</p>
      ) : null}

      <div className="breakdownList">
        {row.itemBreakdown.map((item) => (
          <div className="breakdownRow" key={item.name}>
            <span>{item.name}</span>
            <span>
              {item.buyPrice !== null
                ? `Buy ${formatNumber(item.buyPrice)}`
                : `Sell ${formatNumber(item.sellPrice)}`}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function formatNumber(value: number | null) {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatRoi(row: ArmourFlipRow) {
  return row.roi === null ? "Unavailable" : `${row.roi.toFixed(2)}%`;
}

function parseOptionalNumber(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function compareArmourRows(
  left: ArmourFlipRow,
  right: ArmourFlipRow,
  sort: ArmourSortState,
) {
  const direction = sort.direction === "asc" ? 1 : -1;
  const leftValue = getSortValue(left, sort.key);
  const rightValue = getSortValue(right, sort.key);

  if (typeof leftValue === "string" && typeof rightValue === "string") {
    return leftValue.localeCompare(rightValue) * direction;
  }

  const fallback = sort.direction === "asc" ? Infinity : -Infinity;
  const leftNumber = typeof leftValue === "number" ? leftValue : fallback;
  const rightNumber = typeof rightValue === "number" ? rightValue : fallback;

  if (leftNumber === rightNumber) {
    return left.definition.name.localeCompare(right.definition.name);
  }

  return (leftNumber - rightNumber) * direction;
}

function getSortValue(row: ArmourFlipRow, key: ArmourSortKey) {
  switch (key) {
    case "name":
      return row.definition.name;
    case "buy":
      return row.buyTotal;
    case "sell":
      return row.sellAfterTax;
    case "profit":
      return row.profit;
    case "roi":
      return row.roi;
    case "limit":
      return row.limit;
    case "volume":
      return row.volume;
  }
}
