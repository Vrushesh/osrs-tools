import { NextResponse } from "next/server";
import { parseWiseOldManPlayer } from "@/lib/osrs/player";

const WISE_OLD_MAN_BASE_URL = "https://api.wiseoldman.net/v2";

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

    if (response.status === 404) {
      return NextResponse.json(
        { error: "Player was not found on Wise Old Man." },
        { status: 404 },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Wise Old Man lookup is unavailable right now." },
        { status: 502 },
      );
    }

    const player = parseWiseOldManPlayer(await response.json());
    if (!player) {
      return NextResponse.json(
        { error: "Wise Old Man returned an unsupported player response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ player });
  } catch {
    return NextResponse.json(
      { error: "Wise Old Man lookup is unavailable right now." },
      { status: 502 },
    );
  }
}
