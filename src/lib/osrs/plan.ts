import type { EnrichedAlchRow } from "./table";

export type PlanQuantities = Record<number, number>;

export type AlchPlanItem = {
  id: number;
  name: string;
  icon: string;
  members: boolean;
  quantity: number;
  limit: number | null;
  buyPrice: number;
  highAlch: number;
  profitEach: number;
  capital: number;
  profit: number;
};

export type AlchPlan = {
  items: AlchPlanItem[];
  totals: {
    itemCount: number;
    quantity: number;
    natureRunes: number;
    capital: number;
    profit: number;
    roi: number;
  };
  budget: {
    cashStack: number | null;
    isAffordable: boolean | null;
    remainingCash: number;
    shortfall: number;
  };
};

type BuildAlchPlanInput = {
  entries: EnrichedAlchRow[];
  quantities: PlanQuantities;
  natureRuneCost: number;
  cashStack?: number | null;
};

export function getDefaultPlanQuantity(entry: EnrichedAlchRow) {
  return Math.max(1, entry.row.limit ?? 1);
}

export function buildAlchPlan({
  cashStack = null,
  entries,
  quantities,
  natureRuneCost,
}: BuildAlchPlanInput): AlchPlan {
  const items = entries.flatMap((entry) => {
    if (entry.buyPrice === null || entry.profit === null) return [];

    const requestedQuantity =
      quantities[entry.row.id] ?? getDefaultPlanQuantity(entry);
    const quantity = Math.max(0, Math.floor(requestedQuantity));
    if (quantity === 0) return [];

    const capital = (entry.buyPrice + natureRuneCost) * quantity;
    const profit = entry.profit * quantity;

    return [
      {
        id: entry.row.id,
        name: entry.row.name,
        icon: entry.row.icon,
        members: entry.row.members,
        quantity,
        limit: entry.row.limit ?? null,
        buyPrice: entry.buyPrice,
        highAlch: entry.row.highalch,
        profitEach: entry.profit,
        capital,
        profit,
      },
    ];
  });

  const totals = items.reduce(
    (current, item) => ({
      itemCount: current.itemCount + 1,
      quantity: current.quantity + item.quantity,
      natureRunes: current.natureRunes + item.quantity,
      capital: current.capital + item.capital,
      profit: current.profit + item.profit,
      roi: 0,
    }),
    {
      itemCount: 0,
      quantity: 0,
      natureRunes: 0,
      capital: 0,
      profit: 0,
      roi: 0,
    },
  );

  return {
    items,
    totals: {
      ...totals,
      roi: totals.capital > 0 ? totals.profit / totals.capital : 0,
    },
    budget: buildBudget(totals.capital, cashStack),
  };
}

export function formatAlchPlanShoppingList(plan: AlchPlan) {
  const itemLines = plan.items.map(
    (item) =>
      `${item.name} x${formatNumber(item.quantity)} - buy ${formatNumber(
        item.buyPrice,
      )} gp ea`,
  );

  return [
    "OSRS High Alch Plan",
    ...itemLines,
    `Nature rune x${formatNumber(plan.totals.natureRunes)}`,
    `Capital: ${formatNumber(plan.totals.capital)} gp`,
    `Expected profit: ${formatNumber(plan.totals.profit)} gp`,
  ].join("\n");
}

function buildBudget(totalCapital: number, cashStack: number | null) {
  if (cashStack === null || !Number.isFinite(cashStack)) {
    return {
      cashStack: null,
      isAffordable: null,
      remainingCash: 0,
      shortfall: 0,
    };
  }

  const safeCashStack = Math.max(0, Math.floor(cashStack));
  const remainingCash = Math.max(0, safeCashStack - totalCapital);
  const shortfall = Math.max(0, totalCapital - safeCashStack);

  return {
    cashStack: safeCashStack,
    isAffordable: shortfall === 0,
    remainingCash,
    shortfall,
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}
