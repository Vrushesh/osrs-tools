"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  HIGH_ALCH_CASTS_PER_HOUR,
  formatAlchPlanDuration,
  formatAlchPlanShoppingList,
} from "@/lib/osrs/plan";
import type { AlchPlan } from "@/lib/osrs/plan";

type Props = {
  isOpen: boolean;
  plan: AlchPlan;
  onClose: () => void;
  onClear: () => void;
  cashStack: string;
  onCashStackChange: (value: string) => void;
  onQuantityChange: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  style: "percent",
});

function getIconUrl(icon: string) {
  return `https://oldschool.runescape.wiki/images/${encodeURIComponent(icon).replaceAll("%20", "_")}`;
}

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}

function formatCompact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return formatNumber(value);
}

function formatSignedCompact(value: number) {
  return `${value > 0 ? "+" : ""}${formatCompact(value)}`;
}

function getProfitClassName(value: number) {
  return value >= 0 ? "profitTotal" : "lossTotal";
}

export function AlchPlanDrawer({
  cashStack,
  isOpen,
  onCashStackChange,
  onClear,
  onClose,
  onQuantityChange,
  onRemove,
  plan,
}: Props) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      closeButtonRef.current?.focus();
      return;
    }

    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, [isOpen]);

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timer = window.setTimeout(() => setCopyStatus("idle"), 2_000);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  async function handleCopyPlan() {
    if (plan.items.length === 0) return;

    try {
      await navigator.clipboard.writeText(formatAlchPlanShoppingList(plan));
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <>
      {isOpen ? (
        <button
          aria-label="Close alch plan"
          className="planScrim"
          onClick={onClose}
          type="button"
        />
      ) : null}
      <aside
        aria-label="Alch plan"
        aria-hidden={!isOpen}
        className={`planDrawer ${isOpen ? "open" : ""}`}
        inert={!isOpen}
        role="dialog"
      >
        <div className="planHeader">
          <div>
            <h2>Alch Plan</h2>
            <p>{plan.totals.itemCount} items selected · saved locally</p>
          </div>
          <button
            className="iconButton"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            Close
          </button>
        </div>

        {plan.items.length === 0 ? (
          <div className="emptyPlan">
            <p>No items added yet.</p>
            <span>Add profitable rows from the table to estimate capital and return.</span>
          </div>
        ) : (
          <>
            <div className="planBudget">
              <label>
                Cash stack
                <input
                  min="0"
                  placeholder="Optional gp"
                  type="number"
                  value={cashStack}
                  onChange={(event) => onCashStackChange(event.target.value)}
                />
              </label>
              {plan.budget.cashStack === null ? (
                <span>Enter cash to check affordability.</span>
              ) : plan.budget.isAffordable ? (
                <strong className="budgetOk">
                  Fits with {formatCompact(plan.budget.remainingCash)} spare
                </strong>
              ) : (
                <strong className="budgetShort">
                  Short {formatCompact(plan.budget.shortfall)}
                </strong>
              )}
            </div>

            <div className="planItems">
              {plan.items.map((item) => (
                <section className="planItem" key={item.id}>
                  <div className="planItemTop">
                    <Image
                      alt=""
                      className="itemIcon"
                      height="32"
                      loading="lazy"
                      src={getIconUrl(item.icon)}
                      width="32"
                    />
                    <div className="planItemName">
                      <strong>{item.name}</strong>
                      <span>
                        Buy {formatNumber(item.buyPrice)} · Alch{" "}
                        {formatNumber(item.highAlch)}
                      </span>
                    </div>
                    <button
                      className="removePlanItem"
                      onClick={() => onRemove(item.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="quantityRow">
                    <label>
                      Qty
                      <input
                        min="0"
                        type="number"
                        value={item.quantity}
                        onChange={(event) =>
                          onQuantityChange(item.id, Number(event.target.value))
                        }
                      />
                    </label>
                    <span>
                      {item.limit === null ? "No GE limit" : `GE limit ${item.limit}`}
                    </span>
                  </div>

                  <div className="planMetrics">
                    <span>
                      <small>Profit ea</small>
                      <strong>+{formatNumber(item.profitEach)}</strong>
                    </span>
                    <span>
                      <small>Capital</small>
                      <strong>{formatCompact(item.capital)}</strong>
                    </span>
                    <span>
                      <small>Profit</small>
                      <strong>+{formatCompact(item.profit)}</strong>
                    </span>
                  </div>
                </section>
              ))}
            </div>

            <div className="planTotals">
              <div>
                <span>Capital needed</span>
                <strong>{formatCompact(plan.totals.capital)}</strong>
              </div>
              <div>
                <span>Expected profit</span>
                <strong className={getProfitClassName(plan.totals.profit)}>
                  {formatSignedCompact(plan.totals.profit)}
                </strong>
              </div>
              <div>
                <span>Estimated time</span>
                <strong>{formatAlchPlanDuration(plan.totals.castTimeSeconds)}</strong>
              </div>
              <div>
                <span>Profit / hr</span>
                <strong className={getProfitClassName(plan.totals.profitPerHour)}>
                  {formatSignedCompact(plan.totals.profitPerHour)}
                </strong>
              </div>
              <div>
                <span>Nature runes</span>
                <strong>{formatNumber(plan.totals.natureRunes)}</strong>
              </div>
              <div>
                <span>ROI</span>
                <strong>{percentFormatter.format(plan.totals.roi)}</strong>
              </div>
              <p className="planRateNote">
                Assumes {formatNumber(HIGH_ALCH_CASTS_PER_HOUR)} casts/hr;
                buying and banking time excluded.
              </p>
            </div>

            <div className="planActions">
              <span aria-live="polite" className="planActionStatus">
                {copyStatus === "copied"
                  ? "Copied to clipboard"
                  : copyStatus === "failed"
                    ? "Could not copy"
                    : ""}
              </span>
              <div className="planActionButtons">
                <button onClick={handleCopyPlan} type="button">
                  {copyStatus === "copied" ? "Copied!" : "Copy list"}
                </button>
                <button onClick={onClear} type="button">
                  Clear plan
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
