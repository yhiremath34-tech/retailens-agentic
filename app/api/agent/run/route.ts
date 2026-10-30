import { NextResponse } from "next/server";
import { getScenarioTelemetry, scenarioMeta } from "@/lib/agent/scenarios";
import { scenarioToolInputs, toolSchemas } from "@/lib/agent/retailAgent";
import type { ScenarioId } from "@/lib/agent/types";

export const runtime = "nodejs";

const validScenarios = new Set<ScenarioId>(["A", "B", "C"]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body) || !("scenario" in body)) {
    return NextResponse.json({ error: "A scenario identifier is required." }, { status: 400 });
  }

  const scenario = (body as { scenario: unknown }).scenario;
  if (typeof scenario !== "string" || !validScenarios.has(scenario as ScenarioId)) {
    return NextResponse.json({ error: "scenario must be A, B, or C." }, { status: 400 });
  }

  const scenarioId = scenario as ScenarioId;
  return NextResponse.json({
    mode: "SIMULATION_ONLY",
    scenario: scenarioId,
    scenario_meta: scenarioMeta[scenarioId],
    telemetry: getScenarioTelemetry(scenarioId),
    first_tool_call: {
      name: "detect_checkout_and_shelf_state",
      arguments: scenarioToolInputs(scenarioId),
      schema: toolSchemas.detect_checkout_and_shelf_state
    }
  }, { headers: { "Cache-Control": "no-store" } });
}
