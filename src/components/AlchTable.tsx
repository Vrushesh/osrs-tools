import Image from "next/image";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import type { EnrichedAlchRow, SortKey, SortState } from "@/lib/osrs/table";
import { formatRelativeTime } from "@/lib/osrs/table";

type Props = {
  rows: EnrichedAlchRow[];
  nowSeconds: number;
  planItemIds: ReadonlySet<number>;
  sort: SortState;
  onAddToPlan: (entry: EnrichedAlchRow) => void;
  onSort: (key: SortKey) => void;
};

const columns: Array<{ key: SortKey; label: string; className?: string }> = [
  { key: "item", label: "Item" },
  { key: "buy", label: "Buy", className: "numeric" },
  { key: "highalch", label: "High Alch", className: "numeric" },
  { key: "profit", label: "Profit", className: "numeric" },
  { key: "lastUpdated", label: "Updated" },
  { key: "volume", label: "5 min Vol", className: "numeric" },
];

function formatNumber(value: number | null) {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function getIconUrl(icon: string) {
  return `https://oldschool.runescape.wiki/images/${encodeURIComponent(icon).replaceAll("%20", "_")}`;
}

export function AlchTable({
  nowSeconds,
  onAddToPlan,
  onSort,
  planItemIds,
  rows,
  sort,
}: Props) {
  return (
    <div className="tableWrap">
      <table className="alchTable">
        <thead>
          <tr>
            <th className="planColumn">
              <span className="srOnly">Alch plan</span>
            </th>
            {columns.map((column) => (
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
          {rows.length === 0 ? (
            <tr>
              <td className="emptyTableCell" colSpan={columns.length + 1}>
                No alch candidates match the current filters. Try lowering the
                volume or profit filters, or showing stale trades.
              </td>
            </tr>
          ) : null}
          {rows.map((entry) => {
            const isPlanned = planItemIds.has(entry.row.id);
            const canAdd = entry.buyPrice !== null && entry.profit !== null;

            return (
              <tr key={entry.row.id}>
                <td className="planColumn">
                  <button
                    aria-label={
                      isPlanned
                        ? `${entry.row.name} is in alch plan`
                        : `Add ${entry.row.name} to alch plan`
                    }
                    className={`addPlanButton ${isPlanned ? "planned" : ""}`}
                    disabled={!canAdd}
                    title={
                      canAdd
                        ? isPlanned
                          ? "Added to alch plan"
                          : "Add to alch plan"
                        : "Unavailable price"
                    }
                    onClick={() => onAddToPlan(entry)}
                    type="button"
                  >
                    <span aria-hidden="true">{isPlanned ? "✓" : "+"}</span>
                  </button>
                </td>
                <td>
                <div className="itemCell">
                  <Image
                    alt=""
                    className="itemIcon"
                    height="32"
                    loading="lazy"
                    src={getIconUrl(entry.row.icon)}
                    width="32"
                  />
                  <span>{entry.row.name}</span>
                  {entry.row.members ? (
                    <span className="membersMark" title="Members item">
                      M
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="numeric">{formatNumber(entry.buyPrice)}</td>
              <td className="numeric">{formatNumber(entry.row.highalch)}</td>
              <td className="numeric">
                <div className="profitCell">
                  <span
                    className={
                      entry.profit !== null && entry.profit >= 0
                        ? "profitPill"
                        : "lossPill"
                    }
                  >
                    {formatNumber(entry.profit)}
                  </span>
                  <span className="limitPill" title="GE limit: max quantity bought every 4 hours">
                    <span className="limitLabel">GE</span>
                    {entry.row.limit ?? "-"}
                  </span>
                </div>
              </td>
              <td>
                <div className="freshnessCell">
                  <span>{formatRelativeTime(entry.lastUpdatedTime, nowSeconds)}</span>
                  <FreshnessBadge freshness={entry.freshness} />
                </div>
              </td>
              <td className="numeric">{formatNumber(entry.volume)}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
