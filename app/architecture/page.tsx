import Link from "next/link";
import { ArrowRight, Camera, Database, FileCode2, Network, ScanEye, ShieldCheck, Sparkles, Wrench } from "lucide-react";

const stages = [
  { title: "Vision pipeline", label: "PERCEIVE", detail: "OpenCV-style detections · camera IDs · bounding-box confidence", icon: Camera, accent: "cyan" },
  { title: "Agent reasoning loop", label: "REASON", detail: "Structured decision summaries · anomaly triage · action plan", icon: Sparkles, accent: "lime" },
  { title: "Deterministic tools", label: "ACT", detail: "POS inventory · GST receipt · supplier reorder mock", icon: Wrench, accent: "lime" },
  { title: "HITL intercept", label: "GUARDRAIL", detail: "₹10,000 cap · 85% confidence floor · manager decision", icon: ShieldCheck, accent: "amber" },
  { title: "Live-style command UI", label: "OBSERVE", detail: "Inventory view · decision trace · manager queue", icon: Database, accent: "cyan" }
];

const toolRows = [
  ["detect_checkout_and_shelf_state", "Returns SKU detections, confidence, shelf fill, expiry flags, and anomalies."],
  ["update_pos_inventory_db", "Applies an in-browser sample stock change or markdown."],
  ["generate_gst_invoice", "Calculates mock HSN/CGST/SGST lines and a display-only UPI payload."],
  ["trigger_supplier_reorder_api", "Evaluates the order and pauses any PO above ₹10,000 or below 85% confidence."]
];

export default function ArchitecturePage() {
  return <main className="support-page">
    <div className="page-kicker"><Network size={10} /> System map &nbsp; / &nbsp; agent architecture</div>
    <div className="support-intro">
      <h1>Perceive the floor.<br /><span style={{ color: "var(--lime)" }}>Act with guardrails.</span></h1>
      <p>RetaiLens turns camera-style evidence into deterministic operations—not another chat box. Routine actions move automatically; high-stakes changes stop where a manager can see and decide.</p>
    </div>
    <section aria-label="Agent architecture flow">
      <div className="arch-flow">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return <div className="arch-flow-cell" key={stage.title}>
            <article className={`arch-node ${stage.accent}`}>
              <span className="arch-node-icon"><Icon size={14} /></span>
              <span><small>{stage.label}</small><strong>{stage.title}</strong><span className="arch-node-detail">{stage.detail}</span></span>
              <span className="arch-node-index">0{index + 1}</span>
            </article>
            {index < stages.length - 1 && <span className="arch-arrow"><ArrowRight size={13} /></span>}
          </div>;
        })}
      </div>
      <p className="arch-caption"><ScanEye size={9} style={{ verticalAlign: "-1px", marginRight: 4 }} /> Architecture depicts the intended integration pattern. This demo uses synthetic vision and deterministic local handlers; no real camera, Firebase/Supabase, supplier, payment, or tax provider is connected.</p>
    </section>

    <div className="arch-lanes">
      <section className="arch-lane"><h2><FileCode2 size={11} style={{ verticalAlign: "-2px", marginRight: 5, color: "var(--cyan)" }} />Four typed tool contracts</h2>
        <div className="tool-list">{toolRows.map(([name, detail]) => <div className="tool-row" key={name}><code>{name}</code><p>{detail}</p></div>)}</div>
      </section>
      <section className="arch-lane"><h2><ShieldCheck size={11} style={{ verticalAlign: "-2px", marginRight: 5, color: "var(--amber)" }} />State machine &amp; thresholds</h2>
        <div className="state-machine">
          <span>PERCEIVING</span><i>→</i><span>REASONING</span><i>→</i><span>EXECUTING</span><i>→</i><span className="state-wait">AWAITING_HUMAN_APPROVAL</span><i>→</i><span>RESUMED / FLAGGED</span>
        </div>
        <p>Supplier proposals above ₹10,000 or with anomaly confidence below 0.85 enter a pending state. A manager can approve, modify and re-evaluate the quantity, or reject and flag; the demo never sends a real purchase order.</p>
        <Link className="arch-cta" href="/">Open the interactive command center <ArrowRight size={11} /></Link>
      </section>
    </div>
  </main>;
}
