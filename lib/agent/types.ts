export type ScenarioId = "A" | "B" | "C";
export type AgentStatus = "IDLE" | "PERCEIVING" | "REASONING" | "EXECUTING" | "AWAITING_HUMAN_APPROVAL" | "COMPLETED" | "REJECTED";
export type ZoneType = "CHECKOUT" | "SHELF";
export type ToolName = "detect_checkout_and_shelf_state" | "update_pos_inventory_db" | "generate_gst_invoice" | "trigger_supplier_reorder_api";
export type TraceTone = "neutral" | "success" | "warning" | "danger" | "cyan";
export type AnomalyFlag = "SCAN_MISMATCH" | "CRITICAL_STOCKOUT" | "NEAR_EXPIRY_SURPLUS" | "MISPLACED_ITEM";

export interface InventoryItem {
  sku: string;
  name: string;
  category: string;
  aisle: string;
  stock: number;
  minimum: number;
  price: number;
  previousPrice?: number;
  discount?: number;
  status: "healthy" | "low" | "critical" | "markdown";
  hsnCode: string;
  gstRate: number;
  accent: "lime" | "cyan" | "amber" | "coral";
}

export interface DetectedSku {
  sku_id: string;
  label: string;
  confidence: number;
  box: { x: number; y: number; width: number; height: number };
}

export interface CameraTelemetry {
  camera_id: string;
  zone_type: ZoneType;
  captured_at: string;
  shelf_stock_percent: number;
  detected_skus: DetectedSku[];
  expiry_batch_flags: Array<{ sku_id: string; days_to_expiry: number; affected_units: number }>;
  anomaly_flags: AnomalyFlag[];
  anomaly_confidence: number;
  note: string;
}

export interface CartLine {
  sku_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  hsn_code: string;
  gst_rate: number;
}

export interface InvoiceLine extends CartLine {
  line_subtotal: number;
  cgst: number;
  sgst: number;
  line_total: number;
}

export interface GstInvoice {
  invoice_id: string;
  generated_at: string;
  customer_upi_id: string;
  line_items: InvoiceLine[];
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  total: number;
  upi_payload: string;
  simulation_only: true;
}

export interface PurchaseOrderRequest {
  sku_id: string;
  supplier_id: string;
  order_quantity: number;
  estimated_cost_inr: number;
  urgency_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  anomaly_confidence: number;
}

export interface PurchaseOrderDecision {
  status: "AWAITING_HUMAN_APPROVAL" | "DISPATCHED_SIMULATED" | "REJECTED_FLAGGED";
  order_id: string;
  request: PurchaseOrderRequest;
  pause_reason?: string;
}

export interface TraceEvent {
  id: string;
  time: string;
  phase: "PERCEIVE" | "REASON" | "TOOL_CALL" | "OBSERVATION" | "GUARDRAIL" | "HUMAN";
  title: string;
  message: string;
  tone: TraceTone;
  payload?: unknown;
}

export interface ToolRunResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  latency_ms: number;
}
