export type PricingMode = "recent" | "stable";

export type FreshnessLabel =
  | "<5m"
  | "5-15m"
  | "15-30m"
  | ">30m"
  | "No trade";

export type FreshnessBucket =
  | "fresh"
  | "recent"
  | "aging"
  | "stale"
  | "unknown";

export type Freshness = {
  label: FreshnessLabel;
  bucket: FreshnessBucket;
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

export type PriceApiPayload = {
  rows: AlchRow[];
  fetchedAt: string;
  natureRunePrice: number | null;
  natureRunePriceTime: number | null;
  sourceAge: number | null;
  stableAvailable: boolean;
};
