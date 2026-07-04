export type PricingMode = "recent" | "stable";

export type FreshnessLabel =
  | "Fresh"
  | "Aging"
  | "Stale"
  | "No recent buy price";

export type Freshness = {
  label: FreshnessLabel;
  ageSeconds: number | null;
};

export type MappingItem = {
  id: number;
  name: string;
  icon: string;
  members: boolean;
  highalch?: number;
  lowalch?: number;
  limit?: number;
  value?: number;
  examine?: string;
};

export type LatestPrice = {
  high?: number | null;
  highTime?: number | null;
  low?: number | null;
  lowTime?: number | null;
};

export type FiveMinutePrice = {
  avgHighPrice?: number | null;
  highPriceVolume?: number;
  avgLowPrice?: number | null;
  lowPriceVolume?: number;
};

export type AlchRow = {
  id: number;
  name: string;
  icon: string;
  members: boolean;
  highalch: number;
  limit?: number;
  recentBuyPrice: number | null;
  recentBuyTime: number | null;
  stableBuyPrice: number | null;
  stableLowVolume: number;
};

export type PriceItem = {
  id: number;
  name: string;
  icon: string;
  members: boolean;
  limit?: number;
  recentHighPrice: number | null;
  recentHighTime: number | null;
  recentLowPrice: number | null;
  recentLowTime: number | null;
  stableHighPrice: number | null;
  stableHighVolume: number;
  stableLowPrice: number | null;
  stableLowVolume: number;
};

export type PriceApiPayload = {
  rows: AlchRow[];
  items: PriceItem[];
  fetchedAt: string;
  natureRunePrice: number | null;
  natureRunePriceTime: number | null;
  sourceAge: number | null;
  stableAvailable: boolean;
};
