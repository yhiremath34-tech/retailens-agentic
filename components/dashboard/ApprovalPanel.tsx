"use client";

import { useEffect, useState } from "react";
import { AlertOctagon, CheckCircle2, ChevronRight, CircleCheck, Clock3, FileWarning, Hand, PackageCheck, ShieldAlert, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { formatRupees } from "@/lib/agent/retailAgent";
import type { AgentStatus, PurchaseOrderDecision } from "@/lib/agent/types";

type PurchaseApproval = { type: "purchase"; decision: PurchaseOrderDecision };
type ScanApproval = { type: "scan"; scannedSku: string; scannedLabel: string; visualSku: string; visualLabel: string; confidence: number };
type Approval = PurchaseApproval | ScanApproval;

type Props = {
  approval: Approval | null;
  status: AgentStatus;
  outcome: string | null;
  isBusy: boolean;
  onApprovePurchase: () => void;
  onModifyQuantity: (quantity: number) => Promise<void>;
  onApproveScan: () => Promise<void>;
  onKeepScannedItem: () => void;
  onReject: () => void;
};

export function ApprovalPanel({ approval, status, outcome, isBusy, onApprovePurchase, onModifyQuantity, onApproveScan, onKeepScannedItem, onReject }: Props) {
  const [editingQuantity, setEditingQuantity] = useState(false);
  const [quantity, setQuantity] = useState(20);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditingQuantity(false);
    if (approval?.type === "purchase") setQuantity(approval.decision.request.order_quantity);
  }, [approval]);

  const modifyStart = () => {
    if (!approval || approval.type !== "purchase") return;
    const request = approval.decision.request;
    const unitCost = request.estimated_cost_inr / request.order_quantity;
    const underLimit = Math.floor(10000 / unitCost);
    setQuantity(Math.max(1, Math.min(request.order_quantity, underLimit || 1)));
    setEditingQuantity(true);
  };

  const submitQuantity = async () => {
    if (!Number.isInteger(quantity) || quantity < 1 || !approval || approval.type !== "purchase") return;
    setSaving(true);
    try { await onModifyQuantity(quantity); setEditingQuantity(false); }
    finally { setSaving(false); }
  };

  const title = approval?.type === "purchase" ? "High-value purchase order" : "Disputed checkout scan";
  const pending = Boolean(approval);

  return (
    <section className={`panel approval-panel ${pending ? "pending" : ""}`} aria-labelledby="approval-title">
      <header className="panel-header">
        <div className="panel-title-group">
          <span className="panel-title-icon"><ShieldCheck size={13} /></span>
          <div><h2 className="panel-title" id="approval-title">Manager approval queue</h2><div className="panel-subtitle">Human-in-the-loop · high-stakes actions held</div></div>
        </div>
        <span className="panel-tag">{pending ? <><Clock3 size={9} /> 1 ACTION HELD</> : <><CircleCheck size={9} /> QUEUE CLEAR</>}</span>
      </header>
      <div className="approval-slot" aria-live="polite">
        {approval?.type === "purchase" && <div className="approval-card">
          <div className="approval-card-top">
            <span className="approval-pulse"><AlertOctagon size={13} /></span>
            <div className="approval-card-heading"><strong>{title}</strong><p>Shelf stockout detected · {approval.decision.request.sku_id}</p></div>
            <span className="approval-cost">{formatRupees(approval.decision.request.estimated_cost_inr)}</span>
          </div>
          <div className="approval-order-meta">
            <span>PO <b>{approval.decision.order_id}</b></span><span>QTY <b>{approval.decision.request.order_quantity} units</b></span><span>SUPPLIER <b>KAVERI</b></span>
          </div>
          <div className="risk-banner"><ShieldAlert size={10} /> {approval.decision.pause_reason ?? "Approval required before supplier dispatch."} &nbsp;·&nbsp; no order sent</div>
          {editingQuantity ? <div className="quantity-editor">
            <label htmlFor="po-quantity">Adjust order quantity<small>Current unit cost: {formatRupees(approval.decision.request.estimated_cost_inr / approval.decision.request.order_quantity)}</small></label>
            <input id="po-quantity" type="number" min={1} max={500} step={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} aria-label="Revised purchase order quantity" />
            <button className="button-primary" onClick={submitQuantity} disabled={saving || !Number.isInteger(quantity) || quantity < 1}>{saving ? "Rechecking…" : "Apply & recheck"}<ChevronRight size={10} /></button>
          </div> : <div className="approval-actions">
            <button className="button-approve" onClick={onApprovePurchase} disabled={isBusy}><PackageCheck size={10} />Approve & Dispatch PO (1-Click)</button>
            <button className="button-secondary" onClick={modifyStart} disabled={isBusy}><SlidersHorizontal size={10} />Modify Quantity</button>
            <button className="button-danger" onClick={onReject} disabled={isBusy}><X size={10} />Reject & Flag</button>
          </div>}
        </div>}
        {approval?.type === "scan" && <div className="approval-card scan">
          <div className="approval-card-top">
            <span className="approval-pulse"><FileWarning size={13} /></span>
            <div className="approval-card-heading"><strong>{title}</strong><p>Barcode and computer-vision item do not agree.</p></div>
            <span className="approval-cost">{Math.round(approval.confidence * 100)}%</span>
          </div>
          <div className="approval-order-meta">
            <span>SCANNED <b>{approval.scannedLabel}</b></span><span>VISUAL <b>{approval.visualLabel}</b></span>
          </div>
          <div className="risk-banner"><ShieldAlert size={10} /> Confidence below 85% · checkout paused · no item charged</div>
          <div className="approval-actions">
            <button className="button-approve" onClick={onApproveScan} disabled={isBusy}><Hand size={10} />Approve Scan Override</button>
            <button className="button-secondary" onClick={onKeepScannedItem} disabled={isBusy}>Keep Scanned Item</button>
            <button className="button-danger" onClick={onReject} disabled={isBusy}><X size={10} />Reject & Flag</button>
          </div>
        </div>}
        {!approval && outcome ? <div className={`approval-outcome ${status === "REJECTED" ? "danger" : "success"}`}><CheckCircle2 size={14} /><span>{outcome}</span></div> : null}
        {!approval && !outcome && <div className="approval-idle">
          <span className="approval-idle-icon"><ShieldCheck size={13} /></span>
          <span><strong>No high-risk action pending</strong><p>Manager decisions will appear here only when a guardrail is triggered.</p></span>
        </div>}
      </div>
    </section>
  );
}
