import type { CameraTelemetry, CartLine, InventoryItem, PurchaseOrderRequest, ScenarioId } from "@/lib/agent/types";

export const initialInventory: InventoryItem[] = [
  { sku: "SKU-COF-016", name: "Monsoon Reserve Coffee", category: "Coffee", aisle: "A-01", stock: 34, minimum: 12, price: 620, status: "healthy", hsnCode: "0901", gstRate: 5, accent: "amber" },
  { sku: "SKU-MLK-204", name: "Hill Farm Whole Milk", category: "Dairy", aisle: "C-02", stock: 7, minimum: 10, price: 78, status: "low", hsnCode: "0401", gstRate: 5, accent: "cyan" },
  { sku: "SKU-OLV-088", name: "Cold Pressed Olive Oil", category: "Pantry", aisle: "B-04", stock: 0, minimum: 8, price: 490, status: "critical", hsnCode: "1509", gstRate: 5, accent: "coral" },
  { sku: "SKU-MIL-902", name: "Millet & Sea Salt Bites", category: "Snacks", aisle: "D-03", stock: 21, minimum: 9, price: 168, previousPrice: 210, discount: 20, status: "markdown", hsnCode: "1904", gstRate: 12, accent: "lime" },
  { sku: "SKU-TEA-332", name: "Wild Citrus Green Tea", category: "Tea", aisle: "A-03", stock: 15, minimum: 8, price: 284, status: "healthy", hsnCode: "0902", gstRate: 5, accent: "lime" },
  { sku: "SKU-YOG-019", name: "Clover Greek Yogurt", category: "Dairy", aisle: "C-01", stock: 4, minimum: 8, price: 124, previousPrice: 155, discount: 20, status: "markdown", hsnCode: "0403", gstRate: 5, accent: "cyan" }
];

export const scenarioMeta: Record<ScenarioId, { title: string; shortTitle: string; eyebrow: string; description: string; tag: string }> = {
  A: { title: "Frictionless checkout", shortTitle: "Frictionless checkout", eyebrow: "SCENARIO A", description: "Verified basket → POS sync → GST receipt", tag: "AUTONOMOUS" },
  B: { title: "Critical shelf stockout", shortTitle: "Shelf stockout", eyebrow: "SCENARIO B", description: "Empty shelf → ₹24,500 PO → manager pause", tag: "HITL REQUIRED" },
  C: { title: "Checkout scan dispute", shortTitle: "Scan anomaly", eyebrow: "SCENARIO C", description: "Visual/barcode mismatch → safe override pause", tag: "DISPUTED SCAN" }
};

export const scenarioTelemetry: Record<ScenarioId, Omit<CameraTelemetry, "captured_at">> = {
  A: {
    camera_id: "CAM-CHK-04",
    zone_type: "CHECKOUT",
    shelf_stock_percent: 86,
    detected_skus: [
      { sku_id: "SKU-COF-016", label: "Reserve coffee", confidence: 0.98, box: { x: 20, y: 37, width: 24, height: 39 } },
      { sku_id: "SKU-MLK-204", label: "Whole milk ×2", confidence: 0.96, box: { x: 53, y: 31, width: 23, height: 42 } }
    ],
    expiry_batch_flags: [],
    anomaly_flags: [],
    anomaly_confidence: 0.98,
    note: "Basket and barcode sequence agree. No checkout discrepancy."
  },
  B: {
    camera_id: "CAM-SHL-12",
    zone_type: "SHELF",
    shelf_stock_percent: 4,
    detected_skus: [
      { sku_id: "SKU-OLV-088", label: "Olive oil · shelf gap", confidence: 0.93, box: { x: 58, y: 23, width: 27, height: 56 } },
      { sku_id: "SKU-MIL-902", label: "Millet bites · misplaced", confidence: 0.89, box: { x: 19, y: 61, width: 24, height: 28 } }
    ],
    expiry_batch_flags: [{ sku_id: "SKU-YOG-019", days_to_expiry: 2, affected_units: 3 }],
    anomaly_flags: ["CRITICAL_STOCKOUT", "NEAR_EXPIRY_SURPLUS", "MISPLACED_ITEM"],
    anomaly_confidence: 0.92,
    note: "Critical shelf gap and a misplaced SKU. Reorder proposal exceeds the ₹10,000 approval cap."
  },
  C: {
    camera_id: "CAM-CHK-09",
    zone_type: "CHECKOUT",
    shelf_stock_percent: 71,
    detected_skus: [
      { sku_id: "SKU-MLK-204", label: "Scanned: Whole milk", confidence: 0.99, box: { x: 25, y: 33, width: 28, height: 44 } },
      { sku_id: "SKU-TEA-332", label: "Seen: Citrus tea", confidence: 0.71, box: { x: 56, y: 28, width: 26, height: 45 } }
    ],
    expiry_batch_flags: [],
    anomaly_flags: ["SCAN_MISMATCH"],
    anomaly_confidence: 0.71,
    note: "Camera appearance and scanned SKU differ. Human check is required before override."
  }
};

export const checkoutCart: CartLine[] = [
  { sku_id: "SKU-COF-016", item_name: "Monsoon Reserve Coffee", quantity: 1, unit_price: 620, hsn_code: "0901", gst_rate: 5 },
  { sku_id: "SKU-MLK-204", item_name: "Hill Farm Whole Milk", quantity: 2, unit_price: 78, hsn_code: "0401", gst_rate: 5 }
];

export const supplierOrder: PurchaseOrderRequest = {
  sku_id: "SKU-OLV-088",
  supplier_id: "SUP-KAVERI-014",
  order_quantity: 50,
  estimated_cost_inr: 24500,
  urgency_level: "CRITICAL",
  anomaly_confidence: 0.92
};

export function getScenarioTelemetry(scenario: ScenarioId): CameraTelemetry {
  return { ...scenarioTelemetry[scenario], captured_at: new Date().toISOString() };
}

export function getInitialInventory(): InventoryItem[] {
  return initialInventory.map((item) => ({ ...item }));
}
