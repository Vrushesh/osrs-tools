import Image from "next/image";
import {
  calculatePotentialProfit,
  calculateProfit,
  calculateRoi,
  getFreshness,
} from "@/lib/osrs/calculate";
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

function getIconUrl(icon: string) {
  return `https://oldschool.runescape.wiki/images/${encodeURIComponent(icon).replaceAll("%20", "_")}`;
}

export function AlchTable({
  rows,
  pricingMode,
  natureRuneCost,
  nowSeconds,
}: Props) {
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
          {enriched.map(
            ({ row, buyPrice, profit, roi, potential, freshness }) => (
              <tr key={row.id}>
                <td>
                  <div className="itemCell">
                    <Image
                      alt=""
                      className="itemIcon"
                      height="32"
                      loading="lazy"
                      src={getIconUrl(row.icon)}
                      width="32"
                    />
                    <span>{row.name}</span>
                    {row.members ? (
                      <span className="members">Members</span>
                    ) : null}
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
                <td>
                  <FreshnessBadge freshness={freshness} />
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
