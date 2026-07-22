import Image from "next/image";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import type { EnrichedAlchRow, SortKey, SortState } from "@/lib/osrs/table";
import { formatRelativeTime } from "@/lib/osrs/table";

type Props = {
  rows: EnrichedAlchRow[];
  emptyMessage: string;
  nowSeconds: number;
  planItemIds: ReadonlySet<number>;
  sort: SortState;
  watchItemIds: ReadonlySet<number>;
  onAddToPlan: (entry: EnrichedAlchRow) => void;
  onSort: (key: SortKey) => void;
  onToggleWatch: (itemId: number) => void;
};

const columns: Array<{
  key: SortKey;
  label: string;
  className?: string;
  title?: string;
}> = [
  { key: "item", label: "Item", className: "itemColumn" },
  { key: "buy", label: "Buy", className: "numeric" },
  { key: "highalch", label: "High Alch", className: "numeric" },
  { key: "profit", label: "Profit", className: "numeric" },
  {
    key: "roi",
    label: "ROI",
    className: "numeric",
    title: "Profit divided by item and nature rune cost",
  },
  {
    key: "potential",
    label: "Limit Profit",
    className: "numeric",
    title: "Profit each multiplied by the four-hour GE limit",
  },
  { key: "lastUpdated", label: "Updated" },
  { key: "volume", label: "5 min Vol", className: "numeric" },
];

function formatNumber(value: number | null) {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatPercent(value: number | null) {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

function getIconUrl(icon: string) {
  return `https://oldschool.runescape.wiki/images/${encodeURIComponent(icon).replaceAll("%20", "_")}`;
}

export function AlchTable({
  emptyMessage,
  nowSeconds,
  onAddToPlan,
  onSort,
  planItemIds,
  rows,
  sort,
  watchItemIds,
  onToggleWatch,
}: Props) {
  if (rows.length === 0) {
    return (
      <div className="tableWrap emptyTableWrap">
        <div className="emptyTableCell">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="tableWrap">
      <table className="alchTable">
        <thead>
          <tr>
            <th className="planColumn" scope="col">
              <span className="srOnly">Alch plan</span>
            </th>
            {columns.map((column) => (
              <th
                aria-sort={
                  sort.key === column.key
                    ? sort.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className={column.className}
                key={column.key}
                scope="col"
              >
                <button
                  className="sortHeader"
                  onClick={() => onSort(column.key)}
                  title={column.title}
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
          {rows.map((entry) => {
            const isPlanned = planItemIds.has(entry.row.id);
            const isWatched = watchItemIds.has(entry.row.id);
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
                    aria-pressed={isPlanned}
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
                <td className="itemColumn">
                  <div className="itemCell">
                    <button
                      aria-label={
                        isWatched
                          ? `Remove ${entry.row.name} from watchlist`
                          : `Watch ${entry.row.name}`
                      }
                      aria-pressed={isWatched}
                      className={`watchButton ${isWatched ? "watched" : ""}`}
                      title={isWatched ? "Watched item" : "Watch item"}
                      type="button"
                      onClick={() => onToggleWatch(entry.row.id)}
                    >
                      <span aria-hidden="true">{isWatched ? "★" : "☆"}</span>
                    </button>
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
                    <span
                      className="limitPill"
                      title="GE limit: max quantity bought every 4 hours"
                    >
                      <span className="limitLabel">GE</span>
                      {entry.row.limit ?? "-"}
                    </span>
                  </div>
                </td>
                <td className="numeric">{formatPercent(entry.roi)}</td>
                <td
                  className="numeric"
                  title={
                    entry.row.limit === undefined
                      ? "GE limit unavailable"
                      : `Profit across the ${entry.row.limit.toLocaleString()} item GE limit`
                  }
                >
                  {formatNumber(entry.potential)}
                </td>
                <td>
                  <div className="freshnessCell">
                    <span>
                      {formatRelativeTime(entry.lastUpdatedTime, nowSeconds)}
                    </span>
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
