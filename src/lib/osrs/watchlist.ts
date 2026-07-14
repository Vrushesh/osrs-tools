export function parseWatchlistIds(raw: string | null) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(
        parsed
          .map((value) =>
            typeof value === "string" ? Number(value) : value,
          )
          .filter(isPositiveInteger),
      ),
    );
  } catch {
    return [];
  }
}

export function toggleWatchlistId(ids: number[], itemId: number) {
  const current = new Set(ids.filter(isPositiveInteger));

  if (current.has(itemId)) {
    current.delete(itemId);
  } else if (isPositiveInteger(itemId)) {
    current.add(itemId);
  }

  return Array.from(current);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value > 0;
}
