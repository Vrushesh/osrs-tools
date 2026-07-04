import { NextResponse } from "next/server";
import { getNatureRunePrice, normalizeRows } from "@/lib/osrs/normalize";
import type {
  FiveMinutePrice,
  LatestPrice,
  MappingItem,
  PriceApiPayload,
} from "@/lib/osrs/types";

const USER_AGENT =
  "osrs-high-alch-calculator local-dev contact: github.com/vrushesh";

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const sourceAgeHeader = response.headers.get("age");
  const sourceAge = sourceAgeHeader ? Number(sourceAgeHeader) : null;
  const json = (await response.json()) as T;

  return { json, sourceAge };
}

export async function GET() {
  const [mappingResult, latestResult, fiveMinuteResult] =
    await Promise.allSettled([
      fetchJson<MappingItem[]>(
        "https://prices.runescape.wiki/api/v1/osrs/mapping",
      ),
      fetchJson<{ data: Record<string, LatestPrice> }>(
        "https://prices.runescape.wiki/api/v1/osrs/latest",
      ),
      fetchJson<{ data: Record<string, FiveMinutePrice> }>(
        "https://prices.runescape.wiki/api/v1/osrs/5m",
      ),
    ]);

  if (
    mappingResult.status === "rejected" ||
    latestResult.status === "rejected"
  ) {
    return NextResponse.json(
      { error: "Unable to load required OSRS price data." },
      { status: 502 },
    );
  }

  const fiveMinute =
    fiveMinuteResult.status === "fulfilled" ? fiveMinuteResult.value.json.data : {};
  const natureRune = getNatureRunePrice(latestResult.value.json.data);

  const payload: PriceApiPayload = {
    rows: normalizeRows(
      mappingResult.value.json,
      latestResult.value.json.data,
      fiveMinute,
    ),
    fetchedAt: new Date().toISOString(),
    natureRunePrice: natureRune.price,
    natureRunePriceTime: natureRune.time,
    sourceAge: latestResult.value.sourceAge,
    stableAvailable: fiveMinuteResult.status === "fulfilled",
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=30",
    },
  });
}
