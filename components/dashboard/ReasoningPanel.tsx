"use client";

import { useEffect, useRef } from "react";
import { Activity, Braces, Check, CircleDot, Code2, Cpu, ShieldCheck, Sparkles } from "lucide-react";
import type { AgentStatus, TraceEvent } from "@/lib/agent/types";

const phaseIcon: Record<TraceEvent["phase"], typeof Activity> = {
  PERCEIVE: Activity,
  REASON: Sparkles,
  TOOL_CALL: Code2,
  OBSERVATION: Braces,
  GUARDRAIL: ShieldCheck,
  HUMAN: CircleDot
};

const statusLabel: Record<AgentStatus, string> = {
  IDLE: "STANDBY",
  PERCEIVING: "PERCEIVING",
  REASONING: "REASONING",
  EXECUTING: "EXECUTING",
  AWAITING_HUMAN_APPROVAL: "WAITING · MANAGER",
  COMPLETED: "RUN COMPLETE",
  REJECTED: "STOPPED SAFELY"
};

type Props = { events: TraceEvent[]; status: AgentStatus; activeTool: string | null };

export function ReasoningPanel({ events, status, activeTool }: Props) {
  const scrollArea = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = scrollArea.current;
    if (area) area.scrollTo({ top: area.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [events.length]);

  return (
    <section className="panel trace-panel" aria-labelledby="trace-title">
      <header className="panel-header">
        <div className="panel-title-group">
          <span className="panel-title-icon"><Cpu size={13} /></span>
          <div><h2 className="panel-title" id="trace-title">Agent decision trace</h2><div className="panel-subtitle">Structured reason → tool → observation → guardrail</div></div>
        </div>
        <span className={`panel-tag ${status === "AWAITING_HUMAN_APPROVAL" ? "" : ""}`}><i className={status === "EXECUTING" || status === "PERCEIVING" ? "trace-live-dot" : ""} />{statusLabel[status]}</span>
      </header>
      <div className="trace-body" ref={scrollArea} role="log" aria-live="polite" aria-relevant="additions text">
        {events.length === 0 ? <div className="trace-empty">
          <span className="trace-empty-icon"><Activity size={16} /></span>
          <strong>Agent is on standby</strong>
          <p>Run a scenario to stream camera evidence, safe tool calls, and the agent’s decision summary here.</p>
        </div> : events.map((event) => {
          const Icon = phaseIcon[event.phase];
          const payload = event.payload === undefined ? "" : JSON.stringify(event.payload, null, 2);
          const compact = payload.length > 920 ? `${payload.slice(0, 920)}\n…` : payload;
          return <article key={event.id} className={`trace-event ${event.tone}`}>
            <time className="trace-time">{event.time}</time>
            <div className="trace-content">
              <div className="trace-heading"><Icon size={9} />{event.title}<span className="trace-phase">{event.phase}</span></div>
              <div className="trace-message">{event.message}</div>
              {compact && <pre className="trace-json">{compact}</pre>}
            </div>
          </article>;
        })}
        {(status === "EXECUTING" || status === "PERCEIVING") && <div className="trace-event cyan">
          <span className="trace-time">···</span><div className="trace-content"><div className="trace-heading"><span className="trace-live-dot" />{activeTool ?? "Agent step in progress"}</div><div className="trace-message">Waiting for the deterministic mock handler …</div></div>
        </div>}
      </div>
      <footer className="trace-footer">
        <span className="trace-live"><span className="trace-live-dot" /> SIMULATED EVENT BUS</span>
        <span><Check size={8} style={{ verticalAlign: "-1px", marginRight: 3 }} />{events.length} EVENT{events.length === 1 ? "" : "S"}</span>
      </footer>
    </section>
  );
}
