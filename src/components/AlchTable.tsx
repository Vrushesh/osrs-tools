import Image from "next/image";
import type { EnrichedAlchRow, SortKey, SortState } from "@/lib/osrs/table";
import { formatRelativeTime } from "@/lib/osrs/table";

type Props = {
  rows: EnrichedAlchRow[];
  nowSeconds: number;
  sort: SortState;
  onSort: (key: SortKey) => void;
};

const columns: Array<{ key: SortKey; label: string; className?: string }> = [
  { key: "item", label: "Item" },
  { key: "buy", label: "Buy", className: "numeric" },
  { key: "highalch", label: "High Alch Value", className: "numeric" },
  { key: "profit", label: "Difference (Incl Nature Rune)", className: "numeric" },
  { key: "lastUpdated", label: "Last Updated" },
  { key: "volume", label: "Trade Volume", className: "numeric" },
];

function formatNumber(value: number | null) {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function getIconUrl(icon: string) {
  return `https://oldschool.runescape.wiki/images/${encodeURIComponent(icon).replaceAll("%20", "_")}`;
}

export function AlchTable({ rows, nowSeconds, sort, onSort }: Props) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
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
          {rows.map((entry) => (
            <tr key={entry.row.id}>
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
                  <span className="limitPill" title="GE restriction">
                    {entry.row.limit ?? "-"}
                  </span>
                </div>
              </td>
              <td>{formatRelativeTime(entry.lastUpdatedTime, nowSeconds)}</td>
              <td className="numeric">{formatNumber(entry.volume)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
