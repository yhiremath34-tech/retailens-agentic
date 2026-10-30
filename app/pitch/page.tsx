import Link from "next/link";
import { Activity, ArrowRight, BadgeIndianRupee, Bot, Camera, CircleDollarSign, ShieldCheck, TimerReset } from "lucide-react";

const pitchCards = [
  { n: "01", label: "THE PROBLEM", title: "The store sees it. The system does nothing.", text: "Passive CCTV records what happened while managers discover empty shelves, expiry losses, and checkout shrinkage after the fact. Retail operations still depend on someone noticing, interpreting, and typing the next step.", icon: Camera, tone: "" },
  { n: "02", label: "WHY AN AGENT", title: "No prompt. Just perceive → decide → act.", text: "A chatbot waits for a question. RetaiLens ingests a camera-style event, connects the evidence to inventory and checkout, chooses a safe tool sequence, and carries it forward until a human decision is required.", icon: Bot, tone: "highlight" },
  { n: "03", label: "MULTI-TOOL PIPELINE", title: "One observation. Four operational tools.", text: "Vision identifies SKUs and anomalies. The agent can update POS stock and pricing, calculate mock HSN-based CGST/SGST, and evaluate a supplier reorder—all as visible, structured tool calls.", icon: Activity, tone: "" },
  { n: "04", label: "HUMAN-IN-THE-LOOP", title: "Fast when safe. Paused when it matters.", text: "Low-risk checkouts, receipts, and markdowns are simulated end-to-end. Any purchase over ₹10,000, weak evidence below 85%, or disputed scan stops for one-click approval, quantity adjustment, or rejection.", icon: ShieldCheck, tone: "" },
  { n: "05", label: "90-SECOND LIVE DEMO", title: "Show the loop. Trigger the guardrail. Resume it.", text: "0:00–0:10 — Select A and run. 0:10–0:25 — Point to the live-style detections and tool trace. 0:25–0:35 — Open the mock GST receipt. 0:35–0:48 — Select B and run. 0:48–1:03 — Highlight the empty shelf and 2-day markdown. 1:03–1:15 — Show the ₹24,500 PO pause. 1:15–1:23 — Click “Approve & Dispatch PO (1-Click).” 1:23–1:30 — Select C and show the scan dispute pause.", icon: TimerReset, tone: "highlight" },
  { n: "06", label: "BUSINESS IMPACT", title: "Less waiting between detection and decision.", text: "The innovation is the operational handoff: shrink the gap between seeing a problem and routing a safe, auditable action. The demo measures what matters on the floor—time to resolution, stock availability, and exceptions that still need a manager.", icon: CircleDollarSign, tone: "" }
];

export default function PitchPage() {
  return <main className="support-page">
    <div className="page-kicker"><BadgeIndianRupee size={10} /> PS-07 open track &nbsp; / &nbsp; jury pitch notes</div>
    <div className="support-intro">
      <h1>From passive feeds<br />to <span style={{ color: "var(--lime)" }}>a store that acts.</span></h1>
      <p>Six sharp speaking beats for the demo: define the operational gap, make the case for an agent, prove tool execution, show the safety stop, choreograph 90 seconds, and close on measurable impact.</p>
    </div>
    <div className="pitch-grid">
      {pitchCards.map((card) => {
        const Icon = card.icon;
        return <article className={`pitch-card ${card.tone}`} data-number={card.n} key={card.n}>
          <small><Icon size={9} /> {card.label}</small><h2>{card.title}</h2><p>{card.text}</p>
        </article>;
      })}
    </div>
    <div className="support-footnote">The demo intentionally uses synthetic camera events, local mock tools, sample prices, and a display-only UPI QR. Do not represent its outputs as a live invoice, real model reasoning, production database mutation, or dispatched supplier order.</div>
    <p style={{ marginTop: 18 }}><Link className="arch-cta" href="/">Return to the command center <ArrowRight size={11} /></Link></p>
  </main>;
}
