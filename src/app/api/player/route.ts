import { NextResponse } from "next/server";
import { parseHiscoresPlayer, parseWiseOldManPlayer } from "@/lib/osrs/player";

const WISE_OLD_MAN_BASE_URL = "https://api.wiseoldman.net/v2";
const OFFICIAL_HISCORES_URL =
  "https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json(
      { error: "Enter an OSRS username to look up." },
      { status: 400 },
    );
  }

  try {
    const wiseOldManPlayer = await fetchWiseOldManPlayer(username);
    if (wiseOldManPlayer) return NextResponse.json({ player: wiseOldManPlayer });

    const hiscoresPlayer = await fetchHiscoresPlayer(username);
    if (hiscoresPlayer) return NextResponse.json({ player: hiscoresPlayer });

    return NextResponse.json(
      { error: "Player was not found on Wise Old Man or official hiscores." },
      { status: 404 },
    );
  } catch {
    return NextResponse.json(
      { error: "Player lookup is unavailable right now." },
      { status: 502 },
    );
  }
}

async function fetchWiseOldManPlayer(username: string) {
  const response = await fetch(
    `${WISE_OLD_MAN_BASE_URL}/players/username/${encodeURIComponent(username)}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "osrs-tools player lookup contact: local",
      },
      next: { revalidate: 300 },
    },
  );

  if (response.status === 404) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("application/json")) {
    return null;
  }

  return parseWiseOldManPlayer(await response.json());
}

async function fetchHiscoresPlayer(username: string) {
  const url = new URL(OFFICIAL_HISCORES_URL);
  url.searchParams.set("player", username);

  const response = await fetch(url, {
    headers: {
      Accept: "text/plain,text/csv,*/*",
      "User-Agent": "osrs-tools player lookup contact: local",
    },
    next: { revalidate: 300 },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    return null;
  }

  return parseHiscoresPlayer(username, await response.text());
}
