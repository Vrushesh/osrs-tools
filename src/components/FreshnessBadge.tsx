import type { Freshness } from "@/lib/osrs/types";

export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  return (
    <span
      className={`badge badge-${freshness.label.toLowerCase().replaceAll(" ", "-")}`}
    >
      {freshness.label}
    </span>
  );
}
