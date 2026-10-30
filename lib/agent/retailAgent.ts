import { checkoutCart, getScenarioTelemetry } from "@/lib/agent/scenarios";
import type {
  CameraTelemetry,
  CartLine,
  GstInvoice,
  InventoryItem,
  PurchaseOrderDecision,
  PurchaseOrderRequest,
  ScenarioId,
  ToolRunResult
} from "@/lib/agent/types";

export const toolSchemas = {
  detect_checkout_and_shelf_state: {
    type: "object",
    additionalProperties: false,
    properties: {
      camera_id: { type: "string", minLength: 1 },
      zone_type: { type: "string", enum: ["CHECKOUT", "SHELF"] }
    },
    required: ["camera_id", "zone_type"]
  },
  update_pos_inventory_db: {
    type: "object",
    additionalProperties: false,
    properties: {
      sku_id: { type: "string", minLength: 1 },
      action_type: { type: "string", enum: ["checkout_deduction", "shelf_restock", "markdown", "scan_override"] },
      quantity_delta: { type: "integer" },
      dynamic_price_override: { type: ["number", "null"], minimum: 0 }
    },
    required: ["sku_id", "action_type", "quantity_delta", "dynamic_price_override"]
  },
  generate_gst_invoice: {
    type: "object",
    additionalProperties: false,
    properties: {
      cart_items: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            sku_id: { type: "string", minLength: 1 },
            item_name: { type: "string", minLength: 1 },
            quantity: { type: "integer", minimum: 1 },
            unit_price: { type: "number", minimum: 0 },
            hsn_code: { type: "string", minLength: 1 },
            gst_rate: { type: "number", minimum: 0, maximum: 40 }
          },
          required: ["sku_id", "item_name", "quantity", "unit_price", "hsn_code", "gst_rate"]
        }
      },
      customer_upi_id: { type: "string", minLength: 3 },
      tax_Breakdown: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            hsn_code: { type: "string", minLength: 1 },
            gst_rate: { type: "number", minimum: 0, maximum: 40 }
          },
          required: ["hsn_code", "gst_rate"]
        }
      }
    },
    required: ["cart_items", "customer_upi_id", "tax_Breakdown"]
  },
  trigger_supplier_reorder_api: {
    type: "object",
    additionalProperties: false,
    properties: {
      sku_id: { type: "string", minLength: 1 },
      supplier_id: { type: "string", minLength: 1 },
      order_quantity: { type: "integer", minimum: 1 },
      estimated_cost_inr: { type: "number", minimum: 0 },
      urgency_level: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
      anomaly_confidence: { type: "number", minimum: 0, maximum: 1 }
    },
    required: ["sku_id", "supplier_id", "order_quantity", "estimated_cost_inr", "urgency_level", "anomaly_confidence"]
  }
} as const;

export type InventoryMutation = {
  item: InventoryItem;
  inventory: InventoryItem[];
  delta: number;
};

const latencyByTool = {
  detect_checkout_and_shelf_state: 480,
  update_pos_inventory_db: 390,
  generate_gst_invoice: 620,
  trigger_supplier_reorder_api: 720
} as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} must be a non-empty string.`);
  }
  return value.trim();
}

function requireNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${key} must be a finite number.`);
  }
  return value;
}

function requireEnum<T extends string>(record: Record<string, unknown>, key: string, values: readonly T[]): T {
  const value = record[key];
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw new Error(`${key} must be one of ${values.join(", ")}.`);
  }
  return value as T;
}

function validateCart(value: unknown): CartLine[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error("cart_items must contain at least one item.");
  return value.map((entry, index) => {
    if (!isRecord(entry)) throw new Error(`cart_items[${index}] must be an object.`);
    const sku_id = requireString(entry, "sku_id");
    const item_name = requireString(entry, "item_name");
    const quantity = requireNumber(entry, "quantity");
    const unit_price = requireNumber(entry, "unit_price");
    const hsn_code = requireString(entry, "hsn_code");
    const gst_rate = requireNumber(entry, "gst_rate");
    if (!Number.isInteger(quantity) || quantity <= 0 || unit_price < 0 || gst_rate < 0 || gst_rate > 40) {
      throw new Error(`cart_items[${index}] contains an invalid quantity, price, or tax rate.`);
    }
    return { sku_id, item_name, quantity, unit_price, hsn_code, gst_rate };
  });
}

export async function detectCheckoutAndShelfState(input: unknown): Promise<ToolRunResult<CameraTelemetry>> {
  const start = Date.now();
  try {
    if (!isRecord(input)) throw new Error("Tool arguments must be a JSON object.");
    const camera_id = requireString(input, "camera_id");
    const zone_type = requireEnum(input, "zone_type", ["CHECKOUT", "SHELF"] as const);
    const scenarioByCamera: Record<string, ScenarioId> = {
      "CAM-CHK-04": "A",
      "CAM-SHL-12": "B",
      "CAM-CHK-09": "C"
    };
    const scenario = scenarioByCamera[camera_id];
    if (!scenario) throw new Error(`Unknown simulated camera ${camera_id}.`);
    const expectedZone = getScenarioTelemetry(scenario).zone_type;
    if (zone_type !== expectedZone) throw new Error(`Camera ${camera_id} does not belong to the ${zone_type} zone.`);
    await sleep(latencyByTool.detect_checkout_and_shelf_state);
    return { ok: true, data: getScenarioTelemetry(scenario), latency_ms: Date.now() - start };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Vision tool failed.", latency_ms: Date.now() - start };
  }
}

export async function updatePosInventoryDb(input: unknown, currentInventory: InventoryItem[]): Promise<ToolRunResult<InventoryMutation>> {
  const start = Date.now();
  try {
    if (!isRecord(input)) throw new Error("Tool arguments must be a JSON object.");
    const sku_id = requireString(input, "sku_id");
    const action_type = requireEnum(input, "action_type", ["checkout_deduction", "shelf_restock", "markdown", "scan_override"] as const);
    const quantity_delta = requireNumber(input, "quantity_delta");
    const override = input.dynamic_price_override;
    if (!Number.isInteger(quantity_delta)) throw new Error("quantity_delta must be an integer.");
    if (override !== null && (typeof override !== "number" || !Number.isFinite(override) || override < 0)) {
      throw new Error("dynamic_price_override must be a non-negative number or null.");
    }
    const index = currentInventory.findIndex((item) => item.sku === sku_id);
    if (index < 0) throw new Error(`SKU ${sku_id} is not present in the POS demo inventory.`);
    if ((action_type === "checkout_deduction" || action_type === "scan_override") && quantity_delta > 0) {
      throw new Error(`${action_type} requires quantity_delta to be zero or negative.`);
    }
    if (action_type === "shelf_restock" && quantity_delta < 0) {
      throw new Error("shelf_restock requires a non-negative quantity_delta.");
    }
    const existing = currentInventory[index];
    const nextStock = existing.stock + quantity_delta;
    if (nextStock < 0) throw new Error(`Stock guardrail prevented a negative inventory balance for ${sku_id}.`);
    await sleep(latencyByTool.update_pos_inventory_db);
    const item: InventoryItem = {
      ...existing,
      stock: nextStock,
      price: override === null ? existing.price : override as number,
      previousPrice: override === null ? existing.previousPrice : existing.price,
      discount: override === null ? existing.discount : existing.price > 0 ? Math.max(0, Math.round((1 - (override as number) / existing.price) * 100)) : 0,
      status: nextStock === 0 ? "critical" : nextStock < existing.minimum ? "low" : override !== null ? "markdown" : "healthy"
    };
    const inventory = currentInventory.map((row, rowIndex) => rowIndex === index ? item : row);
    return { ok: true, data: { item, inventory, delta: quantity_delta }, latency_ms: Date.now() - start };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "POS inventory tool failed.", latency_ms: Date.now() - start };
  }
}

export async function generateGstInvoice(input: unknown): Promise<ToolRunResult<GstInvoice>> {
  const start = Date.now();
  try {
    if (!isRecord(input)) throw new Error("Tool arguments must be a JSON object.");
    const cart_items = validateCart(input.cart_items);
    const customer_upi_id = requireString(input, "customer_upi_id");
    const taxRows = input.tax_Breakdown;
    if (!Array.isArray(taxRows) || taxRows.length === 0) throw new Error("tax_Breakdown must include at least one HSN tax row.");
    const rates = new Map<string, number>();
    for (const [index, row] of taxRows.entries()) {
      if (!isRecord(row)) throw new Error(`tax_Breakdown[${index}] must be an object.`);
      const hsn_code = requireString(row, "hsn_code");
      const gst_rate = requireNumber(row, "gst_rate");
      if (gst_rate < 0 || gst_rate > 40) throw new Error(`Invalid GST rate for HSN ${hsn_code}.`);
      rates.set(hsn_code, gst_rate);
    }
    for (const line of cart_items) {
      if (!rates.has(line.hsn_code)) throw new Error(`No tax rate was supplied for HSN ${line.hsn_code}.`);
      if (rates.get(line.hsn_code) !== line.gst_rate) throw new Error(`Tax breakdown mismatch for HSN ${line.hsn_code}.`);
    }
    await sleep(latencyByTool.generate_gst_invoice);
    const line_items = cart_items.map((line): GstInvoice["line_items"][number] => {
      const line_subtotal = roundMoney(line.quantity * line.unit_price);
      const totalTax = roundMoney(line_subtotal * (rates.get(line.hsn_code) ?? 0) / 100);
      const cgst = roundMoney(totalTax / 2);
      const sgst = roundMoney(totalTax - cgst);
      return { ...line, line_subtotal, cgst, sgst, line_total: roundMoney(line_subtotal + cgst + sgst) };
    });
    const subtotal = roundMoney(line_items.reduce((sum, line) => sum + line.line_subtotal, 0));
    const cgst_total = roundMoney(line_items.reduce((sum, line) => sum + line.cgst, 0));
    const sgst_total = roundMoney(line_items.reduce((sum, line) => sum + line.sgst, 0));
    const total = roundMoney(subtotal + cgst_total + sgst_total);
    const invoice_id = `RL-SIM-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${String(Date.now()).slice(-4)}`;
    const upi_payload = `upi://pay?pa=${encodeURIComponent(customer_upi_id)}&pn=RetaiLens%20Market&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Simulated invoice ${invoice_id}`)}`;
    return {
      ok: true,
      data: { invoice_id, generated_at: new Date().toISOString(), customer_upi_id, line_items, subtotal, cgst_total, sgst_total, total, upi_payload, simulation_only: true },
      latency_ms: Date.now() - start
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "GST invoice tool failed.", latency_ms: Date.now() - start };
  }
}

export async function triggerSupplierReorderApi(input: unknown): Promise<ToolRunResult<PurchaseOrderDecision>> {
  const start = Date.now();
  try {
    if (!isRecord(input)) throw new Error("Tool arguments must be a JSON object.");
    const request = validatePurchaseOrder(input);
    await sleep(latencyByTool.trigger_supplier_reorder_api);
    const order_id = `PO-SIM-${String(Date.now()).slice(-6)}`;
    const requiresApproval = request.estimated_cost_inr > 10000 || request.anomaly_confidence < 0.85;
    const pause_reason = request.estimated_cost_inr > 10000
      ? `Estimated cost ${formatRupees(request.estimated_cost_inr)} exceeds the ₹10,000 manager approval limit.`
      : request.anomaly_confidence < 0.85
        ? `Anomaly confidence ${(request.anomaly_confidence * 100).toFixed(0)}% is below the 85% safety threshold.`
        : undefined;
    return {
      ok: true,
      data: { status: requiresApproval ? "AWAITING_HUMAN_APPROVAL" : "DISPATCHED_SIMULATED", order_id, request, pause_reason },
      latency_ms: Date.now() - start
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Supplier reorder tool failed.", latency_ms: Date.now() - start };
  }
}

export function dispatchAfterHumanApproval(decision: PurchaseOrderDecision, orderQuantity = decision.request.order_quantity): PurchaseOrderDecision {
  if (decision.status !== "AWAITING_HUMAN_APPROVAL") throw new Error("No supplier purchase order is awaiting manager approval.");
  if (!Number.isInteger(orderQuantity) || orderQuantity < 1) throw new Error("The approved order quantity must be at least one unit.");
  const unitCost = decision.request.estimated_cost_inr / decision.request.order_quantity;
  return {
    ...decision,
    status: "DISPATCHED_SIMULATED",
    request: { ...decision.request, order_quantity: orderQuantity, estimated_cost_inr: roundMoney(unitCost * orderQuantity) },
    pause_reason: undefined
  };
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatRupees(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value);
}

function validatePurchaseOrder(input: Record<string, unknown>): PurchaseOrderRequest {
  const sku_id = requireString(input, "sku_id");
  const supplier_id = requireString(input, "supplier_id");
  const order_quantity = requireNumber(input, "order_quantity");
  const estimated_cost_inr = requireNumber(input, "estimated_cost_inr");
  const urgency_level = requireEnum(input, "urgency_level", ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const);
  const anomaly_confidence = requireNumber(input, "anomaly_confidence");
  if (!Number.isInteger(order_quantity) || order_quantity < 1) throw new Error("order_quantity must be a positive integer.");
  if (estimated_cost_inr < 0) throw new Error("estimated_cost_inr must be non-negative.");
  if (anomaly_confidence < 0 || anomaly_confidence > 1) throw new Error("anomaly_confidence must be between 0 and 1.");
  return { sku_id, supplier_id, order_quantity, estimated_cost_inr, urgency_level, anomaly_confidence };
}

export function scenarioToolInputs(scenario: ScenarioId): Record<string, unknown> {
  if (scenario === "A") return { camera_id: "CAM-CHK-04", zone_type: "CHECKOUT" };
  if (scenario === "B") return { camera_id: "CAM-SHL-12", zone_type: "SHELF" };
  return { camera_id: "CAM-CHK-09", zone_type: "CHECKOUT" };
}

export function invoiceToolInput(): Record<string, unknown> {
  const tax_Breakdown = Array.from(new Map(checkoutCart.map((line) => [line.hsn_code, { hsn_code: line.hsn_code, gst_rate: line.gst_rate }])).values());
  return { cart_items: checkoutCart, customer_upi_id: "store.demo@upi", tax_Breakdown };
}
