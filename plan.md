# RetaiLens Agentic — Implementation Plan

## Product scope and implementation approach

Build a self-contained, judge-ready retail operations command-center website using the approved Next.js App Router, TypeScript, Tailwind CSS, Lucide, and Framer Motion stack. The primary dashboard offers three repeatable, deterministic scenarios with animated, stepwise agent activity, structured tool events, inventory state updates, invoices/UPI payload display, and interactive HITL decisions. Real cameras, POS systems, tax authorities, and suppliers are outside this demo: clearly label generated telemetry and tool responses as simulated. Do not access credentials or write scenario data into the managed database. Demo mutations live in browser state and may be persisted locally in the browser.

Implement typed scenario/agent/tool logic as reusable TypeScript modules, including a deterministic tool registry, runtime input checks, realistic simulated latency, readable structured observations, and explicit state transitions. A Next.js API route will expose the deterministic agent-run contract; the dashboard owns animated presentation and approval continuation. Scenario A carries a verified-cart mock through inventory deduction and a GST/UPI receipt. Scenario B detects a shelf stockout and pauses the ₹24,500 supplier PO before dispatch. Scenario C pauses at a disputed scan mismatch. A spending threshold above ₹10,000 or anomaly confidence below 0.85 must lead to `AWAITING_HUMAN_APPROVAL`; approving dispatches the simulated action, editing modifies order quantity before resuming, and rejecting flags and ends the pending action.

Use accessible interactions, keyboard-operable controls, responsive layouts, live status labels, and reduced-motion fallbacks. Build real camera-like vision visuals from HTML/CSS overlays and abstract 3D shapes rather than static stock imagery. Add an Architecture view with the requested Vision Pipeline → Agent Reasoning Loop → Tool Executor → HITL Intercept → Firebase/Supabase Live UI flow clearly annotated as a demo adapter, plus a Pitch view with six compact speaking-point sections (the source labels six slides but lists five topics, so the sixth adds business impact).

## Project structure

- `app/layout.tsx`, `app/globals.css`, `app/page.tsx`: App Router shell, typography/global visual treatment, and primary dashboard route.
- `app/architecture/page.tsx`, `app/pitch/page.tsx`: supporting architecture diagram and concise pitch content.
- `app/api/agent/run/route.ts`: stateless deterministic scenario-run endpoint; mock only.
- `components/dashboard/`: shell, camera/3D scene, reasoning trace, inventory grid, invoice/receipt, and approval queue components.
- `lib/agent/`: scenarios, strongly typed schemas, tool registry, safe state transitions, mock latency, and receipt/tax calculations.
- `public/manus-routes.json`: page route manifest for all implemented routes.
- `TODO.md`: outcome-level requirements and implementation status.

## Design direction

### Style options

- 3D industrial flight-deck instrumentation: probability 0.031.
- Sculptural generative retail diorama: probability 0.067.
- Editorial Swiss operations console: probability 0.094.

**Selected style:** 3D industrial flight-deck instrumentation, tailored to a credible retail command center rather than a game HUD.

### Design movement

Contemporary industrial interface design with restrained science-fiction spatial depth, borrowing from precision-control consoles and volumetric product visualization.

### Core principles

- Keep operational facts legible before spectacle.
- Give every important action a visible reason, confidence, and state.
- Reserve high-contrast color for risk, approvals, and system health.
- Use depth and motion as meaningful cues for spatial inventory and agent activity.

### Color philosophy

Near-black graphite and deep ink give a calm, low-glare command surface; cool mineral whites support dense data; vivid acid-lime signals healthy automation; electric cyan marks computer vision; warm amber marks a human decision; coral red marks a blocked anomaly. Avoid relying on color alone: pair status colors with labels and icons.

### Layout paradigm

A wide operations console with a narrow global rail and staggered, unequal panel proportions. The primary view is a large live-vision plane paired with an inventory ledger; a lower terminal-and-approval strip remains visible at desktop widths. Supporting architecture and pitch views reuse the same shell but let their content breathe.

### Signature elements

- A gently drifting 3D shelf/camera diorama with tracked SKU bounding boxes.
- A luminous pulse rail linking `PERCEIVE → REASON → ACT → GUARDRAIL`.
- A tactile approval card with a numeric risk band and explicit pause reason.

### Interaction philosophy

Small, quick motions acknowledge actions; critical decisions require explicit labels, clear consequences, and a strong but unambiguous target. The three scenarios are always one click away. Replays reset demo state predictably. Approval, modification, and rejection each show a distinct response.

### Animation

Use Framer Motion for panel entrance, trace events, approvals, and inventory-value change cues. Keep looping 3D parallax subtle, with a modest camera drift and orbiting scanner line. Avoid constant high-frequency pulses; animate only actionable or changing statuses. Respect `prefers-reduced-motion` and provide a non-moving fallback for the 3D scene.

### Typography system

Use a geometric sans for prominent headings and a crisp neutral sans for dense UI labels; use tabular/monospace figures for money, stock counts, timestamps, and JSON payloads. Distinguish brand title, page heading, metric figures, panel labels, and trace detail through scale and weight instead of excessive capitals.

### Brand essence

An autonomous store-ops co-pilot that turns retail perception into safe, visible action for store teams; precise, vigilant, accountable.

### Brand voice

Lead with concrete operational statements and meaningful thresholds. CTAs describe exactly what changes.

- “Shelf gap detected. Reorder held for your approval.”
- “Invoice verified in simulation. No live payment was initiated.”

### Wordmark & logo

A compact lens/aperture mark whose segmented iris resolves into a retail shelf barcode, followed by the mixed-case wordmark `RetaiLens`; do not use an unmodified default-font wordmark as the only mark.

### Signature brand color

Acid-lime `#C5F467`, reserved for confirmed healthy automation and the primary identity accent.

## Serving and constraints

Use the project’s actual managed Preview port/runtime after confirming configuration. Pin the package manager and declare lifecycle build permissions before installing dependencies. Keep API responses and browser controls safe for the cross-site Preview iframe; browser URLs remain relative. Use only synthetic demo data and avoid writes to the shared managed database. Before the first dev server start, publish and verify a static route manifest for `/`, `/architecture`, and `/pitch`. Work toward the approved features without adding provider credentials or claiming external services are connected.
