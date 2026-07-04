import type { PricingMode } from "@/lib/osrs/types";

type Props = {
  pricingMode: PricingMode;
  setPricingMode: (mode: PricingMode) => void;
  search: string;
  setSearch: (value: string) => void;
  natureRuneCost: number;
  natureRuneSourceText: string;
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
      <div className="segmented" aria-label="Pricing mode">
        <button
          className={props.pricingMode === "recent" ? "active" : ""}
          onClick={() => props.setPricingMode("recent")}
          type="button"
        >
          Most Recent
        </button>
        <button
          className={props.pricingMode === "stable" ? "active" : ""}
          onClick={() => props.setPricingMode("stable")}
          type="button"
        >
          Stable Pricing
        </button>
      </div>

      <input
        aria-label="Search items"
        className="searchInput"
        placeholder="Search items"
        value={props.search}
        onChange={(event) => props.setSearch(event.target.value)}
      />

      <label className="numberControl">
        Nature rune
        <input
          min="0"
          type="number"
          value={props.natureRuneCost}
          onChange={(event) => props.setNatureRuneCost(Number(event.target.value))}
        />
        <span className="sourceHint">{props.natureRuneSourceText}</span>
      </label>

      <label className="checkControl">
        <input
          checked={props.profitableOnly}
          type="checkbox"
          onChange={(event) => props.setProfitableOnly(event.target.checked)}
        />
        Profitable only
      </label>

      <label className="checkControl">
        <input
          checked={props.hideStale}
          type="checkbox"
          onChange={(event) => props.setHideStale(event.target.checked)}
        />
        Hide stale
      </label>

      <button className="refreshButton" onClick={props.onRefresh} type="button">
        Refresh
      </button>
      <span className="refreshText">{props.refreshText}</span>
    </section>
  );
}
