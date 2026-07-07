import type { Freshness } from "@/lib/osrs/types";

export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  return (
    <span
      className={`badge badge-${freshness.bucket}`}
      title={getFreshnessTitle(freshness)}
    >
      {freshness.label}
    </span>
  );
}

function getFreshnessTitle(freshness: Freshness) {
  if (freshness.bucket === "unknown") return "No recent buy trade";
  return `Buy trade age: ${freshness.label}`;
}
