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
  }, [
    hideStale,
    natureRuneCost,
    nowSeconds,
    pricingMode,
    profitableOnly,
    rows,
    search,
  ]);

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
        <div>
          <h1>OSRS High Alchemy Calculator</h1>
          <p>Live alch profit with visible price freshness.</p>
        </div>
        <span className="rowCount">{filteredRows.length.toLocaleString()} rows</span>
      </section>
      <CalculatorControls
        hideStale={hideStale}
        natureRuneCost={natureRuneCost}
        pricingMode={pricingMode}
        profitableOnly={profitableOnly}
        refreshText={refreshText}
        search={search}
        setHideStale={setHideStale}
        setNatureRuneCost={setNatureRuneCost}
        setPricingMode={setPricingMode}
        setProfitableOnly={setProfitableOnly}
        setSearch={setSearch}
        onRefresh={handleManualRefresh}
      />
      <AlchTable
        natureRuneCost={natureRuneCost}
        nowSeconds={nowSeconds}
        pricingMode={pricingMode}
        rows={filteredRows}
      />
    </main>
  );
}
