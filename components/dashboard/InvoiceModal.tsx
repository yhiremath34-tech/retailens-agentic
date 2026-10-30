"use client";

import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";
import { formatRupees } from "@/lib/agent/retailAgent";
import type { GstInvoice } from "@/lib/agent/types";

export function InvoiceModal({ invoice, onClose }: { invoice: GstInvoice | null; onClose: () => void }) {
  if (!invoice) return null;
  const timestamp = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(invoice.generated_at));
  return <div className="invoice-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="presentation">
    <section className="invoice-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-title">
      <header className="invoice-modal-head">
        <div><h2 id="invoice-title">Digital tax receipt</h2><p>Simulated GST invoice · RetaiLens demo market</p></div>
        <button className="icon-button" onClick={onClose} aria-label="Close invoice"><X size={14} /></button>
      </header>
      <div className="invoice-sim-banner">Simulation only — this is not a tax invoice and does not initiate a UPI payment. Tax is demonstrative and uses the mock HSN rates shown.</div>
      <div className="invoice-id-row"><span>INVOICE <strong>{invoice.invoice_id}</strong></span><span>{timestamp} IST</span></div>
      <div className="invoice-id-row" style={{ borderBottom: 0, paddingTop: 8, paddingBottom: 0 }}><span>MERCHANT UPI <strong>{invoice.customer_upi_id}</strong></span><span>GST SPLIT BY HSN</span></div>
      <table className="invoice-lines">
        <thead><tr><th>Product</th><th>Qty</th><th>HSN · GST</th><th>CGST</th><th>SGST</th><th>Total</th></tr></thead>
        <tbody>{invoice.line_items.map((line) => <tr key={line.sku_id}>
          <td>{line.item_name}</td><td>{line.quantity}</td><td>{line.hsn_code} · {line.gst_rate}%</td><td>{formatRupees(line.cgst)}</td><td>{formatRupees(line.sgst)}</td><td>{formatRupees(line.line_total)}</td>
        </tr>)}</tbody>
      </table>
      <div className="invoice-totals">
        <div><span>Taxable subtotal</span><strong>{formatRupees(invoice.subtotal)}</strong></div>
        <div><span>CGST</span><strong>{formatRupees(invoice.cgst_total)}</strong></div>
        <div><span>SGST</span><strong>{formatRupees(invoice.sgst_total)}</strong></div>
        <div className="grand"><span>Mock total</span><strong>{formatRupees(invoice.total)}</strong></div>
      </div>
      <div className="upi-row">
        <div className="upi-qr"><QRCodeSVG value={invoice.upi_payload} size={86} level="M" /></div>
        <div className="upi-copy"><strong>UPI handoff payload · display only</strong><small>{invoice.upi_payload}</small><small>Copy/scan disabled · no payment app was opened.</small></div>
      </div>
    </section>
  </div>;
}
