"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkoutCart, getInitialInventory } from "@/lib/agent/scenarios";
import {
  dispatchAfterHumanApproval,
  detectCheckoutAndShelfState,
  formatRupees,
  generateGstInvoice,
  invoiceToolInput,
  scenarioToolInputs,
  triggerSupplierReorderApi,
  updatePosInventoryDb
} from "@/lib/agent/retailAgent";
import type {
  AgentStatus,
  CameraTelemetry,
  GstInvoice,
  InventoryItem,
  PurchaseOrderDecision,
  ScenarioId,
  TraceEvent,
  TraceTone
} from "@/lib/agent/types";

type PurchaseApproval = { type: "purchase"; decision: PurchaseOrderDecision };
type ScanApproval = {
  type: "scan";
  scannedSku: string;
  scannedLabel: string;
  visualSku: string;
  visualLabel: string;
  confidence: number;
};
type AgentApproval = PurchaseApproval | ScanApproval;

interface DemoState {
  scenario: ScenarioId;
  status: AgentStatus;
  inventory: InventoryItem[];
  telemetry: CameraTelemetry | null;
  events: TraceEvent[];
  approval: AgentApproval | null;
  invoice: GstInvoice | null;
  activeTool: string | null;
  outcome: string | null;
}

interface ScenarioResponse {
  mode: "SIMULATION_ONLY";
  scenario: ScenarioId;
  telemetry: CameraTelemetry;
  scenario_meta: { title: string; description: string; tag: string };
  first_tool_call: { name: string; arguments: Record<string, unknown> };
}

const STORAGE_KEY = "retailens-demo-state-v1";

function createState(scenario: ScenarioId = "A"): DemoState {
  return {
    scenario,
    status: "IDLE",
    inventory: getInitialInventory(),
    telemetry: null,
    events: [],
    approval: null,
    invoice: null,
    activeTool: null,
    outcome: null
  };
}

function formatTime(): string {
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
}

export function useRetailAgent() {
  const [state, setState] = useState<DemoState>(() => createState());
  const [hydrated, setHydrated] = useState(false);
  const generation = useRef(0);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<DemoState>;
        if (Array.isArray(parsed.inventory) && Array.isArray(parsed.events) && ["A", "B", "C"].includes(String(parsed.scenario))) {
          setState({ ...createState(parsed.scenario as ScenarioId), ...parsed });
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const isCurrent = useCallback((runId: number) => generation.current === runId, []);

  const patch = useCallback((runId: number, transform: (current: DemoState) => DemoState) => {
    setState((current) => generation.current === runId ? transform(current) : current);
  }, []);

  const emit = useCallback((runId: number, phase: TraceEvent["phase"], title: string, message: string, tone: TraceTone = "neutral", payload?: unknown) => {
    const event: TraceEvent = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      time: formatTime(), phase, title, message, tone, payload
    };
    patch(runId, (current) => ({ ...current, events: [...current.events, event] }));
  }, [patch]);

  const setStatus = useCallback((runId: number, status: AgentStatus, activeTool: string | null = null) => {
    patch(runId, (current) => ({ ...current, status, activeTool }));
  }, [patch]);

  const runScenario = useCallback(async (scenario: ScenarioId) => {
    const runId = ++generation.current;
    const inventory = getInitialInventory();
    setState({ ...createState(scenario), status: "PERCEIVING" });
    emit(runId, "PERCEIVE", "Frame captured", `Reading a simulated ${scenario === "B" ? "shelf" : "checkout"} camera feed.`, "cyan", { camera: scenarioToolInputs(scenario) });

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario })
      });
      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error ?? "Could not initialize the simulation.");
      }
      const result = await response.json() as ScenarioResponse;
      if (!isCurrent(runId)) return;
      const cameraInput = result.first_tool_call.arguments;
      emit(runId, "TOOL_CALL", "detect_checkout_and_shelf_state", "Tool request validated against its strict schema.", "cyan", cameraInput);
      setStatus(runId, "PERCEIVING", "detect_checkout_and_shelf_state");
      const cameraResult = await detectCheckoutAndShelfState(cameraInput);
      if (!cameraResult.ok || !cameraResult.data) throw new Error(cameraResult.error ?? "Camera telemetry unavailable.");
      if (!isCurrent(runId)) return;
      const telemetry = cameraResult.data;
      patch(runId, (current) => ({ ...current, telemetry }));
      emit(runId, "OBSERVATION", "Vision telemetry received", `${telemetry.detected_skus.length} detected SKU${telemetry.detected_skus.length === 1 ? "" : "s"} · ${Math.round(telemetry.anomaly_confidence * 100)}% confidence · ${cameraResult.latency_ms} ms.`, telemetry.anomaly_flags.length ? "warning" : "success", telemetry);

      if (scenario === "A") {
        setStatus(runId, "REASONING");
        emit(runId, "REASON", "Verified basket · proceed safely", "Visual detections match the checkout basket. No exception flag; low-risk checkout may execute automatically.", "success");
        let nextInventory = inventory;
        for (const line of checkoutCart) {
          const payload = { sku_id: line.sku_id, action_type: "checkout_deduction", quantity_delta: -line.quantity, dynamic_price_override: null };
          emit(runId, "TOOL_CALL", "update_pos_inventory_db", "Deducting a visually verified checkout line from the POS demo inventory.", "cyan", payload);
          setStatus(runId, "EXECUTING", "update_pos_inventory_db");
          const mutation = await updatePosInventoryDb(payload, nextInventory);
          if (!mutation.ok || !mutation.data) throw new Error(mutation.error ?? "POS mutation was not accepted.");
          if (!isCurrent(runId)) return;
          nextInventory = mutation.data.inventory;
          patch(runId, (current) => ({ ...current, inventory: nextInventory }));
          emit(runId, "OBSERVATION", "Inventory row updated", `${mutation.data.item.name}: ${mutation.data.item.stock} units remain.`, "success", { sku_id: line.sku_id, stock: mutation.data.item.stock, latency_ms: mutation.latency_ms });
        }

        const invoiceInput = invoiceToolInput();
        emit(runId, "TOOL_CALL", "generate_gst_invoice", "Calculating a simulated digital receipt with CGST/SGST splits by HSN.", "cyan", invoiceInput);
        setStatus(runId, "EXECUTING", "generate_gst_invoice");
        const invoiceResult = await generateGstInvoice(invoiceInput);
        if (!invoiceResult.ok || !invoiceResult.data) throw new Error(invoiceResult.error ?? "Invoice generation failed.");
        if (!isCurrent(runId)) return;
        patch(runId, (current) => ({ ...current, invoice: invoiceResult.data ?? null }));
        emit(runId, "OBSERVATION", "Mock GST receipt ready", `${invoiceResult.data.invoice_id} · ${formatRupees(invoiceResult.data.total)} including CGST and SGST. No payment was initiated.`, "success", { invoice_id: invoiceResult.data.invoice_id, subtotal: invoiceResult.data.subtotal, cgst: invoiceResult.data.cgst_total, sgst: invoiceResult.data.sgst_total, total: invoiceResult.data.total, upi_payload: invoiceResult.data.upi_payload, latency_ms: invoiceResult.latency_ms });
        setStatus(runId, "COMPLETED");
        patch(runId, (current) => ({ ...current, outcome: "Checkout reconciled · invoice simulated · no live payment." }));
        emit(runId, "GUARDRAIL", "Execution complete", "All changes stayed within the low-risk checkout policy.", "success");
        return;
      }

      if (scenario === "B") {
        setStatus(runId, "REASONING");
        emit(runId, "REASON", "Shelf anomalies confirmed · protect margin", "Critical stockout and a misplaced SKU detected. Flag the 2-day expiry batch for a markdown, then evaluate a supplier PO against manager guardrails.", "warning", { shelf_stock_percent: telemetry.shelf_stock_percent, anomaly_flags: telemetry.anomaly_flags });
        const markdown = { sku_id: "SKU-YOG-019", action_type: "markdown", quantity_delta: 0, dynamic_price_override: 99.2 };
        emit(runId, "TOOL_CALL", "update_pos_inventory_db", "Applying a 20% near-expiry markdown to the three-unit batch in the local demo POS.", "cyan", markdown);
        setStatus(runId, "EXECUTING", "update_pos_inventory_db");
        const markdownResult = await updatePosInventoryDb(markdown, inventory);
        if (!markdownResult.ok || !markdownResult.data) throw new Error(markdownResult.error ?? "Markdown was not accepted.");
        if (!isCurrent(runId)) return;
        const nextInventory = markdownResult.data.inventory;
        patch(runId, (current) => ({ ...current, inventory: nextInventory }));
        emit(runId, "OBSERVATION", "Markdown applied in simulation", "Clover Greek Yogurt marked down 20% for a batch expiring in 2 days.", "success", { sku_id: "SKU-YOG-019", old_price: 124, new_price: 99.2, affected_units: 3, latency_ms: markdownResult.latency_ms });

        const request = { sku_id: "SKU-OLV-088", supplier_id: "SUP-KAVERI-014", order_quantity: 50, estimated_cost_inr: 24500, urgency_level: "CRITICAL", anomaly_confidence: telemetry.anomaly_confidence };
        emit(runId, "TOOL_CALL", "trigger_supplier_reorder_api", "Validating the proposed purchase order. The mock tool cannot bypass the manager threshold.", "cyan", request);
        setStatus(runId, "EXECUTING", "trigger_supplier_reorder_api");
        const poResult = await triggerSupplierReorderApi(request);
        if (!poResult.ok || !poResult.data) throw new Error(poResult.error ?? "Supplier order could not be evaluated.");
        if (!isCurrent(runId)) return;
        if (poResult.data.status === "AWAITING_HUMAN_APPROVAL") {
          patch(runId, (current) => ({ ...current, approval: { type: "purchase", decision: poResult.data! }, status: "AWAITING_HUMAN_APPROVAL", activeTool: null }));
          emit(runId, "GUARDRAIL", "Supplier dispatch intercepted", `${formatRupees(request.estimated_cost_inr)} exceeds ₹10,000. No order has been sent; manager approval is required.`, "danger", { status: poResult.data.status, order_id: poResult.data.order_id, amount_inr: request.estimated_cost_inr, confidence: request.anomaly_confidence, latency_ms: poResult.latency_ms });
        } else {
          setStatus(runId, "COMPLETED");
        }
        return;
      }

      setStatus(runId, "REASONING");
      const scanned = telemetry.detected_skus[0];
      const visual = telemetry.detected_skus[1];
      emit(runId, "REASON", "Conflicting evidence · stop checkout", "Barcode and visual product evidence do not agree. At 71% confidence, a human must resolve the disputed line before POS mutation.", "danger", { anomaly: "SCAN_MISMATCH", confidence: telemetry.anomaly_confidence, scanned_sku: scanned.sku_id, visual_sku: visual.sku_id });
      patch(runId, (current) => ({ ...current, status: "AWAITING_HUMAN_APPROVAL", approval: { type: "scan", scannedSku: scanned.sku_id, scannedLabel: scanned.label, visualSku: visual.sku_id, visualLabel: visual.label, confidence: telemetry.anomaly_confidence } }));
      emit(runId, "GUARDRAIL", "Checkout override intercepted", "The disputed scan remains uncharged. Manager confirmation is required before changing the basket.", "danger");
    } catch (error) {
      if (!isCurrent(runId)) return;
      const message = error instanceof Error ? error.message : "The demo scenario could not be completed.";
      emit(runId, "GUARDRAIL", "Execution stopped safely", message, "danger");
      patch(runId, (current) => ({ ...current, status: "REJECTED", activeTool: null, outcome: message }));
    }
  }, [emit, isCurrent, patch, setStatus]);

  const chooseScenario = useCallback((scenario: ScenarioId) => {
    if (["PERCEIVING", "REASONING", "EXECUTING", "AWAITING_HUMAN_APPROVAL"].includes(state.status) || state.approval) return;
    generation.current += 1;
    setState(createState(scenario));
  }, [state.approval, state.status]);

  const resetDemo = useCallback(() => {
    if (["PERCEIVING", "REASONING", "EXECUTING", "AWAITING_HUMAN_APPROVAL"].includes(state.status) || state.approval) return;
    generation.current += 1;
    setState(createState(state.scenario));
  }, [state.approval, state.scenario, state.status]);

  const appendHumanEvent = useCallback((title: string, message: string, tone: TraceTone, payload?: unknown) => {
    setState((current) => ({
      ...current,
      events: [...current.events, { id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, time: formatTime(), phase: "HUMAN", title, message, tone, payload }]
    }));
  }, []);

  const approvePurchaseOrder = useCallback(() => {
    const approval = state.approval;
    if (!approval || approval.type !== "purchase") return;
    emit(generation.current, "TOOL_CALL", "trigger_supplier_reorder_api · manager-approved", "Manager confirmation resumes the paused supplier handoff.", "cyan", approval.decision.request);
    const dispatched = dispatchAfterHumanApproval(approval.decision);
    setState((current) => ({ ...current, approval: null, status: "COMPLETED", activeTool: null, outcome: "Manager approved the simulated supplier dispatch." }));
    appendHumanEvent("Manager approved dispatch", `${dispatched.order_id} approved · ${formatRupees(dispatched.request.estimated_cost_inr)} · simulated only.`, "success", dispatched);
    appendHumanEvent("Agent resumed", "PO handoff completed in the simulation. Inventory remains unchanged until a simulated delivery arrives.", "success");
    emit(generation.current, "OBSERVATION", "Simulated supplier handoff complete", "Approval resumed the agent. No real supplier endpoint was called.", "success", dispatched);
  }, [appendHumanEvent, emit, state.approval]);

  const reEvaluatePurchaseOrder = useCallback(async (quantity: number) => {
    const approval = state.approval;
    if (!approval || approval.type !== "purchase") return;
    const request = approval.decision.request;
    const unitCost = request.estimated_cost_inr / request.order_quantity;
    const modified = { ...request, order_quantity: quantity, estimated_cost_inr: Math.round(unitCost * quantity * 100) / 100 };
    const runId = generation.current;
    appendHumanEvent("Manager modified quantity", `Updated PO to ${quantity} units · ${formatRupees(modified.estimated_cost_inr)}. Rechecking the threshold.`, "warning", modified);
    emit(runId, "TOOL_CALL", "trigger_supplier_reorder_api · revised quantity", "Re-evaluating the revised order against the same confidence and cost thresholds.", "cyan", modified);
    setStatus(runId, "EXECUTING", "trigger_supplier_reorder_api");
    const result = await triggerSupplierReorderApi(modified);
    if (!result.ok || !result.data) {
      setStatus(runId, "AWAITING_HUMAN_APPROVAL");
      appendHumanEvent("PO recheck failed", result.error ?? "Could not evaluate the revised quantity.", "danger");
      return;
    }
    if (result.data.status === "AWAITING_HUMAN_APPROVAL") {
      setState((current) => ({ ...current, approval: { type: "purchase", decision: result.data! }, status: "AWAITING_HUMAN_APPROVAL", activeTool: null }));
      appendHumanEvent("Manager review still required", `${formatRupees(modified.estimated_cost_inr)} remains above the ₹10,000 guardrail.`, "danger", result.data);
      return;
    }
    setState((current) => ({ ...current, approval: null, status: "COMPLETED", activeTool: null, outcome: "Modified quantity fell within the guardrail and the mock PO auto-dispatched." }));
    appendHumanEvent("Re-evaluated order released", `${formatRupees(modified.estimated_cost_inr)} is within the ₹10,000 cap; the simulated PO was released.`, "success", result.data);
  }, [appendHumanEvent, emit, setStatus, state.approval]);

  const rejectAction = useCallback(() => {
    if (!state.approval) return;
    const message = state.approval.type === "purchase" ? "Supplier PO rejected and flagged. No order was dispatched." : "Checkout dispute rejected and flagged. No POS override was made.";
    setState((current) => ({ ...current, approval: null, status: "REJECTED", activeTool: null, outcome: message }));
    appendHumanEvent("Manager rejected & flagged", message, "danger");
  }, [appendHumanEvent, state.approval]);

  const approveScanOverride = useCallback(async () => {
    const approval = state.approval;
    if (!approval || approval.type !== "scan") return;
    const runId = generation.current;
    const payload = { sku_id: approval.visualSku, action_type: "scan_override", quantity_delta: -1, dynamic_price_override: null };
    appendHumanEvent("Manager approved item override", `Using visual match ${approval.visualSku} for this one checkout.`, "warning", payload);
    emit(runId, "TOOL_CALL", "update_pos_inventory_db · manager-approved", "Applying the one-time scan override after manager confirmation.", "cyan", payload);
    setStatus(runId, "EXECUTING", "update_pos_inventory_db");
    const result = await updatePosInventoryDb(payload, state.inventory);
    if (!result.ok || !result.data) {
      setStatus(runId, "AWAITING_HUMAN_APPROVAL");
      appendHumanEvent("Override was not applied", result.error ?? "POS safety check rejected this override.", "danger");
      return;
    }
    setState((current) => ({ ...current, inventory: result.data!.inventory, approval: null, status: "COMPLETED", activeTool: null, outcome: "Manager-confirmed scan override completed in the simulation." }));
    appendHumanEvent("POS item reconciled", `${result.data.item.name} inventory updated · ${result.data.item.stock} units remain.`, "success", { sku: result.data.item.sku, stock: result.data.item.stock, latency_ms: result.latency_ms });
    emit(runId, "OBSERVATION", "POS override simulated", `${result.data.item.name}: ${result.data.item.stock} units remain.`, "success", { sku_id: result.data.item.sku, stock: result.data.item.stock, latency_ms: result.latency_ms });
  }, [appendHumanEvent, emit, setStatus, state.approval, state.inventory]);

  const keepScannedItem = useCallback(() => {
    const approval = state.approval;
    if (!approval || approval.type !== "scan") return;
    setState((current) => ({ ...current, approval: null, status: "COMPLETED", activeTool: null, outcome: "Manager retained the scanned SKU; no override was made." }));
    appendHumanEvent("Manager kept scanned SKU", `No visual override performed. Scanned item ${approval.scannedSku} was retained for cashier review.`, "success");
  }, [appendHumanEvent, state.approval]);

  const isBusy = ["PERCEIVING", "REASONING", "EXECUTING"].includes(state.status);
  const hasPendingApproval = state.approval !== null;

  return {
    ...state,
    isBusy,
    hasPendingApproval,
    runScenario,
    chooseScenario,
    resetDemo,
    approvePurchaseOrder,
    reEvaluatePurchaseOrder,
    rejectAction,
    approveScanOverride,
    keepScannedItem
  };
}
