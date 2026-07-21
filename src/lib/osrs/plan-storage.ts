import type { PlanQuantities } from "./plan";

export type StoredAlchPlan = {
  itemIds: number[];
  quantities: PlanQuantities;
  cashStack: string;
};

const EMPTY_STORED_PLAN: StoredAlchPlan = {
  itemIds: [],
  quantities: {},
  cashStack: "",
};

export function parseStoredAlchPlan(raw: string | null): StoredAlchPlan {
  if (!raw) return createEmptyStoredPlan();

  try {
    return normalizeStoredAlchPlan(JSON.parse(raw));
  } catch {
    return createEmptyStoredPlan();
  }
}

export function serializeStoredAlchPlan(plan: StoredAlchPlan) {
  return JSON.stringify(normalizeStoredAlchPlan(plan));
}

export function pruneStoredAlchPlan(
  plan: StoredAlchPlan,
  availableItemIds: ReadonlySet<number>,
): StoredAlchPlan {
  const normalized = normalizeStoredAlchPlan(plan);
  const itemIds = normalized.itemIds.filter((itemId) =>
    availableItemIds.has(itemId),
  );

  return {
    itemIds,
    quantities: normalizeQuantities(normalized.quantities, new Set(itemIds)),
    cashStack: normalized.cashStack,
  };
}

function normalizeStoredAlchPlan(value: unknown): StoredAlchPlan {
  if (!isRecord(value)) return createEmptyStoredPlan();

  const itemIds = Array.isArray(value.itemIds)
    ? Array.from(
        new Set(value.itemIds.map(parsePositiveInteger).filter(isNumber)),
      )
    : [];
  const selectedIds = new Set(itemIds);
  const quantities = normalizeQuantities(value.quantities, selectedIds);
  const cashStack = normalizeCashStack(value.cashStack);

  return { itemIds, quantities, cashStack };
}

function normalizeQuantities(
  value: unknown,
  selectedIds: ReadonlySet<number>,
): PlanQuantities {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([rawItemId, rawQuantity]) => {
      const itemId = parsePositiveInteger(rawItemId);
      if (
        itemId === null ||
        !selectedIds.has(itemId) ||
        typeof rawQuantity !== "number" ||
        !Number.isFinite(rawQuantity) ||
        rawQuantity <= 0
      ) {
        return [];
      }

      return [[itemId, Math.floor(rawQuantity)]];
    }),
  );
}

function normalizeCashStack(value: unknown) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (trimmed === "") return "";

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? trimmed : "";
}

function parsePositiveInteger(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isNumber(value: number | null): value is number {
  return value !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createEmptyStoredPlan(): StoredAlchPlan {
  return {
    itemIds: [...EMPTY_STORED_PLAN.itemIds],
    quantities: { ...EMPTY_STORED_PLAN.quantities },
    cashStack: EMPTY_STORED_PLAN.cashStack,
  };
}
