"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlchPlanDrawer } from "@/components/AlchPlanDrawer";
import { AlchTable } from "@/components/AlchTable";
import { CalculatorControls } from "@/components/CalculatorControls";
import { PlayerLookup } from "@/components/PlayerLookup";
import { getFilterPresetValues } from "@/lib/osrs/filter-presets";
import type { FilterPresetId } from "@/lib/osrs/filter-presets";
import {
  addWatchedEntriesToPlan,
  buildAlchPlan,
  getDefaultPlanQuantity,
} from "@/lib/osrs/plan";
import type { PlanQuantities } from "@/lib/osrs/plan";
import {
  parseStoredAlchPlan,
  pruneStoredAlchPlan,
  serializeStoredAlchPlan,
} from "@/lib/osrs/plan-storage";
import { canStartRefresh, getRefreshState } from "@/lib/osrs/refresh";
import {
  enrichRows,
  filterRows,
  paginateRows,
  sortRows,
} from "@/lib/osrs/table";
import type { SortKey, SortState } from "@/lib/osrs/table";
import type { EnrichedAlchRow } from "@/lib/osrs/table";
import type { AlchRow, PriceApiPayload, PricingMode } from "@/lib/osrs/types";
import {
  parseCalculatorViewQuery,
  serializeCalculatorView,
} from "@/lib/osrs/view-state";
import type { CalculatorPageSize } from "@/lib/osrs/view-state";
import { parseWatchlistIds, toggleWatchlistId } from "@/lib/osrs/watchlist";

const DEFAULT_RUNE_COST = 105;
const PLAN_STORAGE_KEY = "osrs-high-alch-plan:v1";
const PREFERENCES_STORAGE_KEY = "osrs-high-alch-preferences:v1";
const THEME_STORAGE_KEY = "osrs-high-alch-theme:v1";
const WATCHLIST_STORAGE_KEY = "osrs-high-alch-watchlist:v1";
type ThemeMode = "system" | "dark" | "light";

type StoredPreferences = {
  pricingMode?: PricingMode;
  includeMembers?: boolean;
  minLimit?: string;
  minVolume?: string;
  minProfit?: string;
  minRoi?: string;
  maxProfit?: string;
  hideStale?: boolean;
  pageSize?: CalculatorPageSize;
};

export default function Home() {
  const [rows, setRows] = useState<AlchRow[]>([]);
  const [pricingMode, setPricingMode] = useState<PricingMode>("recent");
  const [search, setSearch] = useState("");
  const [natureRuneCost, setNatureRuneCost] = useState(DEFAULT_RUNE_COST);
  const [natureRuneSourceText, setNatureRuneSourceText] =
    useState("fallback default");
  const hasEditedNatureRuneCost = useRef(false);
  const [includeMembers, setIncludeMembers] = useState(true);
  const [minLimit, setMinLimit] = useState("");
  const [minVolume, setMinVolume] = useState("5");
  const [minProfit, setMinProfit] = useState("1");
  const [minRoi, setMinRoi] = useState("");
  const [maxProfit, setMaxProfit] = useState("");
  const [hideStale, setHideStale] = useState(true);
  const [watchedOnly, setWatchedOnly] = useState(false);
  const [pageSize, setPageSize] = useState<CalculatorPageSize>(100);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({
    key: "profit",
    direction: "desc",
  });
  const [fetchedAtSeconds, setFetchedAtSeconds] = useState(0);
  const [nowSeconds, setNowSeconds] = useState(() =>
    Math.floor(Date.now() / 1000),
  );
  const [status, setStatus] = useState("Loading prices...");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [planItemIds, setPlanItemIds] = useState<number[]>([]);
  const [planQuantities, setPlanQuantities] = useState<PlanQuantities>({});
  const [planCashStack, setPlanCashStack] = useState("");
  const [isPlanStorageReady, setIsPlanStorageReady] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "copied" | "failed"
  >("idle");
  const [watchItemIds, setWatchItemIds] = useState<number[]>([]);
  const refreshInFlight = useRef(false);
  const hasMountedPreferences = useRef(false);
  const hasMountedTheme = useRef(false);
  const hasLoadedWatchlist = useRef(false);

  useEffect(() => {
    const stored = readStoredPreferences();
    const shared = parseCalculatorViewQuery(window.location.search);
    if (!stored && Object.keys(shared).length === 0) return;

    const frame = window.requestAnimationFrame(() => {
      setPricingMode(shared.pricingMode ?? stored?.pricingMode ?? "recent");
      setSearch(shared.search ?? "");
      setIncludeMembers(shared.includeMembers ?? stored?.includeMembers ?? true);
      setMinLimit(shared.minLimit ?? stored?.minLimit ?? "");
      setMinVolume(shared.minVolume ?? stored?.minVolume ?? "5");
      setMinProfit(shared.minProfit ?? stored?.minProfit ?? "1");
      setMinRoi(shared.minRoi ?? stored?.minRoi ?? "");
      setMaxProfit(shared.maxProfit ?? stored?.maxProfit ?? "");
      setHideStale(shared.hideStale ?? stored?.hideStale ?? true);
      setPageSize(shared.pageSize ?? stored?.pageSize ?? 100);
      setSort(shared.sort ?? { key: "profit", direction: "desc" });
      setPage(1);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasMountedPreferences.current) {
      hasMountedPreferences.current = true;
      return;
    }

    const preferences: StoredPreferences = {
      pricingMode,
      includeMembers,
      minLimit,
      minVolume,
      minProfit,
      minRoi,
      maxProfit,
      hideStale,
      pageSize,
    };

    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  }, [
    includeMembers,
    maxProfit,
    hideStale,
    minLimit,
    minProfit,
    minRoi,
    minVolume,
    pageSize,
    pricingMode,
  ]);

  useEffect(() => {
    const storedTheme = readStoredTheme();

    const frame = window.requestAnimationFrame(() => {
      setThemeMode(storedTheme);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setWatchItemIds(parseWatchlistIds(window.localStorage.getItem(WATCHLIST_STORAGE_KEY)));
      hasLoadedWatchlist.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasLoadedWatchlist.current) return;
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchItemIds));
  }, [watchItemIds]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedPlan = parseStoredAlchPlan(
        window.localStorage.getItem(PLAN_STORAGE_KEY),
      );
      setPlanItemIds(storedPlan.itemIds);
      setPlanQuantities(storedPlan.quantities);
      setPlanCashStack(storedPlan.cashStack);
      setIsPlanStorageReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isPlanStorageReady) return;

    if (planItemIds.length === 0 && planCashStack === "") {
      window.localStorage.removeItem(PLAN_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      PLAN_STORAGE_KEY,
      serializeStoredAlchPlan({
        itemIds: planItemIds,
        quantities: planQuantities,
        cashStack: planCashStack,
      }),
    );
  }, [isPlanStorageReady, planCashStack, planItemIds, planQuantities]);

  useEffect(() => {
    if (!isPlanStorageReady || rows.length === 0) return;

    const prunedPlan = pruneStoredAlchPlan(
      {
        itemIds: planItemIds,
        quantities: planQuantities,
        cashStack: planCashStack,
      },
      new Set(rows.map((row) => row.id)),
    );

    if (prunedPlan.itemIds.length === planItemIds.length) return;

    const frame = window.requestAnimationFrame(() => {
      setPlanItemIds(prunedPlan.itemIds);
      setPlanQuantities(prunedPlan.quantities);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isPlanStorageReady, planCashStack, planItemIds, planQuantities, rows]);

  useEffect(() => {
    const applyTheme = () => {
      const resolvedTheme =
        themeMode === "system"
          ? window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark"
          : themeMode;

      document.documentElement.dataset.theme = resolvedTheme;
    };

    applyTheme();

    if (hasMountedTheme.current) {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } else {
      hasMountedTheme.current = true;
    }

    if (themeMode !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: light)");
    media.addEventListener("change", applyTheme);

    return () => media.removeEventListener("change", applyTheme);
  }, [themeMode]);

  async function loadPrices(forceMessage = false) {
    if (refreshInFlight.current) return;

    refreshInFlight.current = true;
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/prices");

      if (!response.ok) {
        setStatus(
          "Price feed unavailable. Showing the last successful data if available.",
        );
        return;
      }

      const payload = (await response.json()) as PriceApiPayload;
      setRows(payload.rows);
      if (payload.natureRunePrice !== null) {
        if (!hasEditedNatureRuneCost.current) {
          setNatureRuneCost(payload.natureRunePrice);
          setNatureRuneSourceText(`${payload.natureRunePrice.toLocaleString()} gp live`);
        } else {
          setNatureRuneSourceText(
            `manual override · live ${payload.natureRunePrice.toLocaleString()} gp`,
          );
        }
      } else if (!hasEditedNatureRuneCost.current) {
        setNatureRuneSourceText(`${DEFAULT_RUNE_COST.toLocaleString()} gp fallback`);
      }
      setFetchedAtSeconds(Math.floor(new Date(payload.fetchedAt).getTime() / 1000));
      setStatus(forceMessage ? "Price feed refreshed." : "Price feed loaded.");
    } catch {
      setStatus(
        "Price feed unavailable. Showing the last successful data if available.",
      );
    } finally {
      refreshInFlight.current = false;
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPrices();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextNow = Math.floor(Date.now() / 1000);
      setNowSeconds(nextNow);

      const nextRefreshState = fetchedAtSeconds
        ? getRefreshState(fetchedAtSeconds, nextNow)
        : null;

      if (
        fetchedAtSeconds &&
        canStartRefresh(nextRefreshState, refreshInFlight.current)
      ) {
        void loadPrices();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [fetchedAtSeconds]);

  useEffect(() => {
    if (!isPlanOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPlanOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlanOpen]);

  useEffect(() => {
    if (shareStatus === "idle") return;
    const timer = window.setTimeout(() => setShareStatus("idle"), 2_000);
    return () => window.clearTimeout(timer);
  }, [shareStatus]);

  const refreshState = fetchedAtSeconds
    ? getRefreshState(fetchedAtSeconds, nowSeconds)
    : null;

  const enrichedRows = useMemo(
    () => enrichRows(rows, pricingMode, natureRuneCost, nowSeconds),
    [natureRuneCost, nowSeconds, pricingMode, rows],
  );

  const filteredRows = useMemo(() => {
    return filterRows(enrichedRows, {
      search,
      includeMembers,
      profitableOnly: false,
      hideStale,
      watchedOnly,
      watchedItemIds: new Set(watchItemIds),
      minProfit: parseOptionalNumber(minProfit),
      minRoi: parseOptionalPercent(minRoi),
      maxProfit: parseOptionalNumber(maxProfit),
      minLimit: parseOptionalNumber(minLimit),
      minVolume: parseOptionalNumber(minVolume),
    });
  }, [
    enrichedRows,
    includeMembers,
    hideStale,
    maxProfit,
    minLimit,
    minProfit,
    minRoi,
    minVolume,
    search,
    watchedOnly,
    watchItemIds,
  ]);

  const sortedRows = useMemo(
    () => sortRows(filteredRows, sort),
    [filteredRows, sort],
  );

  const planIdSet = useMemo(() => new Set(planItemIds), [planItemIds]);
  const watchIdSet = useMemo(() => new Set(watchItemIds), [watchItemIds]);
  const enrichedRowsById = useMemo(
    () => new Map(enrichedRows.map((entry) => [entry.row.id, entry])),
    [enrichedRows],
  );
  const planEntries = useMemo(
    () =>
      planItemIds.flatMap((itemId) => {
        const entry = enrichedRowsById.get(itemId);
        return entry ? [entry] : [];
      }),
    [enrichedRowsById, planItemIds],
  );
  const alchPlan = useMemo(
    () =>
      buildAlchPlan({
        entries: planEntries,
        quantities: planQuantities,
        natureRuneCost,
        cashStack: parseOptionalNumber(planCashStack),
      }),
    [natureRuneCost, planCashStack, planEntries, planQuantities],
  );

  const totalPages =
    pageSize === "all" ? 1 : Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => paginateRows(sortedRows, safePage, pageSize),
    [pageSize, safePage, sortedRows],
  );
  const resultStart =
    sortedRows.length === 0
      ? 0
      : pageSize === "all"
        ? 1
        : (safePage - 1) * pageSize + 1;
  const resultEnd =
    pageSize === "all"
      ? sortedRows.length
      : Math.min(sortedRows.length, safePage * pageSize);

  function handleManualRefresh() {
    if (!canStartRefresh(refreshState, isRefreshing)) {
      setStatus(
        isRefreshing
          ? "Refresh already in progress."
          : `Next feed refresh in ${refreshState?.secondsUntilRefresh ?? 0}s.`,
      );
      return;
    }

    void loadPrices(true);
  }

  function handleNatureRuneCostChange(value: number) {
    hasEditedNatureRuneCost.current = true;
    setNatureRuneCost(value);
    setNatureRuneSourceText("manual override");
  }

  function updateTableSetting<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  async function handleCopyView() {
    const query = serializeCalculatorView({
      pricingMode,
      search,
      includeMembers,
      hideStale,
      minLimit,
      minVolume,
      minProfit,
      maxProfit,
      minRoi,
      pageSize,
      sort,
    });
    const url = `${window.location.origin}${window.location.pathname}?${query}`;

    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
    } catch {
      setShareStatus("failed");
    }
  }

  function handleApplyFilterPreset(id: FilterPresetId) {
    const preset = getFilterPresetValues(id);
    setIncludeMembers(preset.includeMembers);
    setHideStale(preset.hideStale);
    setMinLimit(preset.minLimit);
    setMinVolume(preset.minVolume);
    setMinProfit(preset.minProfit);
    setMinRoi(preset.minRoi);
    setMaxProfit(preset.maxProfit);
    setWatchedOnly(false);
    setPage(1);
  }

  function handleToggleWatchedOnly() {
    setWatchedOnly((current) => !current);
    setPage(1);
  }

  function handleToggleWatchItem(itemId: number) {
    const next = toggleWatchlistId(watchItemIds, itemId);
    setWatchItemIds(next);
    if (next.length === 0) {
      setWatchedOnly(false);
      setPage(1);
    }
  }

  function handlePlanWatchedItems() {
    const nextPlan = addWatchedEntriesToPlan({
      entries: sortRows(enrichedRows, { key: "profit", direction: "desc" }),
      watchedItemIds: watchIdSet,
      currentItemIds: planItemIds,
      quantities: planQuantities,
    });

    if (nextPlan.eligibleCount === 0) {
      setStatus("Watched items need an available price before they can be planned.");
      return;
    }

    setPlanItemIds(nextPlan.itemIds);
    setPlanQuantities(nextPlan.quantities);
    setIsPlanOpen(true);
  }

  function handleSort(key: SortKey) {
    setSort((current) => {
      if (current.key !== key) return { key, direction: "desc" };
      return {
        key,
        direction: current.direction === "desc" ? "asc" : "desc",
      };
    });
    setPage(1);
  }

  function handleAddToPlan(entry: EnrichedAlchRow) {
    if (entry.buyPrice === null || entry.profit === null) return;

    setPlanItemIds((current) =>
      current.includes(entry.row.id) ? current : [...current, entry.row.id],
    );
    setPlanQuantities((current) => ({
      ...current,
      [entry.row.id]: current[entry.row.id] ?? getDefaultPlanQuantity(entry),
    }));
    setIsPlanOpen(true);
  }

  function handlePlanQuantityChange(itemId: number, quantity: number) {
    const safeQuantity = Number.isFinite(quantity)
      ? Math.max(0, Math.floor(quantity))
      : 0;

    if (safeQuantity === 0) {
      handleRemoveFromPlan(itemId);
      return;
    }

    setPlanQuantities((current) => ({
      ...current,
      [itemId]: safeQuantity,
    }));
  }

  function handleRemoveFromPlan(itemId: number) {
    setPlanItemIds((current) => current.filter((id) => id !== itemId));
    setPlanQuantities((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  }

  function handleClearPlan() {
    setPlanItemIds([]);
    setPlanQuantities({});
    setPlanCashStack("");
    window.localStorage.removeItem(PLAN_STORAGE_KEY);
  }

  const refreshText = refreshState
    ? status === "Price feed loaded." || status === "Price feed refreshed."
      ? `Feed checked ${refreshState.secondsSinceFetch}s ago`
      : status
    : status;
  const isPriceLoading = rows.length === 0 && status === "Loading prices...";
  const emptyTableMessage = isPriceLoading
    ? "Loading live OSRS Wiki prices..."
    : "No alch candidates match the current filters. Try lowering the volume or profit filters, or showing stale trades.";

  return (
    <main className="appShell">
      <section className="toolbar">
        <div className="brandLockup">
          <Image alt="" height="48" priority src="/alchmark.svg" width="48" />
          <div>
            <h1>OSRS High Alchemy Calculator</h1>
            <p>Live alch profit with visible price freshness.</p>
          </div>
        </div>
        <div className="toolbarActions">
          <label className="themeControl">
            Theme
            <select
              aria-label="Theme"
              value={themeMode}
              onChange={(event) => setThemeMode(event.target.value as ThemeMode)}
            >
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <span className="rowCount">
            {isPriceLoading ? "Loading" : `${sortedRows.length.toLocaleString()} rows`}
          </span>
          <button
            className="planToggle"
            onClick={() => setIsPlanOpen(true)}
            type="button"
          >
            Plan {alchPlan.totals.itemCount}
          </button>
        </div>
      </section>
      <section className="dataStatus" aria-label="Price refresh status">
        <button
          className="refreshButton"
          disabled={isRefreshing}
          onClick={handleManualRefresh}
          type="button"
        >
          {isRefreshing ? "Refreshing..." : "Refresh prices"}
        </button>
        <span className="refreshText">{refreshText}</span>
      </section>
      <PlayerLookup />
      <CalculatorControls
        includeMembers={includeMembers}
        hideStale={hideStale}
        maxProfit={maxProfit}
        minLimit={minLimit}
        minProfit={minProfit}
        minRoi={minRoi}
        minVolume={minVolume}
        natureRuneCost={natureRuneCost}
        natureRuneSourceText={natureRuneSourceText}
        page={safePage}
        pageSize={pageSize}
        pricingMode={pricingMode}
        resultEnd={resultEnd}
        resultStart={resultStart}
        search={search}
        isPriceLoading={isPriceLoading}
        onApplyFilterPreset={handleApplyFilterPreset}
        onCopyView={handleCopyView}
        watchedCount={watchItemIds.length}
        watchedOnly={watchedOnly}
        shareStatus={shareStatus}
        onToggleWatchedOnly={handleToggleWatchedOnly}
        onPlanWatched={handlePlanWatchedItems}
        setIncludeMembers={(value) =>
          updateTableSetting(setIncludeMembers, value)
        }
        setHideStale={(value) => updateTableSetting(setHideStale, value)}
        setMaxProfit={(value) => updateTableSetting(setMaxProfit, value)}
        setMinLimit={(value) => updateTableSetting(setMinLimit, value)}
        setMinProfit={(value) => updateTableSetting(setMinProfit, value)}
        setMinRoi={(value) => updateTableSetting(setMinRoi, value)}
        setMinVolume={(value) => updateTableSetting(setMinVolume, value)}
        setNatureRuneCost={(value) =>
          updateTableSetting(handleNatureRuneCostChange, value)
        }
        setPage={setPage}
        setPageSize={(value) => updateTableSetting(setPageSize, value)}
        setPricingMode={(value) => updateTableSetting(setPricingMode, value)}
        setSearch={(value) => updateTableSetting(setSearch, value)}
        totalPages={totalPages}
        totalRows={sortedRows.length}
      />
      <AlchTable
        emptyMessage={emptyTableMessage}
        nowSeconds={nowSeconds}
        planItemIds={planIdSet}
        rows={paginatedRows}
        sort={sort}
        watchItemIds={watchIdSet}
        onAddToPlan={handleAddToPlan}
        onSort={handleSort}
        onToggleWatch={handleToggleWatchItem}
      />
      <AlchPlanDrawer
        isOpen={isPlanOpen}
        plan={alchPlan}
        onClear={handleClearPlan}
        onClose={() => setIsPlanOpen(false)}
        onQuantityChange={handlePlanQuantityChange}
        onRemove={handleRemoveFromPlan}
        cashStack={planCashStack}
        onCashStackChange={setPlanCashStack}
      />
    </main>
  );
}

function parseOptionalNumber(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalPercent(value: string) {
  const parsed = parseOptionalNumber(value);
  return parsed === null ? null : parsed / 100;
}

function readStoredPreferences() {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
    return {
      pricingMode: isPricingMode(parsed.pricingMode) ? parsed.pricingMode : undefined,
      includeMembers:
        typeof parsed.includeMembers === "boolean" ? parsed.includeMembers : undefined,
      minLimit: typeof parsed.minLimit === "string" ? parsed.minLimit : undefined,
      minVolume: typeof parsed.minVolume === "string" ? parsed.minVolume : undefined,
      minProfit: typeof parsed.minProfit === "string" ? parsed.minProfit : undefined,
      minRoi: typeof parsed.minRoi === "string" ? parsed.minRoi : undefined,
      maxProfit: typeof parsed.maxProfit === "string" ? parsed.maxProfit : undefined,
      pageSize: isPageSize(parsed.pageSize) ? parsed.pageSize : undefined,
      hideStale: typeof parsed.hideStale === "boolean" ? parsed.hideStale : undefined,
    };
  } catch {
    return null;
  }
}

function isPricingMode(value: unknown): value is PricingMode {
  return value === "recent" || value === "stable";
}

function isPageSize(value: unknown): value is CalculatorPageSize {
  return value === 25 || value === 50 || value === 100 || value === "all";
}

function readStoredTheme(): ThemeMode {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "dark" || value === "light";
}
