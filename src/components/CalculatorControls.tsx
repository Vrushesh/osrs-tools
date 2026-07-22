import Image from "next/image";
import { FILTER_PRESETS } from "@/lib/osrs/filter-presets";
import type { FilterPresetId } from "@/lib/osrs/filter-presets";
import type { PricingMode } from "@/lib/osrs/types";

type PageSize = 25 | 50 | 100 | "all";

type Props = {
  pricingMode: PricingMode;
  setPricingMode: (mode: PricingMode) => void;
  search: string;
  setSearch: (value: string) => void;
  natureRuneCost: number;
  natureRuneSourceText: string;
  setNatureRuneCost: (value: number) => void;
  includeMembers: boolean;
  setIncludeMembers: (value: boolean) => void;
  hideStale: boolean;
  setHideStale: (value: boolean) => void;
  minLimit: string;
  setMinLimit: (value: string) => void;
  minVolume: string;
  setMinVolume: (value: string) => void;
  minProfit: string;
  setMinProfit: (value: string) => void;
  minRoi: string;
  setMinRoi: (value: string) => void;
  maxProfit: string;
  setMaxProfit: (value: string) => void;
  pageSize: PageSize;
  setPageSize: (value: PageSize) => void;
  page: number;
  totalPages: number;
  resultStart: number;
  resultEnd: number;
  totalRows: number;
  isPriceLoading: boolean;
  onApplyFilterPreset: (id: FilterPresetId) => void;
  watchedCount: number;
  watchedOnly: boolean;
  onToggleWatchedOnly: () => void;
  onPlanWatched: () => void;
  setPage: (value: number) => void;
};

const pricingModeHelp = {
  recent:
    "Most Recent uses the latest OSRS Wiki traded buy price. It is best for finding fresh opportunities, but can be noisier.",
  stable:
    "Stable Pricing uses smoother wiki price averages. It is better when you want less volatile alch candidates.",
  official:
    "Official GE pricing is planned after the MVP. It will use Jagex guide prices once wired in.",
};

export function CalculatorControls(props: Props) {
  return (
    <section className="controlsPanel">
      <div className="controlsTop">
        <div className="segmented" aria-label="Pricing mode">
          <button
            className={props.pricingMode === "recent" ? "active" : ""}
            onClick={() => props.setPricingMode("recent")}
            title={pricingModeHelp.recent}
            type="button"
          >
            <span className="modeLabelFull">Most Recent</span>
            <span className="modeLabelShort">Recent</span>
            <span className="modeHelp" aria-hidden="true">
              ?
            </span>
          </button>
          <button
            className={props.pricingMode === "stable" ? "active" : ""}
            onClick={() => props.setPricingMode("stable")}
            title={pricingModeHelp.stable}
            type="button"
          >
            <span className="modeLabelFull">Stable Pricing</span>
            <span className="modeLabelShort">Stable</span>
            <span className="modeHelp" aria-hidden="true">
              ?
            </span>
          </button>
          <button disabled title={pricingModeHelp.official} type="button">
            Official GE
            <span className="modeHelp" aria-hidden="true">
              ?
            </span>
          </button>
        </div>

        <label className="runeControl">
          <span className="runeLabel">
            <Image
              alt=""
              className="runeIcon"
              height="24"
              src="/nature-rune.png"
              width="24"
            />
            Nature rune
          </span>
          <input
            min="0"
            type="number"
            value={props.natureRuneCost}
            onChange={(event) => props.setNatureRuneCost(Number(event.target.value))}
          />
          <span className="sourceHint">{props.natureRuneSourceText}</span>
        </label>
      </div>

      <input className="filtersToggleInput" id="filters-toggle" type="checkbox" />
      <label className="filtersToggle" htmlFor="filters-toggle">
        Filters: {props.hideStale ? "Fresh trades" : "All ages"} · Limit{" "}
        {props.minLimit || "any"} · Vol {props.minVolume || "any"} · Profit{" "}
        {props.minProfit || "any"}+
        {props.minRoi ? ` · ROI ${props.minRoi}%+` : ""}
        {props.watchedOnly ? " · Watched" : ""}
      </label>

      <div className="presetBar" aria-label="Filter presets">
        <span>Presets</span>
        {FILTER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            title={preset.description}
            type="button"
            onClick={() => props.onApplyFilterPreset(preset.id)}
          >
            {preset.label}
          </button>
        ))}
        <button
          className={props.watchedOnly ? "active" : ""}
          disabled={props.watchedCount === 0}
          title="Show only watched items"
          type="button"
          onClick={props.onToggleWatchedOnly}
        >
          Watched {props.watchedCount}
        </button>
        <button
          disabled={props.watchedCount === 0}
          title="Add all watched items with available prices to the Alch Plan"
          type="button"
          onClick={props.onPlanWatched}
        >
          Plan watched
        </button>
      </div>

      <div className="filtersContent">
        <div className="memberSegment" aria-label="Members item filter">
          <button
            className={!props.includeMembers ? "active" : ""}
            onClick={() => props.setIncludeMembers(false)}
            type="button"
          >
            F2P
          </button>
          <button
            className={props.includeMembers ? "active" : ""}
            onClick={() => props.setIncludeMembers(true)}
            type="button"
          >
            All
          </button>
        </div>

        <label className="compactControl">
          Min limit
          <input
            min="0"
            placeholder="Min"
            type="number"
            value={props.minLimit}
            onChange={(event) => props.setMinLimit(event.target.value)}
          />
        </label>

        <label className="checkControl staleToggle">
          <input
            checked={props.hideStale}
            type="checkbox"
            onChange={(event) => props.setHideStale(event.target.checked)}
          />
          Hide stale trades
        </label>

        <label className="compactControl">
          Min 5 min Vol
          <input
            min="0"
            placeholder="Min"
            type="number"
            value={props.minVolume}
            onChange={(event) => props.setMinVolume(event.target.value)}
          />
        </label>

        <label className="compactControl">
          Min ROI %
          <input
            min="0"
            placeholder="Min"
            step="0.1"
            type="number"
            value={props.minRoi}
            onChange={(event) => props.setMinRoi(event.target.value)}
          />
        </label>

        <label className="compactControl">
          Profit range
          <input
            placeholder="Min"
            type="number"
            value={props.minProfit}
            onChange={(event) => props.setMinProfit(event.target.value)}
          />
          <span>-</span>
          <input
            placeholder="Max"
            type="number"
            value={props.maxProfit}
            onChange={(event) => props.setMaxProfit(event.target.value)}
          />
        </label>
      </div>

      <div className="controlsBottom">
        <input
          aria-label="Search items"
          className="searchInput"
          placeholder="Search items..."
          value={props.search}
          onChange={(event) => props.setSearch(event.target.value)}
        />

        <label className="entriesControl">
          Rows
          <select
            value={String(props.pageSize)}
            onChange={(event) => {
              const value = event.target.value;
              props.setPageSize(value === "all" ? "all" : (Number(value) as PageSize));
            }}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="all">All</option>
          </select>
        </label>

        <span className="paginationSummary">
          {props.isPriceLoading
            ? "Loading item prices..."
            : `Showing ${props.resultStart.toLocaleString()}-${props.resultEnd.toLocaleString()} of ${props.totalRows.toLocaleString()}`}
        </span>
        <div className="pager">
          <button
            disabled={props.isPriceLoading || props.page <= 1}
            onClick={() => props.setPage(props.page - 1)}
            type="button"
          >
            Previous
          </button>
          <span>
            Page {props.page} of {props.totalPages}
          </span>
          <button
            disabled={props.isPriceLoading || props.page >= props.totalPages}
            onClick={() => props.setPage(props.page + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
