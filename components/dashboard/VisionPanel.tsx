"use client";

import { motion } from "framer-motion";
import { Aperture, Boxes, Camera, Crosshair, Eye, Layers3, ScanLine, ShieldAlert, Signal } from "lucide-react";
import { scenarioMeta, scenarioTelemetry } from "@/lib/agent/scenarios";
import type { CameraTelemetry, GstInvoice, ScenarioId } from "@/lib/agent/types";

const packages = [
  { tone: "#92705b", kind: "jar" }, { tone: "#778561", kind: "can" }, { tone: "#667886", kind: "box" },
  { tone: "#a17b4d", kind: "jar" }, { tone: "#748a76", kind: "box" }, { tone: "#72729a", kind: "can" },
  { tone: "#9d6051", kind: "box" }, { tone: "#818c67", kind: "jar" }, { tone: "#7e8176", kind: "can" },
  { tone: "#8e7049", kind: "box" }, { tone: "#597c7c", kind: "jar" }, { tone: "#989463", kind: "can" }
];

const visibleRows = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [2, 4, 9, 10, 11, 1, 7, 3],
  [6, 8, 5, 1, 10, 0, 11, 2]
];

type Props = { scenario: ScenarioId; telemetry: CameraTelemetry | null; isBusy: boolean; invoice?: GstInvoice | null; onOpenInvoice?: () => void };

export function VisionPanel({ scenario, telemetry, isBusy, invoice, onOpenInvoice }: Props) {
  const frame = telemetry ?? scenarioTelemetry[scenario];
  const meta = scenarioMeta[scenario];
  const stockout = frame.anomaly_flags.includes("CRITICAL_STOCKOUT");
  const mismatch = frame.anomaly_flags.includes("SCAN_MISMATCH");
  const alert = stockout ? "CRITICAL STOCKOUT · AISLE B-04" : mismatch ? "SCAN MISMATCH · MANAGER REVIEW" : null;
  const cameraLabel = frame.zone_type === "SHELF" ? "AISLE B · PANTRY" : "TILL 04 · EXPRESS CHECKOUT";

  return (
    <section className="panel" aria-labelledby="vision-title">
      <header className="panel-header">
        <div className="panel-title-group">
          <span className="panel-title-icon"><Eye size={13} /></span>
          <div><h2 className="panel-title" id="vision-title">Live vision telemetry</h2><div className="panel-subtitle">OpenCV perception · bounding-box confidence</div></div>
        </div>
        <div className="panel-action"><span className="panel-tag"><Aperture size={9} /> {meta.eyebrow}</span></div>
      </header>
      <div className="panel-body">
        <div className="camera-screen" role="img" aria-label={`${cameraLabel}, a simulated camera view with tracked retail products`}>
          <div className="camera-noise" /><div className="camera-vignette" />
          <div className="camera-corner"><span className="camera-rec"><i /> REC</span><span>{frame.camera_id}</span></div>
          <div className="camera-corner right"><Signal size={10} /> 60 FPS &nbsp; · &nbsp; MOCK FRAME</div>
          <div className="camera-shelf" aria-hidden="true">
            {visibleRows.map((row, rowIndex) => (
              <div className="shelf-bay" key={rowIndex}>
                {rowIndex === 1 && stockout ? (
                  <>
                    {row.slice(0, 3).map((itemIndex, itemPosition) => <ProductBox key={itemPosition} itemIndex={itemIndex} />)}
                    <div className="empty-slot" />
                    {row.slice(3, 6).map((itemIndex, itemPosition) => <ProductBox key={itemPosition + 3} itemIndex={itemIndex} />)}
                  </>
                ) : row.map((itemIndex, itemPosition) => (
                  <ProductBox key={itemPosition} itemIndex={itemIndex} prominent={scenario === "A" && itemPosition === 3} />
                ))}
              </div>
            ))}
          </div>
          {frame.detected_skus.map((sku) => (
            <motion.div
              key={sku.sku_id}
              className={`sku-box ${sku.confidence < 0.85 ? "warn" : ""}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              style={{ left: `${sku.box.x}%`, top: `${sku.box.y}%`, width: `${sku.box.width}%`, height: `${sku.box.height}%` }}
            >
              <span className="sku-box-label"><Crosshair size={8} /> {sku.sku_id} &nbsp; {Math.round(sku.confidence * 100)}%</span>
            </motion.div>
          ))}
          {alert && <motion.div className="camera-alert" initial={{ opacity: 0, x: 7 }} animate={{ opacity: 1, x: 0 }}><strong><ShieldAlert size={9} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} /> ALERT · {stockout ? "STOCKOUT" : "DISPUTE"}</strong>{stockout ? "Shelf occupancy is below the critical threshold." : "Visual SKU does not match barcode."}</motion.div>}
          {stockout && <div className="camera-empty-message">4% occupancy · restock needed</div>}
          <div className="scanline" />
          <div className="camera-caption"><span><Camera size={9} /> {cameraLabel}</span><span><Layers3 size={9} /> {frame.detected_skus.length} TRACKED</span></div>
        </div>
        <div className="camera-bottom-stats">
          <span className="camera-key"><i /> Bounding box &nbsp;<strong>{Math.round(Math.min(...frame.detected_skus.map((sku) => sku.confidence)) * 100)}%</strong> confidence</span>
          <span className="camera-key danger"><i /> {frame.zone_type === "SHELF" ? "Shelf fill" : "Shelf context"} &nbsp;<strong>{frame.shelf_stock_percent}%</strong></span>
          <span className="panel-tag"><Boxes size={9} /> {isBusy ? "SCANNING" : "SIMULATED"}</span>
        </div>
        <div className="camera-bottom-stats" style={{ justifyContent: "flex-start", paddingTop: 7 }}>
          <span style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><ScanLine size={9} style={{ verticalAlign: "-1px", marginRight: 5, color: "var(--cyan)" }} />{telemetry?.note ?? "Scenario preview · start the run for fresh synthetic telemetry."}</span>
        </div>
        {invoice && <div className="receipt-card">
          <span className="approval-idle-icon"><Boxes size={12} /></span>
          <span className="receipt-card-copy"><strong>GST receipt generated · simulation only</strong><span>{invoice.invoice_id} · CGST + SGST split · UPI payload ready</span></span>
          <span className="receipt-card-total">₹{invoice.total.toFixed(2)}</span>
          <button className="receipt-open" onClick={onOpenInvoice}>Open receipt <Crosshair size={8} /></button>
        </div>}
      </div>
    </section>
  );
}

function ProductBox({ itemIndex, prominent = false }: { itemIndex: number; prominent?: boolean }) {
  const item = packages[itemIndex % packages.length];
  const height = 26 + ((itemIndex * 13) % 24);
  const width = 24 + ((itemIndex * 5) % 13);
  return <div className={`product-box ${item.kind} ${prominent ? "emphasis" : ""}`} style={{ "--box": item.tone, "--box-dark": `${item.tone}88`, "--h": `${height}px`, "--w": `${width}px`, "--depth": `${itemIndex % 4}px` } as React.CSSProperties} />;
}
