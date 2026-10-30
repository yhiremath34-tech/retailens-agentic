"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, ArrowRight, Check, CircleHelp, LoaderCircle, Play, RotateCcw, Shield, Store } from "lucide-react";
import { ApprovalPanel } from "@/components/dashboard/ApprovalPanel";
import { InventoryPanel } from "@/components/dashboard/InventoryPanel";
import { InvoiceModal } from "@/components/dashboard/InvoiceModal";
import { ReasoningPanel } from "@/components/dashboard/ReasoningPanel";
import { useRetailAgent } from "@/components/dashboard/useRetailAgent";
import { VisionPanel } from "@/components/dashboard/VisionPanel";
import { scenarioMeta } from "@/lib/agent/scenarios";
import type { ScenarioId } from "@/lib/agent/types";

const scenarioOrder: ScenarioId[] = ["A", "B", "C"];
const loopLabels = ["Perceive", "Reason", "Act", "Guardrail"] as const;

function activeIndex(status: ReturnType<typeof useRetailAgent>["status"]): number {
  if (status === "REASONING") return 1;
  if (status === "EXECUTING") return 2;
  if (status === "AWAITING_HUMAN_APPROVAL") return 3;
  if (status === "COMPLETED" || status === "REJECTED") return 4;
  return 0;
}

function statusCopy(status: ReturnType<typeof useRetailAgent>["status"]): string {
  if (status === "PERCEIVING") return "Vision is classifying the selected simulated feed.";
  if (status === "REASONING") return "Evaluating evidence and choosing the lowest-risk next step.";
  if (status === "EXECUTING") return "A guarded mock tool is processing the next step.";
  if (status === "AWAITING_HUMAN_APPROVAL") return "Agent paused. A manager must decide before this action continues.";
  if (status === "COMPLETED") return "Scenario finished. All external actions remained simulated.";
  if (status === "REJECTED") return "Run stopped safely. No pending action was sent.";
  return "Choose a scenario to see the agent loop in action.";
}

export function Dashboard() {
  const agent = useRetailAgent();
  const [showInvoice, setShowInvoice] = useState(false);
  const step = activeIndex(agent.status);
  const scenario = scenarioMeta[agent.scenario];
  const controlsLocked = agent.isBusy || agent.approval !== null;

  return <main className="main-wrap">
    <div className="page-kicker"><Activity size={10} /> Autonomous operations &nbsp; / &nbsp; Store 01</div>
    <div className="page-heading">
      <div>
        <h1>Store ops, <span style={{ color: "var(--lime)" }}>thinking ahead.</span></h1>
        <p>Perception becomes action—with a human in the loop wherever it matters.</p>
      </div>
      <div className="heading-right">
        <span className="store-selector"><Store size={11} /> Retail Demo Market <span style={{ color: "#637062" }}>·</span> Mumbai, IN</span>
        <button className="flat-button" title="All feeds and tool responses are synthetic demo data"><CircleHelp size={11} /> Demo info</button>
        <button className="flat-button" onClick={agent.resetDemo} disabled={controlsLocked}><RotateCcw size={10} /> Reset</button>
        <button className="run-button" onClick={() => agent.runScenario(agent.scenario)} disabled={controlsLocked}>
          {agent.isBusy ? <LoaderCircle className="spin" size={12} /> : <Play size={11} fill="currentColor" />}
          {agent.isBusy ? "Agent running…" : `Run ${scenario.eyebrow.toLowerCase()}`}
          {!agent.isBusy && <ArrowRight size={10} />}
        </button>
      </div>
    </div>

    <div className="scenario-bar" role="group" aria-label="Select a demo scenario">
      <span className="scenario-label">Demo scenarios</span>
      {scenarioOrder.map((id) => {
        const meta = scenarioMeta[id];
        return <button key={id} className={`scenario-button ${agent.scenario === id ? "selected" : ""}`} onClick={() => agent.chooseScenario(id)} aria-pressed={agent.scenario === id} disabled={controlsLocked}>
          <span className="scenario-index">{id}</span><span><span className="scenario-button-title">{meta.shortTitle}</span><span className="scenario-button-sub">{meta.tag}</span></span>
        </button>;
      })}
    </div>

    <div className="status-strip" aria-label={`Agent status: ${agent.status}`}>
      <div className="status-steps">
        {loopLabels.map((label, index) => {
          const complete = step === 4 || index < step;
          const active = step < 4 && index === step && ["PERCEIVING", "REASONING", "EXECUTING", "AWAITING_HUMAN_APPROVAL"].includes(agent.status);
          return <span className={`status-step ${complete ? "complete" : ""} ${active ? "active" : ""}`} key={label}>
            <i className="status-node" />{label}{index < loopLabels.length - 1 ? <i className="status-connector" /> : null}
          </span>;
        })}
      </div>
      <span className="status-description"><Shield size={10} style={{ verticalAlign: "-1px", marginRight: 5, color: agent.status === "AWAITING_HUMAN_APPROVAL" ? "var(--amber)" : "#8eaa74" }} />{statusCopy(agent.status)}</span>
    </div>

    <motion.div className="dashboard-grid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <VisionPanel scenario={agent.scenario} telemetry={agent.telemetry} isBusy={agent.isBusy} invoice={agent.invoice} onOpenInvoice={() => setShowInvoice(true)} />
      <InventoryPanel inventory={agent.inventory} events={agent.events} />
    </motion.div>

    <div className="lower-grid">
      <ReasoningPanel events={agent.events} status={agent.status} activeTool={agent.activeTool} />
      <ApprovalPanel
        approval={agent.approval}
        status={agent.status}
        outcome={agent.outcome}
        isBusy={agent.isBusy}
        onApprovePurchase={agent.approvePurchaseOrder}
        onModifyQuantity={agent.reEvaluatePurchaseOrder}
        onApproveScan={agent.approveScanOverride}
        onKeepScannedItem={agent.keepScannedItem}
        onReject={agent.rejectAction}
      />
    </div>
    <p className="page-footnote"><Check size={9} /> Synthetic camera frames · deterministic mock handlers · no live payment, supplier PO, or POS connection.</p>

    <AnimatePresence>{showInvoice && agent.invoice && <motion.div key="invoice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><InvoiceModal invoice={agent.invoice} onClose={() => setShowInvoice(false)} /></motion.div>}</AnimatePresence>
  </main>;
}
