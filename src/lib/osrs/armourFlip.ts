import type { ArmourSetDefinition } from "./armourSets";
import type { PriceItem, PricingMode } from "./types";

export type ArmourFlipMode = "pieces-to-set" | "set-to-pieces";

export type ArmourFlipItem = {
  name: string;
  buyPrice: number | null;
  buyTime: number | null;
  sellPrice: number | null;
  sellTime: number | null;
  lowVolume: number;
  highVolume: number;
};

export type ArmourFlipRow = {
  definition: ArmourSetDefinition;
  set: PriceItem | null;
  pieces: PriceItem[];
  mode: ArmourFlipMode;
  buyTotal: number | null;
  sellTotal: number | null;
  sellAfterTax: number | null;
  profit: number | null;
  roi: number | null;
  limit: number | null;
  volume: number;
  lastUpdatedTime: number | null;
  missingItems: string[];
  itemBreakdown: ArmourFlipItem[];
};

const GE_TAX_RATE = 0.02;
const GE_TAX_CAP = 5_000_000;

export function getAfterTaxSellValue(value: number) {
  const tax = Math.min(Math.floor(value * GE_TAX_RATE), GE_TAX_CAP);
  return value - tax;
}

export function enrichArmourFlips(
  definitions: ArmourSetDefinition[],
  items: PriceItem[],
  mode: ArmourFlipMode,
  pricingMode: PricingMode,
): ArmourFlipRow[] {
  const itemsByName = new Map(items.map((item) => [item.name.toLowerCase(), item]));

  return definitions.map((definition) => {
    const set = itemsByName.get(definition.setItem.toLowerCase()) ?? null;
    const pieces = definition.pieces
      .map((piece) => itemsByName.get(piece.toLowerCase()) ?? null)
      .filter((piece): piece is PriceItem => piece !== null);
    const missingItems = [
      ...(set ? [] : [definition.setItem]),
      ...definition.pieces.filter((piece) => !itemsByName.has(piece.toLowerCase())),
    ];

    const itemBreakdown = buildBreakdown(definition, set, pieces, mode, pricingMode);
    const buyTotal =
      mode === "pieces-to-set"
        ? sumNullable(itemBreakdown.slice(0, definition.pieces.length).map((item) => item.buyPrice))
        : sumNullable([itemBreakdown[0]?.buyPrice ?? null]);
    const rawSellTotal =
      mode === "pieces-to-set"
        ? sumNullable([itemBreakdown.at(-1)?.sellPrice ?? null])
        : sumNullable(itemBreakdown.slice(1).map((item) => item.sellPrice));
    const sellAfterTax =
      rawSellTotal === null
        ? null
        : mode === "pieces-to-set"
          ? getAfterTaxSellValue(rawSellTotal)
          : sumNullable(
              itemBreakdown.slice(1).map((item) =>
                item.sellPrice === null ? null : getAfterTaxSellValue(item.sellPrice),
              ),
            );
    const profit =
      buyTotal === null || sellAfterTax === null ? null : sellAfterTax - buyTotal;
    const roi = buyTotal === null || profit === null ? null : (profit / buyTotal) * 100;

    return {
      definition,
      set,
      pieces,
      mode,
      buyTotal,
      sellTotal: rawSellTotal,
      sellAfterTax,
      profit,
      roi,
      limit: definitionLimit(set, pieces),
      volume: rowVolume(itemBreakdown, mode),
      lastUpdatedTime: rowLastUpdated(itemBreakdown, mode),
      missingItems,
      itemBreakdown,
    };
  });
}

function buildBreakdown(
  definition: ArmourSetDefinition,
  set: PriceItem | null,
  pieces: PriceItem[],
  mode: ArmourFlipMode,
  pricingMode: PricingMode,
): ArmourFlipItem[] {
  if (mode === "pieces-to-set") {
    return [
      ...definition.pieces.map((pieceName) => {
        const piece = pieces.find((item) => item.name === pieceName) ?? null;
        return {
          name: pieceName,
          buyPrice: piece ? buyPrice(piece, pricingMode) : null,
          buyTime: piece ? buyTime(piece, pricingMode) : null,
          sellPrice: null,
          sellTime: null,
          lowVolume: piece?.stableLowVolume ?? 0,
          highVolume: piece?.stableHighVolume ?? 0,
        };
      }),
      {
        name: definition.setItem,
        buyPrice: null,
        buyTime: null,
        sellPrice: set ? sellPrice(set, pricingMode) : null,
        sellTime: set ? sellTime(set, pricingMode) : null,
        lowVolume: set?.stableLowVolume ?? 0,
        highVolume: set?.stableHighVolume ?? 0,
      },
    ];
  }

  return [
    {
      name: definition.setItem,
      buyPrice: set ? buyPrice(set, pricingMode) : null,
      buyTime: set ? buyTime(set, pricingMode) : null,
      sellPrice: null,
      sellTime: null,
      lowVolume: set?.stableLowVolume ?? 0,
      highVolume: set?.stableHighVolume ?? 0,
    },
    ...definition.pieces.map((pieceName) => {
      const piece = pieces.find((item) => item.name === pieceName) ?? null;
      return {
        name: pieceName,
        buyPrice: null,
        buyTime: null,
        sellPrice: piece ? sellPrice(piece, pricingMode) : null,
        sellTime: piece ? sellTime(piece, pricingMode) : null,
        lowVolume: piece?.stableLowVolume ?? 0,
        highVolume: piece?.stableHighVolume ?? 0,
      };
    }),
  ];
}

function buyPrice(item: PriceItem, pricingMode: PricingMode) {
  return pricingMode === "recent" ? item.recentLowPrice : item.stableLowPrice;
}

function buyTime(item: PriceItem, pricingMode: PricingMode) {
  return pricingMode === "recent" ? item.recentLowTime : null;
}

function sellPrice(item: PriceItem, pricingMode: PricingMode) {
  return pricingMode === "recent" ? item.recentHighPrice : item.stableHighPrice;
}

function sellTime(item: PriceItem, pricingMode: PricingMode) {
  return pricingMode === "recent" ? item.recentHighTime : null;
}

function sumNullable(values: Array<number | null>) {
  if (values.some((value) => value === null)) return null;
  return (values as number[]).reduce((total, value) => total + value, 0);
}

function definitionLimit(set: PriceItem | null, pieces: PriceItem[]) {
  const limits = [set?.limit, ...pieces.map((piece) => piece.limit)].filter(
    (limit): limit is number => typeof limit === "number",
  );
  return limits.length ? Math.min(...limits) : null;
}

function rowVolume(items: ArmourFlipItem[], mode: ArmourFlipMode) {
  const volumes = items.map((item, index) => {
    const isSet = mode === "pieces-to-set" ? index === items.length - 1 : index === 0;
    const isBuySide =
      (mode === "pieces-to-set" && !isSet) || (mode === "set-to-pieces" && isSet);

    return isBuySide ? item.lowVolume : item.highVolume;
  });

  return volumes.length ? Math.min(...volumes) : 0;
}

function rowLastUpdated(items: ArmourFlipItem[], mode: ArmourFlipMode) {
  const times = items
    .map((item) => (mode === "pieces-to-set" ? item.sellTime ?? item.buyTime : item.buyTime ?? item.sellTime))
    .filter((value): value is number => typeof value === "number");
  return times.length ? Math.min(...times) : null;
}
