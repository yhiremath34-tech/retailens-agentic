"use client";

import { memo, useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, BadgePercent, Boxes, Database, Package, RefreshCw } from "lucide-react";
import type { InventoryItem, TraceEvent } from "@/lib/agent/types";

const statusLabels: Record<InventoryItem["status"], string> = {
  healthy: "In stock",
  low: "Low stock",
  critical: "Stockout",
  markdown: "Markdown"
};

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: value % 1 === 0 ? 0 : 2 }).format(value);

type Props = { inventory: InventoryItem[]; events: TraceEvent[] };

export const InventoryPanel = memo(function InventoryPanel({ inventory, events }: Props) {
  const latestChanged = useMemo(() => {
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const payload = events[index].payload;
      if (payload && typeof payload === "object" && "sku_id" in payload) return String((payload as { sku_id: unknown }).sku_id);
    }
    return null;
  }, [events]);
  const atRisk = inventory.filter((item) => item.status === "low" || item.status === "critical").length;
  const markdownCount = inventory.filter((item) => item.status === "markdown").length;
  const totalUnits = inventory.reduce((sum, item) => sum + item.stock, 0);

  return (
    <section className="panel" aria-labelledby="inventory-title">
      <header className="panel-header">
        <div className="panel-title-group">
          <span className="panel-title-icon"><Database size={13} /></span>
          <div><h2 className="panel-title" id="inventory-title">POS inventory & pricing</h2><div className="panel-subtitle">Live-style mutations · sample ledger</div></div>
        </div>
        <div className="panel-action"><span className="panel-tag"><RefreshCw size={8} /> LOCAL DEMO</span></div>
      </header>
      <div className="panel-body">
        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead><tr><th style={{ width: "47%" }}>Product / SKU</th><th>Aisle</th><th>On hand</th><th>Price</th><th>Signal</th></tr></thead>
            <tbody>
              {inventory.map((item) => {
                const flash = item.sku === latestChanged;
                return <tr className={flash ? "flash" : ""} key={item.sku}>
                  <td><div className="inventory-name">
                    <span className="product-orb"><Package size={10} /></span>
                    <span><strong title={item.name}>{item.name}</strong><small>{item.sku}</small></span>
                  </div></td>
                  <td style={{ color: "#818a81", fontFamily: "var(--mono)", fontSize: 8 }}>{item.aisle}</td>
                  <td className={`stock-number ${item.status === "critical" ? "critical" : item.status === "low" ? "low" : ""}`}>
                    {item.stock.toString().padStart(2, "0")}
                    {flash && <span className="row-flash-icon" title="Updated in this run"><ArrowDownRight size={10} /></span>}
                  </td>
                  <td className="price-cell">{money(item.price)}{item.previousPrice !== undefined && item.discount ? <span className="price-was">{money(item.previousPrice)}</span> : null}</td>
                  <td><span className={`stock-pill ${item.status}`}>{item.status === "markdown" ? <BadgePercent size={8} /> : null}{statusLabels[item.status]}{item.discount ? ` · ${item.discount}%` : ""}</span></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div className="inventory-footer">
          <span><strong>{inventory.length}</strong> tracked SKUs · <b>{totalUnits.toString().padStart(2, "0")}</b> units in demo</span>
          <span><ArrowUpRight size={9} style={{ verticalAlign: "-1px" }} /> {atRisk} stock risks &nbsp; · &nbsp; {markdownCount} markdowns</span>
        </div>
      </div>
    </section>
  );
});
