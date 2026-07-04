"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlchTable } from "@/components/AlchTable";
import { CalculatorControls } from "@/components/CalculatorControls";
import { ToolTabs } from "@/components/ToolTabs";
import { getRefreshState } from "@/lib/osrs/refresh";
import {
  enrichRows,
  filterRows,
  paginateRows,
  sortRows,
} from "@/lib/osrs/table";
import type { SortKey, SortState } from "@/lib/osrs/table";
import type { AlchRow, PriceApiPayload, PricingMode } from "@/lib/osrs/types";

const DEFAULT_RUNE_COST = 105;
type PageSize = 25 | 50 | 100 | "all";

export default function Home() {
  const [rows, setRows] = useState<AlchRow[]>([]);
  const [pricingMode, setPricingMode] = useState<PricingMode>("recent");
  const [search, setSearch] = useState("");
  const [natureRuneCost, setNatureRuneCost] = useState(DEFAULT_RUNE_COST);
  const [natureRuneSourceText, setNatureRuneSourceText] =
    useState("fallback default");
  const hasEditedNatureRuneCost = useRef(false);
  const [includeMembers, setIncludeMembers] = useState(true);
  const [minLimit, setMinLimit] = useState("1");
  const [minVolume, setMinVolume] = useState("1");
  const [minProfit, setMinProfit] = useState("1");
  const [maxProfit, setMaxProfit] = useState("");
  const [pageSize, setPageSize] = useState<PageSize>(50);
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

  async function loadPrices(forceMessage = false) {
    const response = await fetch("/api/prices");

    if (!response.ok) {
      setStatus(
        "Unable to refresh prices. Showing last successful data if available.",
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
    setStatus(forceMessage ? "Prices refreshed." : "Prices loaded.");
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

      if (fetchedAtSeconds && getRefreshState(fetchedAtSeconds, nextNow).canFetch) {
        void loadPrices();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [fetchedAtSeconds]);

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
      hideStale: false,
      minProfit: parseOptionalNumber(minProfit),
      maxProfit: parseOptionalNumber(maxProfit),
      minLimit: parseOptionalNumber(minLimit),
      minVolume: parseOptionalNumber(minVolume),
    });
  }, [
    enrichedRows,
    includeMembers,
    maxProfit,
    minLimit,
    minProfit,
    minVolume,
    search,
  ]);

  const sortedRows = useMemo(
    () => sortRows(filteredRows, sort),
    [filteredRows, sort],
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
    if (refreshState && !refreshState.canFetch) {
      setStatus(`Next live refresh in ${refreshState.secondsUntilRefresh}s.`);
      return;
    }

    void loadPrices(true);
  }

  function handleNatureRuneCostChange(value: number) {
    hasEditedNatureRuneCost.current = true;
    setNatureRuneCost(value);
    setNatureRuneSourceText("manual override");
  }

  function handleSort(key: SortKey) {
    setSort((current) => {
      if (current.key !== key) return { key, direction: "desc" };
      return {
        key,
        direction: current.direction === "desc" ? "asc" : "desc",
      };
    });
  }

  const refreshText = refreshState
    ? status === "Prices loaded." || status === "Prices refreshed."
      ? `Updated ${refreshState.secondsSinceFetch}s ago`
      : status
    : status;

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
        <span className="rowCount">{sortedRows.length.toLocaleString()} rows</span>
      </section>
      <ToolTabs active="alch" />
      <section className="dataStatus" aria-label="Price refresh status">
        <button className="refreshButton" onClick={handleManualRefresh} type="button">
          Refresh prices
        </button>
        <span className="refreshText">{refreshText}</span>
      </section>
      <CalculatorControls
        includeMembers={includeMembers}
        maxProfit={maxProfit}
        minLimit={minLimit}
        minProfit={minProfit}
        minVolume={minVolume}
        natureRuneCost={natureRuneCost}
        natureRuneSourceText={natureRuneSourceText}
        page={safePage}
        pageSize={pageSize}
        pricingMode={pricingMode}
        resultEnd={resultEnd}
        resultStart={resultStart}
        search={search}
        setIncludeMembers={setIncludeMembers}
        setMaxProfit={setMaxProfit}
        setMinLimit={setMinLimit}
        setMinProfit={setMinProfit}
        setMinVolume={setMinVolume}
        setNatureRuneCost={handleNatureRuneCostChange}
        setPage={setPage}
        setPageSize={setPageSize}
        setPricingMode={setPricingMode}
        setSearch={setSearch}
        totalPages={totalPages}
        totalRows={sortedRows.length}
      />
      <AlchTable
        nowSeconds={nowSeconds}
        rows={paginatedRows}
        sort={sort}
        onSort={handleSort}
      />
    </main>
  );
}

function parseOptionalNumber(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
