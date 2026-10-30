# TODO

## Dashboard shell, dark 3D scene, and navigation — complete
- Create a stunning dark-mode, single-screen Autonomous Store-Ops Command Center optimized for an interactive hackathon jury demo.
- Provide four clearly organized panels: (1) live-style vision telemetry, (2) real-time agent reasoning trace, (3) POS inventory and dynamic pricing, and (4) a human approval queue.
- Include a three-dimensional animated retail/shelf-vision composition and subtle Framer Motion feedback; preserve readable data density and respect reduced-motion preferences.
- Provide supporting Architecture and Pitch views and keep `public/manus-routes.json` synchronized with the page routes.
- Use Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, and Framer Motion.

## Scenario-driven agent loop and mock tool registry — complete
- Follow a Perceive → Reason → Act → Guardrail loop; detect stockouts, misplaced or near-expiry inventory, barcode/visual scan mismatches, and verified checkouts.
- Implement deterministic mock handlers with structured input/output validation, realistic latency simulation, and state changes for `detect_checkout_and_shelf_state(camera_id, zone_type)`, `update_pos_inventory_db(sku_id, action_type, quantity_delta, dynamic_price_override)`, `generate_gst_invoice(cart_items, customer_upi_id, tax_Breakdown)`, and `trigger_supplier_reorder_api(sku_id, supplier_id, order_quantity, estimated_cost_inr, urgency_level)`.
- Return camera-style telemetry with detected SKUs, bounding-box confidence scores, shelf stock percentage, expiry-batch flags, and anomaly flags such as `SCAN_MISMATCH`, `CRITICAL_STOCKOUT`, `NEAR_EXPIRY_SURPLUS`, and `MISPLACED_ITEM`.
- Scenario A demonstrates an autonomous frictionless checkout, POS quantity mutation, a CGST/SGST mock GST invoice, and a display-only UPI QR payload.
- Scenario B demonstrates a critical shelf stockout and a ₹24,500 supplier reorder that pauses before dispatch.
- Scenario C demonstrates a checkout scan anomaly/disputed-item override that pauses for a manager.
- Show high-level agent decision summaries, exact JSON-style tool call payloads, tool observations/responses, and guardrail outcomes in a timestamped terminal-style trace.
- Label synthetic inputs and mock responses as simulated; do not claim real camera, LLM-provider, POS, tax, UPI, or supplier integrations.

## Human approval guardrails and inventory mutations — complete
- Never execute a supplier reorder immediately if `estimated_cost_inr > 10000` or anomaly confidence is below `0.85`; instead transition to `AWAITING_HUMAN_APPROVAL` and show an approval card.
- Include separate “Approve & Dispatch PO (1-Click)”, “Modify Quantity”, and “Reject & Flag” interactions.
- Approval resumes the simulated action; modification changes order quantity and rechecks the same guardrails before resuming; rejection flags the action and does not dispatch it.
- Show inventory counts, dynamic pricing/markdown badges, stock mutation cues, confidence, and the reason a high-risk operation is paused.
- Keep demo state client-side and do not write scenario-test data into the shared managed database.

## Architecture and pitch support content — complete
- Include an architecture diagram that presents Vision Pipeline → Agent Reasoning Loop → Tool Executor → HITL Intercept → Firebase/Supabase Live UI; clearly identify unconnected providers/mock handlers as illustrative rather than live.
- Include concise pitch material on the problem, why an agent rather than a chatbot, architecture and multi-tool flow, human-in-the-loop thresholds, a click-by-click 90-second demo script, and business impact as the sixth section (the source says six slides but lists five topics).

## Runtime and code delivery — complete
- Provide readable modular, runnable source code with no placeholder pseudocode or skipped handler logic.
- Configure TypeScript diagnostics before the first implementation batch, pin the Node package manager, and declare approved lifecycle-script permissions before installation.
- Serve and verify a valid route manifest at `/manus-routes.json` before starting the first web development server; include every implemented page route.
- TypeScript and production builds pass; homepage and support routes respond with HTTP 200; the route manifest is valid JSON; valid scenario telemetry returns in `SIMULATION_ONLY` mode; invalid scenario identifiers are rejected with HTTP 400.

## Production deployment contract — complete
- Configure the project with `features.server: true` and a complete `deploy` declaration that points to the committed root `Dockerfile` and health path `/health`.
- The Dockerfile must install using the pinned Node and pnpm toolchain, the committed lockfile, and the reviewed install-script policy; compile the Next.js app; and start its production listener on `0.0.0.0` using the supplied `PORT` (default 3000).
- Provide an unauthenticated success response from `/health` for deployment readiness, without adding it as a page route in `public/manus-routes.json`.
- Save the Dockerfile, health handler, and deployment configuration with a new checkpoint before publishing the corrected build.
