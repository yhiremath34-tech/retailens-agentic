# RetaiLens Agentic

A Next.js 14+ operations-console prototype with animated simulated shelf perception, deterministic agent/tool traces, POS and markdown state changes, manager approval guardrails, a mock GST/UPI receipt, architecture notes, and hackathon pitch content.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. `pnpm typecheck` and `pnpm build` check the app and create its optimized production build.

## Demo scenarios

- **A — Frictionless checkout:** runs the simulated vision, inventory deduction, and CGST/SGST mock receipt flow.
- **B — Shelf stockout:** marks down a near-expiry batch and holds the ₹24,500 supplier reorder for manager approval. Modifying its quantity rechecks the threshold.
- **C — Scan dispute:** pauses a low-confidence visual/barcode mismatch before any inventory override.

Everything is synthetic and local to the browser demo. No real camera, external LLM, tax authority, payment processor, supplier, POS, Firebase, or Supabase is connected; no real invoice, payment, or purchase order is created or sent.
