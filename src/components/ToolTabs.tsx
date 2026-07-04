"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  active: "alch" | "armour";
};

const FLAG = "armour-flipper";

export function ToolTabs({ active }: Props) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      setEnabled(params.get("ff") === FLAG);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!enabled) return null;

  return (
    <nav className="toolTabs" aria-label="OSRS tools">
      <Link className={active === "alch" ? "active" : ""} href={`/?ff=${FLAG}`}>
        High Alch
      </Link>
      <Link
        className={active === "armour" ? "active" : ""}
        href={`/armour-flipper?ff=${FLAG}`}
      >
        <span className="tabLabelFull">Armour Flipper</span>
        <span className="tabLabelShort">Armour</span>
      </Link>
    </nav>
  );
}
